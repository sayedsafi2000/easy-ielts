/**
 * IELTS auto-marking helpers.
 *
 * Listening + Reading are scored on a 40-question raw scale, then mapped to
 * a band 0–9 using the official British Council conversion tables
 * (Academic Reading uses a stricter table than General Training Reading).
 */

// ─── Listening conversion (same for Academic & GT) ──────────
// raw correct → band
const LISTENING_TABLE = [
  { min: 39, band: 9.0 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8.0 },
  { min: 33, band: 7.5 },
  { min: 30, band: 7.0 },
  { min: 27, band: 6.5 },
  { min: 23, band: 6.0 },
  { min: 19, band: 5.5 },
  { min: 16, band: 5.0 },
  { min: 13, band: 4.5 },
  { min: 11, band: 4.0 },
  { min:  8, band: 3.5 },
  { min:  6, band: 3.0 },
  { min:  4, band: 2.5 },
  { min:  0, band: 0   },
];

// ─── Academic Reading conversion ─────────────────────────────
const READING_ACADEMIC_TABLE = [
  { min: 39, band: 9.0 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8.0 },
  { min: 33, band: 7.5 },
  { min: 30, band: 7.0 },
  { min: 27, band: 6.5 },
  { min: 23, band: 6.0 },
  { min: 19, band: 5.5 },
  { min: 15, band: 5.0 },
  { min: 13, band: 4.5 },
  { min: 10, band: 4.0 },
  { min:  8, band: 3.5 },
  { min:  6, band: 3.0 },
  { min:  4, band: 2.5 },
  { min:  0, band: 0   },
];

// ─── General Training Reading conversion (more lenient) ─────
const READING_GENERAL_TABLE = [
  { min: 40, band: 9.0 },
  { min: 39, band: 8.5 },
  { min: 37, band: 8.0 },
  { min: 36, band: 7.5 },
  { min: 34, band: 7.0 },
  { min: 32, band: 6.5 },
  { min: 30, band: 6.0 },
  { min: 27, band: 5.5 },
  { min: 23, band: 5.0 },
  { min: 19, band: 4.5 },
  { min: 15, band: 4.0 },
  { min: 12, band: 3.5 },
  { min:  9, band: 3.0 },
  { min:  6, band: 2.5 },
  { min:  0, band: 0   },
];

function bandFromTable(raw, table) {
  for (const row of table) if (raw >= row.min) return row.band;
  return 0;
}

/**
 * Normalise an answer string for comparison:
 *   - lowercase
 *   - trim
 *   - collapse internal whitespace
 *   - strip leading/trailing punctuation
 *   - drop articles ("a ", "an ", "the ") at the start (IELTS allows them but
 *     also accepts answers without)
 */
function normalise(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .toLowerCase()
    .replace(/[\.,!\?;:'"]+$/g, '')
    .replace(/^[\.,!\?;:'"]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(a|an|the)\s+/, '')
    .trim();
}

/**
 * Compare a student answer to the canonical answer key.
 *
 * The answer key may contain alternates separated by `|`, e.g.
 *   "200|two hundred"
 * For MCQ questions the answer is the option letter (A/B/C) OR the full option
 * text — both are accepted.
 */
function checkAnswer(student, canonical) {
  if (!canonical) return false;
  const studentN = normalise(student);
  if (!studentN) return false;
  const alternates = String(canonical).split('|').map(normalise);
  if (alternates.includes(studentN)) return true;
  // For MCQ: student may have submitted full option text "A  Around 40"
  // while key is just "A"; accept if student starts with "<key> " or "<key>  ".
  for (const alt of alternates) {
    if (alt.length === 1 && /^[a-z]$/.test(alt)) {
      const m = studentN.match(/^([a-z])\b/);
      if (m && m[1] === alt) return true;
    }
  }
  return false;
}

function listeningBand(rawCorrect)        { return bandFromTable(rawCorrect, LISTENING_TABLE); }
function readingAcademicBand(rawCorrect)  { return bandFromTable(rawCorrect, READING_ACADEMIC_TABLE); }
function readingGeneralBand(rawCorrect)   { return bandFromTable(rawCorrect, READING_GENERAL_TABLE); }

function readingBand(rawCorrect, track = 'academic') {
  return track === 'general' ? readingGeneralBand(rawCorrect) : readingAcademicBand(rawCorrect);
}

/**
 * Given an array of {question_number, correct_answer} keys and a map of
 * studentAnswers {question_number: value}, return a report:
 *   { rawScore, totalQuestions, perQuestion: [{n, correct}], band }
 */
function gradeMcqStyle(answerKey, studentAnswers, module, track = 'academic') {
  const perQuestion = [];
  let raw = 0;
  for (const k of answerKey) {
    const correct = checkAnswer(studentAnswers[k.question_number], k.correct_answer);
    if (correct) raw++;
    perQuestion.push({ n: k.question_number, correct });
  }
  const band = module === 'listening' ? listeningBand(raw) : readingBand(raw, track);
  return { rawScore: raw, totalQuestions: answerKey.length, perQuestion, band };
}

module.exports = {
  normalise,
  checkAnswer,
  listeningBand,
  readingBand,
  readingAcademicBand,
  readingGeneralBand,
  gradeMcqStyle,
};
