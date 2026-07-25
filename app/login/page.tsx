'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { loginAction } from './actions'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Masukkan Kode terlebih dahulu!')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await loginAction(password, rememberMe)
      if (res.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(res.error || 'Terjadi kesalahan')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setError('Gagal menghubungkan ke server.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #5DADE2 0%, #85C1E9 25%, #AED6F1 45%, #D4EFDF 65%, #A9DFBF 80%, #7DCEA0 100%)',
    }}>

      {/* ══ ANIMATED CLOUDS ══ */}
      <div style={{ position: 'absolute', top: '5%', left: '3%', fontSize: '4rem', opacity: 0.35, animation: 'cloudDrift 12s ease-in-out infinite', pointerEvents: 'none' }}>☁️</div>
      <div style={{ position: 'absolute', top: '8%', right: '8%', fontSize: '5.5rem', opacity: 0.25, animation: 'cloudDrift 15s ease-in-out 3s infinite', pointerEvents: 'none' }}>☁️</div>
      <div style={{ position: 'absolute', top: '15%', left: '25%', fontSize: '3rem', opacity: 0.3, animation: 'cloudDrift 10s ease-in-out 1s infinite', pointerEvents: 'none' }}>☁️</div>
      <div style={{ position: 'absolute', top: '3%', right: '30%', fontSize: '3.5rem', opacity: 0.2, animation: 'cloudDrift 18s ease-in-out 5s infinite', pointerEvents: 'none' }}>☁️</div>
      <div style={{ position: 'absolute', top: '12%', left: '60%', fontSize: '2.5rem', opacity: 0.28, animation: 'cloudDrift 9s ease-in-out 2s infinite', pointerEvents: 'none' }}>☁️</div>

      {/* ══ GROUND / GRASS LAYER ══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px',
        background: 'linear-gradient(180deg, transparent 0%, #52BE80 30%, #27AE60 60%, #1E8449 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Grass texture dots */}
      <div style={{
        position: 'absolute', bottom: '60px', left: 0, right: 0, height: '60px',
        background: `
          radial-gradient(circle at 10% 80%, #229954 2px, transparent 2px),
          radial-gradient(circle at 30% 60%, #1E8449 3px, transparent 3px),
          radial-gradient(circle at 50% 75%, #27AE60 2px, transparent 2px),
          radial-gradient(circle at 70% 65%, #229954 2px, transparent 2px),
          radial-gradient(circle at 90% 80%, #1E8449 3px, transparent 3px)
        `,
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ══ CITY SILHOUETTE IN BACKGROUND ══ */}
      <div style={{
        position: 'absolute', bottom: '120px', left: 0, right: 0, height: '200px',
        background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 200'%3E%3Cpath d='M0 200 L0 140 L40 140 L40 100 L60 100 L60 70 L80 70 L80 100 L100 100 L100 120 L140 120 L140 80 L155 80 L155 50 L175 50 L175 80 L190 80 L190 110 L230 110 L230 75 L250 75 L250 40 L260 40 L260 15 L270 15 L270 0 L280 0 L280 15 L290 15 L290 40 L300 40 L300 75 L330 75 L330 100 L360 100 L360 70 L380 70 L380 45 L395 45 L395 30 L410 30 L410 45 L425 45 L425 70 L450 70 L450 110 L490 110 L490 85 L510 85 L510 55 L525 55 L525 35 L545 35 L545 55 L565 55 L565 90 L590 90 L590 70 L610 70 L610 100 L650 100 L650 80 L670 80 L670 50 L680 50 L680 30 L690 30 L690 50 L700 50 L700 80 L740 80 L740 110 L780 110 L780 85 L800 85 L800 60 L815 60 L815 40 L830 40 L830 60 L845 60 L845 85 L870 85 L870 100 L910 100 L910 130 L950 130 L950 95 L970 95 L970 70 L990 70 L990 95 L1020 95 L1020 120 L1060 120 L1060 90 L1080 90 L1080 110 L1120 110 L1120 130 L1160 130 L1160 150 L1200 150 L1200 200 Z' fill='rgba(0,77,96,0.12)'/%3E%3C/svg%3E") repeat-x bottom`,
        backgroundSize: 'auto 200px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ══ DECORATIVE TREES ══ */}
      <div style={{ position: 'absolute', bottom: '130px', left: '5%', fontSize: '3.5rem', opacity: 0.5, pointerEvents: 'none', zIndex: 1 }}>🌳</div>
      <div style={{ position: 'absolute', bottom: '125px', left: '12%', fontSize: '2.8rem', opacity: 0.4, pointerEvents: 'none', zIndex: 1 }}>🌴</div>
      <div style={{ position: 'absolute', bottom: '130px', right: '6%', fontSize: '3.2rem', opacity: 0.5, pointerEvents: 'none', zIndex: 1 }}>🌳</div>
      <div style={{ position: 'absolute', bottom: '125px', right: '14%', fontSize: '2.5rem', opacity: 0.4, pointerEvents: 'none', zIndex: 1 }}>🌿</div>

      {/* ══ PAW PRINTS PATH ══ */}
      <div style={{ position: 'absolute', bottom: '90px', left: '20%', fontSize: '1.2rem', opacity: 0.2, transform: 'rotate(-15deg)', pointerEvents: 'none', zIndex: 1 }}>🐾</div>
      <div style={{ position: 'absolute', bottom: '100px', left: '28%', fontSize: '1rem', opacity: 0.18, transform: 'rotate(10deg)', pointerEvents: 'none', zIndex: 1 }}>🐾</div>
      <div style={{ position: 'absolute', bottom: '85px', left: '36%', fontSize: '1.1rem', opacity: 0.15, transform: 'rotate(-5deg)', pointerEvents: 'none', zIndex: 1 }}>🐾</div>
      <div style={{ position: 'absolute', bottom: '95px', right: '30%', fontSize: '1rem', opacity: 0.18, transform: 'rotate(20deg)', pointerEvents: 'none', zIndex: 1 }}>🐾</div>
      <div style={{ position: 'absolute', bottom: '80px', right: '22%', fontSize: '1.2rem', opacity: 0.15, transform: 'rotate(-10deg)', pointerEvents: 'none', zIndex: 1 }}>🐾</div>

      {/* ══ NICK & JUDY CHARACTERS (sides) ══ */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        style={{
          position: 'absolute', bottom: '160px', left: '6%',
          zIndex: 2, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        }}
        className="login-character"
      >
        <div style={{
          width: '80px', height: '100px',
          background: 'linear-gradient(135deg, rgba(244,162,97,0.2), rgba(233,196,106,0.15))',
          borderRadius: '50% 50% 24px 24px',
          border: '2px solid rgba(244,162,97,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 32px rgba(244,162,97,0.15)',
          animation: 'zooFloat 5s ease-in-out infinite',
          overflow: 'hidden',
        }}>
          <img src="/images/nick.png" alt="Nick" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{
          fontFamily: "'Fredoka', sans-serif", fontSize: '0.7rem', fontWeight: 700,
          color: '#004D60', background: 'rgba(255,255,255,0.7)',
          padding: '3px 12px', borderRadius: '50px',
          backdropFilter: 'blur(4px)',
        }}>NICK</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{
          position: 'absolute', bottom: '160px', right: '6%',
          zIndex: 2, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        }}
        className="login-character"
      >
        <div style={{
          width: '70px', height: '90px',
          background: 'linear-gradient(135deg, rgba(0,119,182,0.15), rgba(0,168,150,0.12))',
          borderRadius: '50% 50% 24px 24px',
          border: '2px solid rgba(0,119,182,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 32px rgba(0,119,182,0.12)',
          animation: 'zooFloat 5s ease-in-out 1s infinite',
          overflow: 'hidden',
        }}>
          <img src="/images/judy.png" alt="Judy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{
          fontFamily: "'Fredoka', sans-serif", fontSize: '0.7rem', fontWeight: 700,
          color: '#004D60', background: 'rgba(255,255,255,0.7)',
          padding: '3px 12px', borderRadius: '50px',
          backdropFilter: 'blur(4px)',
        }}>JUDY</span>
      </motion.div>

      {/* ══════════════════════════════════════
          MAIN GATE / LOGIN CARD
      ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          width: '100%', maxWidth: '420px',
          position: 'relative', zIndex: 10,
        }}
      >
        {/* ── Gate Arch (top ornament) ── */}
        <div style={{
          textAlign: 'center', marginBottom: '-20px', position: 'relative', zIndex: 11,
        }}>
          {/* Arch shape */}
          <div style={{
            width: '280px', margin: '0 auto',
            background: 'linear-gradient(135deg, #004D60, #006D8E, #0081A7)',
            borderRadius: '140px 140px 0 0',
            padding: '24px 20px 28px',
            border: '3px solid rgba(244, 162, 97, 0.4)',
            borderBottom: 'none',
            boxShadow: '0 -8px 32px rgba(0, 77, 96, 0.2)',
            position: 'relative',
          }}>
            {/* Decorative top ornament */}
            <div style={{
              position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #F4A261, #E9C46A)',
              borderRadius: '50%', width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              boxShadow: '0 4px 16px rgba(244,162,97,0.4)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}>🐾</div>

            {/* Gate title */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '4px' }}>🦊🐰</span>
            </motion.div>
            <h1 style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: '1.4rem', fontWeight: 700,
              color: '#F4A261', margin: '0 0 2px 0',
              letterSpacing: '0.08em',
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>ZOOTOPIA</h1>
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              margin: 0,
            }}>Gateway to Our Story</p>
          </div>

          {/* Gate pillars */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            width: '310px', margin: '0 auto', position: 'relative',
          }}>
            {/* Left pillar */}
            <div style={{
              width: '18px', height: '24px',
              background: 'linear-gradient(180deg, #004D60, #006D8E)',
              borderRadius: '0 0 4px 4px',
              border: '2px solid rgba(244, 162, 97, 0.3)',
              borderTop: 'none',
            }} />
            {/* Right pillar */}
            <div style={{
              width: '18px', height: '24px',
              background: 'linear-gradient(180deg, #004D60, #006D8E)',
              borderRadius: '0 0 4px 4px',
              border: '2px solid rgba(244, 162, 97, 0.3)',
              borderTop: 'none',
            }} />
          </div>
        </div>

        {/* ── Login Card Body ── */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '0 0 28px 28px',
          border: '2px solid rgba(0, 168, 150, 0.15)',
          borderTop: '2px solid rgba(244, 162, 97, 0.2)',
          padding: '32px 28px 28px',
          boxShadow: '0 20px 60px rgba(0, 77, 96, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset',
        }}>
          {/* Welcome text */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: '1.15rem', fontWeight: 700,
              color: '#004D60', margin: '0 0 6px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              Selamat Datang! <span style={{ fontSize: '1rem' }}>✨</span>
            </h2>
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '0.78rem', color: '#5a8a9a',
              lineHeight: 1.6, margin: 0,
            }}>
              Masukkan kode rahasia untuk membuka gerbang<br />ke dunia Zootopia kita berdua.
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  padding: '10px 14px', marginBottom: '16px',
                  fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Nunito', sans-serif",
                  color: '#c0392b',
                  background: 'rgba(231, 76, 60, 0.08)',
                  borderRadius: '14px',
                  border: '1px solid rgba(231, 76, 60, 0.15)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Password input */}
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                color: '#0081A7',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan Kode Rahasia..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 48px 14px 44px',
                  fontSize: '0.88rem',
                  fontFamily: "'Nunito', sans-serif",
                  color: '#004D60',
                  background: 'rgba(255,255,255,0.9)',
                  border: '2px solid rgba(0, 168, 150, 0.2)',
                  borderRadius: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00A896'
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 168, 150, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 168, 150, 0.2)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#0081A7', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px', display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '2px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                style={{
                  width: '16px', height: '16px',
                  accentColor: '#00A896', cursor: 'pointer',
                  borderRadius: '4px',
                }}
              />
              <label htmlFor="rememberMe" style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: '0.75rem', fontWeight: 600,
                color: '#006D8E', cursor: 'pointer',
              }}>
                🐾 Ingat Saya (30 hari)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #004D60, #0081A7, #00A896)',
                color: '#fff',
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 6px 24px rgba(0, 77, 96, 0.3)',
                transition: 'all 0.3s ease',
                letterSpacing: '0.03em',
                opacity: loading ? 0.7 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 10px 36px rgba(0, 77, 96, 0.4)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 77, 96, 0.3)'
              }}
            >
              {loading ? (
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  style={{ fontSize: '1.2rem' }}
                >🐾</motion.span>
              ) : (
                <>
                  🚪 Buka Gerbang Zootopia <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Decorative bottom */}
          <div style={{
            marginTop: '24px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          }}>
            {/* Paw divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,168,150,0.2), transparent)' }} />
              <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>🐾</span>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,168,150,0.2), transparent)' }} />
            </div>

            <p style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: '0.82rem', color: '#0081A7',
              fontStyle: 'italic', margin: 0, opacity: 0.7,
            }}>
              "In Zootopia, anyone can be anything."
            </p>

            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '0.62rem', color: '#8faab5',
              margin: 0,
            }}>
              🐾 © {new Date().getFullYear()} Our Zootopia Story. Dibuat dengan 💛
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── CSS Animations ── */}
      <style>{`
        @media (max-width: 640px) {
          .login-character { display: none !important; }
        }
      `}</style>
    </div>
  )
}
