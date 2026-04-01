'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AchievementDef {
  id: string
  emoji: string
  title: string
  desc: string
  rarity: 'bronze' | 'silver' | 'gold' | 'special' | 'legendary'
  category: string
  check: (stats: any) => boolean
  hint?: string
}

const ACHIEVEMENTS: AchievementDef[] = [

  // ── PERJALANAN ──────────────────────────────────────────
  {
    id: 'first_place', emoji: '📍', title: 'Petualang Pertama',
    desc: 'Kunjungi tempat pertama bersama',
    rarity: 'bronze', category: 'Perjalanan',
    hint: 'Tandai 1 tempat sebagai "Sudah Dikunjungi"',
    check: s => s.visited >= 1,
  },
  {
    id: 'places_3', emoji: '🗺️', title: 'Mulai Menjelajah',
    desc: 'Kunjungi 3 tempat bersama',
    rarity: 'bronze', category: 'Perjalanan',
    hint: 'Kunjungi 3 tempat bersama',
    check: s => s.visited >= 3,
  },
  {
    id: 'places_5', emoji: '🧭', title: 'Penjelajah',
    desc: 'Kunjungi 5 tempat bersama',
    rarity: 'bronze', category: 'Perjalanan',
    check: s => s.visited >= 5,
  },
  {
    id: 'places_10', emoji: '🌏', title: 'Pasangan Petualang',
    desc: 'Kunjungi 10 tempat bersama',
    rarity: 'silver', category: 'Perjalanan',
    check: s => s.visited >= 10,
  },
  {
    id: 'places_20', emoji: '✈️', title: 'Wisatawan Sejati',
    desc: 'Kunjungi 20 tempat bersama',
    rarity: 'gold', category: 'Perjalanan',
    check: s => s.visited >= 20,
  },
  {
    id: 'places_50', emoji: '🌍', title: 'Penjelajah Dunia',
    desc: 'Kunjungi 50 tempat bersama',
    rarity: 'legendary', category: 'Perjalanan',
    check: s => s.visited >= 50,
  },
  {
    id: 'wishlist_10', emoji: '📋', title: 'Pemimpi Besar',
    desc: 'Tambahkan 10 tempat ke wishlist',
    rarity: 'bronze', category: 'Perjalanan',
    check: s => s.wishlist >= 10,
  },
  {
    id: 'wishlist_25', emoji: '🗒️', title: 'Kolektor Impian',
    desc: 'Tambahkan 25 tempat ke wishlist',
    rarity: 'silver', category: 'Perjalanan',
    check: s => s.wishlist >= 25,
  },
  {
    id: 'all_categories', emoji: '🎨', title: 'Serba Bisa',
    desc: 'Kunjungi semua kategori tempat (cafe, pantai, gunung, dll)',
    rarity: 'gold', category: 'Perjalanan',
    hint: 'Kunjungi tempat dari semua kategori yang tersedia',
    check: s => s.visitedCategories >= 5,
  },

  // ── KENANGAN ──────────────────────────────────────────
  {
    id: 'first_memory', emoji: '💝', title: 'Kenangan Pertama',
    desc: 'Abadikan kenangan pertama bersama',
    rarity: 'bronze', category: 'Kenangan',
    check: s => s.memories >= 1,
  },
  {
    id: 'memories_5', emoji: '📔', title: 'Pengabadi Momen',
    desc: 'Simpan 5 kenangan indah',
    rarity: 'bronze', category: 'Kenangan',
    check: s => s.memories >= 5,
  },
  {
    id: 'memories_10', emoji: '📖', title: 'Penulis Kenangan',
    desc: 'Simpan 10 kenangan indah',
    rarity: 'silver', category: 'Kenangan',
    check: s => s.memories >= 10,
  },
  {
    id: 'memories_25', emoji: '📚', title: 'Pustaka Cinta',
    desc: 'Simpan 25 kenangan indah',
    rarity: 'gold', category: 'Kenangan',
    check: s => s.memories >= 25,
  },
  {
    id: 'memories_50', emoji: '🏛️', title: 'Arsiparis Cinta',
    desc: 'Simpan 50 kenangan indah',
    rarity: 'legendary', category: 'Kenangan',
    check: s => s.memories >= 50,
  },
  {
    id: 'all_moods', emoji: '🌈', title: 'Segala Rasa',
    desc: 'Abadikan kenangan dengan semua jenis suasana hati',
    rarity: 'silver', category: 'Kenangan',
    hint: 'Gunakan semua pilihan mood saat membuat kenangan',
    check: s => s.moodVariety >= 6,
  },
  {
    id: 'memory_with_photo', emoji: '🖼️', title: 'Bingkai Kenangan',
    desc: 'Simpan kenangan dengan foto pertama',
    rarity: 'bronze', category: 'Kenangan',
    check: s => s.memoriesWithPhoto >= 1,
  },
  {
    id: 'memory_with_photo_10', emoji: '🎞️', title: 'Album Hidup',
    desc: 'Simpan 10 kenangan disertai foto',
    rarity: 'silver', category: 'Kenangan',
    check: s => s.memoriesWithPhoto >= 10,
  },

  // ── SURAT CINTA ──────────────────────────────────────────
  {
    id: 'first_letter', emoji: '💌', title: 'Penulis Romantis',
    desc: 'Tulis surat cinta pertama',
    rarity: 'bronze', category: 'Surat Cinta',
    check: s => s.letters >= 1,
  },
  {
    id: 'letters_3', emoji: '📝', title: 'Surat Menyurat',
    desc: 'Tulis 3 surat cinta',
    rarity: 'bronze', category: 'Surat Cinta',
    check: s => s.letters >= 3,
  },
  {
    id: 'letters_5', emoji: '📜', title: 'Shakespeare Kecil',
    desc: 'Tulis 5 surat cinta',
    rarity: 'silver', category: 'Surat Cinta',
    check: s => s.letters >= 5,
  },
  {
    id: 'letters_10', emoji: '🖊️', title: 'Pujangga Cinta',
    desc: 'Tulis 10 surat cinta',
    rarity: 'gold', category: 'Surat Cinta',
    check: s => s.letters >= 10,
  },
  {
    id: 'letters_25', emoji: '📮', title: 'Legenda Surat',
    desc: 'Tulis 25 surat cinta',
    rarity: 'legendary', category: 'Surat Cinta',
    check: s => s.letters >= 25,
  },

  // ── DOKUMENTASI ──────────────────────────────────────────
  {
    id: 'first_photo', emoji: '📸', title: 'Jepret Pertama',
    desc: 'Upload foto dokumentasi pertama',
    rarity: 'bronze', category: 'Dokumentasi',
    check: s => s.photos >= 1,
  },
  {
    id: 'photos_10', emoji: '🖼️', title: 'Fotografer Cinta',
    desc: 'Upload 10 foto dokumentasi',
    rarity: 'bronze', category: 'Dokumentasi',
    check: s => s.photos >= 10,
  },
  {
    id: 'photos_25', emoji: '📷', title: 'Fotografer Handal',
    desc: 'Upload 25 foto dokumentasi',
    rarity: 'silver', category: 'Dokumentasi',
    check: s => s.photos >= 25,
  },
  {
    id: 'photos_50', emoji: '🎞️', title: 'Arsip Kenangan',
    desc: 'Upload 50 foto dokumentasi',
    rarity: 'gold', category: 'Dokumentasi',
    check: s => s.photos >= 50,
  },
  {
    id: 'photos_100', emoji: '🎬', title: 'Sineas Cinta',
    desc: 'Upload 100 foto dokumentasi',
    rarity: 'legendary', category: 'Dokumentasi',
    check: s => s.photos >= 100,
  },

  // ── STREAK ──────────────────────────────────────────
  {
    id: 'first_checkin', emoji: '🔥', title: 'Hari Pertama',
    desc: 'Lakukan absen pertama kali',
    rarity: 'bronze', category: 'Streak',
    check: s => s.totalCheckins >= 1,
  },
  {
    id: 'streak_3', emoji: '✨', title: 'Awal Yang Baik',
    desc: 'Pertahankan streak 3 hari berturut-turut',
    rarity: 'bronze', category: 'Streak',
    check: s => s.maxStreak >= 3,
  },
  {
    id: 'streak_7', emoji: '🔥', title: 'Api Cinta',
    desc: 'Pertahankan streak 7 hari berturut-turut',
    rarity: 'bronze', category: 'Streak',
    check: s => s.maxStreak >= 7,
  },
  {
    id: 'streak_14', emoji: '⭐', title: 'Dua Minggu Cinta',
    desc: 'Pertahankan streak 14 hari berturut-turut',
    rarity: 'silver', category: 'Streak',
    check: s => s.maxStreak >= 14,
  },
  {
    id: 'streak_30', emoji: '🌟', title: 'Sebulan Penuh',
    desc: 'Pertahankan streak 30 hari berturut-turut',
    rarity: 'gold', category: 'Streak',
    check: s => s.maxStreak >= 30,
  },
  {
    id: 'streak_60', emoji: '💫', title: 'Dua Bulan Setia',
    desc: 'Pertahankan streak 60 hari berturut-turut',
    rarity: 'gold', category: 'Streak',
    check: s => s.maxStreak >= 60,
  },
  {
    id: 'streak_100', emoji: '💎', title: 'Legendaris',
    desc: 'Pertahankan streak 100 hari berturut-turut',
    rarity: 'legendary', category: 'Streak',
    check: s => s.maxStreak >= 100,
  },
  {
    id: 'streak_365', emoji: '👑', title: 'Setahun Bersama',
    desc: 'Pertahankan streak 365 hari berturut-turut',
    rarity: 'legendary', category: 'Streak',
    check: s => s.maxStreak >= 365,
  },
  {
    id: 'total_checkins_50', emoji: '📆', title: 'Rajin Absen',
    desc: 'Total absen sebanyak 50 kali',
    rarity: 'silver', category: 'Streak',
    check: s => s.totalCheckins >= 50,
  },
  {
    id: 'total_checkins_100', emoji: '🗓️', title: 'Absen Veteran',
    desc: 'Total absen sebanyak 100 kali',
    rarity: 'gold', category: 'Streak',
    check: s => s.totalCheckins >= 100,
  },

  // ── BUCKET LIST ──────────────────────────────────────────
  {
    id: 'bucket_1', emoji: '✨', title: 'Pemimpi',
    desc: 'Tambahkan impian pertama ke bucket list',
    rarity: 'bronze', category: 'Bucket List',
    check: s => s.bucketTotal >= 1,
  },
  {
    id: 'bucket_5', emoji: '🌠', title: 'Penuh Impian',
    desc: 'Tambahkan 5 impian ke bucket list',
    rarity: 'bronze', category: 'Bucket List',
    check: s => s.bucketTotal >= 5,
  },
  {
    id: 'bucket_10', emoji: '📋', title: 'Daftar Panjang',
    desc: 'Tambahkan 10 impian ke bucket list',
    rarity: 'silver', category: 'Bucket List',
    check: s => s.bucketTotal >= 10,
  },
  {
    id: 'bucket_done_1', emoji: '🎯', title: 'Impian Pertama Terwujud',
    desc: 'Wujudkan impian pertama dari bucket list',
    rarity: 'bronze', category: 'Bucket List',
    check: s => s.bucketDone >= 1,
  },
  {
    id: 'bucket_done_3', emoji: '🥇', title: 'Pencapai Impian',
    desc: 'Wujudkan 3 impian dari bucket list',
    rarity: 'silver', category: 'Bucket List',
    check: s => s.bucketDone >= 3,
  },
  {
    id: 'bucket_done_5', emoji: '🏆', title: 'Pejuang Impian',
    desc: 'Wujudkan 5 impian dari bucket list',
    rarity: 'gold', category: 'Bucket List',
    check: s => s.bucketDone >= 5,
  },
  {
    id: 'bucket_done_10', emoji: '🌟', title: 'Legenda Impian',
    desc: 'Wujudkan 10 impian dari bucket list',
    rarity: 'legendary', category: 'Bucket List',
    check: s => s.bucketDone >= 10,
  },
  {
    id: 'bucket_all', emoji: '💯', title: 'Semua Terwujud!',
    desc: 'Wujudkan semua impian di bucket list (min. 5)',
    rarity: 'legendary', category: 'Bucket List',
    hint: 'Centang semua impian di bucket list (minimal 5 impian)',
    check: s => s.bucketTotal >= 5 && s.bucketDone >= s.bucketTotal,
  },

  // ── TIME CAPSULE ──────────────────────────────────────────
  {
    id: 'capsule_1', emoji: '⏳', title: 'Penjaga Waktu',
    desc: 'Buat kapsul waktu pertama',
    rarity: 'silver', category: 'Time Capsule',
    check: s => s.capsules >= 1,
  },
  {
    id: 'capsule_3', emoji: '🕰️', title: 'Pesan Masa Depan',
    desc: 'Buat 3 kapsul waktu',
    rarity: 'silver', category: 'Time Capsule',
    check: s => s.capsules >= 3,
  },
  {
    id: 'capsule_5', emoji: '⌛', title: 'Mesin Waktu Cinta',
    desc: 'Buat 5 kapsul waktu',
    rarity: 'gold', category: 'Time Capsule',
    check: s => s.capsules >= 5,
  },
  {
    id: 'capsule_opened', emoji: '📬', title: 'Membuka Masa Lalu',
    desc: 'Buka kapsul waktu pertama',
    rarity: 'gold', category: 'Time Capsule',
    check: s => s.capsulesOpened >= 1,
  },

  // ── LOVE QUIZ ──────────────────────────────────────────
  {
    id: 'quiz_first', emoji: '💘', title: 'Kuis Perdana',
    desc: 'Tambahkan pertanyaan pertama ke love quiz',
    rarity: 'bronze', category: 'Love Quiz',
    check: s => s.quizQuestions >= 1,
  },
  {
    id: 'quiz_10', emoji: '🧠', title: 'Bank Soal Cinta',
    desc: 'Tambahkan 10 pertanyaan ke love quiz',
    rarity: 'silver', category: 'Love Quiz',
    check: s => s.quizQuestions >= 10,
  },
  {
    id: 'quiz_25', emoji: '📝', title: 'Profesor Cinta',
    desc: 'Tambahkan 25 pertanyaan ke love quiz',
    rarity: 'gold', category: 'Love Quiz',
    check: s => s.quizQuestions >= 25,
  },

  // ── WAKTU BERSAMA ──────────────────────────────────────────
  {
    id: 'days_7', emoji: '🌱', title: 'Seminggu Bersama',
    desc: 'Sudah 7 hari bersama',
    rarity: 'bronze', category: 'Waktu Bersama',
    check: s => s.daysTogether >= 7,
  },
  {
    id: 'days_30', emoji: '🌸', title: 'Sebulan Bersama',
    desc: 'Sudah 30 hari bersama',
    rarity: 'bronze', category: 'Waktu Bersama',
    check: s => s.daysTogether >= 30,
  },
  {
    id: 'days_100', emoji: '🌹', title: '100 Hari',
    desc: 'Sudah 100 hari bersama',
    rarity: 'silver', category: 'Waktu Bersama',
    check: s => s.daysTogether >= 100,
  },
  {
    id: 'days_200', emoji: '💐', title: '200 Hari',
    desc: 'Sudah 200 hari bersama',
    rarity: 'silver', category: 'Waktu Bersama',
    check: s => s.daysTogether >= 200,
  },
  {
    id: 'days_365', emoji: '💍', title: 'Satu Tahun!',
    desc: 'Sudah 1 tahun bersama — selamat!',
    rarity: 'gold', category: 'Waktu Bersama',
    check: s => s.daysTogether >= 365,
  },
  {
    id: 'days_500', emoji: '🌟', title: '500 Hari',
    desc: 'Sudah 500 hari bersama',
    rarity: 'gold', category: 'Waktu Bersama',
    check: s => s.daysTogether >= 500,
  },
  {
    id: 'days_730', emoji: '👑', title: 'Dua Tahun Cinta',
    desc: 'Sudah 2 tahun bersama — luar biasa!',
    rarity: 'legendary', category: 'Waktu Bersama',
    check: s => s.daysTogether >= 730,
  },
  {
    id: 'days_1000', emoji: '💎', title: '1000 Hari Bersama',
    desc: 'Sudah 1000 hari bersama — kalian luar biasa!',
    rarity: 'legendary', category: 'Waktu Bersama',
    check: s => s.daysTogether >= 1000,
  },

  // ── SPESIAL / KOMBINASI ──────────────────────────────────────────
  {
    id: 'all_menus', emoji: '🌈', title: 'Serba Lengkap',
    desc: 'Gunakan semua fitur utama minimal sekali',
    rarity: 'special', category: 'Spesial',
    hint: 'Kunjungi tempat + buat kenangan + tulis surat + buat capsule + isi bucket list',
    check: s => s.visited >= 1 && s.memories >= 1 && s.letters >= 1 && s.capsules >= 1 && s.bucketTotal >= 1,
  },
  {
    id: 'power_couple', emoji: '⚡', title: 'Power Couple',
    desc: 'Punya 10+ kenangan, 10+ foto, dan 5+ surat cinta',
    rarity: 'special', category: 'Spesial',
    check: s => s.memories >= 10 && s.photos >= 10 && s.letters >= 5,
  },
  {
    id: 'adventure_lovers', emoji: '🎒', title: 'Adventure Lovers',
    desc: 'Kunjungi 10 tempat DAN punya 20+ foto dokumentasi',
    rarity: 'gold', category: 'Spesial',
    check: s => s.visited >= 10 && s.photos >= 20,
  },
  {
    id: 'hopeless_romantic', emoji: '🥀', title: 'Hopeless Romantic',
    desc: 'Tulis 5 surat cinta DAN buat 3 kapsul waktu',
    rarity: 'gold', category: 'Spesial',
    check: s => s.letters >= 5 && s.capsules >= 3,
  },
  {
    id: 'bucket_traveler', emoji: '🌐', title: 'Bucket Traveler',
    desc: 'Wujudkan 3 impian DAN kunjungi 10 tempat',
    rarity: 'gold', category: 'Spesial',
    check: s => s.bucketDone >= 3 && s.visited >= 10,
  },
  {
    id: 'dedicated', emoji: '💪', title: 'Pasangan Berdedikasi',
    desc: 'Streak 30 hari + 10 kenangan + 5 tempat dikunjungi',
    rarity: 'special', category: 'Spesial',
    check: s => s.maxStreak >= 30 && s.memories >= 10 && s.visited >= 5,
  },
  {
    id: 'ultimate', emoji: '🦋', title: 'Ultimate Couple',
    desc: 'Raih setidaknya 30 achievement lainnya',
    rarity: 'legendary', category: 'Spesial',
    hint: 'Kumpulkan 30 achievement terlebih dahulu',
    check: s => s._unlockedCount >= 30,
  },
]

const RARITY_STYLE: Record<string, { bg: string; border: string; badge: string; text: string; label: string }> = {
  bronze:    { bg: '#fdf6ec', border: '#fcd34d', badge: '#d97706', text: '#92400e', label: 'Perunggu' },
  silver:    { bg: '#f8fafc', border: '#cbd5e1', badge: '#475569', text: '#1e293b', label: 'Perak' },
  gold:      { bg: '#fefce8', border: '#fbbf24', badge: '#b45309', text: '#78350f', label: 'Emas' },
  special:   { bg: '#fdf4ff', border: '#d946ef', badge: '#86198f', text: '#4a044e', label: 'Spesial' },
  legendary: { bg: '#fff1f2', border: '#f43f5e', badge: '#be123c', text: '#881337', label: 'Legendaris' },
}

const CATEGORY_ORDER = [
  'Perjalanan', 'Kenangan', 'Surat Cinta', 'Dokumentasi',
  'Streak', 'Bucket List', 'Time Capsule', 'Love Quiz',
  'Waktu Bersama', 'Spesial',
]

const CATEGORY_EMOJI: Record<string, string> = {
  'Perjalanan': '🗺️', 'Kenangan': '💝', 'Surat Cinta': '💌',
  'Dokumentasi': '📸', 'Streak': '🔥', 'Bucket List': '✨',
  'Time Capsule': '⏳', 'Love Quiz': '💘', 'Waktu Bersama': '💑', 'Spesial': '⭐',
}

export default function AchievementsPage() {
  const [stats, setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all' | 'unlocked' | 'locked'>('all')
  const [activeCategory, setActiveCategory] = useState<string>('Semua')

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const [profRes, placesRes, photosRes, lettersRes, memoriesRes,
           bucketRes, streakRes, capsuleRes, quizRes, memFullRes] = await Promise.all([
      supabase.from('couple_profile').select('anniversary_date').single(),
      supabase.from('places').select('status, category'),
      supabase.from('place_photos').select('id'),
      supabase.from('love_letters').select('id'),
      supabase.from('memories').select('id, mood, photo_url'),
      supabase.from('bucket_list').select('is_completed'),
      supabase.from('streaks').select('longest_streak, total_checkins'),
      supabase.from('time_capsules').select('id, is_opened'),
      supabase.from('quiz_questions').select('id'),
      supabase.from('memories').select('mood'),
    ])

    const places    = placesRes.data  || []
    const bucket    = bucketRes.data  || []
    const streakRows = streakRes.data || []
    const capsules  = capsuleRes.data || []
    const memories  = memoriesRes.data || []
    const moodFull  = memFullRes.data || []

    const anniversaryDate = profRes.data?.anniversary_date
    const daysTogether = anniversaryDate
      ? Math.max(0, Math.floor((Date.now() - new Date(anniversaryDate).getTime()) / 86400000))
      : 0

    const visitedPlaces   = places.filter((p: any) => p.status === 'visited')
    const visitedCats     = new Set(visitedPlaces.map((p: any) => p.category)).size
    const uniqueMoods     = new Set(moodFull.map((m: any) => m.mood)).size
    const memoriesWPhoto  = memories.filter((m: any) => m.photo_url).length
    const totalCheckins   = streakRows.reduce((a: number, s: any) => a + (s.total_checkins || 0), 0)
    const maxStreak       = streakRows.length > 0 ? Math.max(...streakRows.map((s: any) => s.longest_streak || 0)) : 0

    const baseStats = {
      visited:           visitedPlaces.length,
      wishlist:          places.filter((p: any) => p.status === 'wishlist').length,
      visitedCategories: visitedCats,
      photos:            photosRes.data?.length || 0,
      letters:           lettersRes.data?.length || 0,
      memories:          memories.length,
      memoriesWithPhoto: memoriesWPhoto,
      moodVariety:       uniqueMoods,
      bucketTotal:       bucket.length,
      bucketDone:        bucket.filter((b: any) => b.is_completed).length,
      maxStreak,
      totalCheckins,
      capsules:          capsules.length,
      capsulesOpened:    capsules.filter((c: any) => c.is_opened).length,
      quizQuestions:     quizRes.data?.length || 0,
      daysTogether,
      _unlockedCount:    0,
    }

    // Hitung jumlah yang sudah unlock (untuk achievement "Ultimate")
    const unlockedCount = ACHIEVEMENTS.filter(a => a.id !== 'ultimate' && a.check(baseStats)).length
    baseStats._unlockedCount = unlockedCount

    setStats(baseStats)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '64px 0', fontSize: '2.5rem' }} className="heart-beat">🏆</div>
  )

  const unlocked = ACHIEVEMENTS.filter(a => a.check(stats))
  const locked   = ACHIEVEMENTS.filter(a => !a.check(stats))

  const allVisible = filter === 'unlocked' ? unlocked : filter === 'locked' ? locked : ACHIEVEMENTS
  const visible = activeCategory === 'Semua' ? allVisible : allVisible.filter(a => a.category === activeCategory)

  const categories = ['Semua', ...CATEGORY_ORDER]

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Achievement 🏆</h1>
        <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '4px' }}>Setiap langkah cinta kalian adalah pencapaian</p>
      </div>

      {/* Overall progress */}
      <div className="glass" style={{ borderRadius: '20px', padding: '18px 22px', border: '1px solid #fecdd3', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.5rem' }}>🏆</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="font-display" style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.9rem' }}>Progress Keseluruhan</span>
              <span className="font-display" style={{ fontWeight: 700, color: '#f43f5e', fontSize: '0.9rem' }}>{unlocked.length} / {ACHIEVEMENTS.length}</span>
            </div>
            <div style={{ background: '#fce7f3', borderRadius: '50px', height: '8px' }}>
              <div className="progress-bar" style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%`, height: '8px' }} />
            </div>
            <p className="font-body" style={{ color: '#fda4af', fontSize: '0.72rem', marginTop: '5px', marginBottom: 0 }}>
              {unlocked.length === ACHIEVEMENTS.length
                ? '🎉 Semua achievement terbuka! Kalian luar biasa!'
                : `${locked.length} achievement lagi menanti kalian 💪`}
            </p>
          </div>
        </div>

        {/* Rarity summary */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          {(['bronze','silver','gold','special','legendary'] as const).map(r => {
            const count = unlocked.filter(a => a.rarity === r).length
            const total = ACHIEVEMENTS.filter(a => a.rarity === r).length
            const rs = RARITY_STYLE[r]
            return (
              <div key={r} style={{ background: rs.bg, border: `1.5px solid ${rs.border}`, borderRadius: '10px', padding: '5px 10px', textAlign: 'center', minWidth: '64px' }}>
                <div className="font-display" style={{ fontWeight: 700, color: rs.badge, fontSize: '0.9rem' }}>{count}/{total}</div>
                <div className="font-body" style={{ fontSize: '0.62rem', color: rs.text }}>{rs.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter status */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {[['all','Semua'], ['unlocked','✅ Terbuka'], ['locked','🔒 Terkunci']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as any)}
            style={{ padding: '6px 14px', borderRadius: '50px', border: '1.5px solid', borderColor: filter === v ? '#f43f5e' : '#fecdd3', background: filter === v ? '#f43f5e' : '#fff', color: filter === v ? '#fff' : '#fb7185', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Lato,sans-serif' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Filter kategori */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{ padding: '5px 12px', borderRadius: '50px', border: '1.5px solid', whiteSpace: 'nowrap', borderColor: activeCategory === cat ? '#ec4899' : '#fecdd3', background: activeCategory === cat ? '#ec4899' : '#fff', color: activeCategory === cat ? '#fff' : '#fb7185', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Lato,sans-serif', flexShrink: 0 }}>
            {cat !== 'Semua' ? CATEGORY_EMOJI[cat] + ' ' : ''}{cat}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      {visible.length === 0 ? (
        <div className="glass" style={{ borderRadius: '20px', padding: '40px', textAlign: 'center', border: '1px solid #fecdd3' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
          <p className="font-display" style={{ color: '#be123c', fontSize: '1.1rem', margin: 0 }}>Tidak ada achievement di sini</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '10px' }}>
          {visible.map(a => {
            const isUnlocked = a.check(stats)
            const rs = RARITY_STYLE[a.rarity]
            return (
              <div key={a.id} className="card-hover" style={{
                borderRadius: '14px',
                border: `2px solid ${isUnlocked ? rs.border : '#f3f4f6'}`,
                background: isUnlocked ? rs.bg : '#fafafa',
                padding: '14px 12px',
                textAlign: 'center',
                opacity: isUnlocked ? 1 : 0.5,
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Unlocked ribbon */}
                {isUnlocked && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.7rem' }}>✅</div>
                )}

                {/* Emoji */}
                <div style={{ fontSize: '2rem', marginBottom: '6px', filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
                  {isUnlocked ? a.emoji : '🔒'}
                </div>

                {/* Rarity badge */}
                <div style={{ display: 'inline-block', background: isUnlocked ? rs.badge : '#9ca3af', borderRadius: '50px', padding: '2px 8px', marginBottom: '6px' }}>
                  <span style={{ color: '#fff', fontSize: '0.58rem', fontWeight: 700, fontFamily: 'Lato,sans-serif', letterSpacing: '0.05em' }}>
                    {rs.label.toUpperCase()}
                  </span>
                </div>

                {/* Category chip */}
                <div style={{ fontSize: '0.6rem', color: isUnlocked ? rs.text : '#9ca3af', fontFamily: 'Lato,sans-serif', marginBottom: '4px', opacity: 0.7 }}>
                  {CATEGORY_EMOJI[a.category]} {a.category}
                </div>

                {/* Title */}
                <h4 className="font-display" style={{ fontWeight: 700, color: isUnlocked ? '#9f1239' : '#9ca3af', fontSize: '0.8rem', margin: '0 0 4px', lineHeight: 1.3 }}>
                  {a.title}
                </h4>

                {/* Desc */}
                <p className="font-body" style={{ color: isUnlocked ? '#fb7185' : '#d1d5db', fontSize: '0.67rem', margin: 0, lineHeight: 1.4 }}>
                  {isUnlocked ? a.desc : (a.hint || a.desc)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <p className="font-body" style={{ textAlign: 'center', color: '#fda4af', fontSize: '0.75rem', marginTop: '24px' }}>
        Total {ACHIEVEMENTS.length} achievement tersedia 💕
      </p>
    </div>
  )
}
