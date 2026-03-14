'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { differenceInDays, differenceInMonths, differenceInYears, format, parseISO, addYears, addMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Save, Camera, Heart, Sparkles, Calendar } from 'lucide-react'

function getValidDuration(startDateStr: string) {
  try {
    const start = parseISO(startDateStr)
    const now = new Date()
    const years = differenceInYears(now, start)
    const afterYears = addYears(start, years)
    const months = differenceInMonths(now, afterYears)
    const afterMonths = addMonths(afterYears, months)
    const days = differenceInDays(now, afterMonths)
    return { years, months, days, totalDays: differenceInDays(now, start) }
  } catch { return null }
}

export default function BiodataPage() {
  const [profile, setProfile] = useState({
    person1_name: '', person2_name: '', anniversary_date: '',
    person1_photo: '', person2_photo: '', love_quote: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading1, setUploading1] = useState(false)
  const [uploading2, setUploading2] = useState(false)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data } = await supabase.from('couple_profile').select('*').single()
    if (data) {
      setProfile({
        person1_name: data.person1_name || '',
        person2_name: data.person2_name || '',
        anniversary_date: data.anniversary_date || '',
        person1_photo: data.person1_photo || '',
        person2_photo: data.person2_photo || '',
        love_quote: data.love_quote || '',
      })
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    const { data: existing } = await supabase.from('couple_profile').select('id').single()
    if (existing) {
      await supabase.from('couple_profile').update(profile).eq('id', existing.id)
    } else {
      await supabase.from('couple_profile').insert([profile])
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function uploadPhoto(file: File, person: 1 | 2) {
    if (person === 1) setUploading1(true)
    else setUploading2(true)
    const ext = file.name.split('.').pop()
    const fileName = `person${person}_${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('couple-photos').upload(fileName, file, { upsert: true })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('couple-photos').getPublicUrl(fileName)
      setProfile(prev => ({ ...prev, [`person${person}_photo`]: urlData.publicUrl }))
    }
    if (person === 1) setUploading1(false)
    else setUploading2(false)
  }

  const duration = profile.anniversary_date ? getValidDuration(profile.anniversary_date) : null
  const anniversaryFormatted = profile.anniversary_date
    ? format(parseISO(profile.anniversary_date), 'EEEE, d MMMM yyyy', { locale: idLocale })
    : ''

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
      <div className="heart-beat" style={{ fontSize: '2.5rem' }}>💕</div>
    </div>
  )

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── FOTO PASANGAN ── */}
      <div className="glass" style={{ borderRadius: '20px', padding: '24px', border: '1px solid #fecdd3' }}>
        <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#9f1239', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heart size={18} color="#fb7185" fill="#fb7185" /> Foto Pasangan
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {([1, 2] as const).map(num => {
            const photoKey = `person${num}_photo` as 'person1_photo' | 'person2_photo'
            const nameKey  = `person${num}_name`  as 'person1_name'  | 'person2_name'
            const uploading = num === 1 ? uploading1 : uploading2
            return (
              <div key={num} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '112px', height: '112px', margin: '0 auto 10px' }}>
                  <div style={{ width: '112px', height: '112px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fecdd3', boxShadow: '0 6px 20px rgba(244,63,94,0.2)' }}>
                    {profile[photoKey] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile[photoKey]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                        {num === 1 ? '👩' : '👨'}
                      </div>
                    )}
                  </div>
                  <label style={{ position: 'absolute', bottom: 0, right: 0, background: '#f43f5e', borderRadius: '50%', padding: '7px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(244,63,94,0.4)', display: 'flex' }}>
                    <Camera size={14} color="#fff" />
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0], num)} />
                  </label>
                </div>
                <p className="font-body" style={{ color: '#be123c', fontSize: '0.85rem', fontWeight: 600 }}>
                  {profile[nameKey] || `Orang ${num}`}
                </p>
                {uploading && <p style={{ color: '#fb7185', fontSize: '0.7rem', marginTop: '2px' }}>Mengupload...</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── FORM DATA ── */}
      <div className="glass" style={{ borderRadius: '20px', padding: '24px', border: '1px solid #fecdd3' }}>
        <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#9f1239', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#fb7185" /> Data Hubungan
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>👩 Nama Kamu</label>
              <input className="love-input" placeholder="Nama kamu..." value={profile.person1_name}
                onChange={e => setProfile(p => ({ ...p, person1_name: e.target.value }))} />
            </div>
            <div>
              <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>👨 Nama Dia</label>
              <input className="love-input" placeholder="Nama dia..." value={profile.person2_name}
                onChange={e => setProfile(p => ({ ...p, person2_name: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>💑 Tanggal Jadian</label>
            <input type="date" className="love-input" value={profile.anniversary_date}
              onChange={e => setProfile(p => ({ ...p, anniversary_date: e.target.value }))} />
            {anniversaryFormatted && (
              <p className="font-body" style={{ color: '#fb7185', fontSize: '0.72rem', marginTop: '4px' }}>
                📅 {anniversaryFormatted}
              </p>
            )}
          </div>

          <div>
            <label className="font-body" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '6px' }}>💬 Quote Cinta</label>
            <textarea className="love-input" style={{ resize: 'none' }} rows={3}
              placeholder="Tuliskan quote cinta kalian yang paling berkesan..."
              value={profile.love_quote}
              onChange={e => setProfile(p => ({ ...p, love_quote: e.target.value }))} />
          </div>

          <button onClick={saveProfile} disabled={saving}
            className="btn-rose" style={{ width: '100%', justifyContent: 'center', gap: '8px' }}>
            {saving ? <span className="heart-beat">💕</span>
              : saved ? '✅ Tersimpan!'
              : <><Save size={16} /> Simpan Biodata</>}
          </button>
        </div>
      </div>

      {/* ── LOVE TIMER (bawah, hanya muncul kalau anniversary sudah diisi) ── */}
      {duration && profile.anniversary_date && (
        <div className="glass" style={{ borderRadius: '20px', border: '1px solid #fecdd3', overflow: 'hidden' }}>
          {/* header strip */}
          <div style={{ background: 'linear-gradient(90deg, #f43f5e, #ec4899)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="rgba(255,255,255,0.85)" />
            <span className="font-display" style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Perjalanan Cinta Kita</span>
          </div>

          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <p className="font-body" style={{ color: '#fb7185', fontSize: '0.8rem', marginBottom: '20px' }}>
              Bersama sejak <strong>{anniversaryFormatted}</strong>
            </p>

            {/* Blok angka — hanya tampil kalau > 0 */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {duration.years > 0 && (
                <>
                  <div style={{ textAlign: 'center', padding: '0 16px' }}>
                    <div className="font-display" style={{ fontSize: '3rem', fontWeight: 700, color: '#f43f5e', lineHeight: 1 }}>{duration.years}</div>
                    <div className="font-body" style={{ color: '#fda4af', fontSize: '0.78rem', marginTop: '4px' }}>Tahun</div>
                  </div>
                  {(duration.months > 0 || duration.days > 0) && (
                    <div style={{ color: '#fecdd3', fontSize: '2rem', paddingBottom: '20px', fontWeight: 300 }}>·</div>
                  )}
                </>
              )}
              {duration.months > 0 && (
                <>
                  <div style={{ textAlign: 'center', padding: '0 16px' }}>
                    <div className="font-display" style={{ fontSize: '3rem', fontWeight: 700, color: '#f43f5e', lineHeight: 1 }}>{duration.months}</div>
                    <div className="font-body" style={{ color: '#fda4af', fontSize: '0.78rem', marginTop: '4px' }}>Bulan</div>
                  </div>
                  {duration.days > 0 && (
                    <div style={{ color: '#fecdd3', fontSize: '2rem', paddingBottom: '20px', fontWeight: 300 }}>·</div>
                  )}
                </>
              )}
              {duration.days > 0 && (
                <div style={{ textAlign: 'center', padding: '0 16px' }}>
                  <div className="font-display" style={{ fontSize: '3rem', fontWeight: 700, color: '#f43f5e', lineHeight: 1 }}>{duration.days}</div>
                  <div className="font-body" style={{ color: '#fda4af', fontSize: '0.78rem', marginTop: '4px' }}>Hari</div>
                </div>
              )}
              {duration.years === 0 && duration.months === 0 && duration.days === 0 && (
                <div className="font-display" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f43f5e' }}>Hari Pertama ✨</div>
              )}
            </div>

            {/* Total hari badge */}
            <div style={{ display: 'inline-block', background: '#fff1f2', borderRadius: '50px', padding: '6px 18px' }}>
              <span className="font-body" style={{ color: '#be123c', fontSize: '0.8rem', fontWeight: 600 }}>
                🗓️ {duration.totalDays} hari bersama
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
