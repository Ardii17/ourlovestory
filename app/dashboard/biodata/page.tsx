'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { differenceInDays, differenceInMonths, differenceInYears, format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Save, Camera, Heart, Sparkles } from 'lucide-react'

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
    
    const { data, error } = await supabase.storage
      .from('couple-photos')
      .upload(fileName, file, { upsert: true })

    if (!error && data) {
      const { data: urlData } = supabase.storage.from('couple-photos').getPublicUrl(fileName)
      setProfile(prev => ({
        ...prev,
        [`person${person}_photo`]: urlData.publicUrl
      }))
    }

    if (person === 1) setUploading1(false)
    else setUploading2(false)
  }

  function getDuration() {
    if (!profile.anniversary_date) return null
    try {
      const start = parseISO(profile.anniversary_date)
      const now = new Date()
      return {
        years: differenceInYears(now, start),
        months: differenceInMonths(now, start) % 12,
        days: differenceInDays(now, start),
      }
    } catch { return null }
  }

  const duration = getDuration()

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="heart-beat text-4xl">💕</div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Love Counter Preview */}
      {duration && (
        <div className="rounded-3xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)', boxShadow: '0 15px 40px rgba(244, 63, 94, 0.3)' }}
        >
          <div className="text-4xl mb-2">💕</div>
          <p className="text-white font-script text-xl mb-3">Sudah bersama selama...</p>
          <div className="flex justify-center gap-8">
            {[
              { value: duration.years, label: 'Tahun' },
              { value: duration.months, label: 'Bulan' },
              { value: duration.days, label: 'Hari' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="font-display text-4xl font-bold text-white">{item.value}</div>
                <div className="text-rose-200 text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foto Pasangan */}
      <div className="glass rounded-3xl p-6 border border-rose-100">
        <h2 className="font-display text-xl font-bold text-rose-800 mb-6 flex items-center gap-2">
          <Heart size={20} className="text-rose-400" fill="currentColor" />
          Foto Pasangan
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map(num => {
            const photoKey = `person${num}_photo` as 'person1_photo' | 'person2_photo'
            const nameKey = `person${num}_name` as 'person1_name' | 'person2_name'
            const uploading = num === 1 ? uploading1 : uploading2
            return (
              <div key={num} className="text-center">
                <div className="relative mx-auto w-32 h-32 mb-3">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-rose-200"
                    style={{ boxShadow: '0 8px 25px rgba(244, 63, 94, 0.25)' }}
                  >
                    {profile[photoKey] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile[photoKey]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-rose-100 flex items-center justify-center text-4xl">
                        {num === 1 ? '👩' : '👨'}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-rose-500 rounded-full p-2 cursor-pointer hover:bg-rose-600 transition-colors shadow-lg">
                    <Camera size={14} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0], num as 1 | 2)}
                    />
                  </label>
                </div>
                <p className="font-body text-sm text-rose-600 font-semibold">
                  {profile[nameKey] || `Orang ${num}`}
                </p>
                {uploading && <p className="text-xs text-rose-400 mt-1">Mengupload...</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Biodata */}
      <div className="glass rounded-3xl p-6 border border-rose-100">
        <h2 className="font-display text-xl font-bold text-rose-800 mb-6 flex items-center gap-2">
          <Sparkles size={20} className="text-rose-400" />
          Data Hubungan
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">
                👩 Nama Kamu
              </label>
              <input
                className="love-input"
                placeholder="Nama kamu..."
                value={profile.person1_name}
                onChange={e => setProfile(p => ({ ...p, person1_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">
                👨 Nama Dia
              </label>
              <input
                className="love-input"
                placeholder="Nama dia..."
                value={profile.person2_name}
                onChange={e => setProfile(p => ({ ...p, person2_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">
              💑 Tanggal Jadian
            </label>
            <input
              type="date"
              className="love-input"
              value={profile.anniversary_date}
              onChange={e => setProfile(p => ({ ...p, anniversary_date: e.target.value }))}
            />
            {profile.anniversary_date && (
              <p className="text-xs text-rose-400 mt-1 font-body">
                📅 {format(parseISO(profile.anniversary_date), "EEEE, d MMMM yyyy", { locale: idLocale })}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">
              💬 Quote Cinta Kalian
            </label>
            <textarea
              className="love-input resize-none"
              rows={3}
              placeholder="Tuliskan quote cinta kalian yang paling berkesan..."
              value={profile.love_quote}
              onChange={e => setProfile(p => ({ ...p, love_quote: e.target.value }))}
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn-rose w-full flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="heart-beat">💕</span>
            ) : saved ? (
              <>✅ Tersimpan!</>
            ) : (
              <><Save size={18} /> Simpan Biodata</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
