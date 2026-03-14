'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { differenceInDays, differenceInMonths, differenceInYears, format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Heart, MapPin, Camera, Star, Sparkles, Map, CheckSquare, Scroll, BookHeart } from 'lucide-react'

interface Stats {
  wishlistCount: number
  visitedCount: number
  photosCount: number
  lettersCount: number
  memoriesCount: number
  bucketCount: number
  bucketCompletedCount: number
}

export default function DashboardHome() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    wishlistCount: 0, visitedCount: 0, photosCount: 0,
    lettersCount: 0, memoriesCount: 0, bucketCount: 0, bucketCompletedCount: 0
  })
  const [petals, setPetals] = useState<Array<{ id: number; left: number; delay: number; duration: number; emoji: string }>>([])

  useEffect(() => {
    loadData()
    // Generate falling petals
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 10,
      emoji: ['🌸', '🌺', '💮', '🌷', '💐'][Math.floor(Math.random() * 5)]
    }))
    setPetals(items)
  }, [])

  async function loadData() {
    const [profileRes, placesRes, photosRes, lettersRes, memoriesRes, bucketRes] = await Promise.all([
      supabase.from('couple_profile').select('*').single(),
      supabase.from('places').select('status'),
      supabase.from('place_photos').select('id'),
      supabase.from('love_letters').select('id'),
      supabase.from('memories').select('id'),
      supabase.from('bucket_list').select('is_completed'),
    ])

    if (profileRes.data) setProfile(profileRes.data)

    const places = placesRes.data || []
    const bucket = bucketRes.data || []

    setStats({
      wishlistCount: places.filter((p: any) => p.status === 'wishlist').length,
      visitedCount: places.filter((p: any) => p.status === 'visited').length,
      photosCount: photosRes.data?.length || 0,
      lettersCount: lettersRes.data?.length || 0,
      memoriesCount: memoriesRes.data?.length || 0,
      bucketCount: bucket.length,
      bucketCompletedCount: bucket.filter((b: any) => b.is_completed).length,
    })
  }

  function getLoveDuration() {
    if (!profile?.anniversary_date) return { days: 0, months: 0, years: 0 }
    const start = parseISO(profile.anniversary_date)
    const now = new Date()
    return {
      days: differenceInDays(now, start),
      months: differenceInMonths(now, start),
      years: differenceInYears(now, start),
    }
  }

  const duration = getLoveDuration()
  const anniversaryDate = profile?.anniversary_date 
    ? format(parseISO(profile.anniversary_date), 'd MMMM yyyy', { locale: idLocale })
    : '-'

  const quickLinks = [
    { href: '/dashboard/wishlist', emoji: '🗺️', label: 'Mau ke Mana?', count: stats.wishlistCount, desc: 'tempat dalam wishlist', color: 'from-rose-400 to-pink-400' },
    { href: '/dashboard/visited', emoji: '📍', label: 'Sudah Dikunjungi', count: stats.visitedCount, desc: 'tempat kenangan', color: 'from-pink-400 to-fuchsia-400' },
    { href: '/dashboard/dokumentasi', emoji: '📸', label: 'Dokumentasi', count: stats.photosCount, desc: 'foto tersimpan', color: 'from-fuchsia-400 to-purple-400' },
    { href: '/dashboard/love-letters', emoji: '💌', label: 'Surat Cinta', count: stats.lettersCount, desc: 'surat tertulis', color: 'from-rose-500 to-red-400' },
    { href: '/dashboard/memories', emoji: '💝', label: 'Kenangan', count: stats.memoriesCount, desc: 'momen spesial', color: 'from-pink-500 to-rose-400' },
    { href: '/dashboard/bucket-list', emoji: '✨', label: 'Bucket List', count: `${stats.bucketCompletedCount}/${stats.bucketCount}`, desc: 'impian terwujud', color: 'from-amber-400 to-rose-400' },
  ]

  return (
    <div className="relative">
      {/* Floating petals */}
      {petals.map(p => (
        <div
          key={p.id}
          className="petal select-none"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Hero Love Counter */}
      <div className="relative rounded-3xl overflow-hidden mb-8 p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #be123c 100%)',
          boxShadow: '0 20px 60px rgba(244, 63, 94, 0.4)'
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-4 right-8 w-24 h-24 rounded-full opacity-20" 
          style={{ background: 'rgba(255,255,255,0.3)' }} />
        <div className="absolute bottom-4 left-8 w-16 h-16 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.3)' }} />

        <div className="relative z-10">
          <div className="heart-beat text-5xl mb-3">💕</div>
          
          {profile ? (
            <>
              <h1 className="font-display text-3xl font-bold text-white mb-1">
                {profile.person1_name} & {profile.person2_name}
              </h1>
              <p className="text-rose-100 font-body mb-6">Bersama sejak {anniversaryDate}</p>

              {/* Counter */}
              <div className="flex justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className="font-display text-4xl font-bold text-white">{duration.years}</div>
                  <div className="text-rose-200 text-sm font-body">Tahun</div>
                </div>
                <div className="text-white text-3xl font-thin self-center">·</div>
                <div className="text-center">
                  <div className="font-display text-4xl font-bold text-white">{duration.months % 12}</div>
                  <div className="text-rose-200 text-sm font-body">Bulan</div>
                </div>
                <div className="text-white text-3xl font-thin self-center">·</div>
                <div className="text-center">
                  <div className="font-display text-4xl font-bold text-white">{duration.days}</div>
                  <div className="text-rose-200 text-sm font-body">Hari</div>
                </div>
              </div>

              <div className="glass rounded-2xl px-6 py-3 inline-block">
                <p className="font-script text-white text-lg">"{profile.love_quote}"</p>
              </div>
            </>
          ) : (
            <div className="text-white">
              <p className="font-display text-2xl mb-4">Selamat Datang di Our Story! 💕</p>
              <p className="font-body text-rose-100 mb-6">Mulai dengan mengisi biodata kalian</p>
              <Link href="/dashboard/biodata" className="bg-white text-rose-500 font-semibold px-6 py-3 rounded-full hover:bg-rose-50 transition-colors">
                Isi Biodata Sekarang →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card-hover glass rounded-2xl p-5 text-center border border-rose-100"
          >
            <div className="text-3xl mb-2">{item.emoji}</div>
            <div className={`font-display text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
              {item.count}
            </div>
            <div className="text-rose-600 font-body text-sm font-semibold">{item.label}</div>
            <div className="text-rose-400 font-body text-xs">{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 border border-rose-100">
          <h3 className="font-display text-lg font-bold text-rose-800 mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-rose-400" />
            Menu Cepat
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/dashboard/wishlist', label: '+ Tambah Tempat', emoji: '🗺️' },
              { href: '/dashboard/memories', label: '+ Kenangan Baru', emoji: '💝' },
              { href: '/dashboard/love-letters', label: '+ Tulis Surat', emoji: '💌' },
              { href: '/dashboard/bucket-list', label: '+ Impian Baru', emoji: '✨' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 rounded-xl p-3 transition-colors text-rose-700 text-sm font-semibold"
              >
                <span>{item.emoji}</span>
                <span className="font-body">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-rose-100">
          <h3 className="font-display text-lg font-bold text-rose-800 mb-4 flex items-center gap-2">
            <Heart size={18} className="text-rose-400" fill="currentColor" />
            Love Meter
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm font-body text-rose-600 mb-1">
                <span>📍 Tempat Dikunjungi</span>
                <span>{stats.visitedCount} tempat</span>
              </div>
              <div className="bg-rose-100 rounded-full h-2">
                <div className="progress-bar" style={{ width: `${Math.min((stats.visitedCount / 20) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-body text-rose-600 mb-1">
                <span>✨ Bucket List</span>
                <span>{stats.bucketCompletedCount}/{stats.bucketCount}</span>
              </div>
              <div className="bg-rose-100 rounded-full h-2">
                <div className="progress-bar" style={{ width: stats.bucketCount > 0 ? `${(stats.bucketCompletedCount / stats.bucketCount) * 100}%` : '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-body text-rose-600 mb-1">
                <span>📸 Dokumentasi</span>
                <span>{stats.photosCount} foto</span>
              </div>
              <div className="bg-rose-100 rounded-full h-2">
                <div className="progress-bar" style={{ width: `${Math.min((stats.photosCount / 50) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-rose-400 mt-3 font-body text-center">
            💕 Terus jaga kebersamaan kalian!
          </p>
        </div>
      </div>
    </div>
  )
}
