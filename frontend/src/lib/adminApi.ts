/**
 * Admin-only API helpers — content + uploads.
 *
 * Translates the in-memory shape used by the admin "Edit Test" UI into the
 * payload shape expected by the backend (which mirrors the database model).
 */
import { api, API_URL } from "./api";

// ─── Types matching the admin UI's local state ─────────────────────────
export type AdminQType = "MCQ" | "fill-blank" | "matching" | "tfng" | "short";

export interface AdminQuestion {
  id: number;
  type: AdminQType;
  text: string;
  options: string[];
  answer: string;
}

export interface AdminListeningSection {
  title: string;
  audio: string;
  description: string;
  questions: AdminQuestion[];
}

export interface AdminReadingPassage {
  title: string;
  text: string;
  questions: AdminQuestion[];
}

// ─── Mappers: UI → backend ─────────────────────────────────────────────
function letterFromIndex(i: number) {
  return String.fromCharCode(65 + i);
}

/**
 * Listening: the admin UI keeps everything as a flat list of questions per
 * section, but the backend stores groups (Q1-5 MCQ, Q6-10 form, etc.). For
 * a smooth migration we collapse all the section's questions into a single
 * group of mixed types.
 */
function listeningSectionsToPayload(sections: AdminListeningSection[]) {
  return sections.map((s, si) => {
    const groups = s.questions.length
      ? [
          {
            label: `Section ${si + 1} questions`,
            instruction: s.description || "Answer the questions for this section.",
            type: detectListeningGroupType(s.questions),
            form_title: null,
            match_options: [],
            questions: s.questions.map((q) => mapQuestion(q, "listening")),
          },
        ]
      : [];
    return {
      section_number: si + 1,
      title: s.title || `Section ${si + 1}`,
      context: s.description || "",
      audio_url: s.audio || null,
      audio_duration: null,
      question_range: questionRange(s.questions),
      groups,
    };
  });
}

function readingPassagesToPayload(passages: AdminReadingPassage[]) {
  return passages.map((p, pi) => ({
    passage_number: pi + 1,
    title: p.title || `Passage ${pi + 1}`,
    body_text: p.text || "",
    question_range: questionRange(p.questions),
    groups: p.questions.length
      ? [
          {
            label: `Passage ${pi + 1} questions`,
            instruction: "Answer the questions based on the passage above.",
            type: detectReadingGroupType(p.questions),
            options: [],
            questions: p.questions.map((q) => mapQuestion(q, "reading")),
          },
        ]
      : [],
  }));
}

function questionRange(qs: AdminQuestion[]) {
  if (!qs.length) return null;
  const nums = qs.map((q) => q.id).sort((a, b) => a - b);
  return `${nums[0]}–${nums[nums.length - 1]}`;
}

function detectListeningGroupType(qs: AdminQuestion[]): "mcq" | "form" | "matching" {
  const types = new Set(qs.map((q) => q.type));
  if (types.has("matching")) return "matching";
  if (types.has("MCQ"))      return "mcq";
  return "form";
}

function detectReadingGroupType(qs: AdminQuestion[]): "mcq" | "tfng" | "fill" | "matching" | "short" {
  const types = new Set(qs.map((q) => q.type));
  if (types.has("tfng"))     return "tfng";
  if (types.has("MCQ"))      return "mcq";
  if (types.has("matching")) return "matching";
  if (types.has("short"))    return "short";
  return "fill";
}

function mapQuestion(q: AdminQuestion, module: "listening" | "reading") {
  if (q.type === "MCQ") {
    return {
      question_number: q.id,
      [module === "listening" ? "prompt" : "text"]: q.text,
      options: q.options.map((opt, i) => `${letterFromIndex(i)}  ${opt}`),
      correct_answer: q.answer,
      points: 1,
    };
  }
  if (q.type === "tfng") {
    return {
      question_number: q.id,
      text: q.text,
      options: ["TRUE", "FALSE", "NOT GIVEN"],
      correct_answer: q.answer,
      points: 1,
    };
  }
  if (q.type === "fill-blank" || q.type === "short") {
    return {
      question_number: q.id,
      [module === "listening" ? "prompt" : "text"]: q.text,
      options: [],
      correct_answer: q.answer,
      points: 1,
    };
  }
  // matching
  return {
    question_number: q.id,
    [module === "listening" ? "prompt" : "text"]: q.text,
    options: q.options,
    correct_answer: q.answer,
    points: 1,
  };
}

// ─── Public API ────────────────────────────────────────────────────────
export async function saveListening(testId: string, sections: AdminListeningSection[]) {
  return api.put(`/api/admin/tests/${testId}/listening`, {
    sections: listeningSectionsToPayload(sections),
  });
}

export async function saveReading(testId: string, passages: AdminReadingPassage[]) {
  return api.put(`/api/admin/tests/${testId}/reading`, {
    passages: readingPassagesToPayload(passages),
  });
}

export interface AdminWritingState {
  t1ChartType: string;
  t1Image: string;
  t1Prompt: string;
  t1Model: string;
  t1Notes: string;
  t2Type: string;
  t2Prompt: string;
  t2Model: string;
  t2Notes: string;
}

export async function saveWriting(testId: string, w: AdminWritingState) {
  const tasks = [
    {
      task_number: 1,
      heading: "WRITING TASK 1",
      instruction: "You should spend about 20 minutes on this task.",
      prompt: w.t1Prompt,
      note: "Write at least 150 words.",
      min_words: 150,
      time_minutes: 20,
      has_chart: !!w.t1Image,
      chart_type: w.t1ChartType,
      chart_image_url: w.t1Image || null,
      model_answer: w.t1Model,
      marking_notes: w.t1Notes,
    },
    {
      task_number: 2,
      heading: "WRITING TASK 2",
      instruction: "You should spend about 40 minutes on this task.\nWrite about the following topic:",
      prompt: w.t2Prompt,
      note: "Write at least 250 words.",
      min_words: 250,
      time_minutes: 40,
      has_chart: false,
      chart_type: null,
      chart_image_url: null,
      model_answer: w.t2Model,
      marking_notes: w.t2Notes,
    },
  ];
  return api.put(`/api/admin/tests/${testId}/writing`, { tasks });
}

export async function saveSpeaking(testId: string, partsByKey: Record<string, string[]>) {
  const meta: Record<string, { num: number; title: string; duration: string; description: string; prep: number }> = {
    part1: { num: 1, title: "Part 1 — Introduction & Interview", duration: "4–5 minutes", description: "Personal questions about familiar topics.",  prep: 0 },
    part2: { num: 2, title: "Part 2 — Individual Long Turn",     duration: "3–4 minutes", description: "Cue-card topic with 1 minute preparation.",   prep: 60 },
    part3: { num: 3, title: "Part 3 — Two-way Discussion",       duration: "4–5 minutes", description: "Abstract discussion on the Part 2 theme.",     prep: 0 },
  };
  const parts = Object.entries(partsByKey).map(([k, qs]) => ({
    part_number: meta[k].num,
    title:       meta[k].title,
    duration:    meta[k].duration,
    description: meta[k].description,
    prep_time_seconds: meta[k].prep,
    questions:   qs.filter((q) => q && q.trim()),
  }));
  return api.put(`/api/admin/tests/${testId}/speaking`, { parts });
}

// ─── File upload ───────────────────────────────────────────────────────
export async function uploadFile(file: File): Promise<{ url: string; filename: string; mime: string; size: number }> {
  const fd = new FormData();
  fd.append("file", file);
  const token = typeof window !== "undefined" ? window.localStorage.getItem("eielts_token") : null;
  const res = await fetch(`${API_URL}/api/uploads`, {
    method: "POST",
    body: fd,
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json?.message || "Upload failed");
  return json.data;
}

// ─── Test-level metadata ──────────────────────────────────────────────
export interface AdminTestDetails {
  name: string;
  type: "Full Mock" | "Single Module";
  track: "Academic" | "General" | "Both";
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Draft" | "Published";
  notes?: string;
}

export async function createTest(d: AdminTestDetails) {
  return api.post<{ id: string }>("/api/tests", {
    title:           d.name,
    type:            d.track === "General" ? "general" : "academic",
    modules:         d.type === "Full Mock" ? ["listening","reading","writing","speaking"] : [],
    difficulty:      d.difficulty.toLowerCase() as "easy" | "medium" | "hard",
    duration_minutes: d.type === "Full Mock" ? 165 : 60,
    status:          d.status.toLowerCase() as "draft" | "published",
    notes:           d.notes ?? "",
  });
}

export async function updateTestDetails(id: string, d: Partial<AdminTestDetails>) {
  const payload: Record<string, unknown> = {};
  if (d.name)        payload.title = d.name;
  if (d.track)       payload.type = d.track === "General" ? "general" : "academic";
  if (d.difficulty)  payload.difficulty = d.difficulty.toLowerCase();
  if (d.status)      payload.status = d.status.toLowerCase();
  if (d.notes !== undefined) payload.notes = d.notes;
  return api.patch(`/api/tests/${id}`, payload);
}
