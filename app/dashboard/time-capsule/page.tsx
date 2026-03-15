'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Lock, Unlock, Clock } from 'lucide-react'
import { format, parseISO, isPast, differenceInDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface Capsule {
  id: string
  title: string
  message: string
  from_person: string
  to_person: string
  open_date: string
  is_opened: boolean
  created_at: string
}

export default function TimeCapsulePage() {
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', message: '', from_person: '', to_person: '',
    open_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [capRes, profRes] = await Promise.all([
      supabase.from('time_capsules').select('*').order('open_date', { ascending: true }),
      supabase.from('couple_profile').select('person1_name, person2_name').single()
    ])
    setCapsules(capRes.data || [])
    if (profRes.data) {
      setProfile(profRes.data)
      setForm(f => ({ ...f, from_person: profRes.data.person1_name, to_person: profRes.data.person2_name }))
    }
    setLoading(false)
  }

  async function saveCapsule() {
    if (!form.title || !form.message) return
    setSaving(true)
    await supabase.from('time_capsules').insert([{ ...form, is_opened: false }])
    setShowModal(false)
    setSaving(false)
    setForm(f => ({ ...f, title: '', message: '' }))
    await loadData()
  }

  async function openCapsule(capsule: Capsule) {
    if (!isPast(parseISO(capsule.open_date))) return
    await supabase.from('time_capsules').update({ is_opened: true }).eq('id', capsule.id)
    setSelectedCapsule({ ...capsule, is_opened: true })
    setShowReveal(true)
    await loadData()
  }

  async function deleteCapsule(id: string) {
    if (!confirm('Hapus kapsul ini?')) return
    await supabase.from('time_capsules').delete().eq('id', id)
    await loadData()
  }

  const canOpen = (c: Capsule) => isPast(parseISO(c.open_date)) && !c.is_opened
  const daysLeft = (d: string) => Math.max(0, differenceInDays(parseISO(d), new Date()))

  const locked   = capsules.filter(c => !isPast(parseISO(c.open_date)))
  const unlocked = capsules.filter(c => isPast(parseISO(c.open_date)) && !c.is_opened)
  const opened   = capsules.filter(c => c.is_opened)

  const authorOptions = [profile?.person1_name, profile?.person2_name].filter(Boolean)

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Time Capsule ⏳</h1>
          <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginTop: '4px' }}>Pesan rahasia untuk dibuka di masa depan</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-rose" style={{ gap: '6px', fontSize: '0.875rem', padding: '10px 20px' }}>
          <Plus size={16} /> Buat Kapsul
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }} className="heart-beat">⏳</div>
      ) : capsules.length === 0 ? (
        <div className="glass" style={{ borderRadius: '24px', padding: '60px 32px', textAlign: 'center', border: '1px solid #fecdd3' }}>
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>⏳</div>
          <h3 className="font-display" style={{ color: '#be123c', fontSize: '1.2rem', marginBottom: '8px' }}>Belum ada kapsul waktu</h3>
          <p className="font-body" style={{ color: '#fb7185', fontSize: '0.85rem', marginBottom: '20px' }}>Tuliskan pesan untuk dibuka di masa depan!</p>
          <button onClick={() => setShowModal(true)} className="btn-rose">+ Buat Kapsul Pertama</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Belum bisa dibuka */}
          {locked.length > 0 && (
            <div>
              <h2 className="font-display" style={{ color: '#9f1239', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} color="#f43f5e" /> Terkunci ({locked.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {locked.map(c => (
                  <div key={c.id} className="glass" style={{ borderRadius: '16px', border: '1px solid #fecdd3', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg, #f43f5e08, #ec489908)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '2.5rem' }}>🔒</div>
                      <div style={{ flex: 1 }}>
                        <h3 className="font-display" style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.95rem', margin: 0 }}>{c.title}</h3>
                        <p className="font-body" style={{ color: '#fb7185', fontSize: '0.78rem', margin: '2px 0 0' }}>
                          Dari {c.from_person} → {c.to_person}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f43f5e' }}>{daysLeft(c.open_date)}</div>
                        <div className="font-body" style={{ fontSize: '0.7rem', color: '#fda4af' }}>hari lagi</div>
                        <div className="font-body" style={{ fontSize: '0.7rem', color: '#fda4af', marginTop: '2px' }}>
                          {format(parseISO(c.open_date), 'd MMM yyyy', { locale: idLocale })}
                        </div>
                      </div>
                      <button onClick={() => deleteCapsule(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fda4af', padding: '4px', display: 'flex' }}>
                        <X size={14} />
                      </button>
                    </div>
                    {/* progress bar */}
                    <div style={{ height: '4px', background: '#fce7f3' }}>
                      <div style={{
                        height: '4px',
                        background: 'linear-gradient(90deg, #f43f5e, #ec4899)',
                        width: `${Math.max(5, 100 - (daysLeft(c.open_date) / Math.max(1, differenceInDays(parseISO(c.open_date), parseISO(c.created_at)))) * 100)}%`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Siap dibuka */}
          {unlocked.length > 0 && (
            <div>
              <h2 className="font-display" style={{ color: '#9f1239', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Unlock size={16} color="#22c55e" /> Siap Dibuka! ({unlocked.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {unlocked.map(c => (
                  <div key={c.id} className="card-hover" style={{ borderRadius: '16px', border: '2px solid #86efac', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => openCapsule(c)}>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '2.5rem', animation: 'float 3s ease-in-out infinite' }}>📬</div>
                      <div style={{ flex: 1 }}>
                        <h3 className="font-display" style={{ fontWeight: 700, color: '#15803d', fontSize: '0.95rem', margin: 0 }}>{c.title}</h3>
                        <p className="font-body" style={{ color: '#4ade80', fontSize: '0.78rem', margin: '2px 0 0' }}>
                          Dari {c.from_person} → {c.to_person}
                        </p>
                        <p className="font-body" style={{ color: '#86efac', fontSize: '0.72rem' }}>
                          ✨ Klik untuk membuka!
                        </p>
                      </div>
                      <div style={{ background: '#22c55e', borderRadius: '50px', padding: '6px 14px' }}>
                        <span className="font-body" style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>Buka!</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sudah dibuka */}
          {opened.length > 0 && (
            <div>
              <h2 className="font-display" style={{ color: '#9f1239', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💌 Sudah Dibuka ({opened.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {opened.map(c => (
                  <div key={c.id} className="glass" style={{ borderRadius: '16px', border: '1px solid #fecdd3', cursor: 'pointer' }}
                    onClick={() => { setSelectedCapsule(c); setShowReveal(true) }}>
                    <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ fontSize: '2rem' }}>💌</div>
                      <div style={{ flex: 1 }}>
                        <h3 className="font-display" style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.9rem', margin: 0 }}>{c.title}</h3>
                        <p className="font-body" style={{ color: '#fda4af', fontSize: '0.75rem', margin: '2px 0 0' }}>
                          {c.from_person} → {c.to_person} · {format(parseISO(c.open_date), 'd MMM yyyy', { locale: idLocale })}
                        </p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteCapsule(c.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fda4af', padding: '4px', display: 'flex' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reveal Modal */}
      {showReveal && selectedCapsule && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowReveal(false)}>
          <div style={{ background: '#fffdf7', borderRadius: '24px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)', padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>💌</div>
              <h2 className="font-display" style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>{selectedCapsule.title}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginTop: '4px', fontFamily: 'Lato,sans-serif' }}>
                Dari {selectedCapsule.from_person} untuk {selectedCapsule.to_person}
              </p>
            </div>
            <div style={{ padding: '28px' }}>
              <div className="paper-texture" style={{ borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <p className="font-body" style={{ color: '#9f1239', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{selectedCapsule.message}</p>
              </div>
              <p className="font-body" style={{ color: '#fda4af', fontSize: '0.75rem', textAlign: 'center', marginBottom: '16px' }}>
                🗓️ Dibuat {format(parseISO(selectedCapsule.created_at), 'd MMMM yyyy', { locale: idLocale })}
              </p>
              <button onClick={() => setShowReveal(false)} className="btn-rose" style={{ width: '100%', justifyContent: 'center' }}>Tutup 💕</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#9f1239', margin: 0 }}>Buat Kapsul Waktu ⏳</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fb7185', display: 'flex' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Judul Kapsul *</label>
                <input className="love-input" placeholder="Contoh: Untuk 1 tahun ke depan..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Dari</label>
                  <select className="love-input" value={form.from_person} onChange={e => setForm(p => ({ ...p, from_person: e.target.value }))}>
                    {authorOptions.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Untuk</label>
                  <select className="love-input" value={form.to_person} onChange={e => setForm(p => ({ ...p, to_person: e.target.value }))}>
                    {authorOptions.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Tanggal Bisa Dibuka *</label>
                <input type="date" className="love-input" value={form.open_date}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  onChange={e => setForm(p => ({ ...p, open_date: e.target.value }))} />
                <p className="font-body" style={{ color: '#fda4af', fontSize: '0.72rem', marginTop: '4px' }}>
                  ⏳ {daysLeft(form.open_date)} hari lagi dari sekarang
                </p>
              </div>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>Isi Pesan *</label>
                <textarea className="love-input paper-texture" style={{ resize: 'none' }} rows={5}
                  placeholder="Tuliskan pesanmu untuk dibuka di masa depan... Apa harapanmu? Apa yang ingin kamu ingat?"
                  value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowModal(false)} className="font-body" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #fecdd3', background: '#fff', color: '#fb7185', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button onClick={saveCapsule} disabled={saving || !form.title || !form.message} className="btn-rose" style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
                  {saving ? '⏳' : '🔒 Kunci Kapsul'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
