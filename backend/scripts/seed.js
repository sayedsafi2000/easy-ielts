/**
 * Seed initial demo data — admin user, demo student, and a few mock tests.
 *
 * Run:  npm run seed
 */
const bcrypt = require('bcryptjs');
const { pool, query } = require('../src/config/db');

async function upsertUser({ email, password, full_name, role, plan, target_band, country }) {
  const password_hash = await bcrypt.hash(password, 10);
  const sql = `
    INSERT INTO profiles (email, password_hash, full_name, role, plan, target_band, country, email_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
    ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           role      = EXCLUDED.role,
           plan      = EXCLUDED.plan,
           target_band = EXCLUDED.target_band
    RETURNING id, email, role;
  `;
  const { rows } = await query(sql, [email, password_hash, full_name, role, plan, target_band, country]);
  return rows[0];
}

async function upsertTest({ title, type, modules, difficulty, duration_minutes, status }) {
  // Use title as the natural-uniqueness key for idempotent seeding.
  const existing = await query('SELECT id FROM tests WHERE title = $1 LIMIT 1', [title]);
  if (existing.rows[0]) return existing.rows[0];
  const { rows } = await query(
    `INSERT INTO tests (title, type, modules, difficulty, duration_minutes, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [title, type, modules, difficulty, duration_minutes, status]
  );
  return rows[0];
}

(async () => {
  try {
    console.log('Seeding users…');
    const admin = await upsertUser({
      email: 'admin@ieltsjournal.com',
      password: 'admin1234',
      full_name: 'Admin User',
      role: 'admin',
      plan: 'premium',
      target_band: 9.0,
      country: 'Bangladesh',
    });

    const student = await upsertUser({
      email: 'student@ieltsjournal.com',
      password: 'Demo1234!',
      full_name: 'Sarah Khan',
      role: 'student',
      plan: 'pro',
      target_band: 7.5,
      country: 'Bangladesh',
    });

    console.log('Seeding tests…');
    await upsertTest({ title: 'IELTS Academic Mock Test #1',          type: 'academic', modules: ['listening','reading','writing','speaking'], difficulty: 'medium', duration_minutes: 165, status: 'published' });
    await upsertTest({ title: 'IELTS Academic Mock Test #2',          type: 'academic', modules: ['listening','reading','writing','speaking'], difficulty: 'hard',   duration_minutes: 165, status: 'published' });
    await upsertTest({ title: 'IELTS General Training Mock Test #1',  type: 'general',  modules: ['listening','reading','writing','speaking'], difficulty: 'easy',   duration_minutes: 165, status: 'published' });
    await upsertTest({ title: 'Writing Practice — Task 2 Focus',      type: 'academic', modules: ['writing'],                                  difficulty: 'medium', duration_minutes: 60,  status: 'published' });
    await upsertTest({ title: 'Listening Practice Set A',             type: 'academic', modules: ['listening'],                                difficulty: 'medium', duration_minutes: 30,  status: 'published' });

    // Optional: a sample completed attempt + result so the dashboard isn't empty
    const test1 = await query("SELECT id FROM tests WHERE title='IELTS Academic Mock Test #1' LIMIT 1");
    if (test1.rows[0]) {
      const existingAttempt = await query(
        "SELECT id FROM test_attempts WHERE student_id=$1 AND test_id=$2 LIMIT 1",
        [student.id, test1.rows[0].id]
      );
      if (!existingAttempt.rows[0]) {
        const a = await query(
          `INSERT INTO test_attempts (student_id, test_id, track, format, status, started_at, submitted_at, completed_at)
           VALUES ($1, $2, 'academic', 'full', 'completed',
                   NOW() - INTERVAL '10 days',
                   NOW() - INTERVAL '10 days' + INTERVAL '3 hours',
                   NOW() - INTERVAL '8 days')
           RETURNING id`,
          [student.id, test1.rows[0].id]
        );
        const sub = await query(
          `INSERT INTO submissions (attempt_id, student_id, module, answers, word_count, status, submitted_at)
           VALUES ($1, $2, 'writing',
                   $3::jsonb, 420, 'reviewed',
                   NOW() - INTERVAL '10 days' + INTERVAL '3 hours')
           RETURNING id`,
          [
            a.rows[0].id,
            student.id,
            JSON.stringify({
              task1: 'The bar chart illustrates tourist arrivals across three regions.',
              task2: 'Technology has fundamentally reshaped how people communicate and collaborate.',
            }),
          ]
        );
        await query(
          `INSERT INTO results (attempt_id, student_id, submission_id, module, band_score, task1_score, task2_score, feedback, criteria, reviewed_by, published_at)
           VALUES ($1, $2, $3, 'writing', 7.0, 6.5, 7.0,
                   $4, $5::jsonb, $6, NOW() - INTERVAL '8 days')`,
          [
            a.rows[0].id, student.id, sub.rows[0].id,
            'Good overall structure. Vocabulary range is solid but Task 1 needs more precise data referencing.',
            JSON.stringify({ task_achievement: 7.0, coherence_cohesion: 7.0, lexical_resource: 6.5, grammatical_range: 7.5 }),
            admin.id,
          ]
        );
      }
    }

    console.log('✅  Seed complete.');
    console.log(`   Admin:   ${admin.email} / admin1234`);
    console.log(`   Student: ${student.email} / Demo1234!`);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
