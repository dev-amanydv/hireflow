import { test, expect, describe, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const mockPrisma = vi.hoisted(() => ({
  interview: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  resume: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  message: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const mockQueue = vi.hoisted(() => ({
  resumeUploadQueue: { add: vi.fn() },
}));

const mockOpenaiService = vi.hoisted(() => ({
  getResumeSummary: vi.fn(),
}));

const mockLivekit = vi.hoisted(() => {
  const addGrant = vi.fn();
  const toJwt = vi.fn().mockResolvedValue("signed.jwt.token");
  const AccessToken = vi.fn().mockImplementation(function (this: any) {
    this.addGrant = addGrant;
    this.toJwt = toJwt;
    this.roomConfig = undefined;
  });
  function RoomConfiguration(this: any, cfg: unknown) {
    Object.assign(this, cfg as object);
  }
  function RoomAgentDispatch(this: any, cfg: unknown) {
    Object.assign(this, cfg as object);
  }
  return {
    AccessToken,
    RoomConfiguration: vi.fn(RoomConfiguration as any),
    RoomAgentDispatch: vi.fn(RoomAgentDispatch as any),
    __addGrant: addGrant,
    __toJwt: toJwt,
  };
});

vi.mock("../../prisma/db", () => ({ prisma: mockPrisma }));
vi.mock("../queues/queue", () => mockQueue);
// Fully replaces services/openai.ts (which constructs a real `new OpenAI(...)`
// client at import time and throws without AZURE_* env vars configured). The
// zod schema below mirrors the real summarySchema so updateSummary's
// safeParse behavior is exercised faithfully.
vi.mock("../services/openai", async () => {
  const { z } = await import("zod");
  const summarySchema = z.object({
    name: z.string(),
    role: z.string().nullable(),
    summary: z.string().nullable(),
    yearOfExp: z
      .literal(["fresher", "<1 year", "<3 year", "<5 year", "<10 year", ">= 10 year"])
      .nullable(),
    email: z.string().nullable(),
    linkedIn: z.string().nullable(),
    github: z.string().nullable(),
    phone: z.string().nullable(),
    technicalSkills: z.array(
      z.object({ name: z.string().nullable(), usedIn: z.array(z.string()).nullable() }),
    ),
    experience: z.array(
      z.object({
        role: z.string().nullable(),
        company: z.string().nullable(),
        duration: z.string().nullable(),
        work: z.array(z.string()).nullable(),
      }),
    ),
    projects: z.array(
      z.object({
        name: z.string().nullable(),
        skills: z.array(z.string()).nullable(),
        readmeSummary: z.array(z.string()).nullable(),
        about: z.array(z.string()).nullable(),
      }),
    ),
    education: z.array(
      z.object({
        qualification: z.string().nullable(),
        institution: z.string().nullable(),
        startingYear: z.string().nullable(),
      }),
    ),
  });
  return { getResumeSummary: mockOpenaiService.getResumeSummary, summarySchema };
});
vi.mock("livekit-server-sdk", () => ({
  AccessToken: mockLivekit.AccessToken,
  RoomConfiguration: mockLivekit.RoomConfiguration,
  RoomAgentDispatch: mockLivekit.RoomAgentDispatch,
}));

const {
  handleRoleDetails,
  handleResume,
  handleResumeStatus,
  handlePreSession,
  updateSummary,
  generateLivekitToken,
  recordInterviewMessage,
  completeInterview,
} = await import("./interview.controller");

function fakeRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  (res.status as any).mockReturnValue(res);
  return res;
}

function fakeReq(over: Partial<Request> = {}): Request {
  return { body: {}, params: {}, ...over } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLivekit.__toJwt.mockResolvedValue("signed.jwt.token");
});

describe("handleRoleDetails", () => {
  test("no userId -> throws 404 Unauthorised without touching prisma", async () => {
    const req = fakeReq({ body: { role: "Backend Engineer", experience: "mid" } });
    await expect(handleRoleDetails(req, fakeRes(), vi.fn())).rejects.toMatchObject({
      statusCode: 404,
      message: "Unauthorised",
    });
    expect(mockPrisma.interview.create).not.toHaveBeenCalled();
  });

  test("invalid body (bad experience literal) -> throws 401 RoleDetailsRequired", async () => {
    const req = fakeReq({ userId: "user-1", body: { role: "Backend Engineer", experience: "expert" } });
    await expect(handleRoleDetails(req, fakeRes(), vi.fn())).rejects.toMatchObject({
      statusCode: 401,
      message: "RoleDetailsRequired",
    });
  });

  test("missing role -> throws 401 RoleDetailsRequired", async () => {
    const req = fakeReq({ userId: "user-1", body: { experience: "mid" } });
    await expect(handleRoleDetails(req, fakeRes(), vi.fn())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test("valid body -> creates interview scoped to the user and returns 201", async () => {
    mockPrisma.interview.create.mockResolvedValue({ id: "interview-1" });
    const req = fakeReq({ userId: "user-1", body: { role: "Backend Engineer", experience: "mid" } });
    const res = fakeRes();

    await handleRoleDetails(req, res, vi.fn());

    expect(mockPrisma.interview.create).toHaveBeenCalledWith({
      data: { jobRole: "Backend Engineer", experience: "mid", userId: "user-1" },
      select: { id: true },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Role Details Saved",
      data: { interview: { id: "interview-1" } },
    });
  });
});

describe("handleResume", () => {
  // NOTE (bug): handleResume wraps its whole body in a try/catch that always
  // responds 500 "Internal server error", discarding the specific AppError
  // statusCode/message thrown for missing-userId (404), missing-file (404), and
  // missing-interviewId (400). Every failure path below is observably a 500 to the
  // caller, which is very likely a bug (contrast with every other handler in this
  // file, which lets AppError propagate to the errorHandler middleware for a
  // correctly-coded response). Asserting actual behavior here, not desired behavior.
  test("missing userId -> still resolves 500 Internal server error (status/message swallowed)", async () => {
    const req = fakeReq({ body: { interviewId: "interview-1" } });
    const res = fakeRes();

    await handleResume(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error",
      data: null,
    });
  });

  test("missing file -> also resolves 500 (not 404 ResumeRequired)", async () => {
    const req = fakeReq({ userId: "user-1", body: { interviewId: "interview-1" } });
    const res = fakeRes();

    await handleResume(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("missing interviewId -> also resolves 500 (not 400 interviewId required)", async () => {
    const req = fakeReq({
      userId: "user-1",
      body: {},
      file: { originalname: "resume.pdf", filename: "abc.pdf", size: 1234, path: "/tmp/abc.pdf" } as any,
    });
    const res = fakeRes();

    await handleResume(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("happy path -> upserts resume, clears prior summary, and enqueues upload", async () => {
    const resumeRow = { id: "resume-1", name: "abc.pdf" };
    mockPrisma.$transaction.mockImplementation(async (fn: any) =>
      fn({ resume: { upsert: mockPrisma.resume.upsert }, interview: { update: mockPrisma.interview.update } }),
    );
    mockPrisma.resume.upsert.mockResolvedValue(resumeRow);

    const req = fakeReq({
      userId: "user-1",
      body: { interviewId: "interview-1" },
      file: {
        originalname: "resume.pdf",
        filename: "abc.pdf",
        size: 1234,
        path: "/tmp/abc.pdf",
      } as any,
    });
    const res = fakeRes();

    await handleResume(req, res);

    expect(mockPrisma.resume.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { interviewId: "interview-1" },
        create: expect.objectContaining({ status: "UPLOADED_LOCAL", interviewId: "interview-1" }),
        update: expect.objectContaining({ status: "UPLOADED_LOCAL", error: null, url: null }),
      }),
    );
    expect(mockPrisma.interview.update).toHaveBeenCalledWith({
      where: { id: "interview-1" },
      data: { summary: null },
    });
    expect(mockQueue.resumeUploadQueue.add).toHaveBeenCalledWith(
      "user-1-interview-1",
      expect.objectContaining({ resumeId: "resume-1", interviewId: "interview-1" }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { resume: resumeRow } }),
    );
  });
});

describe("handleResumeStatus", () => {
  test("no userId -> throws 401 Unauthorised", async () => {
    const req = fakeReq({ params: { interviewId: "interview-1" } });
    await expect(handleResumeStatus(req, fakeRes(), vi.fn())).rejects.toMatchObject({ statusCode: 401 });
  });

  test("no interviewId param -> throws 400", async () => {
    const req = fakeReq({ userId: "user-1", params: {} });
    await expect(handleResumeStatus(req, fakeRes(), vi.fn())).rejects.toMatchObject({ statusCode: 400 });
  });

  test("resume not found -> throws 404 ResumeNotFound", async () => {
    mockPrisma.resume.findUnique.mockResolvedValue(null);
    const req = fakeReq({ userId: "user-1", params: { interviewId: "interview-1" } });
    await expect(handleResumeStatus(req, fakeRes(), vi.fn())).rejects.toMatchObject({
      statusCode: 404,
      message: "ResumeNotFound",
    });
  });

  test("PARSED status -> ready true, failed false", async () => {
    mockPrisma.resume.findUnique.mockResolvedValue({ status: "PARSED" });
    const req = fakeReq({ userId: "user-1", params: { interviewId: "interview-1" } });
    const res = fakeRes();

    await handleResumeStatus(req, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PARSED", ready: true, failed: false } }),
    );
  });

  test("FAILED status -> ready false, failed true", async () => {
    mockPrisma.resume.findUnique.mockResolvedValue({ status: "FAILED" });
    const req = fakeReq({ userId: "user-1", params: { interviewId: "interview-1" } });
    const res = fakeRes();

    await handleResumeStatus(req, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED", ready: false, failed: true } }),
    );
  });
});

describe("handlePreSession", () => {
  test("invalid body -> throws 401 interviewId required", async () => {
    const req = fakeReq({ body: {} });
    await expect(handlePreSession(req, fakeRes(), vi.fn())).rejects.toMatchObject({ statusCode: 401 });
  });

  test("interview already has a summary -> returns cached summary without calling the resume table or LLM", async () => {
    mockPrisma.interview.findUnique.mockResolvedValue({ summary: JSON.stringify({ name: "Aman" }) });
    const req = fakeReq({ body: { interviewId: "interview-1" } });
    const res = fakeRes();

    await handlePreSession(req, res, vi.fn());

    expect(mockPrisma.resume.findUnique).not.toHaveBeenCalled();
    expect(mockOpenaiService.getResumeSummary).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Summary already generated", data: { name: "Aman" } }),
    );
  });

  test("no resume row -> throws 404 ResumeNotFound", async () => {
    mockPrisma.interview.findUnique.mockResolvedValue(null);
    mockPrisma.resume.findUnique.mockResolvedValue(null);
    const req = fakeReq({ body: { interviewId: "interview-1" } });
    await expect(handlePreSession(req, fakeRes(), vi.fn())).rejects.toMatchObject({
      statusCode: 404,
      message: "ResumeNotFound",
    });
  });

  test("resume parse FAILED -> throws 422 ResumeParseFailed", async () => {
    mockPrisma.interview.findUnique.mockResolvedValue(null);
    mockPrisma.resume.findUnique.mockResolvedValue({ status: "FAILED", parsed: null });
    const req = fakeReq({ body: { interviewId: "interview-1" } });
    await expect(handlePreSession(req, fakeRes(), vi.fn())).rejects.toMatchObject({
      statusCode: 422,
      message: "ResumeParseFailed",
    });
  });

  test("resume not yet parsed -> 202 ResumeNotReady, no LLM call", async () => {
    mockPrisma.interview.findUnique.mockResolvedValue(null);
    mockPrisma.resume.findUnique.mockResolvedValue({ status: "UPLOADED_LOCAL", parsed: null });
    const req = fakeReq({ body: { interviewId: "interview-1" } });
    const res = fakeRes();

    await handlePreSession(req, res, vi.fn());

    expect(mockOpenaiService.getResumeSummary).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "ResumeNotReady", data: null });
  });

  test("resume parsed -> generates summary via LLM, persists it, and returns 201", async () => {
    mockPrisma.interview.findUnique.mockResolvedValue(null);
    mockPrisma.resume.findUnique.mockResolvedValue({
      status: "PARSED",
      parsed: { rawResumeText: "raw", usedOcr: false, githubSources: [], siteSources: [] },
    });
    mockOpenaiService.getResumeSummary.mockResolvedValue({ name: "Aman", role: "Engineer" });
    const req = fakeReq({ body: { interviewId: "interview-1" } });
    const res = fakeRes();

    await handlePreSession(req, res, vi.fn());

    expect(mockOpenaiService.getResumeSummary).toHaveBeenCalledWith({
      rawResumeText: "raw",
      usedOcr: false,
      githubSources: [],
      siteSources: [],
    });
    expect(mockPrisma.interview.update).toHaveBeenCalledWith({
      where: { id: "interview-1" },
      data: { summary: JSON.stringify({ name: "Aman", role: "Engineer" }) },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("updateSummary", () => {
  const validSummary = {
    name: "Aman",
    role: "Engineer",
    summary: "summary",
    yearOfExp: "<1 year",
    email: "a@b.com",
    linkedIn: null,
    github: null,
    phone: null,
    technicalSkills: [],
    experience: [],
    projects: [],
    education: [],
  };

  test("no userId -> throws 401", async () => {
    const req = fakeReq({ params: { interviewId: "interview-1" }, body: validSummary });
    await expect(updateSummary(req, fakeRes(), vi.fn())).rejects.toMatchObject({ statusCode: 401 });
  });

  test("no interviewId param -> throws 400", async () => {
    const req = fakeReq({ userId: "user-1", params: {}, body: validSummary });
    await expect(updateSummary(req, fakeRes(), vi.fn())).rejects.toMatchObject({ statusCode: 400 });
  });

  test("invalid summary shape -> throws 400 InvalidSummary", async () => {
    const req = fakeReq({
      userId: "user-1",
      params: { interviewId: "interview-1" },
      body: { name: "Aman" }, // missing required fields
    });
    await expect(updateSummary(req, fakeRes(), vi.fn())).rejects.toMatchObject({
      statusCode: 400,
      message: "InvalidSummary",
    });
  });

  test("invalid yearOfExp enum value -> throws 400 InvalidSummary", async () => {
    const req = fakeReq({
      userId: "user-1",
      params: { interviewId: "interview-1" },
      body: { ...validSummary, yearOfExp: "20 years" },
    });
    await expect(updateSummary(req, fakeRes(), vi.fn())).rejects.toMatchObject({ statusCode: 400 });
  });

  test("interview not owned by user -> throws 404 Interview not found", async () => {
    mockPrisma.interview.findFirst.mockResolvedValue(null);
    const req = fakeReq({ userId: "user-1", params: { interviewId: "interview-1" }, body: validSummary });
    await expect(updateSummary(req, fakeRes(), vi.fn())).rejects.toMatchObject({
      statusCode: 404,
      message: "Interview not found",
    });
  });

  test("valid summary for owned interview -> persists and echoes it back", async () => {
    mockPrisma.interview.findFirst.mockResolvedValue({ id: "interview-1" });
    const req = fakeReq({ userId: "user-1", params: { interviewId: "interview-1" }, body: validSummary });
    const res = fakeRes();

    await updateSummary(req, res, vi.fn());

    expect(mockPrisma.interview.findFirst).toHaveBeenCalledWith({
      where: { id: "interview-1", userId: "user-1" },
      select: { id: true },
    });
    expect(mockPrisma.interview.update).toHaveBeenCalledWith({
      where: { id: "interview-1" },
      data: { summary: JSON.stringify(validSummary) },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Summary updated", data: validSummary }),
    );
  });
});

describe("generateLivekitToken", () => {
  test("no userId -> throws 401", async () => {
    const req = fakeReq({ params: { interviewId: "interview-1" } });
    await expect(generateLivekitToken(req, fakeRes())).rejects.toMatchObject({ statusCode: 401 });
  });

  test("no interviewId param -> throws 400", async () => {
    const req = fakeReq({ userId: "user-1", params: {} });
    await expect(generateLivekitToken(req, fakeRes())).rejects.toMatchObject({ statusCode: 400 });
  });

  test("interview not owned by user -> throws 404 Interview not found", async () => {
    mockPrisma.interview.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.interview.findFirst.mockResolvedValue(null);
    const req = fakeReq({ userId: "user-1", params: { interviewId: "interview-1" } });
    await expect(generateLivekitToken(req, fakeRes())).rejects.toMatchObject({
      statusCode: 404,
      message: "Interview not found",
    });
  });

  test("happy path -> atomically claims the interview, grants room access, dispatches the agent", async () => {
    mockPrisma.interview.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.interview.findUniqueOrThrow.mockResolvedValue({
      id: "interview-1",
      summary: null,
      jobRole: "Backend Engineer",
      experience: "mid",
    });
    mockPrisma.user.findUnique.mockResolvedValue({ email: "candidate@example.com" });
    const req = fakeReq({ userId: "user-1", params: { interviewId: "interview-1" } });
    const res = fakeRes();

    await generateLivekitToken(req, res);

    expect(mockPrisma.interview.updateMany).toHaveBeenCalledWith({
      where: { id: "interview-1", userId: "user-1", status: "SCHEDULED" },
      data: expect.objectContaining({ status: "ONGOING" }),
    });
    expect(mockLivekit.__addGrant).toHaveBeenCalledWith(
      expect.objectContaining({ roomJoin: true, room: "interview-interview-1" }),
    );
    expect(mockLivekit.__toJwt).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ participant_token: "signed.jwt.token" }),
    );
  });

  test("interview already started (claim loses the race, e.g. a concurrent duplicate request already won it) -> throws 409, no token minted", async () => {
    mockPrisma.interview.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.interview.findFirst.mockResolvedValue({ id: "interview-1" });
    const req = fakeReq({ userId: "user-1", params: { interviewId: "interview-1" } });

    await expect(generateLivekitToken(req, fakeRes())).rejects.toMatchObject({
      statusCode: 409,
      message: "InterviewAlreadyStarted",
    });
    expect(mockLivekit.__toJwt).not.toHaveBeenCalled();
  });
});

describe("recordInterviewMessage", () => {
  test("invalid body (bad role) -> throws 400 Invalid message", async () => {
    const req = fakeReq({ params: { interviewId: "interview-1" }, body: { role: "System", content: "hi" } });
    await expect(recordInterviewMessage(req, fakeRes())).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid message",
    });
  });

  test("empty content -> throws 400 Invalid message", async () => {
    const req = fakeReq({ params: { interviewId: "interview-1" }, body: { role: "User", content: "" } });
    await expect(recordInterviewMessage(req, fakeRes())).rejects.toMatchObject({ statusCode: 400 });
  });

  test("valid message -> persisted with the given role/content and 201 returned", async () => {
    const req = fakeReq({
      params: { interviewId: "interview-1" },
      body: { role: "Assistant", content: "Tell me about yourself." },
    });
    const res = fakeRes();

    await recordInterviewMessage(req, res);

    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: {
        interviewId: "interview-1",
        role: "Assistant",
        content: "Tell me about yourself.",
        createdAt: undefined,
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("numeric unix-seconds createdAt is converted to a Date", async () => {
    const req = fakeReq({
      params: { interviewId: "interview-1" },
      body: { role: "User", content: "hello", createdAt: 1700000000 },
    });

    await recordInterviewMessage(req, fakeRes());

    const call = mockPrisma.message.create.mock.calls[0][0];
    expect(call.data.createdAt).toBeInstanceOf(Date);
    expect(call.data.createdAt.getTime()).toBe(1700000000 * 1000);
  });
});

describe("completeInterview", () => {
  test("marks the interview COMPLETED and stamps endAt", async () => {
    const req = fakeReq({ params: { interviewId: "interview-1" } });
    const res = fakeRes();

    await completeInterview(req, res);

    expect(mockPrisma.interview.update).toHaveBeenCalledWith({
      where: { id: "interview-1" },
      data: expect.objectContaining({ status: "COMPLETED" }),
    });
    expect(mockPrisma.interview.update.mock.calls[0][0].data.endAt).toBeInstanceOf(Date);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
