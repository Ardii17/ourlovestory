'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Camera, Upload, X, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface Place {
  id: string
  name: string
  category: string
  visited_date: string | null
}

interface Photo {
  id: string
  place_id: string
  photo_url: string
  caption: string | null
  created_at: string
}

const categoryEmoji: Record<string, string> = {
  cafe: '☕', restaurant: '🍽️', hotel: '🏨', pantai: '🏖️', gunung: '⛰️',
  taman: '🌿', museum: '🏛️', mall: '🛍️', wisata: '🎡', lainnya: '📌'
}

export default function DokumentasiPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [showCaption, setShowCaption] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadPlaces() }, [])
  useEffect(() => { if (selectedPlace) loadPhotos(selectedPlace) }, [selectedPlace])

  async function loadPlaces() {
    const { data } = await supabase.from('places').select('id, name, category, visited_date').eq('status', 'visited').order('visited_date', { ascending: false })
    setPlaces(data || [])
    if (data && data.length > 0) setSelectedPlace(data[0].id)
  }

  async function loadPhotos(placeId: string) {
    const { data } = await supabase.from('place_photos').select('*').eq('place_id', placeId).order('created_at', { ascending: false })
    setPhotos(data || [])
  }

  async function uploadPhoto(file: File) {
    if (!selectedPlace) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `place_${selectedPlace}_${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('place-photos').upload(fileName, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('place-photos').getPublicUrl(fileName)
      await supabase.from('place_photos').insert([{
        place_id: selectedPlace,
        photo_url: urlData.publicUrl,
        caption: caption || null
      }])
      setCaption('')
      await loadPhotos(selectedPlace)
    }
    setUploading(false)
  }

  async function deletePhoto(id: string) {
    if (!confirm('Hapus foto ini?')) return
    await supabase.from('place_photos').delete().eq('id', id)
    if (selectedPlace) await loadPhotos(selectedPlace)
    if (lightbox !== null) setLightbox(null)
  }

  async function updateCaption(id: string, newCaption: string) {
    await supabase.from('place_photos').update({ caption: newCaption }).eq('id', id)
    if (selectedPlace) await loadPhotos(selectedPlace)
    setShowCaption(null)
  }

  const currentPlace = places.find(p => p.id === selectedPlace)
  const filteredPlaces = places.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-rose-800">Dokumentasi 📸</h1>
        <p className="text-rose-500 font-body text-sm mt-1">Foto-foto kenangan kalian di setiap tempat</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar - Places List */}
        <div className="md:w-64 flex-shrink-0">
          <div className="glass rounded-2xl border border-rose-100 overflow-hidden">
            <div className="p-3 border-b border-rose-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" />
                <input
                  className="love-input pl-8 text-sm py-2"
                  placeholder="Cari tempat..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {filteredPlaces.length === 0 ? (
                <p className="text-center text-rose-400 text-sm py-6 font-body">Tidak ada tempat</p>
              ) : filteredPlaces.map(place => (
                <button
                  key={place.id}
                  onClick={() => setSelectedPlace(place.id)}
                  className={`w-full text-left px-4 py-3 transition-colors border-b border-rose-50 ${
                    selectedPlace === place.id ? 'bg-rose-50 border-l-4 border-l-rose-400' : 'hover:bg-rose-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{categoryEmoji[place.category] || '📌'}</span>
                    <div className="min-w-0">
                      <p className="text-rose-800 text-sm font-semibold font-body truncate">{place.name}</p>
                      {place.visited_date && (
                        <p className="text-rose-400 text-xs">{new Date(place.visited_date).toLocaleDateString('id-ID')}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="flex-1">
          {!selectedPlace ? (
            <div className="text-center py-16 glass rounded-3xl">
              <div className="text-5xl mb-4">📸</div>
              <p className="text-rose-600 font-display text-xl">Pilih tempat untuk melihat foto</p>
            </div>
          ) : (
            <>
              {/* Upload Section */}
              <div className="glass rounded-2xl p-4 border border-rose-100 mb-4">
                <h3 className="font-display font-bold text-rose-800 mb-3">
                  {categoryEmoji[currentPlace?.category || '']} {currentPlace?.name}
                </h3>
                <div className="flex gap-2">
                  <input
                    className="love-input text-sm flex-1"
                    placeholder="Tulis caption foto (opsional)..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="btn-rose flex items-center gap-2 whitespace-nowrap text-sm"
                  >
                    {uploading ? <span className="heart-beat">💕</span> : <><Upload size={16} /> Upload</>}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={async e => {
                      const files = Array.from(e.target.files || [])
                      for (const file of files) await uploadPhoto(file)
                    }} />
                </div>
              </div>

              {/* Photos Grid */}
              {photos.length === 0 ? (
                <div className="text-center py-16 glass rounded-2xl border border-dashed border-rose-200 cursor-pointer hover:bg-rose-50 transition-colors"
                  onClick={() => fileRef.current?.click()}>
                  <Camera size={40} className="text-rose-300 mx-auto mb-3" />
                  <p className="font-display text-rose-600 font-semibold">Belum ada foto di sini</p>
                  <p className="text-rose-400 text-sm font-body mt-1">Klik untuk upload foto pertama</p>
                </div>
              ) : (
                <div className="photo-grid">
                  {photos.map((photo, idx) => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-rose-50"
                      style={{ boxShadow: '0 4px 15px rgba(244,63,94,0.1)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.photo_url} alt={photo.caption || ''} className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setLightbox(idx)} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        {photo.caption && (
                          <p className="text-white text-xs font-body line-clamp-2 mb-1">{photo.caption}</p>
                        )}
                        <div className="flex gap-1">
                          <button onClick={() => setShowCaption(photo.id)}
                            className="text-xs bg-white/20 hover:bg-white/40 text-white px-2 py-1 rounded flex-1">✏️ Edit</button>
                          <button onClick={() => deletePhoto(photo.id)}
                            className="text-xs bg-red-500/60 hover:bg-red-500/80 text-white px-2 py-1 rounded">🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Add more */}
                  <div className="aspect-square rounded-xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50 transition-colors"
                    onClick={() => fileRef.current?.click()}>
                    <Plus size={24} className="text-rose-300 mb-1" />
                    <span className="text-xs text-rose-400 font-body">Tambah Foto</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center modal-backdrop"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-rose-300 z-10" onClick={() => setLightbox(null)}>
            <X size={32} />
          </button>
          {lightbox > 0 && (
            <button className="absolute left-4 text-white hover:text-rose-300 z-10"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }}>
              <ChevronLeft size={40} />
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button className="absolute right-4 text-white hover:text-rose-300 z-10"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }}>
              <ChevronRight size={40} />
            </button>
          )}
          <div className="max-w-3xl max-h-screen p-8 text-center" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[lightbox].photo_url} alt="" className="max-h-[75vh] max-w-full rounded-xl object-contain mx-auto" />
            {photos[lightbox].caption && (
              <p className="text-white font-script text-lg mt-4">"{photos[lightbox].caption}"</p>
            )}
            <p className="text-gray-400 text-sm mt-2 font-body">{lightbox + 1} / {photos.length}</p>
          </div>
        </div>
      )}

      {/* Edit Caption Modal */}
      {showCaption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="font-display font-bold text-rose-800 mb-4">Edit Caption 💬</h3>
            <CaptionEditor
              photoId={showCaption}
              currentCaption={photos.find(p => p.id === showCaption)?.caption || ''}
              onSave={updateCaption}
              onCancel={() => setShowCaption(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function CaptionEditor({ photoId, currentCaption, onSave, onCancel }: {
  photoId: string
  currentCaption: string
  onSave: (id: string, caption: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(currentCaption)
  return (
    <>
      <textarea className="love-input resize-none mb-4" rows={3} value={value}
        onChange={e => setValue(e.target.value)} placeholder="Tulis caption..." />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-xl border-2 border-rose-200 text-rose-500 font-semibold hover:bg-rose-50 transition-colors font-body">Batal</button>
        <button onClick={() => onSave(photoId, value)} className="flex-1 btn-rose text-sm">Simpan</button>
      </div>
    </>
  )
}
