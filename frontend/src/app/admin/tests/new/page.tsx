"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTest, saveListening, saveReading, saveWriting, saveSpeaking, uploadFile } from "@/lib/adminApi";

/* ─── Types ────────────────────────────────────────────────────────────── */
type QType = "MCQ" | "fill-blank" | "matching" | "tfng" | "short";

interface Question {
  id: number;
  type: QType;
  text: string;
  options: string[];
  answer: string;
}

interface ListeningSection {
  title: string;
  audio: string;
  description: string;
  questions: Question[];
}

interface ReadingPassage {
  title: string;
  text: string;
  questions: Question[];
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */
let qId = 1;
const blankQ = (type: QType): Question => ({
  id: qId++,
  type,
  text: "",
  options: type === "MCQ" ? ["", "", "", ""] : type === "matching" ? ["", "", ""] : [],
  answer: "",
});

const blankListeningSection = (): ListeningSection => ({
  title: "",
  audio: "",
  description: "",
  questions: [blankQ("MCQ")],
});

const blankPassage = (): ReadingPassage => ({
  title: "",
  text: "",
  questions: [blankQ("tfng")],
});

/* ─── Sub-components ───────────────────────────────────────────────────── */
function QuestionEditor({
  q,
  index,
  onChange,
  onRemove,
}: {
  q: Question;
  index: number;
  onChange: (q: Question) => void;
  onRemove: () => void;
}) {
  const qTypes: { value: QType; label: string }[] = [
    { value: "MCQ", label: "Multiple Choice" },
    { value: "fill-blank", label: "Fill in the Blank" },
    { value: "matching", label: "Matching" },
    { value: "tfng", label: "True / False / Not Given" },
    { value: "short", label: "Short Answer" },
  ];

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">Q{index + 1}</span>
        <div className="flex items-center gap-3">
          <select
            value={q.type}
            onChange={(e) => onChange({ ...q, type: e.target.value as QType, options: e.target.value === "MCQ" ? ["", "", "", ""] : e.target.value === "matching" ? ["", "", ""] : [], answer: "" })}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {qTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-600 cursor-pointer font-semibold">Remove</button>
        </div>
      </div>

      <textarea
        value={q.text}
        onChange={(e) => onChange({ ...q, text: e.target.value })}
        placeholder="Question text..."
        rows={2}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {q.type === "MCQ" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Options</p>
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 w-4">{["A", "B", "C", "D"][i]}</span>
              <input
                value={opt}
                onChange={(e) => { const o = [...q.options]; o[i] = e.target.value; onChange({ ...q, options: o }); }}
                placeholder={`Option ${["A","B","C","D"][i]}`}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <input
                type="radio"
                name={`correct-${q.id}`}
                checked={q.answer === ["A","B","C","D"][i]}
                onChange={() => onChange({ ...q, answer: ["A","B","C","D"][i] })}
                className="cursor-pointer"
                title="Mark as correct"
              />
            </div>
          ))}
          <p className="text-xs text-slate-400">Select the radio button to mark the correct answer</p>
        </div>
      )}

      {q.type === "tfng" && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Correct Answer</p>
          <div className="flex gap-2">
            {["True", "False", "Not Given"].map((v) => (
              <button
                key={v}
                onClick={() => onChange({ ...q, answer: v })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${q.answer === v ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {(q.type === "fill-blank" || q.type === "short") && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Model Answer</p>
          <input
            value={q.answer}
            onChange={(e) => onChange({ ...q, answer: e.target.value })}
            placeholder="Correct answer..."
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      )}

      {q.type === "matching" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Match items (left → right)</p>
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => { const o = [...q.options]; o[i] = e.target.value; onChange({ ...q, options: o }); }}
                placeholder={`Left item ${i + 1}`}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <span className="text-slate-400">→</span>
              <input
                placeholder={`Right item ${i + 1}`}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          ))}
          <button
            onClick={() => onChange({ ...q, options: [...q.options, ""] })}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            + Add pair
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Details ─────────────────────────────────────────────────────── */
function DetailsTab({ data, onChange }: { data: Record<string, string>; onChange: (k: string, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Test Name <span className="text-red-500">*</span></label>
          <input value={data.name} onChange={(e) => onChange("name", e.target.value)} placeholder="e.g. Full Mock Test — June 2026" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Test Type <span className="text-red-500">*</span></label>
          <select value={data.type} onChange={(e) => onChange("type", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="Full Mock">Full Mock Test (all 4 modules)</option>
            <option value="Single Module">Single Module</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">IELTS Track <span className="text-red-500">*</span></label>
          <select value={data.track} onChange={(e) => onChange("track", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="Academic">Academic</option>
            <option value="General">General Training</option>
            <option value="Both">Both (Academic + General)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Difficulty</label>
          <select value={data.difficulty} onChange={(e) => onChange("difficulty", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
          <select value={data.status} onChange={(e) => onChange("status", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="Draft">Draft (not visible to students)</option>
            <option value="Published">Published (visible to students)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Internal Notes</label>
        <textarea value={data.notes} onChange={(e) => onChange("notes", e.target.value)} placeholder="Admin notes about this test — not shown to students..." rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {data.type === "Single Module" && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Active Module</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "listening", label: "Listening", color: "bg-blue-100 text-blue-700 border-blue-200" },
              { key: "reading", label: "Reading", color: "bg-violet-100 text-violet-700 border-violet-200" },
              { key: "writing", label: "Writing", color: "bg-amber-100 text-amber-700 border-amber-200" },
              { key: "speaking", label: "Speaking", color: "bg-green-100 text-green-700 border-green-200" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => onChange("module", m.key)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border cursor-pointer transition-colors ${data.module === m.key ? m.color : "bg-slate-50 text-slate-400 border-slate-200"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Listening ───────────────────────────────────────────────────── */
function ListeningTab({ sections, onChange, onAudioUpload, uploadingAudioIdx }: { sections: ListeningSection[]; onChange: (s: ListeningSection[]) => void; onAudioUpload?: (si: number, file: File) => void; uploadingAudioIdx?: number | null }) {
  const updateSection = (i: number, s: ListeningSection) => { const arr = [...sections]; arr[i] = s; onChange(arr); };
  const addSection = () => onChange([...sections, blankListeningSection()]);
  const removeSection = (i: number) => onChange(sections.filter((_, idx) => idx !== i));

  const addQuestion = (si: number, type: QType) => {
    const s = { ...sections[si], questions: [...sections[si].questions, blankQ(type)] };
    updateSection(si, s);
  };
  const updateQ = (si: number, qi: number, q: Question) => {
    const qs = [...sections[si].questions]; qs[qi] = q;
    updateSection(si, { ...sections[si], questions: qs });
  };
  const removeQ = (si: number, qi: number) => {
    const qs = sections[si].questions.filter((_, idx) => idx !== qi);
    updateSection(si, { ...sections[si], questions: qs });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Listening Sections</h3>
          <p className="text-xs text-slate-500 mt-0.5">Standard IELTS has 4 sections with 10 questions each (40 total)</p>
        </div>
        <button onClick={addSection} disabled={sections.length >= 4} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Section ({sections.length}/4)
        </button>
      </div>

      {sections.map((section, si) => (
        <div key={si} className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Section {si + 1}</span>
              <input
                value={section.title}
                onChange={(e) => updateSection(si, { ...section, title: e.target.value })}
                placeholder={`Section ${si + 1} title (e.g. A Conversation between two people)`}
                className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:outline-none w-64 placeholder:text-slate-400"
              />
            </div>
            {sections.length > 1 && (
              <button onClick={() => removeSection(si)} className="text-xs text-red-400 hover:text-red-600 cursor-pointer font-semibold">Remove</button>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Audio File URL</label>
                <div className="flex gap-2">
                  <input
                    value={section.audio}
                    onChange={(e) => updateSection(si, { ...section, audio: e.target.value })}
                    placeholder="https://res.cloudinary.com/... or paste URL"
                    className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className={`text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer transition-colors flex-shrink-0 ${uploadingAudioIdx === si ? "bg-blue-100 text-blue-400" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>
                    {uploadingAudioIdx === si ? "Uploading…" : "Upload"}
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
                      className="hidden"
                      disabled={uploadingAudioIdx != null}
                      onChange={(ev) => { const f = ev.target.files?.[0]; if (f && onAudioUpload) onAudioUpload(si, f); (ev.target as HTMLInputElement).value = ''; }}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Section Context</label>
                <input
                  value={section.description}
                  onChange={(e) => updateSection(si, { ...section, description: e.target.value })}
                  placeholder="Brief context shown to students before audio plays..."
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-700">Questions <span className="text-slate-400 font-normal">({section.questions.length})</span></p>
                <div className="flex gap-1.5">
                  {(["MCQ", "fill-blank", "matching"] as QType[]).map((t) => (
                    <button key={t} onClick={() => addQuestion(si, t)} className="text-xs font-semibold text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                      + {t === "MCQ" ? "MCQ" : t === "fill-blank" ? "Fill Blank" : "Matching"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {section.questions.map((q, qi) => (
                  <QuestionEditor key={q.id} q={q} index={qi} onChange={(nq) => updateQ(si, qi, nq)} onRemove={() => removeQ(si, qi)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Tab: Reading ─────────────────────────────────────────────────────── */
function ReadingTab({ passages, onChange }: { passages: ReadingPassage[]; onChange: (p: ReadingPassage[]) => void }) {
  const updateP = (i: number, p: ReadingPassage) => { const arr = [...passages]; arr[i] = p; onChange(arr); };
  const addPassage = () => onChange([...passages, blankPassage()]);
  const removePassage = (i: number) => onChange(passages.filter((_, idx) => idx !== i));

  const addQ = (pi: number, type: QType) => {
    const p = { ...passages[pi], questions: [...passages[pi].questions, blankQ(type)] };
    updateP(pi, p);
  };
  const updateQ = (pi: number, qi: number, q: Question) => {
    const qs = [...passages[pi].questions]; qs[qi] = q;
    updateP(pi, { ...passages[pi], questions: qs });
  };
  const removeQ = (pi: number, qi: number) => {
    const qs = passages[pi].questions.filter((_, idx) => idx !== qi);
    updateP(pi, { ...passages[pi], questions: qs });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Reading Passages</h3>
          <p className="text-xs text-slate-500 mt-0.5">Standard IELTS has 3 passages with ~13 questions each (40 total)</p>
        </div>
        <button onClick={addPassage} disabled={passages.length >= 3} className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 cursor-pointer disabled:opacity-40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Passage ({passages.length}/3)
        </button>
      </div>

      {passages.map((passage, pi) => (
        <div key={pi} className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-violet-50 border-b border-violet-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">Passage {pi + 1}</span>
              <input
                value={passage.title}
                onChange={(e) => updateP(pi, { ...passage, title: e.target.value })}
                placeholder="Passage title / topic..."
                className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:outline-none w-64 placeholder:text-slate-400"
              />
            </div>
            {passages.length > 1 && (
              <button onClick={() => removePassage(pi)} className="text-xs text-red-400 hover:text-red-600 cursor-pointer font-semibold">Remove</button>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Passage Text</label>
              <textarea
                value={passage.text}
                onChange={(e) => updateP(pi, { ...passage, text: e.target.value })}
                placeholder="Paste or type the full reading passage here. Students will see this on the left panel..."
                rows={10}
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-violet-500 font-serif leading-relaxed"
              />
              <p className="text-xs text-slate-400 mt-1">{passage.text.split(/\s+/).filter(Boolean).length} words</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-700">Questions <span className="text-slate-400 font-normal">({passage.questions.length})</span></p>
                <div className="flex gap-1.5 flex-wrap">
                  {(["MCQ", "tfng", "fill-blank", "matching", "short"] as QType[]).map((t) => (
                    <button key={t} onClick={() => addQ(pi, t)} className="text-xs font-semibold text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                      + {t === "MCQ" ? "MCQ" : t === "tfng" ? "T/F/NG" : t === "fill-blank" ? "Fill Blank" : t === "matching" ? "Match" : "Short Ans"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {passage.questions.map((q, qi) => (
                  <QuestionEditor key={q.id} q={q} index={qi} onChange={(nq) => updateQ(pi, qi, nq)} onRemove={() => removeQ(pi, qi)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Tab: Writing ─────────────────────────────────────────────────────── */
function WritingTab({ data, onChange, onChartUpload, uploadingChart }: { data: Record<string, string>; onChange: (k: string, v: string) => void; onChartUpload?: (file: File) => void; uploadingChart?: boolean }) {
  return (
    <div className="space-y-6">
      {/* Task 1 */}
      <div className="border border-amber-200 rounded-2xl overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Task 1</span>
            <span className="text-xs text-slate-500">20 minutes · at least 150 words</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Chart / Diagram Type</label>
              <select value={data.t1ChartType} onChange={(e) => onChange("t1ChartType", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                <option>Line Graph</option>
                <option>Bar Chart</option>
                <option>Pie Chart</option>
                <option>Table</option>
                <option>Map / Diagram</option>
                <option>Process Diagram</option>
                <option>Mixed Charts</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Chart / Image URL</label>
              <div className="flex gap-2">
                <input value={data.t1Image} onChange={(e) => onChange("t1Image", e.target.value)} placeholder="https://res.cloudinary.com/... or paste URL" className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <label className={`text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer transition-colors flex-shrink-0 ${uploadingChart ? "bg-amber-100 text-amber-400" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>
                  {uploadingChart ? "Uploading…" : "Upload"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" disabled={uploadingChart} onChange={e => { const f = e.target.files?.[0]; if (f && onChartUpload) onChartUpload(f); e.target.value = ''; }} />
                </label>
              </div>
              {data.t1Image && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-w-xs">
                  <img src={data.t1Image} alt="chart preview" className="w-full h-auto max-h-48 object-contain bg-slate-50" />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Task 1 Prompt</label>
            <textarea
              value={data.t1Prompt}
              onChange={(e) => onChange("t1Prompt", e.target.value)}
              placeholder="The graph below shows... Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Model Answer (for examiners)</label>
            <textarea
              value={data.t1Model}
              onChange={(e) => onChange("t1Model", e.target.value)}
              placeholder="The line graph illustrates..."
              rows={6}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Examiner Marking Notes</label>
            <textarea
              value={data.t1Notes}
              onChange={(e) => onChange("t1Notes", e.target.value)}
              placeholder="Key features students must address. Common errors to watch for. Band 7+ expectations..."
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Task 2 */}
      <div className="border border-amber-200 rounded-2xl overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Task 2</span>
            <span className="text-xs text-slate-500">40 minutes · at least 250 words</span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Essay Type</label>
            <select value={data.t2Type} onChange={(e) => onChange("t2Type", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
              <option>Discuss both views + opinion</option>
              <option>Advantages and disadvantages</option>
              <option>Problem and solution</option>
              <option>To what extent do you agree?</option>
              <option>Direct question</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Task 2 Prompt</label>
            <textarea
              value={data.t2Prompt}
              onChange={(e) => onChange("t2Prompt", e.target.value)}
              placeholder="Some people believe that... Others argue that... Discuss both views and give your own opinion."
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Model Answer (for examiners)</label>
            <textarea
              value={data.t2Model}
              onChange={(e) => onChange("t2Model", e.target.value)}
              placeholder="The question of whether..."
              rows={8}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Examiner Marking Notes</label>
            <textarea
              value={data.t2Notes}
              onChange={(e) => onChange("t2Notes", e.target.value)}
              placeholder="Expected argument structure. Key vocabulary range expected. Grammatical structures to look for..."
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Speaking ────────────────────────────────────────────────────── */
function SpeakingTab({ data, onChange }: { data: Record<string, string[]>; onChange: (k: string, v: string[]) => void }) {
  const addItem = (key: string) => onChange(key, [...data[key], ""]);
  const updateItem = (key: string, i: number, val: string) => {
    const arr = [...data[key]]; arr[i] = val; onChange(key, arr);
  };
  const removeItem = (key: string, i: number) => onChange(key, data[key].filter((_, idx) => idx !== i));

  const sections = [
    {
      key: "part1",
      label: "Part 1 — Introduction & Interview",
      color: "bg-green-50 border-green-100 text-green-700",
      accent: "ring-green-500",
      badge: "bg-green-100 text-green-700",
      desc: "4–5 min · Personal questions about familiar topics (home, work, hobbies, family)",
      placeholder: "e.g. Can you tell me about where you grew up?",
    },
    {
      key: "part2",
      label: "Part 2 — Individual Long Turn",
      color: "bg-teal-50 border-teal-100 text-teal-700",
      accent: "ring-teal-500",
      badge: "bg-teal-100 text-teal-700",
      desc: "3–4 min · Cue card topic with 1 min preparation. Student speaks for 1–2 min.",
      placeholder: "e.g. Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why it was memorable.",
    },
    {
      key: "part3",
      label: "Part 3 — Two-way Discussion",
      color: "bg-emerald-50 border-emerald-100 text-emerald-700",
      accent: "ring-emerald-500",
      badge: "bg-emerald-100 text-emerald-700",
      desc: "4–5 min · Abstract discussion questions related to the Part 2 topic",
      placeholder: "e.g. Why do you think travel has become more popular in recent years?",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-green-800 mb-1">About Speaking tests</p>
        <p className="text-xs text-green-700">Speaking tests are live 15-minute video sessions with a certified examiner. The questions here guide the examiner — they are not shown to students in advance. Examiners may deviate naturally based on the conversation.</p>
      </div>

      {sections.map((s) => (
        <div key={s.key} className={`border rounded-2xl overflow-hidden ${s.color.split(" ").slice(1).join(" ")}`}>
          <div className={`${s.color} border-b px-5 py-3`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label.split(" — ")[0]}</span>
              <span className="text-xs font-semibold text-slate-700">{s.label.split(" — ")[1]}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
          </div>

          <div className="p-5 space-y-3">
            {data[s.key].map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-xs font-bold text-slate-400 mt-2.5 w-5 flex-shrink-0">{i + 1}.</span>
                <textarea
                  value={item}
                  onChange={(e) => updateItem(s.key, i, e.target.value)}
                  placeholder={s.placeholder}
                  rows={s.key === "part2" ? 4 : 2}
                  className={`flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 ${s.accent} bg-white`}
                />
                {data[s.key].length > 1 && (
                  <button onClick={() => removeItem(s.key, i)} className="text-xs text-red-400 hover:text-red-600 cursor-pointer mt-2 font-semibold flex-shrink-0">✕</button>
                )}
              </div>
            ))}
            <button onClick={() => addItem(s.key)} className="text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add {s.key === "part2" ? "cue card variant" : "question"}
            </button>
          </div>
        </div>
      ))}

      {/* Examiner notes */}
      <div className="border border-slate-200 rounded-2xl p-5">
        <label className="block text-xs font-semibold text-slate-700 mb-2">Examiner Instructions</label>
        <textarea
          rows={4}
          placeholder="General instructions for the examiner conducting this speaking test. Include tone, pace, follow-up probing guidelines..."
          className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function NewTestPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Details");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [saveError, setSaveError] = useState("");

  const [uploadingAudio, setUploadingAudio] = useState<number | null>(null);
  const [uploadingChart, setUploadingChart] = useState(false);

  async function handleAudioUpload(si: number, file: File) {
    setUploadingAudio(si);
    try {
      const r = await uploadFile(file);
      // Update the section's audio URL in state
      const arr = [...listeningSections];
      arr[si] = { ...arr[si], audio: r.url };
      setListeningSections(arr);
    } catch (e: any) {
      setSaveError(e?.message || "Audio upload failed.");
    } finally {
      setUploadingAudio(null);
    }
  }

  async function handleChartUpload(file: File) {
    setUploadingChart(true);
    try {
      const r = await uploadFile(file);
      setWritingData(d => ({ ...d, t1Image: r.url }));
    } catch (e: any) {
      setSaveError(e?.message || "Image upload failed.");
    } finally {
      setUploadingChart(false);
    }
  }

  // Details state
  const [details, setDetails] = useState<Record<string, string>>({
    name: "", type: "Full Mock", track: "Academic", difficulty: "Medium", status: "Draft", notes: "", module: "listening",
  });

  // Listening state
  const [listeningSections, setListeningSections] = useState<ListeningSection[]>([
    blankListeningSection(),
    blankListeningSection(),
    blankListeningSection(),
    blankListeningSection(),
  ]);

  // Reading state
  const [readingPassages, setReadingPassages] = useState<ReadingPassage[]>([
    blankPassage(),
    blankPassage(),
    blankPassage(),
  ]);

  // Writing state
  const [writingData, setWritingData] = useState<Record<string, string>>({
    t1ChartType: "Line Graph", t1Image: "", t1Prompt: "", t1Model: "", t1Notes: "",
    t2Type: "Discuss both views + opinion", t2Prompt: "", t2Model: "", t2Notes: "",
  });

  // Speaking state
  const [speakingData, setSpeakingData] = useState<Record<string, string[]>>({
    part1: ["", "", "", ""],
    part2: [""],
    part3: ["", "", ""],
  });

  const tabs = [
    { key: "Details", icon: "⚙", color: "text-slate-600" },
    { key: "Listening", icon: "🎧", color: "text-blue-600" },
    { key: "Reading", icon: "📖", color: "text-violet-600" },
    { key: "Writing", icon: "✍", color: "text-amber-600" },
    { key: "Speaking", icon: "🎤", color: "text-green-600" },
  ];

  const completionStatus = {
    Details: !!details.name,
    Listening: listeningSections.some((s) => s.audio || s.questions.some((q) => q.text)),
    Reading: readingPassages.some((p) => p.text),
    Writing: !!writingData.t1Prompt || !!writingData.t2Prompt,
    Speaking: speakingData.part1.some((q) => q) || speakingData.part2.some((q) => q),
  };

  const handleSave = async (publish = false) => {
    if (!details.name) {
      setSaveError("Test name is required.");
      setActiveTab("Details");
      return;
    }
    setSaveError("");
    setSaving(true);
    try {
      const finalDetails = { ...details };
      if (publish) finalDetails.status = "Published";

      // 1. Create the test record → get its ID
      const newTest = await createTest({
        name:       finalDetails.name,
        type:       finalDetails.type as "Full Mock" | "Single Module",
        track:      finalDetails.track as "Academic" | "General" | "Both",
        difficulty: finalDetails.difficulty as "Easy" | "Medium" | "Hard",
        status:     finalDetails.status as "Draft" | "Published",
        notes:      finalDetails.notes,
      });
      const testId = (newTest as any).id ?? (newTest as any).data?.id;
      if (!testId) throw new Error("Test created but no ID returned.");

      // 2. Save all module content in parallel
      await Promise.all([
        saveListening(testId, listeningSections),
        saveReading(testId, readingPassages),
        saveWriting(testId, {
          t1ChartType: writingData.t1ChartType,
          t1Image:     writingData.t1Image,
          t1Prompt:    writingData.t1Prompt,
          t1Model:     writingData.t1Model,
          t1Notes:     writingData.t1Notes,
          t2Type:      writingData.t2Type,
          t2Prompt:    writingData.t2Prompt,
          t2Model:     writingData.t2Model,
          t2Notes:     writingData.t2Notes,
        }),
        saveSpeaking(testId, speakingData),
      ]);

      setSaved(true);
      // Redirect to the edit page for this new test
      setTimeout(() => router.push(`/admin/tests/${testId}`), 800);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save test. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/tests" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 cursor-pointer mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Tests
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{details.name || "New Mock Test"}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{details.status}</span>
            <span className="text-xs text-slate-400">{details.type} · {details.track}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Saving…
            </span>
          )}
          {saveError && (
            <span className="text-xs font-semibold text-red-500">{saveError}</span>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="text-sm font-semibold text-slate-700 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl cursor-pointer transition-colors disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Publish Test"}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white border border-slate-100 shadow-sm rounded-2xl p-1.5">
        {tabs.map((t) => {
          const done = completionStatus[t.key as keyof typeof completionStatus];
          const active = activeTab === t.key;
          const showTab = details.type === "Full Mock" || t.key === "Details" || (details.type === "Single Module" && (t.key === "Details" || t.key.toLowerCase() === details.module));
          if (!showTab) return null;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors flex-1 justify-center ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {done && !active && (
                <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              )}
              <span>{t.key}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {activeTab === "Details" && (
          <DetailsTab data={details} onChange={(k, v) => setDetails((d) => ({ ...d, [k]: v }))} />
        )}
        {activeTab === "Listening" && (
          <ListeningTab sections={listeningSections} onChange={setListeningSections} onAudioUpload={handleAudioUpload} uploadingAudioIdx={uploadingAudio} />
        )}
        {activeTab === "Reading" && (
          <ReadingTab passages={readingPassages} onChange={setReadingPassages} />
        )}
        {activeTab === "Writing" && (
          <WritingTab data={writingData} onChange={(k, v) => setWritingData((d) => ({ ...d, [k]: v }))} onChartUpload={handleChartUpload} uploadingChart={uploadingChart} />
        )}
        {activeTab === "Speaking" && (
          <SpeakingTab data={speakingData} onChange={(k, v) => setSpeakingData((d) => ({ ...d, [k]: v }))} />
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex justify-between">
        <button
          onClick={() => {
            const order = tabs.filter((t) => details.type === "Full Mock" || t.key === "Details" || t.key.toLowerCase() === details.module).map((t) => t.key);
            const i = order.indexOf(activeTab);
            if (i > 0) setActiveTab(order[i - 1]);
          }}
          className="text-sm font-semibold text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-40"
        >
          ← Previous
        </button>
        <button
          onClick={() => {
            const order = tabs.filter((t) => details.type === "Full Mock" || t.key === "Details" || t.key.toLowerCase() === details.module).map((t) => t.key);
            const i = order.indexOf(activeTab);
            if (i < order.length - 1) setActiveTab(order[i + 1]);
            else handleSave(false);
          }}
          className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
        >
          {activeTab === (details.type === "Full Mock" ? "Speaking" : "Details") ? "Save Draft" : "Next →"}
        </button>
      </div>
    </div>
  );
}
