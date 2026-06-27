'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ChevronLeft, ChevronRight, X, Calendar, Eye, Heart, Camera, User, Sparkles, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Link from 'next/link'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    loadGalleryData()
  }, [])

  async function loadGalleryData() {
    setLoading(true)
    try {
      const [profileRes, memoriesRes, photosRes] = await Promise.all([
        supabase.from('couple_profile').select('*').maybeSingle(),
        supabase.from('memories').select('*').is('photo_url', 'not.null').order('memory_date', { ascending: false }),
        supabase.from('place_photos').select('*, places(name, visited_date, category)').order('created_at', { ascending: false })
      ])

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
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.sourceName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesSearch
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
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-rose-800 flex items-center gap-2">
            Galeri Foto 🖼️
          </h1>
          <p className="text-rose-500 font-body text-sm mt-1">
            Lihat semua lembaran foto perjalanan cinta kita dalam satu halaman indah
          </p>
        </div>

        {/* Info stats */}
        <div className="glass px-4 py-2 rounded-full border border-rose-100 flex items-center gap-4 text-xs font-semibold text-rose-700">
          <div>📸 {items.filter(i => i.type === 'documentation').length} Dokumentasi</div>
          <div className="w-[1px] h-4 bg-rose-200" />
          <div>💝 {items.filter(i => i.type === 'memory').length} Kenangan</div>
          <div className="w-[1px] h-4 bg-rose-200" />
          <div>💑 {items.filter(i => i.type === 'profile').length} Profil</div>
        </div>
      </div>

      {/* Control Panel (Filter, Search, Sort) */}
      <div className="glass p-4 rounded-3xl border border-rose-100 mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute -translate-y-1/2 left-4 top-1/2 text-rose-400" />
            <input
              type="text"
              placeholder="Cari foto berdasarkan nama tempat, caption, atau jenis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="love-input pl-11 py-2.5 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-rose-700 font-body whitespace-nowrap">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="love-input py-2 px-3 text-xs w-auto cursor-pointer"
            >
              <option value="newest">📅 Terbaru</option>
              <option value="oldest">📅 Terlama</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'all', label: 'Semua Foto', icon: Sparkles, color: 'text-rose-500' },
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
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="heart-beat text-4xl">💕</div>
          <p className="text-sm font-semibold text-rose-500 font-display mt-2">Merajut momen foto-foto kita...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty state */
        <div className="glass text-center py-20 rounded-3xl border border-rose-100">
          <div className="text-5xl mb-4">🖼️</div>
          <h3 className="font-display text-xl font-bold text-rose-800 mb-2">Foto tidak ditemukan</h3>
          <p className="text-sm text-rose-400 font-body max-w-md mx-auto">
            {searchQuery
              ? `Tidak ada foto dengan kata kunci "${searchQuery}" pada kategori ini.`
              : 'Belum ada foto yang diunggah dalam kategori ini.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setFilterType('all') }}
              className="btn-rose text-xs mt-4 py-2 px-6"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        /* Photo Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative overflow-hidden rounded-2xl aspect-square bg-rose-50 border border-rose-100 cursor-pointer card-hover shadow-sm"
            >
              {/* Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md rounded-full p-2">
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
                <h4 className="font-display font-bold text-xs truncate mb-1">
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
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 transition-all duration-300"
        >
          {/* Top Bar */}
          <div className="flex justify-between items-center w-full z-10 p-2">
            <span className="text-xs font-semibold tracking-wide text-gray-400 font-body">
              {lightboxIndex + 1} dari {filteredItems.length} foto
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Center Area: Prev Image Next */}
          <div className="flex-1 flex items-center justify-between gap-4 max-w-5xl mx-auto w-full relative">
            {/* Prev button */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev() }}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white cursor-pointer transition-colors flex-shrink-0"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Image Container */}
            <div
              className="flex-1 max-h-[70vh] flex items-center justify-center relative p-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentLightboxItem.url}
                alt={currentLightboxItem.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl animate-fade-in"
              />
            </div>

            {/* Next button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white cursor-pointer transition-colors flex-shrink-0"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Bottom Bar: Detail Info */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-5 max-w-3xl mx-auto w-full mb-4 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
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

              <h3 className="font-display font-bold text-lg md:text-xl">
                {currentLightboxItem.type === 'documentation' && currentLightboxItem.category && categoryEmoji[currentLightboxItem.category] ? `${categoryEmoji[currentLightboxItem.category]} ` : ''}
                {currentLightboxItem.type === 'memory' && currentLightboxItem.mood && moodEmoji[currentLightboxItem.mood] ? `${moodEmoji[currentLightboxItem.mood]} ` : ''}
                {currentLightboxItem.title}
              </h3>

              {currentLightboxItem.caption && (
                <p className="text-sm text-gray-300 font-body leading-relaxed max-w-2xl italic">
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
    </div>
  )
}
