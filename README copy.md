# 💕 Our Love Story - Web App

Aplikasi web romantis untuk pasangan, dibangun dengan **Next.js 14** dan **Supabase**.

---

## 🌸 Fitur Lengkap

| Menu | Deskripsi |
|------|-----------|
| 🏠 **Beranda** | Dashboard utama dengan love counter (hari, bulan, tahun bersama) |
| 💑 **Biodata Kami** | Data pasangan, foto profil, tanggal jadian, dan quote cinta |
| 🗺️ **Mau ke Mana?** | Wishlist tempat yang ingin dikunjungi bersama |
| 📍 **Tempat Kenangan** | Log semua tempat yang sudah dikunjungi + rating + catatan |
| 📸 **Dokumentasi** | Gallery foto per tempat dengan caption |
| 💝 **Kenangan Indah** | Timeline momen-momen spesial |
| ✨ **Bucket List** | Daftar impian bersama dengan progress tracker |
| 💌 **Surat Cinta** | Tulis dan simpan surat cinta satu sama lain |

---

## 🚀 Cara Setup

### 1. Clone & Install Dependencies

```bash
# Clone atau extract project ini
cd loveapp

# Install dependencies
npm install
```

### 2. Setup Supabase

1. Buka [https://supabase.com](https://supabase.com) dan buat akun gratis
2. Buat **New Project** baru
3. Tunggu project selesai dibuat (~2 menit)
4. Buka **SQL Editor** di sidebar kiri
5. Copy-paste isi file `supabase-schema.sql` lalu klik **Run**
6. Semua tabel dan storage bucket akan otomatis terbuat

### 3. Setup Environment Variables

```bash
# Copy file contoh
cp .env.local.example .env.local
```

Lalu edit `.env.local` dan isi dengan kredensial Supabase kamu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Cara dapat kredensial:** Di dashboard Supabase → Project Settings → API → copy `Project URL` dan `anon public`

### 4. Jalankan App

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. 🎉

---

## 🗂️ Struktur Project

```
loveapp/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx          # Layout dengan sidebar navigasi
│   │   ├── page.tsx            # Beranda / Love Counter
│   │   ├── biodata/page.tsx    # Biodata pasangan
│   │   ├── wishlist/page.tsx   # Tempat wishlist
│   │   ├── visited/page.tsx    # Tempat sudah dikunjungi
│   │   ├── dokumentasi/page.tsx # Gallery foto
│   │   ├── memories/page.tsx   # Kenangan spesial
│   │   ├── bucket-list/page.tsx # Bucket list
│   │   └── love-letters/page.tsx # Surat cinta
│   ├── globals.css             # Styling global
│   └── layout.tsx              # Root layout
├── lib/
│   └── supabase.ts             # Supabase client + TypeScript types
├── supabase-schema.sql         # SQL untuk setup database
├── .env.local.example          # Template environment variables
└── package.json
```

---

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (styling)
- **Supabase** (database PostgreSQL + storage foto)
- **date-fns** (format tanggal bahasa Indonesia)
- **lucide-react** (icons)
- **Google Fonts** (Playfair Display, Dancing Script, Lato)

---

## 📸 Storage Buckets (Auto-created)

| Bucket | Kegunaan |
|--------|----------|
| `couple-photos` | Foto profil pasangan |
| `place-photos` | Foto dokumentasi per tempat |
| `memory-photos` | Foto kenangan spesial |

---

## 🌐 Deploy ke Vercel (Opsional)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di Vercel Dashboard atau:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 💡 Tips Penggunaan

1. **Mulai dari Biodata** — isi nama dan tanggal jadian dulu agar love counter aktif
2. **Wishlist → Visited** — ketika sudah mengunjungi tempat di wishlist, klik tombol "Sudah Dikunjungi"
3. **Dokumentasi** — upload foto setelah menandai tempat sebagai visited
4. **Surat Cinta** — bisa diakses berdua untuk saling mengirim surat

---

*Dibuat dengan 💕 untuk pasangan yang ingin mengabadikan setiap momennya*
