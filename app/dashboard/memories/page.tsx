'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, BookHeart, Upload } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const moods = [
  { value: 'happy', label: 'Bahagia', emoji: '😊' },
  { value: 'romantic', label: 'Romantis', emoji: '💕' },
  { value: 'nostalgic', label: 'Nostalgia', emoji: '🥺' },
  { value: 'exciting', label: 'Seru', emoji: '🎉' },
  { value: 'peaceful', label: 'Damai', emoji: '🌸' },
  { value: 'funny', label: 'Lucu', emoji: '😂' },
]

interface Memory {
  id: string
  title: string
  description: string | null
  memory_date: string
  mood: string | null
  photo_url: string | null
  created_at: string
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', memory_date: new Date().toISOString().split('T')[0], mood: 'happy', photo_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Memory | null>(null)

  useEffect(() => { loadMemories() }, [])

  async function loadMemories() {
    const { data } = await supabase.from('memories').select('*').order('memory_date', { ascending: false })
    setMemories(data || [])
    setLoading(false)
  }

  async function uploadPhoto(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `memory_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('memory-photos').upload(fileName, file)
    if (!error) {
      const { data } = supabase.storage.from('memory-photos').getPublicUrl(fileName)
      setForm(p => ({ ...p, photo_url: data.publicUrl }))
    }
    setUploading(false)
  }

  async function saveMemory() {
    if (!form.title) return
    setSaving(true)
    await supabase.from('memories').insert([{
      title: form.title,
      description: form.description || null,
      memory_date: form.memory_date,
      mood: form.mood,
      photo_url: form.photo_url || null
    }])
    setForm({ title: '', description: '', memory_date: new Date().toISOString().split('T')[0], mood: 'happy', photo_url: '' })
    setShowModal(false)
    setSaving(false)
    await loadMemories()
  }

  async function deleteMemory(id: string) {
    if (!confirm('Hapus kenangan ini?')) return
    await supabase.from('memories').delete().eq('id', id)
    await loadMemories()
    if (selected?.id === id) setSelected(null)
  }

  const getMoodInfo = (mood: string | null) => moods.find(m => m.value === mood) || moods[0]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-rose-800">Kenangan Indah 💝</h1>
          <p className="text-rose-500 font-body text-sm mt-1">{memories.length} momen spesial tersimpan</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-rose flex items-center gap-2">
          <Plus size={18} /> Tambah Kenangan
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-4xl heart-beat">💕</div>
      ) : memories.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl">
          <div className="text-5xl mb-4">💝</div>
          <h3 className="font-display text-xl text-rose-700 mb-2">Belum ada kenangan</h3>
          <p className="text-rose-400 font-body text-sm mb-4">Abadikan setiap momen spesial kalian!</p>
          <button onClick={() => setShowModal(true)} className="btn-rose">+ Tulis Kenangan Pertama</button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-10 bottom-0 w-0.5" style={{ background: 'linear-gradient(to bottom, #f43f5e, #fecdd3 80%, transparent)' }} />

          <div className="space-y-4">
            {memories.map(memory => {
              const moodInfo = getMoodInfo(memory.mood)
              return (
                <div key={memory.id} className="relative pl-14">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-4 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center z-10"
                    style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)', boxShadow: '0 0 0 3px rgba(244,63,94,0.2)' }}>
                  </div>

                  <div
                    className="card-hover glass rounded-2xl border border-rose-100 overflow-hidden cursor-pointer"
                    onClick={() => setSelected(memory)}
                  >
                    <div className="flex">
                      {memory.photo_url && (
                        <div className="w-24 md:w-32 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={memory.photo_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="mood-badge" style={{ background: '#ffe8ef', color: '#f43f5e' }}>
                                {moodInfo.emoji} {moodInfo.label}
                              </span>
                            </div>
                            <h3 className="font-display font-bold text-rose-800 text-base">{memory.title}</h3>
                            <p className="text-rose-400 text-xs font-body mt-0.5">
                              📅 {format(parseISO(memory.memory_date), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                            </p>
                            {memory.description && (
                              <p className="text-rose-600 text-sm font-body mt-2 line-clamp-2">{memory.description}</p>
                            )}
                          </div>
                          <button onClick={e => { e.stopPropagation(); deleteMemory(memory.id) }}
                            className="ml-2 p-1.5 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors flex-shrink-0">
                            <X size={14} className="text-rose-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {selected.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.photo_url} alt="" className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <span className="mood-badge" style={{ background: '#ffe8ef', color: '#f43f5e' }}>
                  {getMoodInfo(selected.mood).emoji} {getMoodInfo(selected.mood).label}
                </span>
                <button onClick={() => setSelected(null)} className="text-rose-400 hover:text-rose-600">
                  <X size={20} />
                </button>
              </div>
              <h2 className="font-display text-xl font-bold text-rose-800 mb-1">{selected.title}</h2>
              <p className="text-rose-400 text-sm font-body mb-4">
                📅 {format(parseISO(selected.memory_date), 'EEEE, d MMMM yyyy', { locale: idLocale })}
              </p>
              {selected.description && (
                <p className="text-rose-700 font-body leading-relaxed paper-texture p-4 rounded-xl">
                  {selected.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-rose-800">Tulis Kenangan 💝</h2>
              <button onClick={() => setShowModal(false)} className="text-rose-400 hover:text-rose-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Judul *</label>
                <input className="love-input" placeholder="Judul kenangan..." value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Tanggal</label>
                <input type="date" className="love-input" value={form.memory_date}
                  onChange={e => setForm(p => ({ ...p, memory_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Suasana</label>
                <div className="grid grid-cols-3 gap-2">
                  {moods.map(m => (
                    <button key={m.value} onClick={() => setForm(p => ({ ...p, mood: m.value }))}
                      className={`py-2 px-3 rounded-xl text-sm font-body font-semibold flex items-center justify-center gap-1 transition-all ${
                        form.mood === m.value ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Cerita</label>
                <textarea className="love-input resize-none paper-texture" rows={4}
                  placeholder="Ceritakan kenangan indah ini..." value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-rose-700 mb-2 font-body">Foto</label>
                {form.photo_url ? (
                  <div className="relative rounded-xl overflow-hidden h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setForm(p => ({ ...p, photo_url: '' }))}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-rose-200 rounded-xl p-4 flex flex-col items-center cursor-pointer hover:bg-rose-50 transition-colors">
                    <Upload size={24} className="text-rose-300 mb-1" />
                    <span className="text-sm text-rose-400 font-body">{uploading ? 'Mengupload...' : 'Upload foto (opsional)'}</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                  </label>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-rose-200 text-rose-500 font-semibold hover:bg-rose-50 transition-colors font-body">
                  Batal
                </button>
                <button onClick={saveMemory} disabled={saving || !form.title || uploading} className="flex-1 btn-rose flex items-center justify-center gap-2">
                  {saving ? '💕' : <><BookHeart size={16} /> Simpan</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
