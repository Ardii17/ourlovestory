'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Trophy, Lock } from 'lucide-react'

interface AchievementDef {
  id: string
  emoji: string
  title: string
  desc: string
  rarity: 'bronze' | 'silver' | 'gold' | 'special'
  check: (stats: any) => boolean
}

const ACHIEVEMENTS: AchievementDef[] = [
  // Places
  { id: 'first_place',    emoji: '📍', title: 'Petualang Pertama',  desc: 'Kunjungi tempat pertama bersama',              rarity: 'bronze',  check: s => s.visited >= 1 },
  { id: 'places_5',       emoji: '🗺️', title: 'Penjelajah',         desc: 'Kunjungi 5 tempat bersama',                   rarity: 'bronze',  check: s => s.visited >= 5 },
  { id: 'places_10',      emoji: '🌏', title: 'Pasangan Petualang', desc: 'Kunjungi 10 tempat bersama',                  rarity: 'silver',  check: s => s.visited >= 10 },
  { id: 'places_25',      emoji: '✈️', title: 'Wisatawan Sejati',   desc: 'Kunjungi 25 tempat bersama',                  rarity: 'gold',    check: s => s.visited >= 25 },
  // Memories
  { id: 'first_memory',   emoji: '💝', title: 'Kenangan Pertama',   desc: 'Buat kenangan pertama',                       rarity: 'bronze',  check: s => s.memories >= 1 },
  { id: 'memories_10',    emoji: '📖', title: 'Penulis Kenangan',   desc: 'Simpan 10 kenangan indah',                    rarity: 'silver',  check: s => s.memories >= 10 },
  // Letters
  { id: 'first_letter',   emoji: '💌', title: 'Penulis Romantis',   desc: 'Tulis surat cinta pertama',                   rarity: 'bronze',  check: s => s.letters >= 1 },
  { id: 'letters_5',      emoji: '📜', title: 'Shakespeare Kecil',  desc: 'Tulis 5 surat cinta',                         rarity: 'silver',  check: s => s.letters >= 5 },
  // Photos
  { id: 'photos_10',      emoji: '📸', title: 'Fotografer Cinta',   desc: 'Upload 10 foto dokumentasi',                  rarity: 'bronze',  check: s => s.photos >= 10 },
  { id: 'photos_50',      emoji: '🎞️', title: 'Arsip Kenangan',     desc: 'Upload 50 foto dokumentasi',                  rarity: 'gold',    check: s => s.photos >= 50 },
  // Streak
  { id: 'streak_7',       emoji: '🔥', title: 'Api Cinta',          desc: 'Streak 7 hari berturut-turut',                rarity: 'bronze',  check: s => s.maxStreak >= 7 },
  { id: 'streak_30',      emoji: '🌟', title: 'Sebulan Penuh',      desc: 'Streak 30 hari berturut-turut',               rarity: 'gold',    check: s => s.maxStreak >= 30 },
  { id: 'streak_100',     emoji: '💎', title: 'Legendaris',         desc: 'Streak 100 hari berturut-turut',              rarity: 'special', check: s => s.maxStreak >= 100 },
  // Bucket
  { id: 'bucket_1',       emoji: '✨', title: 'Pemimpi',            desc: 'Tambahkan 1 impian di bucket list',           rarity: 'bronze',  check: s => s.bucketTotal >= 1 },
  { id: 'bucket_done_5',  emoji: '🏆', title: 'Pejuang Impian',     desc: 'Wujudkan 5 impian dari bucket list',          rarity: 'gold',    check: s => s.bucketDone >= 5 },
  // Capsule
  { id: 'capsule_1',      emoji: '⏳', title: 'Penjaga Waktu',      desc: 'Buat kapsul waktu pertama',                   rarity: 'silver',  check: s => s.capsules >= 1 },
  // Time together
  { id: 'days_100',       emoji: '🌹', title: '100 Hari',           desc: 'Sudah 100 hari bersama',                      rarity: 'bronze',  check: s => s.daysTogether >= 100 },
  { id: 'days_365',       emoji: '💍', title: 'Satu Tahun',         desc: 'Sudah 1 tahun bersama!',                      rarity: 'gold',    check: s => s.daysTogether >= 365 },
  { id: 'all_menus',      emoji: '🌈', title: 'Serba Lengkap',      desc: 'Gunakan semua fitur minimal sekali',          rarity: 'special', check: s => s.visited >= 1 && s.memories >= 1 && s.letters >= 1 && s.capsules >= 1 && s.bucketTotal >= 1 },
]

const rarityStyle: Record<string, { bg: string; border: string; badge: string; label: string }> = {
  bronze:  { bg: '#fdf6ec', border: '#fbbf24', badge: '#f59e0b', label: 'Perunggu' },
  silver:  { bg: '#f8fafc', border: '#94a3b8', badge: '#64748b', label: 'Perak' },
  gold:    { bg: '#fefce8', border: '#fbbf24', badge: '#d97706', label: 'Emas' },
  special: { bg: '#fdf4ff', border: '#d946ef', badge: '#a21caf', label: 'Spesial' },
}

export default function AchievementsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const [profRes, placesRes, photosRes, lettersRes, memoriesRes, bucketRes, streakRes, capsuleRes] = await Promise.all([
      supabase.from('couple_profile').select('anniversary_date').single(),
      supabase.from('places').select('status'),
      supabase.from('place_photos').select('id'),
      supabase.from('love_letters').select('id'),
      supabase.from('memories').select('id'),
      supabase.from('bucket_list').select('is_completed'),
      supabase.from('streaks').select('longest_streak'),
      supabase.from('time_capsules').select('id'),
    ])
    const places = placesRes.data || []
    const bucket = bucketRes.data || []
    const streakRows = streakRes.data || []
    const anniversaryDate = profRes.data?.anniversary_date
    const daysTogether = anniversaryDate
      ? Math.max(0, Math.floor((Date.now() - new Date(anniversaryDate).getTime()) / 86400000))
      : 0

    setStats({
      visited: places.filter((p: any) => p.status === 'visited').length,
      photos: photosRes.data?.length || 0,
      letters: lettersRes.data?.length || 0,
      memories: memoriesRes.data?.length || 0,
      bucketTotal: bucket.length,
      bucketDone: bucket.filter((b: any) => b.is_completed).length,
      maxStreak: streakRows.length > 0 ? Math.max(...streakRows.map((s: any) => s.longest_streak)) : 0,
      capsules: capsuleRes.data?.length || 0,
      daysTogether,
    })
    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '64px 0', fontSize: '2.5rem' }} className="heart-beat">🏆</div>

  const unlocked = ACHIEVEMENTS.filter(a => a.check(stats))
  const locked   = ACHIEVEMENTS.filter(a => !a.check(stats))
  const visible  = filter === 'unlocked' ? unlocked : filter === 'locked' ? locked : ACHIEVEMENTS

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Achievement 🏆</h1>
        <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '4px' }}>Setiap langkah cinta kalian adalah pencapaian</p>
      </div>

      {/* Progress */}
      <div className="glass" style={{ borderRadius: '20px', padding: '20px 24px', border: '1px solid #fecdd3', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ fontSize: '3rem' }}>🏆</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="font-display" style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.95rem' }}>Progress Keseluruhan</span>
            <span className="font-display" style={{ fontWeight: 700, color: '#f43f5e' }}>{unlocked.length}/{ACHIEVEMENTS.length}</span>
          </div>
          <div style={{ background: '#fce7f3', borderRadius: '50px', height: '8px' }}>
            <div className="progress-bar" style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%`, height: '8px' }} />
          </div>
          <p className="font-body" style={{ color: '#fda4af', fontSize: '0.72rem', marginTop: '4px' }}>
            {unlocked.length === ACHIEVEMENTS.length ? '🎉 Semua achievement terbuka!' : `${locked.length} achievement lagi menanti!`}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[['all','Semua'], ['unlocked','Terbuka ✅'], ['locked','Terkunci 🔒']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as any)}
            style={{ padding: '7px 16px', borderRadius: '50px', border: '1.5px solid', borderColor: filter === v ? '#f43f5e' : '#fecdd3', background: filter === v ? '#f43f5e' : '#fff', color: filter === v ? '#fff' : '#fb7185', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Lato,sans-serif' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {visible.map(a => {
          const isUnlocked = a.check(stats)
          const rs = rarityStyle[a.rarity]
          return (
            <div key={a.id} className="card-hover" style={{
              borderRadius: '16px', border: `2px solid ${isUnlocked ? rs.border : '#fecdd3'}`,
              background: isUnlocked ? rs.bg : '#fafafa',
              padding: '16px', textAlign: 'center',
              opacity: isUnlocked ? 1 : 0.55,
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '8px', filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
                {isUnlocked ? a.emoji : '🔒'}
              </div>
              <div style={{ display: 'inline-block', background: isUnlocked ? rs.badge : '#d1d5db', borderRadius: '50px', padding: '2px 8px', marginBottom: '6px' }}>
                <span style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Lato,sans-serif' }}>{rs.label.toUpperCase()}</span>
              </div>
              <h4 className="font-display" style={{ fontWeight: 700, color: isUnlocked ? '#9f1239' : '#9ca3af', fontSize: '0.82rem', margin: '0 0 4px' }}>{a.title}</h4>
              <p className="font-body" style={{ color: isUnlocked ? '#fb7185' : '#d1d5db', fontSize: '0.7rem', margin: 0, lineHeight: 1.4 }}>{a.desc}</p>
              {isUnlocked && <div style={{ marginTop: '8px', fontSize: '0.75rem' }}>✅</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
