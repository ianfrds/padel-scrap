# Jatim Padel Scout

Dashboard intelijen dan pemindai multi-sumber turnamen padel di wilayah Jawa Timur (Surabaya, Malang, Batu, Sidoarjo, Gresik, Pasuruan, Nganjuk, Kediri, Jember, Sumenep, dan sekitarnya). Menampilkan poster resolusi tinggi, tanggal turnamen, lokasi lapangan, status pelaksanaan (Akan Datang, Sedang Berlangsung, Sudah Selesai), kategori tanding, tautan pendaftaran langsung, dan fitur ekspor CSV.

## Fitur Utama

1. **Multi-Source Scraping Otomatis (6 Platform Publik):**
   - **Incourta** (`https://incourta.com/events`): Hub turnamen padel utama di Jawa Timur lengkap dengan metadata Schema.org JSON-LD dan flyer poster.
   - **Padelgigs** (`https://padelgigs.id/`): Pemindai data Inertia.js untuk turnamen Jawa Timur (Surabaya, Gresik, Sidoarjo) dengan divisi kategori, poster, dan status pendaftaran.
   - **PBPI Jawa Timur** (`https://pbpijatim.com/events`): Federasi resmi Perkumpulan Besar Padel Indonesia Pengurus Provinsi Jawa Timur.
   - **Smesh.ID** (`https://smesh.id/tournaments?sport=padel`): Kalender turnamen padel Indonesia.
   - **Recourt.ID** (`https://recourt.id/tournaments`): Platform turnamen padel dan tenis dengan pemindaian turnamen Jawa Timur (seperti Smash and Smile Platinum Padel Surabaya dan KOBER Padel Garden Malang Open).
   - **Reclub** (`https://reclub.co`): Ekstraksi data pre-rendered Nuxt SSR untuk turnamen, liga, dan turnamen komunitas Jawa Timur (Jungle Padel Citraland, La Familia Padel Club, Padel Up Surabaya, Tamora Padel, Clubhouse Surabaya, Surabaya Padel Community) lengkap dengan banner poster resmi CDN dan tautan pendaftaran.

2. **Filter Rentang Bulan Sebelum Scraping:**
   - Memilih rentang bulan turnamen yang ingin dicari (Mulai Bulan dan Sampai Bulan).
   - Tombol pintas cepat: Bulan Ini, 3 Bulan Kedepan, 6 Bulan Kedepan, dan Semua Bulan.
   - Memindai secara spesifik hanya turnamen dalam rentang waktu yang dipilih untuk menghemat waktu dan beban jaringan.

3. **Pengecekan Tanggal dan Label Status Otomatis:**
   - Turnamen yang tanggal selesainya telah terlewat (`dateEnd < hari_ini`) otomatis ditandai dengan badge **Sudah Selesai** dan tampilan kartu yang disesuaikan.
   - Turnamen yang sedang berjalan hari ini ditandai **Sedang Berlangsung**.
   - Turnamen di masa mendatang ditandai **Akan Datang**.
   - Dilengkapi filter status di toolbar utama.

4. **Desain Humanis Anti-AI Slop (Light Mode dan Dark Mode):**
   - Tipografi menggunakan font **Plus Jakarta Sans** (karya Tokotype, Indonesia).
   - Mendukung dua mode tampilan: **Mode Terang** (latar kanvas bersih, teks hijau tua kontras tinggi) dan **Mode Gelap** (latar charcoal malam, aksen hijau lapangan padel).
   - Dilengkapi tombol sakelar tema di pojok kanan atas dengan penyimpanan otomatis ke `localStorage`.
   - Bebas dari pola AI slop generik (tanpa gradient neon ungu/cyan, tanpa emoji dekoratif pada heading, tanpa panah dekoratif pada tombol).

5. **Instagram Discovery Hub (35 Akun Radar Jawa Timur):**
   - **Direktori 35 Akun Padel Jatim**: Memantau federasi resmi (PBPI Jatim, PBPI Kota Pasuruan), klub dan venue (Darmo, Graha, LUCA, Platinum, Padel Town, Uno, Homeground, Jungle, Vibora, Casano, JAS Malang, Padel Garden Malang, Golden Grove, Pas Padel, Basecamp, Panjalu Kediri, Padel Eight Jember, Sempusari, Sumenep, dsb.), serta komunitas pemain di Jawa Timur.
   - **Pencarian dan Filter Kota Akun**: Memfilter akun radar berdasarkan kota (Surabaya, Malang dan Batu, Sidoarjo dan Gresik, Pasuruan, Jember, Kediri, Madura).
   - **Smart NLP Extractor**: Tempel caption atau tautan postingan Instagram; sistem mengekstrak otomatis nama turnamen, rentang tanggal, lokasi, dan kategori.
   - **Antrean Verifikasi**: Meninjau hasil ekstraksi sebelum diterbitkan ke katalog utama.

6. **Fitur Pendukung:**
   - Lightbox Viewer: Klik poster untuk melihat flyer resolusi tinggi.
   - Ekspor Data CSV: Mengunduh data turnamen terfilter ke format spreadsheet CSV.
   - Input Manual: Menambahkan jadwal turnamen langsung ke basis data lokal.

## Cara Menjalankan

Node.js versi 20 atau yang lebih baru diperlukan.

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## API Endpoints

- `GET /api/tournaments?monthStart=...&monthEnd=...` : Mengambil data turnamen terindeks (opsional filter rentang bulan)
- `POST /api/scan` : Menjalankan pemindaian live ke 5 platform (menerima body `{ monthStart, monthEnd }`)
- `POST /api/tournaments` : Menambahkan turnamen manual
- `DELETE /api/tournaments/:id` : Menghapus data turnamen
- `GET /api/sources` : Daftar platform sumber data yang dipantau
- `GET /api/instagram/accounts` : Mengambil direktori 35 akun Instagram padel resmi Jawa Timur
- `POST /api/instagram/parse` : Ekstraksi NLP regex instan untuk teks caption Instagram
- `POST /api/instagram/import` : Menyimpan postingan ke antrean verifikasi
- `GET /api/instagram/candidates` : Mengambil daftar antrean verifikasi Instagram
- `POST /api/instagram/candidates/:id/approve` : Menyetujui dan memublikasikan turnamen ke katalog
- `POST /api/instagram/scan` : Menjalankan pemindaian Meta Graph API (jika kredensial dikonfigurasi)
