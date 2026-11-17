# Pelatihan Day 20 - Backend (Express.js + SQLite)

REST API CRUD untuk Data Siswa.

## Menjalankan
```bash
npm install
npm start        # http://localhost:3000
```

## Endpoint
| Method | URL | Keterangan |
|--------|-----|------------|
| GET    | /api/siswa         | Ambil semua siswa |
| GET    | /api/siswa/:kode   | Ambil satu siswa |
| POST   | /api/siswa         | Tambah siswa |
| PUT    | /api/siswa/:kode   | Ubah siswa |
| DELETE | /api/siswa/:kode   | Hapus siswa |

## Contoh body (POST)
```json
{
  "kode_siswa": "S001",
  "nama_siswa": "Budi Santoso",
  "alamat_siswa": "Jl. Merdeka No. 1, Jakarta",
  "tgl_siswa": "2008-05-17",
  "jurusan_siswa": "Rekayasa Perangkat Lunak"
}
```
