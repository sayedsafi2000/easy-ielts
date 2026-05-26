/**
 * Rich demo seed — creates 8 students, 2 examiners, speaking bookings,
 * submissions, and reviewed results so every admin page shows real data.
 *
 * Safe to run multiple times (idempotent).
 *
 * Run:  node scripts/seed_demo.js
 */
require('dotenv').config();
const bcrypt   = require('bcryptjs');
const { pool, query } = require('../src/config/db');

const hash = (p) => bcrypt.hash(p, 10);

// ─── Demo students ────────────────────────────────────────────────────
const STUDENTS = [
  { email: 'aisha.rahman@demo.com',    name: 'Aisha Rahman',     plan: 'pro',       target: 7.5, country: 'Bangladesh', track: 'academic' },
  { email: 'carlos.mendez@demo.com',   name: 'Carlos Mendez',    plan: 'intensive', target: 8.0, country: 'Mexico',     track: 'academic' },
  { email: 'priya.sharma@demo.com',    name: 'Priya Sharma',     plan: 'pro',       target: 7.0, country: 'India',      track: 'general'  },
  { email: 'james.okafor@demo.com',    name: 'James Okafor',     plan: 'starter',   target: 6.5, country: 'Nigeria',    track: 'academic' },
  { email: 'li.wei@demo.com',          name: 'Li Wei',           plan: 'pro',       target: 7.0, country: 'China',      track: 'academic' },
  { email: 'fatima.hassan@demo.com',   name: 'Fatima Al-Hassan', plan: 'starter',   target: 6.0, country: 'Bangladesh', track: 'general'  },
  { email: 'marco.rossi@demo.com',     name: 'Marco Rossi',      plan: 'intensive', target: 7.5, country: 'Italy',      track: 'academic' },
  { email: 'sofia.hernandez@demo.com', name: 'Sofia Hernandez',  plan: 'starter',   target: 6.5, country: 'Spain',      track: 'academic' },
];

const EXAMINERS = [
  { email: 'sarah.mills@demo.com',   name: 'Dr. Sarah Mills',  spec: ['Writing','Speaking'] },
  { email: 'james.carter@demo.com',  name: 'James Carter',     spec: ['Writing','Speaking'] },
];

// ─── Helpers ──────────────────────────────────────────────────────────
async function upsertProfile(email, name, role, plan, target, country, track) {
  const ph = await hash('Demo1234!');
  const { rows } = await query(
    `INSERT INTO profiles
       (email, password_hash, full_name, role, plan, target_band, country, track, email_verified)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
     ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           plan      = EXCLUDED.plan,
           target_band = EXCLUDED.target_band,
           updated_at  = NOW()
     RETURNING id`,
    [email, ph, name, role, plan, target, country, track]
  );
  return rows[0].id;
}

async function upsertExaminer(profileId, spec) {
  await query(
    `INSERT INTO examiners (profile_id, specialization, rating)
     VALUES ($1, $2, $3)
     ON CONFLICT (profile_id) DO NOTHING`,
    [profileId, spec, (4.7 + Math.random() * 0.3).toFixed(2)]
  );
}

async function getTestId(title) {
  const { rows } = await query(
    `SELECT id FROM tests WHERE title ILIKE $1 LIMIT 1`,
    [`%${title}%`]
  );
  return rows[0]?.id ?? null;
}

async function hasAttempt(studentId, testId) {
  const { rows } = await query(
    `SELECT id FROM test_attempts WHERE student_id=$1 AND test_id=$2 LIMIT 1`,
    [studentId, testId]
  );
  return rows.length > 0;
}

async function createAttempt(studentId, testId, track, format, status, daysAgo, daysAgoEnd) {
  const started = `NOW() - INTERVAL '${daysAgo} days'`;
  const submitted = daysAgoEnd ? `NOW() - INTERVAL '${daysAgoEnd} days'` : null;
  const completed = (status === 'completed' && daysAgoEnd) ? `NOW() - INTERVAL '${Math.max(0, daysAgoEnd - 1)} days'` : null;

  const { rows } = await query(
    `INSERT INTO test_attempts
       (student_id, test_id, track, format, status, started_at, submitted_at, completed_at)
     VALUES (
       $1, $2, $3, $4, $5,
       ${started},
       ${submitted ? submitted : 'NULL'},
       ${completed ? completed : 'NULL'}
     ) RETURNING id`,
    [studentId, testId, track, format, status]
  );
  return rows[0].id;
}

async function createSubmission(attemptId, studentId, module, answers, wordCount, status, daysAgo) {
  const { rows } = await query(
    `INSERT INTO submissions
       (attempt_id, student_id, module, answers, word_count, status, submitted_at)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6, NOW() - INTERVAL '${daysAgo} days')
     RETURNING id`,
    [attemptId, studentId, module, JSON.stringify(answers), wordCount, status]
  );
  return rows[0].id;
}

async function createResult(attemptId, studentId, submissionId, module, band, t1, t2, feedback, criteria, reviewedBy, daysAgo) {
  await query(
    `INSERT INTO results
       (attempt_id, student_id, submission_id, module,
        band_score, task1_score, task2_score, feedback, criteria, reviewed_by, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10, NOW() - INTERVAL '${daysAgo} days')
     ON CONFLICT DO NOTHING`,
    [attemptId, studentId, submissionId, module, band, t1, t2, feedback, JSON.stringify(criteria), reviewedBy]
  );
}

async function createBooking(studentId, examinerId, attemptId, daysOffset, status) {
  const when = daysOffset >= 0
    ? `NOW() + INTERVAL '${daysOffset} days' + INTERVAL '10 hours'`
    : `NOW() - INTERVAL '${Math.abs(daysOffset)} days' + INTERVAL '10 hours'`;
  const link = `https://meet.google.com/demo-${Math.random().toString(36).slice(2,8)}`;
  await query(
    `INSERT INTO speaking_bookings
       (student_id, examiner_id, attempt_id, scheduled_at, status, meeting_link)
     VALUES ($1,$2,$3,${when},$4,$5)`,
    [studentId, examinerId, attemptId, status, link]
  );
}

// ─── Main ─────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('Creating demo users…');

    // 1. Examiners
    const examinerIds = [];
    for (const e of EXAMINERS) {
      const id = await upsertProfile(e.email, e.name, 'examiner', 'premium', 9.0, 'UK', 'academic');
      await upsertExaminer(id, e.spec);
      examinerIds.push(id);
      console.log(`  examiner: ${e.email}`);
    }
    const [e1, e2] = examinerIds;

    // 2. Students
    const studentIds = [];
    for (const s of STUDENTS) {
      const id = await upsertProfile(s.email, s.name, 'student', s.plan, s.target, s.country, s.track);
      studentIds.push({ id, ...s });
      console.log(`  student: ${s.email}`);
    }

    // 3. Tests
    console.log('\nLooking up tests…');
    const test1 = await getTestId('Academic Mock Test #1');
    const test2 = await getTestId('Academic Mock Test #2');
    const test3 = await getTestId('General Training Mock Test');
    const testW = await getTestId('Writing Practice');
    const testL = await getTestId('Listening Practice');
    console.log(`  tests: ${[test1,test2,test3,testW,testL].filter(Boolean).length} found`);

    // 4. Create attempts + submissions + results + bookings per student
    console.log('\nSeeding test history…');

    const adminRes = await query(`SELECT id FROM profiles WHERE role='admin' LIMIT 1`);
    const adminId  = adminRes.rows[0]?.id ?? null;

    // ── Aisha (student[0]) — 2 completed, 1 submitted ──────────────
    const [aisha] = studentIds;
    if (test1 && !await hasAttempt(aisha.id, test1)) {
      const a1 = await createAttempt(aisha.id, test1, 'academic', 'full', 'completed', 14, 12);
      const s1 = await createSubmission(a1, aisha.id, 'writing', { task1: 'The bar chart illustrates…', task2: 'Technology has fundamentally…' }, 430, 'reviewed', 14);
      await createResult(a1, aisha.id, s1, 'writing', 7.0, 6.5, 7.0,
        'Good structure and coherence. Task 1 needs more precise data referencing.',
        { task_achievement:7.0, coherence_cohesion:7.0, lexical_resource:6.5, grammatical_range:7.5 },
        adminId, 12);
    }
    if (test3 && !await hasAttempt(aisha.id, test3)) {
      const a2 = await createAttempt(aisha.id, test3, 'general', 'full', 'completed', 7, 5);
      const s2 = await createSubmission(a2, aisha.id, 'writing', { task1: 'Dear Manager, I am writing…', task2: 'Urban transport investment…' }, 390, 'reviewed', 7);
      await createResult(a2, aisha.id, s2, 'writing', 7.5, 7.0, 7.5,
        'Excellent improvement. Letter format appropriate. Strong arguments in Task 2.',
        { task_achievement:7.5, coherence_cohesion:7.5, lexical_resource:7.0, grammatical_range:8.0 },
        e1, 5);
    }
    if (test1) {
      const a1 = await query(`SELECT id FROM test_attempts WHERE student_id=$1 AND test_id=$2 LIMIT 1`,[aisha.id,test1]);
      if (a1.rows[0]) await createBooking(aisha.id, e1, a1.rows[0].id, 2, 'confirmed');
    }

    // ── Carlos (student[1]) — 3 completed, high scorer ─────────────
    const carlos = studentIds[1];
    if (test1 && !await hasAttempt(carlos.id, test1)) {
      const a = await createAttempt(carlos.id, test1, 'academic', 'full', 'completed', 10, 8);
      const s = await createSubmission(a, carlos.id, 'writing', { task1: 'The line graph depicts…', task2: 'Some experts argue that…' }, 460, 'reviewed', 10);
      await createResult(a, carlos.id, s, 'writing', 8.0, 7.5, 8.0,
        'Excellent work throughout. Near-native range of vocabulary and accurate complex grammar.',
        { task_achievement:8.0, coherence_cohesion:8.0, lexical_resource:7.5, grammatical_range:8.5 },
        e1, 8);
    }
    if (test2 && !await hasAttempt(carlos.id, test2)) {
      const a = await createAttempt(carlos.id, test2, 'academic', 'full', 'completed', 5, 3);
      const s = await createSubmission(a, carlos.id, 'writing', { task1: 'The pie charts compare…', task2: 'Renewable energy adoption…' }, 480, 'reviewed', 5);
      await createResult(a, carlos.id, s, 'writing', 8.5, 8.0, 8.5,
        'Outstanding. Exceptional lexical range and fully accurate grammar. Task 1 and 2 both band 8+.',
        { task_achievement:8.5, coherence_cohesion:8.5, lexical_resource:8.0, grammatical_range:9.0 },
        e1, 3);
    }

    // ── Priya (student[2]) — 1 completed, 1 pending review ─────────
    const priya = studentIds[2];
    if (test3 && !await hasAttempt(priya.id, test3)) {
      const a = await createAttempt(priya.id, test3, 'general', 'full', 'completed', 12, 10);
      const s = await createSubmission(a, priya.id, 'writing', { task1: 'I am writing to complain…', task2: 'Healthcare access is a right…' }, 370, 'reviewed', 12);
      await createResult(a, priya.id, s, 'writing', 7.0, 6.5, 7.0,
        'Good overall. Letter tone appropriate. Task 2 argument well-developed.',
        { task_achievement:7.0, coherence_cohesion:7.0, lexical_resource:6.5, grammatical_range:7.0 },
        e2, 10);
    }
    if (test1 && !await hasAttempt(priya.id, test1)) {
      const a = await createAttempt(priya.id, test1, 'academic', 'single', 'submitted', 2, 2);
      await createSubmission(a, priya.id, 'writing', { task1: 'The graph shows temperature…', task2: 'Social media has changed…' }, 355, 'pending', 2);
    }

    // ── James (student[3]) — many tests, lower band ─────────────────
    const james = studentIds[3];
    if (test1 && !await hasAttempt(james.id, test1)) {
      const a = await createAttempt(james.id, test1, 'academic', 'full', 'completed', 20, 18);
      const s = await createSubmission(a, james.id, 'writing', { task1: 'The diagram shows the process…', task2: 'Education should be free…' }, 300, 'reviewed', 20);
      await createResult(a, james.id, s, 'writing', 6.0, 5.5, 6.0,
        'Adequate communication but limited range. Work on developing ideas more fully in Task 2.',
        { task_achievement:6.0, coherence_cohesion:6.0, lexical_resource:5.5, grammatical_range:6.0 },
        e2, 18);
    }
    if (testW && !await hasAttempt(james.id, testW)) {
      const a = await createAttempt(james.id, testW, 'academic', 'single', 'submitted', 1, 1);
      await createSubmission(a, james.id, 'writing', { task1: 'The table compares…', task2: 'The government must act…' }, 280, 'pending', 1);
    }

    // ── Li Wei (student[4]) — 2 completed ───────────────────────────
    const liwei = studentIds[4];
    if (testL && !await hasAttempt(liwei.id, testL)) {
      await createAttempt(liwei.id, testL, 'academic', 'single', 'completed', 8, 8);
    }
    if (test2 && !await hasAttempt(liwei.id, test2)) {
      const a = await createAttempt(liwei.id, test2, 'academic', 'full', 'completed', 6, 4);
      const s = await createSubmission(a, liwei.id, 'writing', { task1: 'The bar chart illustrates…', task2: 'Climate change is the…' }, 410, 'reviewed', 6);
      await createResult(a, liwei.id, s, 'writing', 7.0, 6.5, 7.0,
        'Solid performance. Vocabulary is good. Work on linking words in Task 1.',
        { task_achievement:7.0, coherence_cohesion:6.5, lexical_resource:7.0, grammatical_range:7.0 },
        e1, 4);
    }

    // ── Fatima (student[5]) — recently joined ────────────────────────
    const fatima = studentIds[5];
    if (test3 && !await hasAttempt(fatima.id, test3)) {
      const a = await createAttempt(fatima.id, test3, 'general', 'single', 'submitted', 1, 1);
      await createSubmission(a, fatima.id, 'writing', { task1: 'I am writing about the job…', task2: 'Work-life balance is…' }, 320, 'pending', 1);
    }
    if (fatima.id && e2) {
      await createBooking(fatima.id, e2, null, 4, 'pending');
    }

    // ── Marco (student[6]) — active, good results ────────────────────
    const marco = studentIds[6];
    if (test1 && !await hasAttempt(marco.id, test1)) {
      const a = await createAttempt(marco.id, test1, 'academic', 'full', 'completed', 9, 7);
      const s = await createSubmission(a, marco.id, 'writing', { task1: 'The chart shows sales…', task2: 'AI will replace…' }, 445, 'reviewed', 9);
      await createResult(a, marco.id, s, 'writing', 7.5, 7.0, 7.5,
        'Very good work. Fluent writing with well-supported arguments.',
        { task_achievement:7.5, coherence_cohesion:7.5, lexical_resource:7.0, grammatical_range:7.5 },
        e2, 7);
    }
    if (marco.id && e1) {
      const att = await query(`SELECT id FROM test_attempts WHERE student_id=$1 LIMIT 1`,[marco.id]);
      await createBooking(marco.id, e1, att.rows[0]?.id ?? null, -3, 'completed');
    }

    // ── Sofia (student[7]) — brand new ───────────────────────────────
    const sofia = studentIds[7];
    if (test1 && !await hasAttempt(sofia.id, test1)) {
      await createAttempt(sofia.id, test1, 'academic', 'full', 'in_progress', 0, null);
    }

    console.log('\n✅  Demo seed complete.');
    console.log('   All passwords: Demo1234!');
    console.log('   Examiner emails:', EXAMINERS.map(e=>e.email).join(', '));
    console.log('   Student emails:', STUDENTS.map(s=>s.email).join(', '));
  } catch (err) {
    console.error('❌  Demo seed failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
