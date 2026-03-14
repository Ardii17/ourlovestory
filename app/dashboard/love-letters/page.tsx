'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Scroll, Heart } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const moods = [
  { value: 'romantic', label: 'Romantis', emoji: '💕', color: '#ffe8ef' },
  { value: 'longing', label: 'Rindu', emoji: '🥺', color: '#fef3c7' },
  { value: 'grateful', label: 'Bersyukur', emoji: '🙏', color: '#dcfce7' },
  { value: 'excited', label: 'Semangat', emoji: '🌟', color: '#ede9fe' },
  { value: 'sorry', label: 'Minta Maaf', emoji: '😔', color: '#dbeafe' },
  { value: 'playful', label: 'Gemas', emoji: '😘', color: '#fce7f3' },
]

interface Letter {
  id: string
  title: string
  content: string
  from_person: string
  to_person: string
  mood: string | null
  created_at: string
}

export default function LoveLettersPage() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [profile, setProfile] = useState<{ person1_name: string; person2_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Letter | null>(null)
  const [form, setForm] = useState({ title: '', content: '', from_person: '', to_person: '', mood: 'romantic' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [lettersRes, profileRes] = await Promise.all([
      supabase.from('love_letters').select('*').order('created_at', { ascending: false }),
      supabase.from('couple_profile').select('person1_name, person2_name').single()
    ])
    setLetters(lettersRes.data || [])
    if (profileRes.data) {
      setProfile(profileRes.data)
      setForm(f => ({ ...f, from_person: profileRes.data.person1_name, to_person: profileRes.data.person2_name }))
    }
    setLoading(false)
  }

  async function saveLetter() {
    if (!form.title || !form.content) return
    setSaving(true)
    await supabase.from('love_letters').insert([form])
    setForm(f => ({ ...f, title: '', content: '', mood: 'romantic' }))
    setShowModal(false)
    setSaving(false)
    await loadData()
  }

  async function deleteLetter(id: string) {
    if (!confirm('Hapus surat ini?')) return
    await supabase.from('love_letters').delete().eq('id', id)
    await loadData()
    if (selected?.id === id) setSelected(null)
  }

  const getMoodInfo = (mood: string | null) => moods.find(m => m.value === mood) || moods[0]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-rose-800">Surat Cinta 💌</h1>
          <p className="text-rose-500 font-body text-sm mt-1">{letters.length} surat tersimpan dengan cinta</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-rose flex items-center gap-2">
          <Plus size={18} /> Tulis Surat
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-4xl heart-beat">💕</div>
      ) : letters.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl">
          <div className="text-5xl mb-4">💌</div>
          <h3 className="font-display text-xl text-rose-700 mb-2">Belum ada surat cinta</h3>
          <p className="text-rose-400 font-body text-sm mb-4">Ungkapkan perasaanmu lewat tulisan!</p>
          <button onClick={() => setShowModal(true)} className="btn-rose">+ Tulis Surat Pertama</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {letters.map(letter => {
            const moodInfo = getMoodInfo(letter.mood)
            return (
              <div key={letter.id}
                className="card-hover rounded-2xl border border-rose-100 overflow-hidden cursor-pointer relative"
                style={{ background: `linear-gradient(135deg, ${moodInfo.color}, #fffdf7)` }}
                onClick={() => setSelected(letter)}
              >
                {/* Decorative wax seal */}
                <div className="absolute top-3 right-3 text-2xl opacity-60">{moodInfo.emoji}</div>

                <div className="p-5">
                  {/* Envelope lines */}
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.15), transparent)' }} />

                  <div className="mb-3">
                    <span className="text-xs font-body text-rose-400 italic">Untuk: {letter.to_person} 💌</span>
                  </div>
                  <h3 className="font-display font-bold text-rose-800 text-lg mb-2 pr-8">{letter.title}</h3>
                  <p className="text-rose-600 font-body text-sm line-clamp-3 leading-relaxed">{letter.content}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-rose-100">
                    <span className="text-xs text-rose-400 font-body italic">— {letter.from_person}</span>
                    <span className="text-xs text-rose-400 font-body">
                      {format(parseISO(letter.created_at), 'd MMM yyyy', { locale: idLocale })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Letter Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSelected(null)}>
          <div className="bg-amber-50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            style={{ maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {/* Letter header */}
            <div className="p-6 pb-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="mood-badge mb-2 inline-block" style={{ background: '#ffe8ef', color: '#f43f5e' }}>
                    {getMoodInfo(selected.mood).emoji} {getMoodInfo(selected.mood).label}
                  </span>
                  <p className="text-rose-400 font-body text-sm italic">
                    {format(parseISO(selected.created_at), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteLetter(selected.id)}
                    className="p-2 bg-rose-100 rounded-lg hover:bg-rose-200 transition-colors">
                    <X size={16} className="text-rose-500" />
                  </button>
                  <button onClick={() => setSelected(null)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Letter content */}
            <div className="px-6 pb-6">
              <div className="paper-texture rounded-2xl p-6" style={{ border: '1px solid rgba(244,63,94,0.1)' }}>
                <p className="font-body text-rose-700 text-sm italic mb-4">Kepada yang tercinta, {selected.to_person}...</p>
                <h2 className="font-display text-xl font-bold text-rose-800 mb-4">{selected.title}</h2>
                <p className="font-body text-rose-700 leading-relaxed whitespace-pre-wrap">{selected.content}</p>
                <div className="mt-6 text-right">
                  <p className="font-script text-rose-500 text-lg">Dengan sepenuh cinta,</p>
                  <p className="font-script text-rose-600 text-xl font-bold">{selected.from_person} 💕</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Write Letter Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-rose-800">Tulis Surat Cinta 💌</h2>
              <button onClick={() => setShowModal(false)} className="text-rose-400 hover:text-rose-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Dari</label>
                  <input className="love-input" placeholder="Namamu..." value={form.from_person}
                    onChange={e => setForm(p => ({ ...p, from_person: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Untuk</label>
                  <input className="love-input" placeholder="Nama dia..." value={form.to_person}
                    onChange={e => setForm(p => ({ ...p, to_person: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Suasana Hati</label>
                <div className="grid grid-cols-3 gap-2">
                  {moods.map(m => (
                    <button key={m.value} onClick={() => setForm(p => ({ ...p, mood: m.value }))}
                      className={`py-2 px-2 rounded-xl text-xs font-body font-semibold flex items-center justify-center gap-1 transition-all ${
                        form.mood === m.value ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Judul Surat *</label>
                <input className="love-input" placeholder="Judul surat cinta..." value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Isi Surat *</label>
                <textarea className="love-input resize-none paper-texture" rows={8}
                  placeholder="Tuliskan segala perasaanmu di sini... setiap kata yang tulus akan selalu dikenang 💕"
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-rose-200 text-rose-500 font-semibold hover:bg-rose-50 transition-colors font-body">
                  Batal
                </button>
                <button onClick={saveLetter} disabled={saving || !form.title || !form.content}
                  className="flex-1 btn-rose flex items-center justify-center gap-2">
                  {saving ? '💕' : <><Scroll size={16} /> Kirim Surat</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
