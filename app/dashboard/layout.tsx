'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Heart, MapPin, Camera, BookHeart, Star, 
  Map, CheckSquare, Scroll, Home, Menu, X,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'Beranda', icon: Home, emoji: '🏠' },
  { href: '/dashboard/biodata', label: 'Biodata Kami', icon: Heart, emoji: '💑' },
  { href: '/dashboard/wishlist', label: 'Mau ke Mana?', icon: MapPin, emoji: '🗺️' },
  { href: '/dashboard/visited', label: 'Tempat Kenangan', icon: Map, emoji: '📍' },
  { href: '/dashboard/dokumentasi', label: 'Dokumentasi', icon: Camera, emoji: '📸' },
  { href: '/dashboard/memories', label: 'Kenangan Indah', icon: BookHeart, emoji: '💝' },
  { href: '/dashboard/bucket-list', label: 'Bucket List', icon: CheckSquare, emoji: '✨' },
  { href: '/dashboard/love-letters', label: 'Surat Cinta', icon: Scroll, emoji: '💌' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<{ person1_name: string; person2_name: string } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data } = await supabase.from('couple_profile').select('person1_name, person2_name').single()
    if (data) setProfile(data)
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fdf8f0 50%, #fce7f3 100%)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 lg:hidden modal-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-72 z-40 transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{
          background: 'linear-gradient(180deg, #fff1f2 0%, #fdf2f8 50%, #fce7f3 100%)',
          borderRight: '1px solid #fecdd3',
          boxShadow: '4px 0 20px rgba(244, 63, 94, 0.08)'
        }}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-rose-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="heart-beat text-2xl">💕</span>
                <h1 className="font-display text-xl font-bold gradient-text">Our Story</h1>
              </div>
              {profile && (
                <p className="font-script text-sm text-rose-400">
                  {profile.person1_name} & {profile.person2_name}
                </p>
              )}
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-rose-400 hover:text-rose-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Decorative hearts */}
        <div className="absolute right-4 top-16 opacity-10 text-rose-300 text-4xl pointer-events-none">♥</div>
        <div className="absolute right-8 bottom-40 opacity-10 text-rose-300 text-2xl pointer-events-none">♥</div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'nav-active font-semibold' 
                    : 'text-rose-700 hover:bg-rose-50 hover:text-rose-500'
                  }
                `}
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="font-body text-sm">{item.label}</span>
                {isActive && <Sparkles size={14} className="ml-auto text-rose-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom quote */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="glass rounded-2xl p-4 text-center">
            <p className="font-script text-rose-400 text-sm leading-relaxed">
              "Every love story is beautiful, but ours is my favorite."
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 glass border-b border-rose-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-rose-400 hover:text-rose-600 transition-colors"
              >
                <Menu size={24} />
              </button>
              <div>
                <h2 className="font-display text-lg font-semibold text-rose-800">
                  {navItems.find(n => n.href === pathname)?.emoji}{' '}
                  {navItems.find(n => n.href === pathname)?.label || 'Our Story'}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 text-rose-300">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
