export type Experience = "beginner" | "junior" | "mid" | "senior" | "staff";
export type InterviewKind = "REAL" | "PRACTICE";
export type RecordingStatus = "NONE" | "PROCESSING" | "READY" | "FAILED";

export type ProfileStats = {
  totalInterviews: number;
  minutesPracticed: number;
  avgScore: number | null;
  bestScore: number | null;
  currentStreak: number;
};

export type ProfileResume = {
  name: string;
  overallScore: number | null;
  analyzedAt: string;
} | null;

export type WeeklyPracticePoint = { weekStart: string; minutes: number };
export type ScoreTrendPoint = { date: string; score: number };
export type TypeCount = { type: InterviewKind; count: number };
export type SkillCount = { skill: string | null; count: number };

export type MyProfileData = {
  id: string;
  username: string | null;
  displayName: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  provider: "GOOGLE" | "LOCAL";
  joinedAt: string;
  stats: ProfileStats;
  resume: ProfileResume;
  weeklyPractice: WeeklyPracticePoint[];
  scoreTrend: ScoreTrendPoint[];
  typeDistribution: TypeCount[];
  skillDistribution: SkillCount[];
};

export type MyInterviewCard = {
  id: string;
  jobRole: string;
  skill: string | null;
  experience: Experience;
  type: InterviewKind;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED";
  createdAt: string;
  recordingStatus: RecordingStatus;
  recordingDurationMs: number | null;
  isPublic: boolean;
  score: number | null;
};

export type PublicProfileData = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  interviews: {
    id: string;
    jobRole: string;
    skill: string | null;
    experience: Experience;
    type: InterviewKind;
    createdAt: string;
    recordingStatus: RecordingStatus;
    recordingDurationMs: number | null;
  }[];
};

export type PublicInterviewData = {
  jobRole: string;
  skill: string | null;
  experience: Experience;
  type: InterviewKind;
  createdAt: string;
  recordingStatus: RecordingStatus;
  durationMs: number | null;
  recordingUrl: string | null;
};
