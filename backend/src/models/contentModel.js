/**
 * Test-content data access — listening / reading / writing / speaking content
 * fetched in the exact shape the existing frontend pages already consume,
 * so the UI never needs to change.
 */
const { query } = require('../config/db');

// ─── Listening ──────────────────────────────────────────────
async function getListeningTest(testId) {
  const sectionsRes = await query(
    `SELECT id, section_number, title, context, audio_url, audio_duration, question_range
       FROM listening_sections
      WHERE test_id = $1
      ORDER BY section_number`,
    [testId]
  );
  const sections = [];
  for (const s of sectionsRes.rows) {
    const groupsRes = await query(
      `SELECT id, label, instruction, type, form_title, match_options
         FROM listening_groups
        WHERE section_id = $1
        ORDER BY order_index`,
      [s.id]
    );
    const groups = [];
    for (const g of groupsRes.rows) {
      const qRes = await query(
        `SELECT question_number AS id, prompt AS text, prefix, suffix, options
           FROM listening_questions
          WHERE group_id = $1
          ORDER BY order_index, question_number`,
        [g.id]
      );
      groups.push({
        label: g.label,
        instruction: g.instruction,
        type: g.type,
        formTitle: g.form_title || undefined,
        matchOpts: Array.isArray(g.match_options) ? g.match_options : [],
        questions: qRes.rows.map((r) => ({
          id: r.id,
          text: r.text,
          prefix: r.prefix,
          suffix: r.suffix,
          opts: Array.isArray(r.options) ? r.options : [],
        })),
      });
    }
    sections.push({
      id: s.section_number,
      range: s.question_range,
      context: s.context,
      audioLabel: s.title || `Section ${s.section_number}`,
      audioDuration: s.audio_duration,
      audioUrl: s.audio_url,
      groups,
    });
  }
  return sections;
}

async function getListeningAnswerKey(testId) {
  const { rows } = await query(
    `SELECT lq.question_number, lq.correct_answer
       FROM listening_questions lq
       JOIN listening_groups lg     ON lg.id = lq.group_id
       JOIN listening_sections ls   ON ls.id = lg.section_id
      WHERE ls.test_id = $1
      ORDER BY lq.question_number`,
    [testId]
  );
  return rows;
}

// ─── Reading ────────────────────────────────────────────────
async function getReadingTest(testId) {
  const passRes = await query(
    `SELECT id, passage_number, title, body_text, question_range
       FROM reading_passages
      WHERE test_id = $1
      ORDER BY passage_number`,
    [testId]
  );
  const passages = [];
  for (const p of passRes.rows) {
    const groupsRes = await query(
      `SELECT id, label, instruction, type, options
         FROM reading_groups
        WHERE passage_id = $1
        ORDER BY order_index`,
      [p.id]
    );
    const groups = [];
    for (const g of groupsRes.rows) {
      const qRes = await query(
        `SELECT question_number AS id, text, pre, suf, options
           FROM reading_questions
          WHERE group_id = $1
          ORDER BY order_index, question_number`,
        [g.id]
      );
      groups.push({
        label: g.label,
        instruction: g.instruction,
        type: g.type,
        opts: Array.isArray(g.options) ? g.options : undefined,
        questions: qRes.rows.map((r) => ({
          id: r.id,
          text: r.text,
          pre: r.pre,
          suf: r.suf,
          opts: Array.isArray(r.options) && r.options.length ? r.options : undefined,
        })),
      });
    }
    passages.push({
      id: p.passage_number,
      title: p.title,
      range: p.question_range,
      text: p.body_text,
      groups,
    });
  }
  return passages;
}

async function getReadingAnswerKey(testId) {
  const { rows } = await query(
    `SELECT rq.question_number, rq.correct_answer
       FROM reading_questions rq
       JOIN reading_groups rg     ON rg.id = rq.group_id
       JOIN reading_passages rp   ON rp.id = rg.passage_id
      WHERE rp.test_id = $1
      ORDER BY rq.question_number`,
    [testId]
  );
  return rows;
}

// ─── Writing ────────────────────────────────────────────────
async function getWritingTest(testId) {
  const { rows } = await query(
    `SELECT task_number AS id, heading, instruction, prompt, note,
            min_words AS min, time_minutes,
            chart_image_url, has_chart, chart_type
       FROM writing_tasks
      WHERE test_id = $1
      ORDER BY task_number`,
    [testId]
  );
  return rows.map((r) => ({
    id: r.id,
    min: r.min,
    time: `about ${r.time_minutes} minutes`,
    heading: r.heading,
    instruction: r.instruction,
    prompt: r.prompt,
    note: r.note,
    hasChart: r.has_chart,
    chartType: r.chart_type,
    chartImageUrl: r.chart_image_url,
  }));
}

// ─── Speaking ───────────────────────────────────────────────
async function getSpeakingTest(testId) {
  const { rows } = await query(
    `SELECT part_number AS num, title, duration, description, questions
       FROM speaking_parts
      WHERE test_id = $1
      ORDER BY part_number`,
    [testId]
  );
  return rows.map((r) => ({
    num: r.num,
    title: r.title,
    duration: r.duration,
    desc: r.description,
    sampleQ: Array.isArray(r.questions) ? r.questions : [],
  }));
}

// ─── Admin: bulk replace test content ──────────────────────
async function replaceListeningContent(testId, sections) {
  await query(`DELETE FROM listening_sections WHERE test_id = $1`, [testId]);
  for (let si = 0; si < sections.length; si++) {
    const s = sections[si];
    const sec = await query(
      `INSERT INTO listening_sections
         (test_id, section_number, title, context, audio_url, audio_duration, question_range, order_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [testId, s.section_number || si + 1, s.title || null, s.context || null,
       s.audio_url || null, s.audio_duration || null, s.question_range || null, si]
    );
    const sectionId = sec.rows[0].id;
    const groups = Array.isArray(s.groups) ? s.groups : [];
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      const grp = await query(
        `INSERT INTO listening_groups
           (section_id, label, instruction, type, form_title, match_options, order_index)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING id`,
        [sectionId, g.label, g.instruction, g.type, g.form_title || null,
         JSON.stringify(g.match_options || []), gi]
      );
      const groupId = grp.rows[0].id;
      const questions = Array.isArray(g.questions) ? g.questions : [];
      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        await query(
          `INSERT INTO listening_questions
             (group_id, question_number, prompt, prefix, suffix, options, correct_answer, points, order_index)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)`,
          [groupId, q.question_number, q.prompt || null, q.prefix || null,
           q.suffix || null, JSON.stringify(q.options || []),
           String(q.correct_answer ?? ''), q.points || 1, qi]
        );
      }
    }
  }
}

async function replaceReadingContent(testId, passages) {
  await query(`DELETE FROM reading_passages WHERE test_id = $1`, [testId]);
  for (let pi = 0; pi < passages.length; pi++) {
    const p = passages[pi];
    const pas = await query(
      `INSERT INTO reading_passages
         (test_id, passage_number, title, body_text, question_range, order_index)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [testId, p.passage_number || pi + 1, p.title, p.body_text,
       p.question_range || null, pi]
    );
    const passageId = pas.rows[0].id;
    const groups = Array.isArray(p.groups) ? p.groups : [];
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      const grp = await query(
        `INSERT INTO reading_groups
           (passage_id, label, instruction, type, options, order_index)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING id`,
        [passageId, g.label, g.instruction, g.type,
         JSON.stringify(g.options || []), gi]
      );
      const groupId = grp.rows[0].id;
      const questions = Array.isArray(g.questions) ? g.questions : [];
      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        await query(
          `INSERT INTO reading_questions
             (group_id, question_number, text, pre, suf, options, correct_answer, points, order_index)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)`,
          [groupId, q.question_number, q.text || null, q.pre || null,
           q.suf || null, JSON.stringify(q.options || []),
           String(q.correct_answer ?? ''), q.points || 1, qi]
        );
      }
    }
  }
}

async function replaceWritingContent(testId, tasks) {
  await query(`DELETE FROM writing_tasks WHERE test_id = $1`, [testId]);
  for (const t of tasks) {
    await query(
      `INSERT INTO writing_tasks
         (test_id, task_number, heading, instruction, prompt, note,
          min_words, time_minutes, chart_image_url, has_chart, chart_type,
          model_answer, marking_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [testId, t.task_number, t.heading, t.instruction, t.prompt, t.note || null,
       t.min_words || 150, t.time_minutes || 20,
       t.chart_image_url || null, !!t.has_chart, t.chart_type || null,
       t.model_answer || null, t.marking_notes || null]
    );
  }
}

async function replaceSpeakingContent(testId, parts) {
  await query(`DELETE FROM speaking_parts WHERE test_id = $1`, [testId]);
  for (const p of parts) {
    await query(
      `INSERT INTO speaking_parts
         (test_id, part_number, title, duration, description, prep_time_seconds, questions)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [testId, p.part_number, p.title, p.duration || null, p.description || null,
       p.prep_time_seconds || 0, JSON.stringify(p.questions || [])]
    );
  }
}

module.exports = {
  getListeningTest,
  getListeningAnswerKey,
  getReadingTest,
  getReadingAnswerKey,
  getWritingTest,
  getSpeakingTest,
  replaceListeningContent,
  replaceReadingContent,
  replaceWritingContent,
  replaceSpeakingContent,
};
