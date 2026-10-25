'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Camera, Upload, X, Plus, ChevronLeft, ChevronRight, Search, Download, CheckSquare, Square, Check, Loader2 } from 'lucide-react'
import { downloadSingleFile, downloadMultipleAsZip, DownloadItem } from '@/lib/download'

function isVideoUrl(url: string | null): boolean {
  if (!url) return false
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ['mp4', 'mov', 'webm', 'avi', 'mkv', '3gp', 'm4v'].includes(ext)
}

async function compressImage(file: File): Promise<File | Blob> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1080
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() }))
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            0.8
          )
        } else {
          resolve(file)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

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

  // Selection & Batch Download States
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null)

  useEffect(() => { loadPlaces() }, [])
  useEffect(() => {
    setSelectedPhotoIds([])
    setIsSelectMode(false)
    if (selectedPlace) loadPhotos(selectedPlace)
  }, [selectedPlace])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (lightbox === null) return
      if (e.key === 'ArrowRight' && lightbox < photos.length - 1) {
        setLightbox(lightbox + 1)
      }
      if (e.key === 'ArrowLeft' && lightbox > 0) {
        setLightbox(lightbox - 1)
      }
      if (e.key === 'Escape') {
        setLightbox(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightbox, photos.length])

  async function loadPlaces() {
    const { data } = await supabase.from('places').select('id, name, category, visited_date').eq('status', 'visited').order('visited_date', { ascending: false })
    setPlaces(data || [])
    if (data && data.length > 0) {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const paramPlaceName = params.get('place')
        if (paramPlaceName) {
          const found = data.find(p => p.name.toLowerCase() === paramPlaceName.toLowerCase())
          if (found) {
            setSelectedPlace(found.id)
            return
          }
        }
      }
      setSelectedPlace(data[0].id)
    }
  }

  async function loadPhotos(placeId: string) {
    const { data } = await supabase.from('place_photos').select('*').eq('place_id', placeId).order('created_at', { ascending: false })
    setPhotos(data || [])
  }

  async function uploadPhoto(originalFile: File) {
    if (!selectedPlace) return
    setUploading(true)
    setUploadError('')

    let fileToUpload: File | Blob = originalFile

    const isVideo = originalFile.type.startsWith('video/')
    const isImage = originalFile.type.startsWith('image/')

    if (isImage) {
      try {
        fileToUpload = await compressImage(originalFile)
      } catch (err) {
        console.error('Gagal mengompresi gambar:', err)
      }

      if (fileToUpload.size > 5 * 1024 * 1024) {
        setUploadError('Ukuran gambar maksimal 5 MB setelah dikompresi!')
        setUploading(false)
        setTimeout(() => setUploadError(''), 4000)
        return
      }
    } else if (isVideo) {
      if (originalFile.size > 30 * 1024 * 1024) {
        setUploadError('Ukuran video maksimal 30 MB ya!')
        setUploading(false)
        setTimeout(() => setUploadError(''), 4000)
        return
      }
    } else {
      setUploadError('Format file tidak didukung!')
      setUploading(false)
      setTimeout(() => setUploadError(''), 4000)
      return
    }

    const fileExt = fileToUpload instanceof File 
      ? fileToUpload.name.split('.').pop() 
      : originalFile.name.split('.').pop()
      
    const fileName = `place_${selectedPlace}_${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('place-photos')
      .upload(fileName, fileToUpload)

    if (error) {
      console.error('Gagal upload ke storage:', error)
      setUploadError('Gagal mengunggah file. Silakan coba lagi.')
      setUploading(false)
      setTimeout(() => setUploadError(''), 4000)
      return
    }

    const { data: urlData } = supabase.storage
      .from('place-photos')
      .getPublicUrl(fileName)

    await supabase.from('place_photos').insert([{
      place_id: selectedPlace,
      photo_url: urlData.publicUrl,
      caption: caption || null
    }])
    
    setCaption('')
    await loadPhotos(selectedPlace)
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
  const currentPlaceName = currentPlace?.name || 'dokumentasi'

  function getPhotoFilename(photo: Photo, index: number) {
    const ext = isVideoUrl(photo.photo_url) ? 'mp4' : 'jpg'
    const safePlace = currentPlaceName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    return `${safePlace}_${index + 1}.${ext}`
  }

  async function handleDownloadSingle(photo: Photo, index: number) {
    const filename = getPhotoFilename(photo, index)
    await downloadSingleFile(photo.photo_url, filename)
  }

  function toggleSelectPhoto(id: string) {
    setSelectedPhotoIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSelectAll() {
    if (selectedPhotoIds.length === photos.length) {
      setSelectedPhotoIds([])
    } else {
      setSelectedPhotoIds(photos.map(p => p.id))
    }
  }

  async function handleDownloadSelected() {
    if (selectedPhotoIds.length === 0 || downloading) return
    setDownloading(true)
    const itemsToDownload: DownloadItem[] = selectedPhotoIds.map(id => {
      const idx = photos.findIndex(p => p.id === id)
      const p = photos[idx]
      return {
        url: p.photo_url,
        filename: getPhotoFilename(p, idx)
      }
    })

    const safeZipName = `${currentPlaceName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_dokumentasi.zip`
    try {
      await downloadMultipleAsZip(itemsToDownload, safeZipName, (prog) => {
        setDownloadProgress({ current: prog.current, total: prog.total })
      })
    } catch (err) {
      console.error('Download error:', err)
      alert('Gagal mendownload foto terpilih.')
    } finally {
      setDownloading(false)
      setDownloadProgress(null)
    }
  }

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

      {/* ── CONTROLS ROW (Search, Select Place, and Upload on the same row) ── */}
      <div className="p-4 mb-6 border glass rounded-2xl border-rose-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        {/* 1. Form Cari (Search) */}
        <div className="relative w-full lg:w-48 flex-shrink-0">
          <Search
            size={14}
            className="absolute -translate-y-1/2 left-3 top-1/2 text-rose-400"
          />
          <input
            className="py-2.5 !pl-9 text-sm love-input w-full"
            placeholder="Cari tempat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 2. Pilih Tempat (Select Dropdown) */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <select
            value={selectedPlace || ''}
            onChange={(e) => setSelectedPlace(e.target.value || null)}
            className="w-full py-2.5 px-3 text-sm love-input bg-white cursor-pointer"
            style={{
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2300A896\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px',
              paddingRight: '36px',
            }}
          >
            {filteredPlaces.length === 0 ? (
              <option value="">Tidak ada tempat</option>
            ) : (
              filteredPlaces.map((place) => (
                <option key={place.id} value={place.id}>
                  {categoryEmoji[place.category] || '📌'} {place.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 3. Upload Form (Visible if a place is selected) */}
        {selectedPlace && (
          <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
            <div className="flex-1 relative">
              <input
                className="w-full text-sm love-input"
                placeholder="Tulis caption foto (opsional)..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              {uploadError && (
                <p className="absolute left-1 top-full text-[10px] text-red-500 mt-0.5 whitespace-nowrap">
                  ⚠️ {uploadError}
                </p>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 text-sm btn-rose whitespace-nowrap py-2.5 px-6"
            >
              {uploading ? (
                <span className="heart-beat">🌿</span>
              ) : (
                <>
                  <Upload size={16} /> Upload Foto
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                for (const file of files) await uploadPhoto(file);
              }}
            />
          </div>
        )}
      </div>

      {/* ── PHOTO GALLERY (Full Width Below) ── */}
      <div className="w-full">
        {!selectedPlace ? (
          <div className="py-16 text-center glass rounded-3xl">
            <div className="mb-4 text-5xl">📸</div>
            <p className="text-xl text-rose-600 font-display">
              Pilih tempat untuk melihat foto
            </p>
          </div>
        ) : (
          <>
            {photos.length === 0 ? (
              <div
                className="py-16 text-center transition-colors border border-dashed cursor-pointer glass rounded-2xl border-rose-200 hover:bg-rose-50"
                onClick={() => fileRef.current?.click()}
              >
                <Camera size={40} className="mx-auto mb-3 text-rose-300" />
                <p className="font-semibold font-display text-rose-600">
                  Belum ada dokumentasi di sini
                </p>
                <p className="mt-1 text-sm text-rose-400 font-body">
                  Klik di sini untuk mengunggah foto atau video pertama kalian
                </p>
              </div>
            ) : (
              <>
                {/* ── Sub-header Toolbar for Selection & Actions ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
                  <div className="text-xs font-medium text-rose-600 font-body flex items-center gap-2">
                    <span>Total {photos.length} foto/video di {currentPlaceName}</span>
                    {selectedPhotoIds.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#2d8c6e]/15 text-[#2d8c6e] font-bold">
                        {selectedPhotoIds.length} dipilih
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsSelectMode(!isSelectMode)
                        if (isSelectMode) setSelectedPhotoIds([])
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                        isSelectMode
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 shadow-sm'
                      }`}
                    >
                      <CheckSquare size={14} />
                      <span>{isSelectMode ? 'Batal Pilih' : 'Pilih Banyak'}</span>
                    </button>

                    {isSelectMode && (
                      <>
                        <button
                          onClick={handleSelectAll}
                          className="px-3 py-1.5 text-xs font-bold bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-xl transition cursor-pointer shadow-sm"
                        >
                          {selectedPhotoIds.length === photos.length ? 'Batal Semua' : 'Pilih Semua'}
                        </button>

                        {selectedPhotoIds.length > 0 && (
                          <button
                            onClick={handleDownloadSelected}
                            disabled={downloading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#2d8c6e] hover:bg-[#236e57] rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                          >
                            {downloading ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Mengunduh {downloadProgress ? `${downloadProgress.current}/${downloadProgress.total}` : '...'}</span>
                              </>
                            ) : (
                              <>
                                <Download size={13} />
                                <span>Download ({selectedPhotoIds.length})</span>
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* ── Photo Grid ── */}
                <div className="photo-grid">
                  {photos.map((photo, idx) => {
                    const isSelected = selectedPhotoIds.includes(photo.id)
                    return (
                      <div
                        key={photo.id}
                        onClick={() => {
                          if (isSelectMode) {
                            toggleSelectPhoto(photo.id)
                          } else {
                            setLightbox(idx)
                          }
                        }}
                        className={`relative overflow-hidden group rounded-xl aspect-square bg-rose-50 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'ring-4 ring-[#2d8c6e] scale-[0.98] shadow-lg'
                            : 'hover:shadow-md'
                        }`}
                        style={{
                          boxShadow: isSelected ? 'none' : '0 4px 15px rgba(0, 168, 150, 0.08)',
                          border: isSelected ? 'none' : '1.5px solid rgba(0, 168, 150, 0.1)',
                        }}
                      >
                        {/* Checkbox badge (Always visible in select mode, or on hover) */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isSelectMode) setIsSelectMode(true)
                            toggleSelectPhoto(photo.id)
                          }}
                          className={`absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#2d8c6e] text-white shadow-md opacity-100 scale-105'
                              : isSelectMode
                                ? 'bg-black/40 text-white/70 border border-white/70 backdrop-blur-sm opacity-100'
                                : 'opacity-0 group-hover:opacity-100 bg-black/40 text-white/70 border border-white/60 backdrop-blur-sm'
                          }`}
                          title={isSelected ? 'Batal pilih' : 'Pilih foto ini'}
                        >
                          {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                        </div>

                        {/* Quick download button on top-right (hover) */}
                        {!isSelectMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadSingle(photo, idx)
                            }}
                            className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg bg-black/40 hover:bg-[#2d8c6e] text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition shadow-sm cursor-pointer"
                            title="Download foto ini"
                          >
                            <Download size={13} />
                          </button>
                        )}

                        {isVideoUrl(photo.photo_url) ? (
                          <video
                            src={photo.photo_url}
                            className="object-cover w-full h-full"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || ''}
                            className="object-cover w-full h-full"
                          />
                        )}

                        {/* Bottom overlay for caption & actions */}
                        <div
                          className={`absolute inset-0 flex flex-col justify-end p-2.5 transition-opacity ${
                            isSelectMode ? 'opacity-0 pointer-events-none' : 'opacity-0 bg-black/40 group-hover:opacity-100'
                          }`}
                        >
                          {photo.caption && (
                            <p className="mb-2 text-xs text-white font-body line-clamp-2">
                              {photo.caption}
                            </p>
                          )}
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadSingle(photo, idx)
                              }}
                              className="px-2.5 py-1.5 text-center text-xs text-white rounded bg-[#2d8c6e]/80 hover:bg-[#2d8c6e] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                              title="Download foto"
                            >
                              <Download size={12} />
                              <span className="hidden sm:inline">Unduh</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowCaption(photo.id)
                              }}
                              className="flex-1 py-1.5 text-center text-xs text-white rounded bg-white/20 hover:bg-white/35 font-semibold transition cursor-pointer"
                            >
                              ✏️ Edit Caption
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deletePhoto(photo.id)
                              }}
                              className="px-2 py-1.5 text-center text-xs text-white rounded bg-red-500/60 hover:bg-red-500/85 transition cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add more photo card */}
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

                {/* ── Sticky Bottom Action Bar when items are selected ── */}
                {selectedPhotoIds.length > 0 && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md shadow-2xl border border-rose-200 px-5 py-3 rounded-2xl flex items-center gap-3 sm:gap-4 text-rose-800 transition-all max-w-[90vw]">
                    <span className="text-xs font-bold font-display whitespace-nowrap">
                      ✨ {selectedPhotoIds.length} foto dipilih
                    </span>
                    <div className="h-4 w-[1px] bg-rose-200" />
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer whitespace-nowrap"
                    >
                      {selectedPhotoIds.length === photos.length ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                    <button
                      onClick={handleDownloadSelected}
                      disabled={downloading}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2d8c6e] hover:bg-[#236e57] rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      {downloading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Mengunduh {downloadProgress ? `${downloadProgress.current}/${downloadProgress.total}` : '...'}</span>
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          <span>Download Terpilih ({selectedPhotoIds.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 modal-backdrop"
          onClick={() => setLightbox(null)}
        >
          {/* Top buttons: Download & Close */}
          <div className="absolute z-10 flex items-center gap-3 top-4 right-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadSingle(photos[lightbox], lightbox)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#2d8c6e] hover:bg-[#236e57] rounded-full transition shadow-md cursor-pointer"
              title="Download media ini"
            >
              <Download size={15} />
              <span>Download</span>
            </button>
            <button
              className="p-1.5 text-white transition rounded-full hover:text-rose-300 bg-white/10 hover:bg-white/20 cursor-pointer"
              onClick={() => setLightbox(null)}
            >
              <X size={24} />
            </button>
          </div>
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
            {isVideoUrl(photos[lightbox].photo_url) ? (
              <video
                src={photos[lightbox].photo_url}
                className="max-h-[75vh] max-w-full rounded-xl object-contain mx-auto"
                controls
                autoPlay
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photos[lightbox].photo_url}
                alt=""
                className="max-h-[75vh] max-w-full rounded-xl object-contain mx-auto"
              />
            )}
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
