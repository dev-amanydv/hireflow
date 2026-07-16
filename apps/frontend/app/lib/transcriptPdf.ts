import axios from "axios";
import { BACKEND_URL } from "./config";

type TranscriptMessage = {
  role: "User" | "Assistant";
  content: string;
  createdAt: string;
};

type TranscriptPayload = {
  type: "REAL" | "PRACTICE";
  skill: string | null;
  jobRole: string;
  experience: string;
  createdAt: string;
  messages: TranscriptMessage[];
};

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "interview"
  );
}

export async function downloadTranscriptPdf(interviewId: string): Promise<void> {
  const res = await axios.get(
    `${BACKEND_URL}/interview/${interviewId}/transcript`,
    { withCredentials: true },
  );
  const data = res.data?.data as TranscriptPayload;
  if (!data) throw new Error("No transcript data");

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentW = pageW - margin * 2;
  const bottom = pageH - margin;

  const ink = "#18181b";
  const muted = "#71717a";
  const hair = "#e4e4e7";

  const date = new Date(data.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const contextBits = [
    data.jobRole,
    data.experience ? `${data.experience} level` : null,
    data.type === "PRACTICE" ? "Practice" : "Interview",
    date,
  ].filter(Boolean);

  let y = margin + 6;
  doc.setTextColor(muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("INTERVIEW TRANSCRIPT", margin, y, { charSpace: 1.5 });

  y += 26;
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(data.jobRole, margin, y);

  y += 18;
  doc.setTextColor(muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(contextBits.join("   ·   "), margin, y);

  y += 20;
  doc.setDrawColor(hair);
  doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y);
  y += 28;

  const addPageFooter = () => {
    const page = doc.getNumberOfPages();
    doc.setTextColor(muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(page), pageW / 2, pageH - 28, { align: "center" });
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > bottom) {
      addPageFooter();
      doc.addPage();
      y = margin + 6;
    }
  };

  const messages = data.messages ?? [];
  if (messages.length === 0) {
    doc.setTextColor(muted);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.text("No transcript was recorded for this interview.", margin, y);
  }

  for (const m of messages) {
    const speaker = m.role === "Assistant" ? "Interviewer" : "Candidate";
    const isInterviewer = m.role === "Assistant";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const speakerLines = 1;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const bodyLines = doc.splitTextToSize(m.content.trim(), contentW) as string[];

    ensureSpace(14 + speakerLines * 12 + 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(isInterviewer ? muted : ink);
    doc.text(speaker.toUpperCase(), margin, y, { charSpace: 1 });
    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(ink);
    const lineH = 16;
    for (const line of bodyLines) {
      ensureSpace(lineH);
      doc.text(line, margin, y);
      y += lineH;
    }
    y += 16;
  }
  addPageFooter();

  const filename = `interview-transcript-${slugify(data.jobRole)}-${new Date(
    data.createdAt,
  )
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(filename);
}
