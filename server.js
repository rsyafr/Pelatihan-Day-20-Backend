import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------- Koneksi MySQL ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_siswa',
  dateStrings: true, // tgl_siswa tetap berbentuk "YYYY-MM-DD"
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS siswa (
      kode_siswa    VARCHAR(20)  PRIMARY KEY,
      nama_siswa    VARCHAR(100) NOT NULL,
      alamat_siswa  VARCHAR(255) NOT NULL,
      tgl_siswa     DATE         NOT NULL,
      jurusan_siswa VARCHAR(100) NOT NULL
    )
  `);
}

// ---------- Helper ----------
const FIELDS = ['kode_siswa', 'nama_siswa', 'alamat_siswa', 'tgl_siswa', 'jurusan_siswa'];

function validate(body, { requireKode = true } = {}) {
  const required = requireKode ? FIELDS : FIELDS.slice(1);
  const missing = required.filter((f) => !body[f] || String(body[f]).trim() === '');
  return missing.length ? `Field wajib diisi: ${missing.join(', ')}` : null;
}

// Membungkus handler async agar error tertangkap
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Kode siswa sudah dipakai' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  });

// ---------- Routes CRUD ----------
// READ semua
app.get('/api/siswa', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM siswa ORDER BY kode_siswa');
  res.json(rows);
}));

// READ satu
app.get('/api/siswa/:kode', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM siswa WHERE kode_siswa = ?', [req.params.kode]);
  if (rows.length === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
  res.json(rows[0]);
}));

// CREATE
app.post('/api/siswa', wrap(async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ message: err });

  const { kode_siswa, nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa } = req.body;
  await pool.query(
    `INSERT INTO siswa (kode_siswa, nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa)
     VALUES (?, ?, ?, ?, ?)`,
    [kode_siswa.trim(), nama_siswa.trim(), alamat_siswa.trim(), tgl_siswa, jurusan_siswa.trim()]
  );
  res.status(201).json({ kode_siswa, nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa });
}));

// UPDATE
app.put('/api/siswa/:kode', wrap(async (req, res) => {
  const err = validate(req.body, { requireKode: false });
  if (err) return res.status(400).json({ message: err });

  const { nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa } = req.body;
  const [result] = await pool.query(
    `UPDATE siswa SET nama_siswa = ?, alamat_siswa = ?, tgl_siswa = ?, jurusan_siswa = ?
     WHERE kode_siswa = ?`,
    [nama_siswa.trim(), alamat_siswa.trim(), tgl_siswa, jurusan_siswa.trim(), req.params.kode]
  );
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
  res.json({ kode_siswa: req.params.kode, nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa });
}));

// DELETE
app.delete('/api/siswa/:kode', wrap(async (req, res) => {
  const [result] = await pool.query('DELETE FROM siswa WHERE kode_siswa = ?', [req.params.kode]);
  if (result.affectedRows === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
  res.json({ message: 'Siswa berhasil dihapus' });
}));

app.get('/', (req, res) => res.json({ message: 'API Data Siswa berjalan' }));

// ---------- Start ----------
initDb()
  .then(() => app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Gagal terhubung ke MySQL:', err.message);
    process.exit(1);
  });