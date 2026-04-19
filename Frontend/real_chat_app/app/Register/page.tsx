'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface User {
  username: string
  email: string
  password: string
}

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

function Register() {
  const router = useRouter()
  const [user, setUser] = useState<User>({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateForm = () => {
    if (!user.username.trim() || !user.email.trim() || !user.password.trim()) {
      setError('All fields are required')
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

  const handleRegisterUser = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const payload = { ...user, role: 'user' }

      const response = await axios.post(`${BASE_URL}/auth/register`, payload, {
        headers: { 'Content-Type': 'application/json' }
      })
      console.log(response.data);
      

      if (response?.data?.status === 201) {
        router.push('/Login')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 mt-2">Register to access all features of our app</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={user.username}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />

          <input
            type="email"
            placeholder="Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />

          <div>
            <input
              type="password"
              placeholder="Password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              Must be 8+ characters with uppercase, lowercase, number & special char
            </p>
          </div>

          <button
            onClick={handleRegisterUser}
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md'
            }`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already registered?{' '}
          <Link href="/Login" className="text-blue-600 font-medium hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register