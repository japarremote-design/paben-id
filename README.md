# PABEN.ID — Wibawa dalam setiap Berita

Portal berita PABEN.ID. Basis kode diambil dari arsitektur HaloJatimNews
(Vite + React 19 + TypeScript + Tailwind 4 + Firebase Firestore/Auth),
di-rebrand penuh ke identitas PABEN.ID.

## Identitas Brand

Diambil dari dokumen *PABEN.ID — Sistem Identitas & Navbar* (revisi v2),
konsep logo **nomor 1: Glass Bold**.

| Token | oklch (sumber) | hex | Dipakai untuk |
|---|---|---|---|
| Jingga Redaksi | `oklch(.635 .185 44)` | `#E15B00` | monogram, tombol langganan, label TERKINI |
| Jingga Tua | `oklch(.50 .155 42)` | `#A63C00` | tautan & hover |
| Jingga Terang | `oklch(.78 .13 50)` | `#FA9D68` | aksen di atas bidang tinta |
| Jingga Tipis | `oklch(.955 .028 55)` | `#FFECE0` | latar tenang |
| Tinta Hangat | `oklch(.17 .02 30)` | `#170C0A` | teks, navbar, mode gelap |
| Abu Teks | `oklch(.52 .012 45)` | `#6F6763` | tagline & meta |
| Kertas | `oklch(.975 .006 70)` | `#F9F6F2` | latar halaman |
| Garis | `oklch(.90 .006 60)` | `#E1DDDA` | border |

**Aturan pemakaian jingga** (langsung dari dokumen identitas): jingga penuh
hanya di monogram, tombol langganan, dan label TERKINI. Bidang besar lain
memakai tinta hangat — oranye versi lama terlalu terang untuk blok luas.

Tokennya didefinisikan sekali di `src/index.css` (blok `@theme`), jadi bisa
dipakai sebagai utility Tailwind: `bg-jingga`, `text-tinta`, `border-garis`,
dan seterusnya.

**Tipografi**

| Keluarga | Bobot | Untuk |
|---|---|---|
| Barlow Condensed | 800 | wordmark & judul |
| Barlow | 400/600 | navigasi & antarmuka |
| Newsreader | italic 400 | tagline & kutipan |

Tagline: *Wibawa dalam setiap Berita*

Aset logo ada di `public/`, semuanya digambar ulang dari spesifikasi Glass
Bold (kotak jingga radius 15/64, huruf P Barlow Condensed 800 putih digeser
2/64 ke bawah untuk keseimbangan optis, sorot tipis di tepi atas):

- `logo-wordmark.png` — lockup utama: monogram + PABEN.ID + tagline. Proporsinya
  persis mengikuti dokumen (monogram 64u, wordmark 22u, tagline 11.5u, jarak 14u)
  supaya tagline tetap terbaca di tinggi header
- `logo-wordmark-plain.png` — lockup tanpa tagline, untuk tempat sangat sempit
- `logo-icon-512.png` — ikon aplikasi
- `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`
- `og-default.jpg` — gambar OG default 1200×630

`src/components/PabenMark.tsx` adalah versi SVG monogram yang sama, dipakai
inline di byline artikel supaya tetap tajam di ukuran kecil.

## SEO

Yang sudah terpasang:

| Hal | Di mana |
|---|---|
| Judul, deskripsi, canonical, OG per halaman | `src/lib/seo.ts` (hook `useSeo`) |
| `NewsArticle` JSON-LD per berita | `src/components/ArticleDetail.tsx` |
| `NewsMediaOrganization` + `WebSite` JSON-LD | beranda, di `src/App.tsx` |
| `noindex` untuk `/redaksi` & berita nonaktif | via `useSeo({ noindex: true })` |
| Halaman kanal `/kanal/<slug>` + `CollectionPage` | `src/App.tsx`, `src/main.tsx` |
| Halaman 404 ber-noindex | `src/App.tsx` (prop `notFound`) |
| sitemap.xml + kanal + tag Google News | `api/sitemap.js` |
| rss.xml | `api/rss.js` |
| robots.txt dinamis | `api/robots.js` |
| Preview WhatsApp/Telegram/X | `middleware.ts` (edge) |
| Lazy-load gambar, `fetchPriority` di elemen LCP | komponen masing-masing |
| Bundle dipecah react/firebase/icons | `vite.config.ts` |

**Canonical itu wajib di sini.** `vercel.json` mengarahkan semua alamat ke
`index.html` dengan status 200, jadi `/berita/apa-pun-ngawur` tetap membalas
halaman penuh. Tanpa canonical, satu berita bisa terindeks di alamat tak
terhingga banyaknya.

**Halaman kanal.** `/kanal/<slug>` — kanal aktif diturunkan dari alamat, bukan
dari state, jadi tiap kanal punya judul, canonical, `CollectionPage` JSON-LD,
dan tempat sendiri di sitemap. Slug dibuat `slugifyCategory()`.

> Daftar kanal di `api/sitemap.js` ditulis manual (konstanta `KANAL`) supaya
> sitemap tetap terbit walau Firestore bermasalah. **Kalau menambah kanal lewat
> panel admin, tambahkan juga di sana** — kalau tidak, kanal barunya tidak
> pernah masuk sitemap.

**Halaman 404.** Alamat tak dikenal, termasuk `/kanal/<slug>` yang tidak cocok
kanal mana pun, menampilkan halaman 404 ber-`noindex`. Status HTTP-nya tetap
200 karena `vercel.json` menyajikan `index.html` untuk semua alamat — yang
mengeluarkannya dari indeks adalah tag `noindex`, bukan kode status.

**`BOT_UA_REGEX` hanya untuk perayap pratinjau tautan.** Bot di daftar itu
menerima HTML berbeda dari yang dilihat pembaca; untuk mesin pencari itu
cloaking. `Google-InspectionTool` sudah dikeluarkan. Jangan tambahkan Googlebot
atau Bingbot ke sana — Googlebot menjalankan JavaScript dan sudah membaca meta
dari `src/lib/seo.ts`.

**Yang masih tersisa:**

- Halaman kanal belum berpaginasi. Begitu satu kanal punya ratusan berita,
  semuanya menumpuk di satu alamat.
- Belum ada `BreadcrumbList` JSON-LD.

## Menjalankan Secara Lokal

**Prasyarat:** Node.js 18+

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit
npm run build    # output ke dist/
```

## Setup Firebase (PROJECT BARU PABEN.ID)

Codebase ini **belum** terhubung ke Firebase mana pun — semua nilai masih
placeholder. Ada dua cara mengisinya (pilih salah satu):

### Cara A — Isi file config (paling cepat)

Buka `firebase-applet-config.json`, ganti semua nilai `GANTI-DENGAN-...`
dengan config dari Firebase Console project PABEN.ID:

> Firebase Console → Project settings → General → Your apps → Web app →
> SDK setup and configuration → **Config**

### Cara B — Environment Variables di Vercel (disarankan untuk produksi)

Set di Vercel → Settings → Environment Variables. Nilai env var akan
**menimpa** isi `firebase-applet-config.json`:

| Variable | Contoh |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `paben-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `paben-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `paben-id.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abc...` |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | *(kosongkan kalau pakai database default)* |
| `SITE_URL` | `https://paben.id` |

### Langkah wajib di Firebase Console

1. **Authentication** → aktifkan provider **Google**, **Anonymous**, dan
   **Email/Password** (yang terakhir untuk login kru redaksi).
2. **Authentication → Settings → Authorized domains** → tambahkan
   `paben.id`, `www.paben.id`, dan domain `*.vercel.app` milik project.
3. **Firestore Database** → buat database (mode production).
4. **Firestore → Rules** → tempel isi file `firestore.rules` di repo ini,
   lalu Publish.

Saat pertama kali dibuka dan koleksi masih kosong, aplikasi otomatis
melakukan seeding: 8 artikel contoh (`src/lib/seedData.ts`) dan 7 kanal
default (`src/lib/categories.ts`). Hapus/ubah isinya lewat panel admin.
Seeding hanya berhasil kalau yang membuka sudah login sebagai Super Admin,
karena aturan Firestore menolak tulisan dari pengunjung biasa.

### Migrasi data dari situs lama (opsional)

> **Bagian ini warisan dari codebase PASEK.ID dan belum tentu berlaku untuk
> PABEN.ID.** Nama project `paben-com` di bawah adalah hasil rename otomatis
> dari `pasek-com` — project itu tidak ada. Kalau PABEN.ID situs baru tanpa
> data lama, lewati saja seluruh bagian ini; skripnya tetap disertakan kalau
> nanti ada data Realtime Database yang perlu dipindahkan.

Skrip `scripts/migrate-rtdb-to-firestore.mjs` memindahkan data dari
**Realtime Database** ke **Firestore** — dua produk Firebase yang berbeda,
jadi datanya tidak berpindah sendiri.

```bash
# 1. Ekspor data lama
#    Firebase Console (project lama) -> Realtime Database -> tiga titik -> Export JSON
#    simpan sebagai paben-lama.json

# 2. Ambil kunci service account project BARU
#    Project settings -> Service accounts -> Generate new private key
#    simpan sebagai service-account.json  (sudah masuk .gitignore)

# 3. Lihat hasil pemetaannya dulu, tanpa menulis apa pun
npm run migrate -- paben-lama.json --dry-run

# 4. Kalau sudah cocok, jalankan sungguhan
npm run migrate -- paben-lama.json --service-account=service-account.json
```

Yang dipetakan:

| Data lama (RTDB) | Jadi (Firestore) | Catatan |
|---|---|---|
| `articles` | `articles` | HTML Quill diubah jadi teks paragraf; tanggal Indonesia ("4 Agustus 2026") diubah ke ISO; `is_deleted` → `isActive:false` |
| `categories` | `categories` | Nama jadi slug. Kategori yang dipakai artikel tapi belum terdaftar ditambahkan otomatis |
| `ads_sidebar` | `ads` | `sidebar` → `square`, `banner_artikel` → `billboard` |
| `users` | `newsroomUsers` + akun Firebase Auth | Password TIDAK dibawa — lihat di bawah |
| `settings/logo_url` | `settings/site` | |

**Soal password kru.** Sistem lama menyimpan password polos di database yang
bisa dibaca siapa saja lewat Developer Tools, jadi semuanya harus dianggap
sudah bocor. Skrip ini membuat password baru yang diacak untuk tiap kru dan
menuliskannya ke `kredensial-redaksi.csv`. Bagikan lewat jalur pribadi ke
masing-masing orang, lalu **hapus berkas itu**.

**Komentar tidak ikut pindah** — sistem lama ternyata tidak pernah menyimpan
komentar ke database; formulirnya ada, tapi isinya tidak tersimpan ke mana pun.

### Kalau memindahkan artikel lama

Setiap artikel **wajib punya field `status`**. Pembaca umum mengambil berita
dengan kueri `where('status', '==', 'Published')` — aturan Firestore menilai
kuerinya, bukan hasilnya, jadi kueri tanpa filter akan ditolak seluruhnya
demi menjaga draft tetap tertutup. Artikel hasil impor yang tidak punya
`status` tidak akan muncul di situs sampai field itu diisi `"Published"`.

## Ruang Redaksi PABEN (`/redaksi`)

Sistem redaksi berjenjang, dibawa dari PASEK.ID, basis codebase ini.

### Jenjang & izin

| Role | Tulis | Terbitkan | Hapus | Kelola user/iklan/kategori/logo |
|---|---|---|---|---|
| Super Admin | ✓ | ✓ | ✓ | ✓ |
| Redaktur | ✓ | ✓ | — | — |
| Editor | ✓ | ✓ | — | — |
| Reporter | ✓ (draft sendiri) | — | draft sendiri | — |

### Alur kerja berita

```
Draft  →  Ready for Editor  →  Published
```

Reporter menulis dan mengajukan; Redaktur/Editor yang menerbitkan. Berita
baru selalu mulai dari Draft. Penghapusan bersifat lunak (`isActive=false`)
sehingga Super Admin masih bisa memulihkannya lewat menu Monitor.

Izin ditegakkan di **dua lapis**: `src/lib/roles.ts` untuk menyembunyikan
tombol, dan `firestore.rules` sebagai penjaga sebenarnya. Kalau salah satu
diubah, ubah keduanya — kalau hanya UI yang dijaga, siapa pun bisa
melewatinya lewat Developer Tools.

### Login

Dua jalur, sesuai perannya:

- **Pembaca** → tombol "Masuk Google" di header. Untuk komentar & bookmark.
- **Kru redaksi** → buka `/redaksi`, isi username + password.

Password ditangani Firebase Auth (di-hash di server Google) — situs tidak
pernah menyimpan atau membacanya. Ini berbeda dari sistem PASEK.ID lama (basis codebase ini) yang
menyimpan password apa adanya di database dan mencocokkannya di browser.

Aktifkan **Email/Password** di Firebase Console → Authentication → Sign-in
method, selain Google dan Anonymous.

### Akun pertama (bootstrap)

Sebelum ada satu pun akun kru, tidak ada yang bisa membuat akun. Karena itu
email di `ADMIN_EMAILS` (`src/lib/admin.ts`) selalu dianggap Super Admin.
Daftar yang sama harus ditulis ulang di fungsi `isBootstrapAdmin()` pada
`firestore.rules` — **dua tempat, harus sama**.

Langkahnya: login Google dengan email tersebut → buka `/redaksi` → menu
**User** → buatkan akun untuk kru lain.

### Panel yang tersedia

| Menu | Isi | Akses |
|---|---|---|
| Tulis Berita | Form berita (judul, kota/dateline, kategori, tahapan, breaking) | Semua kru |
| Monitor | Daftar semua berita + tahapannya, edit/hapus/pulihkan | Semua kru |
| Iklan | Kelola banner iklan | Super Admin |
| Kategori | Tambah/nonaktifkan kategori | Super Admin |
| Logo | Ganti logo situs tanpa deploy ulang | Super Admin |
| User | Buat akun kru, ubah role, nonaktifkan | Super Admin |

## Fitur lain

- **Breaking news ticker** — running text di atas header, diisi dari artikel
  yang dicentang "Masukkan ke Breaking News".
- **Komentar tamu** — pembaca bisa berkomentar tanpa akun, cukup isi
  Nama/Email/Situs Web. Email tidak pernah ditampilkan ke publik. Alternatif
  login Google tetap ada.
- **Halaman legal** — Pedoman Media Siber, Kebijakan Privasi, Syarat &
  Ketentuan, Kontak & Pengaduan. Isinya masih placeholder dan disunting
  langsung dari halamannya oleh admin.
- **Media sosial & email redaksi** — tautannya ada di `src/components/Footer.tsx`
  (konstanta `SOCIAL_LINKS` dan `CONTACT_EMAIL`), ganti sesuai akun asli.

## Deploy ke Vercel

1. Push repo ini ke GitHub, lalu Import di Vercel.
2. Framework preset: **Vite**. Build command & output sudah diatur di
   `vercel.json` (`npm run build` → `dist`).
3. Isi Environment Variables (tabel di atas).
4. Deploy.

### Preview link WhatsApp / Facebook / Telegram

`middleware.ts` adalah Vercel Edge Middleware yang mendeteksi user-agent
crawler media sosial. Untuk URL artikel (`/artikel/:id`), middleware
mengambil data artikel langsung dari Firestore REST API dan mengembalikan
HTML kecil berisi `og:title` / `og:description` / `og:image` yang benar —
jadi link yang dishare menampilkan judul & gambar artikel, bukan judul
homepage. Pengunjung manusia tidak tersentuh dan tetap mendapat React app
seperti biasa.

Kalau gambar Cloudinary dipakai, middleware otomatis menyisipkan
transformasi 1200×630 JPG supaya WhatsApp mau menampilkan gambarnya.

> Pastikan `VITE_FIREBASE_PROJECT_ID` dan `SITE_URL` sudah terisi di Vercel,
> karena middleware membaca keduanya.

## Struktur

```
src/
  App.tsx                  # routing + state utama
  types.ts                 # Article, Category, Comment, Ad, Page, UserProfile
  lib/
    firebase.ts            # init Firebase (config file atau env var)
    admin.ts               # allowlist admin
    categories.ts          # kategori default + seeding
    seedData.ts            # artikel contoh + seeding
    staticPages.ts         # halaman Tentang/Redaksi/Kontak/Iklan
  components/
    Header, Footer, HeroSection, CategoryGrid, Sidebar,
    ArticleDetail, Comments, SearchOverlay, AdBanner, StaticPageView,
    AuthModal, ArticleEditorModal, ArticleManagerModal,
    CategoryManagerModal, AdManagerModal
  lib/
    roles.ts               # matriks izin tiap jenjang redaksi
    newsroom.ts            # login & manajemen akun kru
    settings.ts            # pengaturan situs (logo)
  components/
    Newsroom, NewsroomLogin, ArticleMonitor, UserManager,
    LogoManager, BreakingTicker
middleware.ts              # OG tags dinamis untuk crawler
firestore.rules            # security rules
vercel.json                # build config + SPA rewrite
```
