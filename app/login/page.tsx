'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f9f7]">
      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md glass border border-rose-200/50 p-8 shadow-2xl rounded-3xl relative z-10 backdrop-blur-lg bg-white/70"
      >
        {/* Heart logo */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner"
          >
            <span className="text-3xl">🦊🐰</span>
          </motion.div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-display text-rose-800 flex items-center justify-center gap-1.5">
            Our Story <Sparkles size={16} className="text-rose-500" />
          </h2>
          <p className="text-xs text-rose-500 mt-1.5 font-body leading-relaxed">
            Selamat datang kembali! Masukkan Kode rahasia kalian untuk mengakses dashboard kenangan kita.
          </p>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 mb-5 text-xs font-semibold text-red-600 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2"
            >
              <span>⚠️</span> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan Kode..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full !pl-11 pr-12 py-3.5 text-sm love-input border border-rose-200/60 rounded-2xl focus:ring-rose-300 focus:border-rose-300 transition-all font-body text-gray-800 bg-white/80"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600 cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 border-rose-300 focus:ring-rose-400 accent-rose-500 cursor-pointer"
                disabled={loading}
              />
              Ingat Saya (30 hari)
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold py-3.5 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-200 text-sm font-display disabled:opacity-85 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="heart-beat">🌿</span>
            ) : (
              <>
                Masuk <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-[10px] text-rose-400/80 font-body">
          Dibuat dengan 🌿 khusus untuk kita berdua.
        </div>
      </motion.div>
    </div>
  )
}
