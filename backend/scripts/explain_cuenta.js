import 'dotenv/config';
import { pool } from '../config/db.js';

(async () => {
  try {
    const text = `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT * FROM cuentas ORDER BY id LIMIT $1 OFFSET $2`;
    const params = [300, 0];
    const res = await pool.query(text, params);
    console.log('EXPLAIN result:\n', res.rows.map(r => r['QUERY PLAN']).join('\n'));
  } catch (err) {
    console.error('Error running EXPLAIN:', err.message || err);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
