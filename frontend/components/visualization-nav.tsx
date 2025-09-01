"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function VisualizationNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Dashboard", icon: "🏠" },
    { href: "/visualizations", label: "3D Visualizations", icon: "✨" },
    { href: "/test", label: "Test 3D", icon: "🧪" },
    { href: "/swarm-protocol", label: "Swarm Protocol", icon: "🐙" },
    { href: "/rag-chat", label: "RAG Chat", icon: "💬" },
    { href: "/voice-transcription", label: "Voice", icon: "🎤" },
  ]

  return (
    <nav className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-white">
              CuttleFish Labs
            </Link>
            
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-purple-600/20"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Advanced 3D Visualizations
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
