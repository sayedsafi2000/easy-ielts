export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: "student" | "admin" | "examiner";
  plan: "starter" | "pro" | "premium" | "intensive";
  target_band: number;
  country?: string;
  track?: "academic" | "general";
  email_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Result {
  id?: string;
  module: string;
  band_score: number | null;
  task1_score?: number | null;
  task2_score?: number | null;
  feedback?: string;
  criteria?: Record<string, number>;
  test_attempts?: { track: string; format: string; tests: { title: string } | null } | null;
  reviewer?: { full_name: string } | null;
}

export interface TestSummary {
  title: string;
  type: string;
}

export interface Attempt {
  id: string;
  test_id?: string | null;
  track: string;
  format: string;
  module: string | null;
  status: string;
  started_at: string;
  submitted_at: string | null;
  completed_at?: string | null;
  results: Result[];
  tests: TestSummary | null;
}

export interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_link?: string;
  examiner?: { full_name: string } | null;
}

export interface DashboardData {
  profile: Profile | null;
  attempts: Attempt[];
  upcomingSpeaking: { scheduled_at: string } | null;
  totalBookings?: number;
  pendingSubmissions?: number;
  actionableBookings?: number;
}

export interface Test {
  id: string;
  title: string;
  type: "academic" | "general";
  modules: string[];
  difficulty: "easy" | "medium" | "hard";
  duration_minutes: number;
  status: "draft" | "published" | "archived";
  notes?: string;
  created_at: string;
  listening_count?: number;
  reading_count?: number;
  writing_count?: number;
}

export interface AdminStats {
  totalStudents: number;
  testsThisMonth: number;
  pendingReviews: number;
  avgBand: string;
  upcomingSpeaking: Array<{ id: string; scheduled_at: string; status: string }>;
}
