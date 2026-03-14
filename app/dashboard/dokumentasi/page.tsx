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
  const [uploadError, setUploadError] = useState('')
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
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran foto maksimal 5 MB ya!')
      setTimeout(() => setUploadError(''), 3000)
      return
    }
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
        <h1 className="text-2xl font-bold font-display text-rose-800">
          Dokumentasi 📸
        </h1>
        <p className="mt-1 text-sm text-rose-500 font-body">
          Foto-foto kenangan kalian di setiap tempat
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {/* Sidebar - Places List */}
        <div className="flex-shrink-0 md:w-64">
          <div className="overflow-hidden border glass rounded-2xl border-rose-100">
            <div className="p-3 border-b border-rose-100">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute -translate-y-1/2 left-3 top-1/2 text-rose-400"
                />
                <input
                  className="py-2 pl-8 text-sm love-input"
                  placeholder="Cari tempat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
              {filteredPlaces.length === 0 ? (
                <p className="py-6 text-sm text-center text-rose-400 font-body">
                  Tidak ada tempat
                </p>
              ) : (
                filteredPlaces.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => setSelectedPlace(place.id)}
                    className={`w-full text-left px-4 py-3 transition-colors border-b border-rose-50 ${
                      selectedPlace === place.id
                        ? "bg-rose-50 border-l-4 border-l-rose-400"
                        : "hover:bg-rose-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {categoryEmoji[place.category] || "📌"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-rose-800 font-body">
                          {place.name}
                        </p>
                        {place.visited_date && (
                          <p className="text-xs text-rose-400">
                            {new Date(place.visited_date).toLocaleDateString(
                              "id-ID",
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="flex-1">
          {!selectedPlace ? (
            <div className="py-16 text-center glass rounded-3xl">
              <div className="mb-4 text-5xl">📸</div>
              <p className="text-xl text-rose-600 font-display">
                Pilih tempat untuk melihat foto
              </p>
            </div>
          ) : (
            <>
              {/* Upload Section */}
              <div className="p-4 mb-4 border glass rounded-2xl border-rose-100">
                <h3 className="mb-3 font-bold font-display text-rose-800">
                  {categoryEmoji[currentPlace?.category || ""]}{" "}
                  {currentPlace?.name}
                </h3>
                <div className="flex gap-2">
                  <input
                    className="flex-1 text-sm love-input"
                    placeholder="Tulis caption foto (opsional)..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 text-sm btn-rose whitespace-nowrap"
                  >
                    {uploading ? (
                      <span className="heart-beat">💕</span>
                    ) : (
                      <>
                        <Upload size={16} /> Upload
                      </>
                    )}
                  </button>
                  {uploadError && (
                    <p
                      style={{
                        color: "#f43f5e",
                        fontSize: "0.8rem",
                        marginTop: "6px",
                      }}
                    >
                      ⚠️ {uploadError}
                    </p>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      for (const file of files) await uploadPhoto(file);
                    }}
                  />
                </div>
              </div>

              {/* Photos Grid */}
              {photos.length === 0 ? (
                <div
                  className="py-16 text-center transition-colors border border-dashed cursor-pointer glass rounded-2xl border-rose-200 hover:bg-rose-50"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera size={40} className="mx-auto mb-3 text-rose-300" />
                  <p className="font-semibold font-display text-rose-600">
                    Belum ada foto di sini
                  </p>
                  <p className="mt-1 text-sm text-rose-400 font-body">
                    Klik untuk upload foto pertama
                  </p>
                </div>
              ) : (
                <div className="photo-grid">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="relative overflow-hidden group rounded-xl aspect-square bg-rose-50"
                      style={{ boxShadow: "0 4px 15px rgba(244,63,94,0.1)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || ""}
                        className="object-cover w-full h-full cursor-pointer"
                        onClick={() => setLightbox(idx)}
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-2 transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                        {photo.caption && (
                          <p className="mb-1 text-xs text-white font-body line-clamp-2">
                            {photo.caption}
                          </p>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => setShowCaption(photo.id)}
                            className="flex-1 px-2 py-1 text-xs text-white rounded bg-white/20 hover:bg-white/40"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deletePhoto(photo.id)}
                            className="px-2 py-1 text-xs text-white rounded bg-red-500/60 hover:bg-red-500/80"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Add more */}
                  <div
                    className="flex flex-col items-center justify-center transition-colors border-2 border-dashed cursor-pointer aspect-square rounded-xl border-rose-200 hover:bg-rose-50"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Plus size={24} className="mb-1 text-rose-300" />
                    <span className="text-xs text-rose-400 font-body">
                      Tambah Foto
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 modal-backdrop"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute z-10 text-white top-4 right-4 hover:text-rose-300"
            onClick={() => setLightbox(null)}
          >
            <X size={32} />
          </button>
          {lightbox > 0 && (
            <button
              className="absolute z-10 text-white left-4 hover:text-rose-300"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(lightbox - 1);
              }}
            >
              <ChevronLeft size={40} />
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button
              className="absolute z-10 text-white right-4 hover:text-rose-300"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(lightbox + 1);
              }}
            >
              <ChevronRight size={40} />
            </button>
          )}
          <div
            className="max-w-3xl max-h-screen p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightbox].photo_url}
              alt=""
              className="max-h-[75vh] max-w-full rounded-xl object-contain mx-auto"
            />
            {photos[lightbox].caption && (
              <p className="mt-4 text-lg text-white font-script">
                "{photos[lightbox].caption}"
              </p>
            )}
            <p className="mt-2 text-sm text-gray-400 font-body">
              {lightbox + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}

      {/* Edit Caption Modal */}
      {showCaption && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="p-6 bg-white shadow-2xl rounded-2xl w-80">
            <h3 className="mb-4 font-bold font-display text-rose-800">
              Edit Caption 💬
            </h3>
            <CaptionEditor
              photoId={showCaption}
              currentCaption={
                photos.find((p) => p.id === showCaption)?.caption || ""
              }
              onSave={updateCaption}
              onCancel={() => setShowCaption(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
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
      <textarea className="mb-4 resize-none love-input" rows={3} value={value}
        onChange={e => setValue(e.target.value)} placeholder="Tulis caption..." />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 font-semibold transition-colors border-2 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 font-body">Batal</button>
        <button onClick={() => onSave(photoId, value)} className="flex-1 text-sm btn-rose">Simpan</button>
      </div>
    </>
  )
}
