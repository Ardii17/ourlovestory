'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { differenceInDays, format, parseISO, isToday, isYesterday } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Flame, Heart, AlertTriangle, RefreshCw } from 'lucide-react'

const FUNNY_PENALTIES = [
  { id: 1, label: 'Nyanyi lagu cinta di depan pasangan 🎤', emoji: '🎤' },
  { id: 2, label: 'Kirim voice note bilang "I love you" dengan suara aneh 🐸', emoji: '🐸' },
  { id: 3, label: 'Buat gambar wajah pasangan (tidak boleh dihapus) 🎨', emoji: '🎨' },
  { id: 4, label: 'Ceritakan hal memalukan di depan pasangan 😳', emoji: '😳' },
  { id: 5, label: 'Joget selama 30 detik tanpa musik 💃', emoji: '💃' },
  { id: 6, label: 'Bacakan puisi asal-asalan tentang pasangan 📜', emoji: '📜' },
  { id: 7, label: 'Tiru suara hewan favorit pasangan 🐾', emoji: '🐾' },
  { id: 8, label: 'Buat video selfie dengan ekspresi lebay 🤪', emoji: '🤪' },
]

interface StreakData {
  id: string
  person_name: string
  current_streak: number
  longest_streak: number
  last_check_in: string | null
  penalty_done: boolean
  total_checkins: number
}

export default function StreakPage() {
  const [streaks, setStreaks] = useState<StreakData[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [penalty, setPenalty] = useState<typeof FUNNY_PENALTIES[0] | null>(null)
  const [showPenalty, setShowPenalty] = useState<string | null>(null) // person_name
  const [showConfetti, setShowConfetti] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [streakRes, profRes] = await Promise.all([
      supabase.from('streaks').select('*').order('person_name'),
      supabase.from('couple_profile').select('person1_name, person2_name').single()
    ])
    if (profRes.data) {
      setProfile(profRes.data)
      // init records jika belum ada
      const names = [profRes.data.person1_name, profRes.data.person2_name]
      const existing = (streakRes.data || []).map((s: StreakData) => s.person_name)
      for (const name of names) {
        if (!existing.includes(name)) {
          await supabase.from('streaks').insert([{
            person_name: name, current_streak: 0,
            longest_streak: 0, last_check_in: null,
            penalty_done: false, total_checkins: 0
          }])
        }
      }
      const { data } = await supabase.from('streaks').select('*').order('person_name')
      setStreaks(data || [])
    }
    setLoading(false)
  }

  function getStatus(s: StreakData): 'checked' | 'missed' | 'pending' {
    if (!s.last_check_in) return 'pending'
    const last = parseISO(s.last_check_in)
    if (isToday(last)) return 'checked'
    if (isYesterday(last)) return 'pending'
    return 'missed'
  }

  async function checkIn(s: StreakData) {
    const status = getStatus(s)
    if (status === 'checked') return
    if (status === 'missed' && !s.penalty_done) {
      // pilih penalty random
      setPenalty(FUNNY_PENALTIES[Math.floor(Math.random() * FUNNY_PENALTIES.length)])
      setShowPenalty(s.person_name)
      return
    }
    setCheckingIn(s.person_name)
    const newStreak = status === 'missed' ? 1 : s.current_streak + 1
    const newLongest = Math.max(newStreak, s.longest_streak)
    await supabase.from('streaks').update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_check_in: new Date().toISOString(),
      penalty_done: false,
      total_checkins: s.total_checkins + 1
    }).eq('id', s.id)
    setCheckingIn(null)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2500)
    await loadData()
  }

  async function completePenalty(personName: string) {
    await supabase.from('streaks').update({ penalty_done: true }).eq('person_name', personName)
    setShowPenalty(null)
    setPenalty(null)
    await loadData()
    // now allow check in
    const { data } = await supabase.from('streaks').select('*').eq('person_name', personName).single()
    if (data) await checkIn(data)
  }

  const totalSharedStreak = streaks.length === 2
    ? Math.min(...streaks.map(s => s.current_streak))
    : 0

  if (loading) return <div style={{ textAlign: 'center', padding: '64px 0', fontSize: '2.5rem' }} className="heart-beat">🔥</div>

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Streak Kebersamaan 🔥</h1>
        <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '4px' }}>Absen setiap hari untuk menjaga streak kalian!</p>
      </div>

      {/* Shared streak banner */}
      <div style={{
        borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '24px',
        background: totalSharedStreak > 0
          ? 'linear-gradient(135deg, #f43f5e, #ec4899)'
          : 'linear-gradient(135deg, #fecdd3, #fda4af)',
        boxShadow: '0 12px 40px rgba(244,63,94,0.25)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '6px' }}>
          {totalSharedStreak >= 30 ? '🔥🔥🔥' : totalSharedStreak >= 7 ? '🔥🔥' : totalSharedStreak >= 1 ? '🔥' : '💤'}
        </div>
        <div className="font-display" style={{ fontSize: '3.5rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{totalSharedStreak}</div>
        <div className="font-body" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '4px' }}>Hari Streak Bersama</div>
        {totalSharedStreak >= 7 && (
          <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '50px', display: 'inline-block', padding: '4px 14px' }}>
            <span className="font-body" style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
              {totalSharedStreak >= 30 ? '🏆 Luar biasa! 30+ hari!' : totalSharedStreak >= 14 ? '⭐ 2 minggu!' : '🌟 7 hari!'}
            </span>
          </div>
        )}
      </div>

      {/* Individual streaks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {streaks.map(s => {
          const status = getStatus(s)
          const isP1 = s.person_name === profile?.person1_name
          const streakColor = status === 'checked' ? '#22c55e' : status === 'missed' ? '#ef4444' : '#f43f5e'

          return (
            <div key={s.id} className="glass" style={{ borderRadius: '20px', border: `2px solid ${status === 'checked' ? '#86efac' : status === 'missed' ? '#fca5a5' : '#fecdd3'}`, overflow: 'hidden' }}>
              {/* Status bar */}
              <div style={{ height: '4px', background: streakColor }} />

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '2rem' }}>{isP1 ? '👩' : '👨'}</div>
                    <div>
                      <h3 className="font-display" style={{ fontWeight: 700, color: '#9f1239', fontSize: '1rem', margin: 0 }}>{s.person_name}</h3>
                      <p className="font-body" style={{ fontSize: '0.72rem', color: '#fda4af', margin: 0 }}>
                        {s.last_check_in ? `Terakhir: ${format(parseISO(s.last_check_in), 'd MMM, HH:mm', { locale: idLocale })}` : 'Belum pernah absen'}
                      </p>
                    </div>
                  </div>
                  {/* streak count */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Flame size={20} color={s.current_streak > 0 ? '#f43f5e' : '#fda4af'} fill={s.current_streak > 0 ? '#f43f5e' : 'none'} />
                      <span className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, color: s.current_streak > 0 ? '#f43f5e' : '#fda4af' }}>{s.current_streak}</span>
                    </div>
                    <div className="font-body" style={{ fontSize: '0.68rem', color: '#fda4af' }}>hari</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  {[
                    { label: 'Terpanjang', value: s.longest_streak, suffix: 'hari' },
                    { label: 'Total absen', value: s.total_checkins, suffix: 'kali' },
                  ].map(stat => (
                    <div key={stat.label} style={{ flex: 1, background: '#fff1f2', borderRadius: '10px', padding: '8px 10px', textAlign: 'center' }}>
                      <div className="font-display" style={{ fontWeight: 700, color: '#f43f5e', fontSize: '1.1rem' }}>{stat.value}</div>
                      <div className="font-body" style={{ fontSize: '0.65rem', color: '#fda4af' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Status + check-in button */}
                {status === 'checked' ? (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.3rem' }}>✅</span>
                    <p className="font-body" style={{ color: '#15803d', fontWeight: 600, fontSize: '0.85rem', margin: '4px 0 0' }}>Sudah absen hari ini!</p>
                  </div>
                ) : status === 'missed' && !s.penalty_done ? (
                  <div>
                    <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '12px', padding: '10px 12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={16} color="#ef4444" />
                      <p className="font-body" style={{ color: '#dc2626', fontSize: '0.78rem', margin: 0, fontWeight: 600 }}>
                        Streak terputus! Kamu harus menyelesaikan tantangan dulu.
                      </p>
                    </div>
                    <button onClick={() => checkIn(s)} style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Lato, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <RefreshCw size={15} /> Terima Tantangan! 😂
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => checkIn(s)}
                    disabled={checkingIn === s.person_name}
                    className="btn-rose"
                    style={{ width: '100%', justifyContent: 'center', gap: '8px', fontSize: '0.875rem' }}
                  >
                    {checkingIn === s.person_name ? '💕' : <><Flame size={16} /> Absen Sekarang!</>}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Confetti overlay */}
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', animation: 'float 0.5s ease-out' }}>
            <div style={{ fontSize: '5rem' }}>🔥</div>
            <div className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: '#f43f5e', textShadow: '0 2px 20px rgba(244,63,94,0.5)' }}>Streak lanjut!</div>
          </div>
          {['❤️','💕','🔥','⭐','✨'].map((e, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              fontSize: '1.5rem',
              animation: `confetti-fall ${0.8 + Math.random()}s ease-out forwards`,
              animationDelay: `${i * 0.1}s`,
            }}>{e}</div>
          ))}
        </div>
      )}

      {/* Penalty Modal */}
      {showPenalty && penalty && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '0', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>{penalty.emoji}</div>
              <h2 className="font-display" style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Hukuman untuk {showPenalty}! 😂</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginTop: '4px', fontFamily: 'Lato,sans-serif' }}>Streak terputus, selesaikan tantangan ini dulu!</p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
                <p className="font-body" style={{ color: '#9a3412', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{penalty.label}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowPenalty(null); setPenalty(null) }}
                  className="font-body" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #fecdd3', background: '#fff', color: '#fb7185', fontWeight: 600, cursor: 'pointer' }}>
                  Nanti dulu 😅
                </button>
                <button onClick={() => completePenalty(showPenalty)}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Lato,sans-serif' }}>
                  Sudah selesai! ✅
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
