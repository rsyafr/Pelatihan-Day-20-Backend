import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------- Database (SQLite, file: siswa.db) ----------
const db = new Database('siswa.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS siswa (
    kode_siswa    TEXT PRIMARY KEY,
    nama_siswa    TEXT NOT NULL,
    alamat_siswa  TEXT NOT NULL,
    tgl_siswa     TEXT NOT NULL,
    jurusan_siswa TEXT NOT NULL
  )
`);

// ---------- Helper validasi ----------
const FIELDS = ['kode_siswa', 'nama_siswa', 'alamat_siswa', 'tgl_siswa', 'jurusan_siswa'];

function validate(body, { requireKode = true } = {}) {
  const required = requireKode ? FIELDS : FIELDS.slice(1);
  const missing = required.filter((f) => !body[f] || String(body[f]).trim() === '');
  return missing.length ? `Field wajib diisi: ${missing.join(', ')}` : null;
}

// ---------- Routes CRUD ----------
// READ semua
app.get('/api/siswa', (req, res) => {
  const rows = db.prepare('SELECT * FROM siswa ORDER BY kode_siswa').all();
  res.json(rows);
});

// READ satu
app.get('/api/siswa/:kode', (req, res) => {
  const row = db.prepare('SELECT * FROM siswa WHERE kode_siswa = ?').get(req.params.kode);
  if (!row) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
  res.json(row);
});

// CREATE
app.post('/api/siswa', (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ message: err });

  const { kode_siswa, nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa } = req.body;
  const exists = db.prepare('SELECT 1 FROM siswa WHERE kode_siswa = ?').get(kode_siswa);
  if (exists) return res.status(409).json({ message: 'Kode siswa sudah dipakai' });

  db.prepare(
    `INSERT INTO siswa (kode_siswa, nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa)
     VALUES (?, ?, ?, ?, ?)`
  ).run(kode_siswa.trim(), nama_siswa.trim(), alamat_siswa.trim(), tgl_siswa, jurusan_siswa.trim());

  res.status(201).json({ kode_siswa, nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa });
});

// UPDATE
app.put('/api/siswa/:kode', (req, res) => {
  const err = validate(req.body, { requireKode: false });
  if (err) return res.status(400).json({ message: err });

  const { nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa } = req.body;
  const info = db
    .prepare(
      `UPDATE siswa SET nama_siswa = ?, alamat_siswa = ?, tgl_siswa = ?, jurusan_siswa = ?
       WHERE kode_siswa = ?`
    )
    .run(nama_siswa.trim(), alamat_siswa.trim(), tgl_siswa, jurusan_siswa.trim(), req.params.kode);

  if (info.changes === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
  res.json({ kode_siswa: req.params.kode, nama_siswa, alamat_siswa, tgl_siswa, jurusan_siswa });
});

// DELETE
app.delete('/api/siswa/:kode', (req, res) => {
  const info = db.prepare('DELETE FROM siswa WHERE kode_siswa = ?').run(req.params.kode);
  if (info.changes === 0) return res.status(404).json({ message: 'Siswa tidak ditemukan' });
  res.json({ message: 'Siswa berhasil dihapus' });
});

app.get('/', (req, res) => res.json({ message: 'API Data Siswa berjalan' }));

app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
