"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface User {
  id: number
  email: string
  token: string
  // Add other user fields as needed
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  enrollFace: (commitment: string) => Promise<void>
  verifyFace: (faceDescriptor: number[]) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Login failed")
      }

      const userData = await response.json()
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (user?.token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      localStorage.removeItem("user")
    }
  }

  const enrollFace = async (commitment: string) => {
    if (!user) throw new Error("User must be logged in to enroll face")

    try {
      const response = await fetch(`${API_URL}/face/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          commitment,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to enroll face")
      }

      // Update user state if needed
      const updatedUser = await response.json()
      setUser({ ...user, ...updatedUser })
    } catch (error) {
      console.error("Face enrollment error:", error)
      throw error
    }
  }

  const verifyFace = async (faceDescriptor: number[]): Promise<boolean> => {
    if (!user) throw new Error("User must be logged in to verify face")

    try {
      const response = await fetch(`${API_URL}/face/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          face_descriptor: faceDescriptor,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Face verification failed")
      }

      const result = await response.json()
      return result.is_valid
    } catch (error) {
      console.error("Face verification error:", error)
      return false
    }
  }

  const value = {
    user,
    login,
    logout,
    enrollFace,
    verifyFace,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
