'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface LoginUser {
  email: string
  password: string
}

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

function Login() {
  const router = useRouter()
  const [user, setUser] = useState<LoginUser>({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form validation
  const validateForm = () => {
    if (!user.email.trim() || !user.password.trim()) {
      setError('Email and password are required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      setError('Invalid email format')
      return false
    }
    if (!passwordRegex.test(user.password)) {
      setError(
        'Password must be 8+ characters with uppercase, lowercase, number, and special character'
      )
      return false
    }
    return true
  }

  // Handle login
  const handleLoginUser = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const payload = { email: user.email.trim(), password: user.password }

      const response = await axios.post(`${BASE_URL}/auth/login`, payload, {
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.status === 200) {
        const token = response.data.token
        if (token) localStorage.setItem('authToken', token)
        console.log(response?.data);
        

        // Redirect admin if payload indicates admin
        if (response.data.redirect === '/admin/dashboard') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Login</h1>
          <p className="text-gray-500 mt-2">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Password input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              Must be 8+ characters with uppercase, lowercase, number & special char
            </p>
          </div>

          {/* Login button */}
          <button
            onClick={handleLoginUser}
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-all text-lg ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        {/* Register link */}
        <p className="text-sm text-center text-gray-500 mt-6">
          Don’t have an account?{' '}
          <Link href="/Register" className="text-blue-600 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login