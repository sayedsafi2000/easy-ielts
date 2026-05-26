"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  saveListening, saveReading, saveWriting, saveSpeaking,
  updateTestDetails, uploadFile,
  type AdminListeningSection, type AdminReadingPassage,
  type AdminWritingState,
} from "@/lib/adminApi";
import { api } from "@/lib/api";

/* ─── Pre-filled dummy data for MT-008 ─────────────────────────────────── */
const TEST = {
  id: "MT-008",
  name: "Full Mock Test — May 2026",
  type: "Full Mock",
  track: "Academic",
  difficulty: "Medium",
  status: "Published",
  attempts: 142,
  notes: "May sitting preparation test. Focus on graph types from 2023-2025 Cambridge books.",
};

const LISTENING_SECTIONS = [
  {
    title: "A conversation between two students about a university project",
    audio: "https://cdn.ieltsjournal.com/audio/mt-008-s1.mp3",
    description: "You will hear two students discussing their biology project assignment.",
    questions: [
      { id: 1, type: "MCQ", text: "What subject are the two students studying?", options: ["Biology", "Chemistry", "Physics", "Medicine"], answer: "A" },
      { id: 2, type: "fill-blank", text: "The project deadline is ________.", options: [], answer: "Friday 15th" },
      { id: 3, type: "MCQ", text: "What does Maria suggest they do first?", options: ["Visit the library", "Email the professor", "Create an outline", "Find a partner"], answer: "C" },
    ],
  },
  {
    title: "A tour guide explaining a museum exhibition",
    audio: "https://cdn.ieltsjournal.com/audio/mt-008-s2.mp3",
    description: "You will hear a museum tour guide explaining the Ancient Egypt exhibition.",
    questions: [
      { id: 4, type: "MCQ", text: "How old is the museum?", options: ["50 years", "80 years", "120 years", "200 years"], answer: "C" },
      { id: 5, type: "fill-blank", text: "The exhibition features over ________ artefacts.", options: [], answer: "300" },
    ],
  },
  {
    title: "A lecture on climate change and agriculture",
    audio: "https://cdn.ieltsjournal.com/audio/mt-008-s3.mp3",
    description: "You will hear a university lecture about the effects of climate change on food production.",
    questions: [
      { id: 6, type: "MCQ", text: "According to the lecturer, which crop is most affected?", options: ["Rice", "Wheat", "Maize", "Soybeans"], answer: "B" },
      { id: 7, type: "matching", text: "Match the regions to their primary impact.", options: ["Sub-Saharan Africa → Drought", "South Asia → Flooding", "Europe → Irregular seasons"], answer: "" },
    ],
  },
  {
    title: "A documentary on renewable energy solutions",
    audio: "https://cdn.ieltsjournal.com/audio/mt-008-s4.mp3",
    description: "You will hear a documentary excerpt discussing solar and wind energy developments.",
    questions: [
      { id: 8, type: "MCQ", text: "Which country leads in solar capacity?", options: ["USA", "Germany", "China", "India"], answer: "C" },
      { id: 9, type: "fill-blank", text: "Wind energy now accounts for ________% of global electricity.", options: [], answer: "7.8" },
    ],
  },
];

const READING_PASSAGES = [
  {
    title: "The History of the Internet",
    text: "The internet, as we know it today, emerged from a US Department of Defense project called ARPANET in the late 1960s...",
    questions: [
      { id: 10, type: "tfng", text: "ARPANET was originally developed for military communication.", options: [], answer: "True" },
      { id: 11, type: "MCQ", text: "When did the World Wide Web become publicly accessible?", options: ["1983", "1989", "1991", "1995"], answer: "C" },
    ],
  },
  {
    title: "Urban Green Spaces and Mental Health",
    text: "Research consistently shows that access to parks, gardens, and natural environments within cities has significant positive effects on residents' psychological wellbeing...",
    questions: [
      { id: 12, type: "tfng", text: "All cities have adequate green space per resident.", options: [], answer: "False" },
      { id: 13, type: "short", text: "What term is used to describe the psychological benefit of nature exposure?", options: [], answer: "attention restoration" },
    ],
  },
  {
    title: "The Economics of Space Exploration",
    text: "Private companies entering the space industry have dramatically reduced launch costs over the past decade...",
    questions: [
      { id: 14, type: "MCQ", text: "How much has the cost per kilogram to orbit reduced since 2010?", options: ["20%", "50%", "80%", "90%"], answer: "D" },
      { id: 15, type: "tfng", text: "Government agencies no longer invest in space exploration.", options: [], answer: "Not Given" },
    ],
  },
];

const WRITING_DATA = {
  t1ChartType: "Line Graph",
  t1Image: "https://cdn.ieltsjournal.com/charts/mt-008-t1.png",
  t1Prompt: "The graph below shows the number of visitors to three London museums between 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  t1Model: "The line graph illustrates the number of visitors to three museums in London — the British Museum, the National Gallery, and the V&A — over a ten-year period from 2010 to 2020.\n\nOverall, the British Museum consistently attracted the most visitors throughout the period, while the V&A saw the most significant growth...",
  t1Notes: "Students must reference all 3 museums. Key trend: V&A growth vs British Museum plateau. Band 7+ requires comparison language and accurate data referencing.",
  t2Type: "Discuss both views + opinion",
  t2Prompt: "Some people believe that university education should be free for all students. Others believe that students should pay for their own tuition. Discuss both views and give your own opinion.",
  t2Model: "The question of whether university education should be provided free of charge or funded by students themselves is a subject of considerable debate...",
  t2Notes: "Both views must be discussed before giving opinion. Look for: clear thesis in intro, body paragraph structure, cohesive devices, range of vocabulary related to education/finance.",
};

const SPEAKING_DATA = {
  part1: [
    "Can you tell me your full name and where you're from?",
    "Do you work or are you a student?",
    "What do you enjoy doing in your free time?",
    "How often do you use public transport?",
  ],
  part2: [
    "Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why it was memorable to you.",
  ],
  part3: [
    "Why do you think travel has become more popular in recent years?",
    "What are the environmental impacts of increased international tourism?",
    "Do you think people travel differently now compared to 20 years ago? How?",
  ],
};

type QType = "MCQ" | "fill-blank" | "matching" | "tfng" | "short";

interface Question { id: number; type: QType; text: string; options: string[]; answer: string; }
interface LSection { title: string; audio: string; description: string; questions: Question[]; }
interface RPassage { title: string; text: string; questions: Question[]; }

function QuestionEditor({ q, index, onChange, onRemove }: { q: Question; index: number; onChange: (q: Question) => void; onRemove: () => void }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">Q{index + 1} · <span className="font-normal text-slate-400">{q.type}</span></span>
        <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-600 cursor-pointer font-semibold">Remove</button>
      </div>
      <textarea value={q.text} onChange={(e) => onChange({ ...q, text: e.target.value })} rows={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      {q.type === "MCQ" && (
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 w-4">{["A","B","C","D"][i]}</span>
              <input value={opt} onChange={(e) => { const o=[...q.options]; o[i]=e.target.value; onChange({...q,options:o}); }} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input type="radio" name={`c-${q.id}`} checked={q.answer===["A","B","C","D"][i]} onChange={()=>onChange({...q,answer:["A","B","C","D"][i]})} className="cursor-pointer" />
            </div>
          ))}
        </div>
      )}
      {q.type==="tfng" && (
        <div className="flex gap-2">
          {["True","False","Not Given"].map((v)=>(
            <button key={v} onClick={()=>onChange({...q,answer:v})} className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${q.answer===v?"bg-blue-600 text-white":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>{v}</button>
          ))}
        </div>
      )}
      {(q.type==="fill-blank"||q.type==="short") && (
        <input value={q.answer} onChange={(e)=>onChange({...q,answer:e.target.value})} placeholder="Correct answer" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      )}
    </div>
  );
}

export default function TestEditPage() {
  const params = useParams<{ id: string }>();
  const testId = params?.id as string;

  const [tab, setTab] = useState("Details");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<Record<string,string>>({ ...TEST, attempts: String(TEST.attempts), notes: TEST.notes });
  const [listeningSections, setListeningSections] = useState<LSection[]>(LISTENING_SECTIONS as LSection[]);
  const [readingPassages, setReadingPassages] = useState<RPassage[]>(READING_PASSAGES as RPassage[]);
  const [writingData, setWritingData] = useState<Record<string,string>>(WRITING_DATA);
  const [speakingData, setSpeakingData] = useState<Record<string,string[]>>(SPEAKING_DATA);

  // Load real test + content from the API on mount.
  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    (async () => {
      try {
        const [test, content] = await Promise.all([
          api.get<{ id: string; title: string; type: string; difficulty: string; status: string; notes?: string }>(`/api/tests/${testId}`),
          api.get<{
            listening: Array<{ id: number; audioLabel: string; audioUrl?: string; context: string; groups: Array<{ questions: Array<{ id: number; text?: string; opts?: string[] }> }> }>;
            reading:   Array<{ id: number; title: string; text: string; groups: Array<{ type: string; options?: string[]; questions: Array<{ id: number; text?: string; opts?: string[] }> }> }>;
            writing:   Array<{ id: number; prompt: string; chartImageUrl?: string | null; chartType?: string; modelAnswer?: string; markingNotes?: string }>;
            speaking:  Array<{ num: number; sampleQ: string[] }>;
          }>(`/api/admin/tests/${testId}/content`),
        ]);
        if (cancelled) return;

        setDetails((d) => ({
          ...d,
          name:       test.title,
          track:      test.type === "general" ? "General" : "Academic",
          difficulty: test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1),
          status:     test.status.charAt(0).toUpperCase() + test.status.slice(1),
          notes:      test.notes ?? "",
        }));

        // Listening — collapse server groups back into the flat shape the
        // existing UI expects (questions[] per section).
        if (Array.isArray(content.listening) && content.listening.length) {
          setListeningSections(content.listening.map((sec) => ({
            title:       sec.audioLabel,
            audio:       sec.audioUrl ?? "",
            description: sec.context ?? "",
            questions:   sec.groups.flatMap((g) => g.questions).map((q) => ({
              id:      q.id,
              type:    "MCQ" as QType,
              text:    q.text ?? "",
              options: Array.isArray(q.opts) ? q.opts.map((o) => String(o).replace(/^[A-Z]\s+/, "")) : [],
              answer:  "",
            })),
          })) as LSection[]);
        }

        // Reading — same flatten.
        if (Array.isArray(content.reading) && content.reading.length) {
          setReadingPassages(content.reading.map((p) => ({
            title:     p.title,
            text:      p.text,
            questions: p.groups.flatMap((g) => g.questions).map((q) => ({
              id:      q.id,
              type:    "tfng" as QType,
              text:    q.text ?? "",
              options: Array.isArray(q.opts) ? q.opts : [],
              answer:  "",
            })),
          })) as RPassage[]);
        }

        // Writing
        if (Array.isArray(content.writing) && content.writing.length) {
          const t1 = content.writing.find((t) => t.id === 1);
          const t2 = content.writing.find((t) => t.id === 2);
          setWritingData((w) => ({
            ...w,
            t1Prompt: t1?.prompt ?? w.t1Prompt,
            t1Image:  t1?.chartImageUrl ?? "",
            t1ChartType: t1?.chartType ?? w.t1ChartType,
            t1Model:  (t1 as any)?.modelAnswer  ?? w.t1Model,
            t1Notes:  (t1 as any)?.markingNotes ?? w.t1Notes,
            t2Prompt: t2?.prompt ?? w.t2Prompt,
            t2Model:  (t2 as any)?.modelAnswer  ?? w.t2Model,
            t2Notes:  (t2 as any)?.markingNotes ?? w.t2Notes,
          }));
        }

        // Speaking
        if (Array.isArray(content.speaking) && content.speaking.length) {
          setSpeakingData({
            part1: content.speaking.find((p) => p.num === 1)?.sampleQ ?? [""],
            part2: content.speaking.find((p) => p.num === 2)?.sampleQ ?? [""],
            part3: content.speaking.find((p) => p.num === 3)?.sampleQ ?? [""],
          });
        }
      } catch (err) {
        // Stay on the seeded sample data so the editor remains usable.
        console.warn("Could not load test from API:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [testId]);

  // Persist everything in parallel. Any tab the user hasn't touched still gets
  // sent — that's fine because the backend replaces a module's content as a
  // single transactional operation.
  async function handleSave() {
    if (saving) return;
    setSaveError("");
    setSaving(true);
    try {
      await Promise.all([
        updateTestDetails(testId, {
          name:       details.name,
          track:      (details.track as "Academic" | "General"),
          difficulty: details.difficulty as "Easy" | "Medium" | "Hard",
          status:     details.status as "Draft" | "Published",
          notes:      details.notes,
        }),
        saveListening(testId, listeningSections as AdminListeningSection[]),
        saveReading  (testId, readingPassages   as AdminReadingPassage[]),
        saveWriting  (testId, writingData       as unknown as AdminWritingState),
        saveSpeaking (testId, speakingData),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  // Helper for the Listening "Audio File URL" upload button to actually upload.
  async function handleAudioUpload(si: number, file: File) {
    try {
      const r = await uploadFile(file);
      const arr = [...listeningSections];
      arr[si] = { ...arr[si], audio: r.url };
      setListeningSections(arr);
    } catch (err: any) {
      setSaveError(err?.message || "Audio upload failed.");
    }
  }

  // And for Writing Task-1 chart image.
  async function handleChartUpload(file: File) {
    try {
      const r = await uploadFile(file);
      setWritingData((d) => ({ ...d, t1Image: r.url }));
    } catch (err: any) {
      setSaveError(err?.message || "Image upload failed.");
    }
  }

  const tabs = ["Details", "Listening", "Reading", "Writing", "Speaking"];

  const updateLQ = (si: number, qi: number, q: Question) => {
    const sections = [...listeningSections];
    sections[si].questions[qi] = q;
    setListeningSections([...sections]);
  };
  const removeLQ = (si: number, qi: number) => {
    const sections = [...listeningSections];
    sections[si].questions = sections[si].questions.filter((_,i)=>i!==qi);
    setListeningSections([...sections]);
  };
  const updateRQ = (pi: number, qi: number, q: Question) => {
    const passages = [...readingPassages];
    passages[pi].questions[qi] = q;
    setReadingPassages([...passages]);
  };
  const removeRQ = (pi: number, qi: number) => {
    const passages = [...readingPassages];
    passages[pi].questions = passages[pi].questions.filter((_,i)=>i!==qi);
    setReadingPassages([...passages]);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/tests" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Tests
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{details.name}</h1>
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">{details.status}</span>
            <span className="text-xs text-slate-400">{testId} · {String((details as any).attempts ?? 0)} attempts</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs font-semibold text-green-600 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Saved</span>}
          {saveError && <span className="text-xs font-semibold text-red-600">{saveError}</span>}
          <a href={`/start-test/format?track=${(details as any).type === 'general' ? 'general' : 'academic'}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-700 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 cursor-pointer">Preview Test</a>
          <button onClick={handleSave} disabled={saving} className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl cursor-pointer transition-colors disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-100 shadow-sm rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl cursor-pointer transition-colors ${tab===t?"bg-slate-900 text-white":"text-slate-600 hover:bg-slate-100"}`}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

        {tab === "Details" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Test Name</label>
                <input value={details.name} onChange={(e)=>setDetails(d=>({...d,name:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Track</label>
                <select value={details.track} onChange={(e)=>setDetails(d=>({...d,track:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option>Academic</option><option>General</option><option>Both</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Difficulty</label>
                <select value={details.difficulty} onChange={(e)=>setDetails(d=>({...d,difficulty:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
                <select value={details.status} onChange={(e)=>setDetails(d=>({...d,status:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option value="Draft">Draft</option><option value="Published">Published</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Internal Notes</label>
              <textarea value={details.notes} onChange={(e)=>setDetails(d=>({...d,notes:e.target.value}))} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-3">Test Statistics</p>
              <div className="grid grid-cols-3 gap-4">
                {[{ label: "Total Attempts", value: String((details as any).attempts ?? 0) }, { label: "Avg Band Score", value: "—" }, { label: "Status", value: (details as any).status ? (details as any).status.charAt(0).toUpperCase() + (details as any).status.slice(1) : "Draft" }].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "Listening" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Listening Sections</h3>
                <p className="text-xs text-slate-500 mt-0.5">{listeningSections.reduce((a,s)=>a+s.questions.length,0)} total questions across {listeningSections.length} sections</p>
              </div>
            </div>
            {listeningSections.map((s, si) => (
              <div key={si} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Section {si+1}</span>
                  <input value={s.title} onChange={(e)=>{const arr=[...listeningSections];arr[si]={...s,title:e.target.value};setListeningSections(arr);}} className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:outline-none flex-1" />
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Audio URL</label>
                      <div className="flex gap-2">
                        <input value={s.audio} onChange={(e)=>{const arr=[...listeningSections];arr[si]={...s,audio:e.target.value};setListeningSections(arr);}} placeholder="https://res.cloudinary.com/... or paste URL" className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs" />
                        <label className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl cursor-pointer transition-colors flex-shrink-0">
                          Upload
                          <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) handleAudioUpload(si, f); (ev.target as HTMLInputElement).value = ''; }} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Context for Students</label>
                      <input value={s.description} onChange={(e)=>{const arr=[...listeningSections];arr[si]={...s,description:e.target.value};setListeningSections(arr);}} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-3">Questions ({s.questions.length})</p>
                    <div className="space-y-3">
                      {s.questions.map((q,qi)=>(
                        <QuestionEditor key={q.id} q={q} index={qi} onChange={(nq)=>updateLQ(si,qi,nq)} onRemove={()=>removeLQ(si,qi)} />
                      ))}
                    </div>
                    <button onClick={()=>{const arr=[...listeningSections];arr[si]={...s,questions:[...s.questions,{id:Date.now(),type:"MCQ",text:"",options:["","","",""],answer:""}]};setListeningSections(arr);}} className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Reading" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Reading Passages</h3>
                <p className="text-xs text-slate-500 mt-0.5">{readingPassages.reduce((a,p)=>a+p.questions.length,0)} total questions across {readingPassages.length} passages</p>
              </div>
            </div>
            {readingPassages.map((p, pi) => (
              <div key={pi} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-violet-50 border-b border-violet-100 px-5 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">Passage {pi+1}</span>
                  <input value={p.title} onChange={(e)=>{const arr=[...readingPassages];arr[pi]={...p,title:e.target.value};setReadingPassages(arr);}} className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:outline-none flex-1" />
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Passage Text</label>
                    <textarea value={p.text} onChange={(e)=>{const arr=[...readingPassages];arr[pi]={...p,text:e.target.value};setReadingPassages(arr);}} rows={8} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-violet-500 font-serif" />
                    <p className="text-xs text-slate-400 mt-1">{p.text.split(/\s+/).filter(Boolean).length} words</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-3">Questions ({p.questions.length})</p>
                    <div className="space-y-3">
                      {p.questions.map((q,qi)=>(
                        <QuestionEditor key={q.id} q={q} index={qi} onChange={(nq)=>updateRQ(pi,qi,nq)} onRemove={()=>removeRQ(pi,qi)} />
                      ))}
                    </div>
                    <button onClick={()=>{const arr=[...readingPassages];arr[pi]={...p,questions:[...p.questions,{id:Date.now(),type:"tfng",text:"",options:[],answer:""}]};setReadingPassages(arr);}} className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 cursor-pointer flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Writing" && (
          <div className="space-y-6">
            {[
              { key: "t1", label: "Task 1", badge: "bg-amber-100 text-amber-700", accent: "amber", hint: "20 min · 150+ words", promptKey: "t1Prompt", modelKey: "t1Model", notesKey: "t1Notes" },
              { key: "t2", label: "Task 2", badge: "bg-amber-100 text-amber-700", accent: "amber", hint: "40 min · 250+ words", promptKey: "t2Prompt", modelKey: "t2Model", notesKey: "t2Notes" },
            ].map((task) => (
              <div key={task.key} className="border border-amber-200 rounded-2xl overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${task.badge}`}>{task.label}</span>
                  <span className="text-xs text-slate-500">{task.hint}</span>
                </div>
                <div className="p-5 space-y-4">
                  {task.key === "t1" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Chart Type</label>
                        <select value={writingData.t1ChartType} onChange={(e)=>setWritingData(d=>({...d,t1ChartType:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                          {["Line Graph","Bar Chart","Pie Chart","Table","Map / Diagram","Process Diagram","Mixed Charts"].map((v)=><option key={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Chart Image URL</label>
                        <div className="flex gap-2">
                          <input value={writingData.t1Image} onChange={(e)=>setWritingData(d=>({...d,t1Image:e.target.value}))} placeholder="https://res.cloudinary.com/..." className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs" />
                          <label className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl cursor-pointer transition-colors flex-shrink-0">
                            Upload
                            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) handleChartUpload(f); (ev.target as HTMLInputElement).value = ''; }} />
                          </label>
                        </div>
                        {writingData.t1Image && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-w-xs">
                            <img src={writingData.t1Image} alt="chart preview" className="w-full h-auto max-h-48 object-contain bg-slate-50" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {task.key === "t2" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Essay Type</label>
                      <select value={writingData.t2Type} onChange={(e)=>setWritingData(d=>({...d,t2Type:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                        {["Discuss both views + opinion","Advantages and disadvantages","Problem and solution","To what extent do you agree?","Direct question"].map((v)=><option key={v}>{v}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Prompt shown to student</label>
                    <textarea value={writingData[task.promptKey]} onChange={(e)=>setWritingData(d=>({...d,[task.promptKey]:e.target.value}))} rows={4} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Model answer (examiner only)</label>
                    <textarea value={writingData[task.modelKey]} onChange={(e)=>setWritingData(d=>({...d,[task.modelKey]:e.target.value}))} rows={6} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Marking notes (examiner only)</label>
                    <textarea value={writingData[task.notesKey]} onChange={(e)=>setWritingData(d=>({...d,[task.notesKey]:e.target.value}))} rows={3} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Speaking" && (
          <div className="space-y-6">
            {[
              { key: "part1", label: "Part 1 — Introduction & Interview", desc: "4–5 min · Personal familiar topic questions", color: "bg-green-50 border-green-100", badge: "bg-green-100 text-green-700", accent: "ring-green-500" },
              { key: "part2", label: "Part 2 — Individual Long Turn", desc: "3–4 min · Cue card + 1 min prep + 1–2 min talk", color: "bg-teal-50 border-teal-100", badge: "bg-teal-100 text-teal-700", accent: "ring-teal-500" },
              { key: "part3", label: "Part 3 — Two-way Discussion", desc: "4–5 min · Abstract discussion on the Part 2 theme", color: "bg-emerald-50 border-emerald-100", badge: "bg-emerald-100 text-emerald-700", accent: "ring-emerald-500" },
            ].map((part) => (
              <div key={part.key} className={`border rounded-2xl overflow-hidden ${part.color}`}>
                <div className={`border-b px-5 py-3 ${part.color}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${part.badge}`}>{part.label.split(" — ")[0]}</span>
                    <span className="text-xs font-semibold text-slate-700">{part.label.split(" — ")[1]}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{part.desc}</p>
                </div>
                <div className="p-5 space-y-3">
                  {speakingData[part.key].map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-xs font-bold text-slate-400 mt-2.5 w-5 flex-shrink-0">{i+1}.</span>
                      <textarea
                        value={item}
                        onChange={(e)=>{const arr=[...speakingData[part.key]];arr[i]=e.target.value;setSpeakingData(d=>({...d,[part.key]:arr}));}}
                        rows={part.key==="part2"?4:2}
                        className={`flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 ${part.accent} bg-white`}
                      />
                      {speakingData[part.key].length > 1 && (
                        <button onClick={()=>setSpeakingData(d=>({...d,[part.key]:d[part.key].filter((_,idx)=>idx!==i)}))} className="text-xs text-red-400 hover:text-red-600 cursor-pointer mt-2 flex-shrink-0">✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={()=>setSpeakingData(d=>({...d,[part.key]:[...d[part.key],""]})) } className="text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    Add {part.key==="part2"?"variant":"question"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
