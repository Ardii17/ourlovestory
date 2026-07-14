'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ChevronLeft, ChevronRight, X, Calendar, Eye, Heart, Camera, User, Sparkles, ExternalLink, Plus, Upload } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Link from 'next/link'

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

interface GalleryItem {
  id: string
  url: string
  title: string
  caption: string | null
  date: string | null
  type: 'profile' | 'memory' | 'documentation'
  sourceName: string
  mood?: string | null
  category?: string | null
}

const categoryEmoji: Record<string, string> = {
  cafe: '☕', restaurant: '🍽️', hotel: '🏨', pantai: '🏖️', gunung: '⛰️',
  taman: '🌿', museum: '🏛️', mall: '🛍️', wisata: '🎡', lainnya: '📌'
}

const moodEmoji: Record<string, string> = {
  happy: '😊', romantic: '💕', nostalgic: '🥺', exciting: '🎉', peaceful: '🌸', funny: '😂'
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'profile' | 'memory' | 'documentation'>('all')
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'photo' | 'video'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<'documentation' | 'memory'>('documentation')
  const [places, setPlaces] = useState<any[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [captionText, setCaptionText] = useState('')
  const [titleText, setTitleText] = useState('')
  const [descriptionText, setDescriptionText] = useState('')
  const [memoryDate, setMemoryDate] = useState('')
  const [moodVal, setMoodVal] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const modalFileRef = useRef<HTMLInputElement>(null)

  async function handleMediaUpload(file: File) {
    if (!file) return
    setUploading(true)
    setUploadError('')

    let fileToUpload: File | Blob = file
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (isImage) {
      try {
        fileToUpload = await compressImage(file)
      } catch (err) {
        console.error('Gagal mengompresi gambar:', err)
      }
      if (fileToUpload.size > 5 * 1024 * 1024) {
        setUploadError('Ukuran gambar maksimal 5 MB setelah dikompresi!')
        setUploading(false)
        return
      }
    } else if (isVideo) {
      if (file.size > 30 * 1024 * 1024) {
        setUploadError('Ukuran video maksimal 30 MB ya!')
        setUploading(false)
        return
      }
    } else {
      setUploadError('Format file tidak didukung!')
      setUploading(false)
      return
    }

    const fileExt = fileToUpload instanceof File 
      ? fileToUpload.name.split('.').pop() 
      : file.name.split('.').pop()

    const bucketName = uploadTarget === 'documentation' ? 'place-photos' : 'memory-photos'
    const prefix = uploadTarget === 'documentation' ? `place_${selectedPlaceId}` : `memory`
    const fileName = `${prefix}_${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileToUpload)

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
      setUploadError('Gagal mengunggah file ke storage.')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    if (uploadTarget === 'documentation') {
      if (!selectedPlaceId) {
        setUploadError('Pilih tempat kenangan terlebih dahulu!')
        setUploading(false)
        return
      }
      const { error: insertErr } = await supabase.from('place_photos').insert([{
        place_id: selectedPlaceId,
        photo_url: publicUrl,
        caption: captionText || null
      }])
      if (insertErr) {
        console.error('DB insert error:', insertErr)
        setUploadError('Gagal menyimpan dokumentasi ke database.')
        setUploading(false)
        return
      }
    } else {
      if (!titleText.trim()) {
        setUploadError('Judul kenangan wajib diisi!')
        setUploading(false)
        return
      }
      const { error: insertErr } = await supabase.from('memories').insert([{
        title: titleText,
        description: descriptionText || null,
        memory_date: memoryDate || new Date().toISOString().split('T')[0],
        mood: moodVal || null,
        photo_url: publicUrl
      }])
      if (insertErr) {
        console.error('DB insert error:', insertErr)
        setUploadError('Gagal menyimpan kenangan ke database.')
        setUploading(false)
        return
      }
    }

    // Success!
    setUploading(false)
    setShowUploadModal(false)
    // Clear state
    setCaptionText('')
    setTitleText('')
    setDescriptionText('')
    setMemoryDate('')
    setMoodVal('')
    // Reload gallery
    await loadGalleryData()
  }

  useEffect(() => {
    loadGalleryData()
  }, [])

  async function loadGalleryData() {
    setLoading(true)
    try {
      const [profileRes, memoriesRes, photosRes, placesRes] = await Promise.all([
        supabase.from('couple_profile').select('*').maybeSingle(),
        supabase.from('memories').select('*').is('photo_url', 'not.null').order('memory_date', { ascending: false }),
        supabase.from('place_photos').select('*, places(name, visited_date, category)').order('created_at', { ascending: false }),
        supabase.from('places').select('id, name, category, visited_date').eq('status', 'visited').order('visited_date', { ascending: false })
      ])

      setPlaces(placesRes.data || [])
      if (placesRes.data && placesRes.data.length > 0) {
        setSelectedPlaceId(placesRes.data[0].id)
      }

      const galleryItems: GalleryItem[] = []

      // 1. Profile photos
      if (profileRes.data) {
        const prof = profileRes.data
        if (prof.person1_photo) {
          galleryItems.push({
            id: 'profile-person1',
            url: prof.person1_photo,
            title: `Foto ${prof.person1_name || 'Kamu'}`,
            caption: 'Foto profil utama dari halaman biodata.',
            date: prof.anniversary_date || null,
            type: 'profile',
            sourceName: 'Biodata Kami'
          })
        }
        if (prof.person2_photo) {
          galleryItems.push({
            id: 'profile-person2',
            url: prof.person2_photo,
            title: `Foto ${prof.person2_name || 'Dia'}`,
            caption: 'Foto profil pasangan dari halaman biodata.',
            date: prof.anniversary_date || null,
            type: 'profile',
            sourceName: 'Biodata Kami'
          })
        }
      }

      // 2. Memories photos
      if (memoriesRes.data) {
        memoriesRes.data.forEach((mem) => {
          if (mem.photo_url) {
            galleryItems.push({
              id: `memory-${mem.id}`,
              url: mem.photo_url,
              title: mem.title,
              caption: mem.description,
              date: mem.memory_date,
              type: 'memory',
              sourceName: `Kenangan Indah`,
              mood: mem.mood
            })
          }
        })
      }

      // 3. Place photos (Documentation)
      if (photosRes.data) {
        photosRes.data.forEach((photo) => {
          const placeInfo = photo.places
          let placeName = 'Tempat Kenangan'
          let visitedDate = null
          let category = null

          if (placeInfo) {
            if (Array.isArray(placeInfo)) {
              if (placeInfo.length > 0) {
                placeName = placeInfo[0].name
                visitedDate = placeInfo[0].visited_date
                category = placeInfo[0].category
              }
            } else {
              placeName = (placeInfo as any).name || 'Tempat Kenangan'
              visitedDate = (placeInfo as any).visited_date || null
              category = (placeInfo as any).category || null
            }
          }

          galleryItems.push({
            id: `photo-${photo.id}`,
            url: photo.photo_url,
            title: placeName,
            caption: photo.caption,
            date: visitedDate || photo.created_at,
            type: 'documentation',
            sourceName: `Dokumentasi Tempat`,
            category: category
          })
        })
      }

      setItems(galleryItems)
    } catch (err) {
      console.error('Gagal mengambil data galeri:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter & Search & Sort
  const filteredItems = items
    .filter((item) => {
      const matchesType = filterType === 'all' || item.type === filterType
      const isVid = isVideoUrl(item.url)
      const matchesMediaType =
        mediaTypeFilter === 'all' ||
        (mediaTypeFilter === 'video' && isVid) ||
        (mediaTypeFilter === 'photo' && !isVid)

      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.sourceName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesMediaType && matchesSearch
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

  // Keyboard navigation for lightbox
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (lightboxIndex === null) return
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  function handleNext() {
    if (lightboxIndex === null) return
    setLightboxIndex((prev) => (prev! + 1) % filteredItems.length)
  }

  function handlePrev() {
    if (lightboxIndex === null) return
    setLightboxIndex((prev) => (prev! - 1 + filteredItems.length) % filteredItems.length)
  }

  const currentLightboxItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null

  function getRedirectLink(item: GalleryItem) {
    if (item.type === 'profile') return '/dashboard/biodata'
    if (item.type === 'memory') return '/dashboard/memories'
    return '/dashboard/dokumentasi'
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold font-display text-rose-800">
            Galeri Media 🖼️
          </h1>
          <p className="mt-1 text-sm text-rose-500 font-body">
            Lihat semua lembaran foto dan video perjalanan cinta kita dalam satu halaman indah
          </p>
        </div>

        {/* Actions + Info stats */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-full bg-rose-500 hover:bg-rose-600 transition-colors shadow-md shadow-rose-200 cursor-pointer"
          >
            <Plus size={14} /> Unggah Media 📤
          </button>
          
          <div className="flex items-center gap-4 px-4 py-2 text-xs font-semibold border rounded-full glass border-rose-100 text-rose-700">
            <div>📸 {items.filter(i => i.type === 'documentation').length} Dokumentasi</div>
            <div className="w-[1px] h-4 bg-rose-200" />
            <div>💝 {items.filter(i => i.type === 'memory').length} Kenangan</div>
            <div className="w-[1px] h-4 bg-rose-200" />
            <div>💑 {items.filter(i => i.type === 'profile').length} Profil</div>
          </div>
        </div>
      </div>

      {/* Control Panel (Filter, Search, Sort) */}
      <div className="flex flex-col gap-4 p-4 mb-8 border glass rounded-3xl border-rose-100">
        <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute -translate-y-1/2 left-4 top-1/2 text-rose-400" />
            <input
              type="text"
              placeholder="Cari foto berdasarkan nama tempat, caption, atau jenis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="love-input !pl-11 py-2.5 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute -translate-y-1/2 right-3 top-1/2 text-rose-400 hover:text-rose-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort selection */}
          <div className="flex items-center flex-shrink-0 gap-2">
            <span className="text-xs font-bold text-rose-700 font-body whitespace-nowrap">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="w-auto px-3 py-2 text-xs cursor-pointer love-input"
            >
              <option value="newest">📅 Terbaru</option>
              <option value="oldest">📅 Terlama</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'Semua Kategori', icon: Sparkles, color: 'text-rose-500' },
            { id: 'profile', label: 'Profil Pasangan', icon: User, color: 'text-blue-500' },
            { id: 'memory', label: 'Kenangan Indah', icon: Heart, color: 'text-rose-600' },
            { id: 'documentation', label: 'Dokumentasi Tempat', icon: Camera, color: 'text-amber-500' }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = filterType === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-white/80 hover:bg-rose-50 text-rose-700 border border-rose-100'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : tab.color} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Separator line */}
        <div className="h-[1px] bg-rose-100/50 w-full" />

        {/* Media Type Filter Tabs (Foto vs Video) */}
        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'Semua Media 🌸', color: 'text-rose-500' },
            { id: 'photo', label: '📸 Foto', color: 'text-rose-600' },
            { id: 'video', label: '🎥 Video', color: 'text-amber-500' }
          ].map((tab) => {
            const isActive = mediaTypeFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setMediaTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-rose-450 text-white shadow-sm'
                    : 'bg-white/40 hover:bg-rose-50 text-rose-600 border border-rose-100/60'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="text-4xl heart-beat">💕</div>
          <p className="mt-2 text-sm font-semibold text-rose-500 font-display">Merajut momen media kita...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty state */
        <div className="py-20 text-center border glass rounded-3xl border-rose-100">
          <div className="mb-4 text-5xl">🖼️</div>
          <h3 className="mb-2 text-xl font-bold font-display text-rose-800">Media tidak ditemukan</h3>
          <p className="max-w-md mx-auto text-sm text-rose-400 font-body">
            {searchQuery
              ? `Tidak ada foto atau video dengan kata kunci "${searchQuery}" pada kategori ini.`
              : 'Belum ada media yang diunggah dalam kategori ini.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setFilterType('all'); setMediaTypeFilter('all') }}
              className="px-6 py-2 mt-4 text-xs btn-rose"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        /* Photo Grid */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              className="relative overflow-hidden border shadow-sm cursor-pointer group rounded-2xl aspect-square bg-rose-50 border-rose-100 card-hover"
            >
              {/* Media */}
              {isVideoUrl(item.url) ? (
                <video
                  src={item.url}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.url}
                  alt={item.title}
                  loading="lazy"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 text-white transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:opacity-100">
                <div className="absolute p-2 rounded-full top-3 right-3 bg-white/20 backdrop-blur-md">
                  <Eye size={14} className="text-white" />
                </div>

                {/* Badge Type */}
                <div className="mb-2.5">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    item.type === 'profile'
                      ? 'bg-blue-500/80 text-white'
                      : item.type === 'memory'
                      ? 'bg-rose-500/80 text-white'
                      : 'bg-amber-500/80 text-white'
                  }`}>
                    {item.type === 'profile' ? '💑 Profil' : item.type === 'memory' ? '💝 Kenangan' : '📸 Dokumentasi'}
                  </span>
                </div>

                {/* Details */}
                <h4 className="mb-1 text-xs font-bold truncate font-display">
                  {item.type === 'documentation' && item.category && categoryEmoji[item.category] ? `${categoryEmoji[item.category]} ` : ''}
                  {item.type === 'memory' && item.mood && moodEmoji[item.mood] ? `${moodEmoji[item.mood]} ` : ''}
                  {item.title}
                </h4>

                {item.date && (
                  <p className="text-[10px] text-gray-300 font-body flex items-center gap-1">
                    <Calendar size={10} />
                    {format(parseISO(item.date), 'd MMM yyyy', { locale: idLocale })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && currentLightboxItem && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 flex flex-col justify-between p-4 transition-all duration-300 bg-black/95 backdrop-blur-md"
        >
          {/* Top Bar */}
          <div className="z-10 flex items-center justify-between w-full p-2">
            <span className="text-xs font-semibold tracking-wide text-gray-400 font-body">
              {lightboxIndex + 1} dari {filteredItems.length} media
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 text-white transition-colors rounded-full cursor-pointer bg-white/10 hover:bg-white/20"
            >
              <X size={20} />
            </button>
          </div>

          {/* Center Area: Prev Image Next */}
          <div className="relative flex items-center justify-between flex-1 w-full max-w-5xl gap-4 mx-auto">
            {/* Prev button */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev() }}
              className="flex-shrink-0 p-3 text-white transition-colors rounded-full cursor-pointer bg-white/5 hover:bg-white/10"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Image Container */}
            <div
              className="flex-1 max-h-[70vh] flex items-center justify-center relative p-2"
              onClick={(e) => e.stopPropagation()}
            >
              {isVideoUrl(currentLightboxItem.url) ? (
                <video
                  src={currentLightboxItem.url}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl animate-fade-in"
                  controls
                  autoPlay
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={currentLightboxItem.url}
                  alt={currentLightboxItem.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl animate-fade-in"
                />
              )}
            </div>

            {/* Next button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              className="flex-shrink-0 p-3 text-white transition-colors rounded-full cursor-pointer bg-white/5 hover:bg-white/10"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Bottom Bar: Detail Info */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-start justify-between w-full max-w-3xl gap-4 p-5 mx-auto mb-4 text-white border bg-white/10 backdrop-blur-lg border-white/10 rounded-2xl md:flex-row md:items-center"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  currentLightboxItem.type === 'profile'
                    ? 'bg-blue-500 text-white'
                    : currentLightboxItem.type === 'memory'
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {currentLightboxItem.type === 'profile' ? '💑 Profil Pasangan' : currentLightboxItem.type === 'memory' ? '💝 Kenangan Indah' : '📸 Dokumentasi Tempat'}
                </span>
                {currentLightboxItem.date && (
                  <span className="text-[10px] text-gray-300 font-body flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                    <Calendar size={10} />
                    {format(parseISO(currentLightboxItem.date), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold font-display md:text-xl">
                {currentLightboxItem.type === 'documentation' && currentLightboxItem.category && categoryEmoji[currentLightboxItem.category] ? `${categoryEmoji[currentLightboxItem.category]} ` : ''}
                {currentLightboxItem.type === 'memory' && currentLightboxItem.mood && moodEmoji[currentLightboxItem.mood] ? `${moodEmoji[currentLightboxItem.mood]} ` : ''}
                {currentLightboxItem.title}
              </h3>

              {currentLightboxItem.caption && (
                <p className="max-w-2xl text-sm italic leading-relaxed text-gray-300 font-body">
                  "{currentLightboxItem.caption}"
                </p>
              )}
            </div>

            {/* Direct action link to origin page */}
            <Link
              href={getRedirectLink(currentLightboxItem)}
              onClick={() => setLightboxIndex(null)}
              className="flex items-center gap-2 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white py-2.5 px-4 rounded-xl transition-all whitespace-nowrap font-body border border-white/10"
            >
              Kelola Momen <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* Upload Media Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ zIndex: 100 }}>
          <div className="w-full max-w-lg p-6 bg-white border border-rose-100 shadow-2xl rounded-3xl animate-fade-in text-gray-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold font-display text-rose-800 flex items-center gap-2">
                <Upload size={18} /> Unggah Momen Baru 🌸
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadError('')
                }}
                className="p-1 text-gray-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 mb-4 text-xs font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                <span>⚠️</span> {uploadError}
              </div>
            )}

            {/* Route selector: Documentation vs Memory */}
            <div className="flex gap-2 p-1 mb-5 bg-rose-50/50 rounded-2xl border border-rose-100/40">
              <button
                type="button"
                onClick={() => setUploadTarget('documentation')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  uploadTarget === 'documentation'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-rose-600 hover:bg-rose-50/70'
                }`}
              >
                📸 Dokumentasi Tempat
              </button>
              <button
                type="button"
                onClick={() => setUploadTarget('memory')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  uploadTarget === 'memory'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-rose-600 hover:bg-rose-50/70'
                }`}
              >
                💝 Kenangan Indah
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
              {uploadTarget === 'documentation' ? (
                <>
                  {/* Select Visited Place */}
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-rose-800 font-body">Tempat yang Dikunjungi *</label>
                    {places.length === 0 ? (
                      <div className="p-3 text-xs text-rose-500 bg-rose-50/50 rounded-xl border border-rose-100/50">
                        Belum ada tempat yang ditandai "Sudah Dikunjungi". Silakan kunjungi halaman Tempat Kenangan untuk menambahkannya!
                      </div>
                    ) : (
                      <select
                        value={selectedPlaceId}
                        onChange={(e) => setSelectedPlaceId(e.target.value)}
                        className="w-full text-xs love-input cursor-pointer py-2 px-3 border border-rose-100 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300"
                      >
                        {places.map((p) => (
                          <option key={p.id} value={p.id}>
                            {categoryEmoji[p.category || '']} {p.name} ({p.visited_date ? format(parseISO(p.visited_date), 'd MMM yyyy', { locale: idLocale }) : 'Tanggal -'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {/* Caption */}
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-rose-800 font-body">Caption</label>
                    <input
                      type="text"
                      placeholder="Tulis cerita singkat dari foto/video ini..."
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      className="w-full text-xs love-input py-2 px-3 border border-rose-100 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Memory Title */}
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-rose-800 font-body">Judul Kenangan *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kencan Pertama, Ultah Pasangan..."
                      value={titleText}
                      onChange={(e) => setTitleText(e.target.value)}
                      className="w-full text-xs love-input py-2 px-3 border border-rose-100 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300"
                      required
                    />
                  </div>
                  {/* Memory Description */}
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-rose-800 font-body">Cerita/Deskripsi</label>
                    <textarea
                      placeholder="Tulis kenangan manis kita di sini..."
                      value={descriptionText}
                      onChange={(e) => setDescriptionText(e.target.value)}
                      className="w-full text-xs love-input py-2 px-3 border border-rose-100 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 min-h-[70px] resize-none"
                    />
                  </div>
                  {/* Memory Date & Mood */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5 text-xs font-bold text-rose-800 font-body">Tanggal Kenangan *</label>
                      <input
                        type="date"
                        value={memoryDate}
                        onChange={(e) => setMemoryDate(e.target.value)}
                        className="w-full text-xs love-input py-2 px-3 border border-rose-100 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-bold text-rose-800 font-body">Mood</label>
                      <select
                        value={moodVal}
                        onChange={(e) => setMoodVal(e.target.value)}
                        className="w-full text-xs love-input py-2 px-3 border border-rose-100 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 cursor-pointer"
                      >
                        <option value="">Pilih Mood...</option>
                        <option value="happy">😊 Bahagia</option>
                        <option value="romantic">💕 Romantis</option>
                        <option value="nostalgic">🥺 Nostalgia</option>
                        <option value="exciting">🎉 Seru</option>
                        <option value="peaceful">🌸 Tenang</option>
                        <option value="funny">😂 Lucu</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Upload Input Box */}
              <div>
                <label className="block mb-1.5 text-xs font-bold text-rose-800 font-body">Pilih Media (Foto/Video) *</label>
                <div
                  onClick={() => modalFileRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer bg-rose-50/20 hover:bg-rose-50/50 border-rose-200 transition-colors"
                >
                  <Upload size={24} className="mb-2 text-rose-450 animate-bounce" />
                  <p className="text-xs font-bold text-rose-700">Klik untuk mencari file</p>
                  <p className="mt-1 text-[10px] text-rose-400 text-center font-body leading-normal">
                    Format Foto: JPG, PNG (Kompresi Otomatis, max 5MB)<br />
                    Format Video: MP4, MOV, WEBM (max 30MB)
                  </p>
                </div>
                <input
                  ref={modalFileRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      await handleMediaUpload(file)
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Loading Indicator */}
            {uploading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-bold text-rose-600 font-display">
                <span className="heart-beat">💕</span> Mengunggah & mengompresi media...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
