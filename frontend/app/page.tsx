"use client"

import React, { useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Stars } from "@react-three/drei"
import { Suspense } from "react"
import CuttlefishModel from "@/components/cuttlefish-widget/cuttlefish-model"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Zap, Brain, MessageSquare, BarChart3, Shield, Mic, ArrowDown, Mail, ExternalLink } from "lucide-react"
// Avoid SSR issues (localStorage) in RAGChat by client-only dynamic import
const RAGChatClient = dynamic(() => import("@/components/rag-chat"), { ssr: false })
import { RAGAgent } from "@/components/rag-agent"
import { CuttlefishDashboard } from "@/components/cuttlefish-dashboard"
import { KernelScoresDashboard } from "@/components/kernel-scores-dashboard"
import { MultisigDashboard } from "@/components/multisig-dashboard"
import VoiceTranscript from "@/components/voice-transcript"

export default function CuttlefishWidget() {
  const [state, setState] = useState("idle")
  const mouse = useRef({ x: 0, y: 0 })

  // Mouse tracking similar to your original code
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const states = [
    { key: "idle", label: "Idle", description: "Gentle rainbow glow with slow rotation", icon: Sparkles },
    { key: "curious", label: "Curious", description: "Brighter colors with bobbing motion", icon: Zap },
    { key: "thinking", label: "Thinking", description: "Slow pulsing with muted rainbow", icon: Brain },
    { key: "excited", label: "Excited", description: "Intense rainbow with rapid movement", icon: Zap },
    { key: "cautious", label: "Cautious", description: "Fast color cycling with defensive posture", icon: Shield },
  ]

  const currentState = states.find((s) => s.key === state)

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)] animate-pulse delay-1000" />
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md transform rotate-45" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Cuttlefish Labs
                </h1>
                <p className="text-xs text-purple-300/70">AI-Powered Innovation</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-purple-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-purple-300 hover:text-white transition-colors">About</a>
              <a href="#contact" className="text-purple-300 hover:text-white transition-colors">Contact</a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <ExternalLink className="w-3 h-3 mr-1" />
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section with 3D Cuttlefish */}
      <div className="relative h-screen pt-20">
        <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <ambientLight intensity={0.3} />
            <CuttlefishModel mouse={mouse.current} globalState={state} />
            <Environment preset="night" />
            <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
          </Suspense>
        </Canvas>



        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center max-w-4xl mx-auto px-4">
            <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Welcome to the Future
            </h2>
            <p className="text-xl text-purple-200/80 mb-8 max-w-2xl mx-auto">
              Experience the next generation of AI-powered tools with our interactive cuttlefish interface. 
              Move your mouse to interact with the 3D model and explore our suite of intelligent applications.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Zap className="w-4 h-4 mr-2" />
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20">
                <ArrowDown className="w-4 h-4 mr-2" />
                Explore Features
              </Button>
            </div>
          </div>
        </div>

                 {/* Control Panel - Commented Out */}
         {/* <Card className="absolute top-24 left-4 w-80 bg-black/20 backdrop-blur-md border-purple-500/30">
           <CardContent className="p-4">
             <div className="flex items-center gap-2 mb-3">
               <Sparkles className="w-4 h-4 text-purple-400" />
               <h3 className="font-semibold text-purple-400">Interactive States</h3>
             </div>
             <div className="grid grid-cols-2 gap-2 mb-3">
               {states.map((stateOption) => {
                 const Icon = stateOption.icon
                 return (
                   <Button
                     key={stateOption.key}
                     onClick={() => setState(stateOption.key)}
                     variant={state === stateOption.key ? "default" : "outline"}
                     size="sm"
                     className={
                       state === stateOption.key
                         ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                         : "border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                     }
                   >
                     <Icon className="w-3 h-3 mr-1" />
                     {stateOption.label}
                   </Button>
                 )
               })}
             </div>
             <p className="text-sm text-purple-400/70">Move your mouse to interact!</p>
           </CardContent>
         </Card> */}

         {/* Info Panel - Commented Out */}
         {/* <Card className="absolute top-24 right-4 w-72 bg-black/20 backdrop-blur-md border-purple-500/30">
           <CardContent className="p-4">
             <div className="flex items-center gap-2 mb-2">
               <Brain className="w-4 h-4 text-purple-400" />
               <h3 className="font-semibold text-purple-400">Current State</h3>
             </div>
             <div className="flex items-center gap-2 mb-2">
               <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse" />
               <span className="capitalize font-medium text-white">{state}</span>
             </div>
             <p className="text-sm text-purple-400/70 mb-3">{currentState?.description}</p>
             <div className="text-xs text-purple-400/50 space-y-1">
               <p>Rainbow Shader Active</p>
               <p>Mouse: {mouse.current.x.toFixed(2)}, {mouse.current.y.toFixed(2)}</p>
             </div>
           </CardContent>
         </Card> */}

        
      </div>

      {/* Feature Showcase Sections */}
      <div className="relative bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Powerful AI Tools
            </h2>
            <p className="text-xl text-purple-200/80 max-w-3xl mx-auto">
              Discover our comprehensive suite of AI-powered applications designed to enhance your workflow
            </p>
          </div>

          {/* RAG Chat Section */}
          <section className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white">RAG Chat</h3>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-black/40 backdrop-blur-sm p-6 shadow-2xl">
              <RAGChatClient />
            </div>
          </section>

          {/* RAG Agent Section */}
          <section className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white">RAG Agent</h3>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-black/40 backdrop-blur-sm p-6 shadow-2xl">
              <RAGAgent />
            </div>
          </section>

          {/* Cuttlefish Dashboard Section */}
          <section className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Cuttlefish Dashboard</h3>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-black/40 backdrop-blur-sm p-6 shadow-2xl">
              <CuttlefishDashboard />
            </div>
          </section>

          {/* Kernel Scores Section */}
          <section className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Kernel Scores</h3>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-black/40 backdrop-blur-sm p-6 shadow-2xl">
              <KernelScoresDashboard />
            </div>
          </section>

          {/* Multisig Dashboard Section */}
          <section className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Multisig Dashboard</h3>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-black/40 backdrop-blur-sm p-6 shadow-2xl">
              <MultisigDashboard />
            </div>
          </section>

          {/* Voice Transcript Section */}
          <section className="relative" id="voice-transcript">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Voice Transcript</h3>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-black/40 backdrop-blur-sm p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-purple-200/80 text-sm">View your live session transcript</p>
                <Button
                  size="sm"
                  onClick={() => {
                    const overlay = document.getElementById('voice-transcript-overlay')
                    if (overlay) overlay.classList.remove('hidden')
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Open Fullscreen
                </Button>
              </div>
              <VoiceTranscript history={[]} />
            </div>
          </section>
        </div>
      </div>

      {/* Voice Transcript Fullscreen Overlay */}
      <div id="voice-transcript-overlay" className="hidden fixed inset-0 z-[10000]">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-[10001] w-screen h-screen p-4 sm:p-6">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 p-0 backdrop-blur-sm border border-white/20 shadow-lg"
              onClick={() => {
                const overlay = document.getElementById('voice-transcript-overlay')
                if (overlay) overlay.classList.add('hidden')
              }}
            >
              ✕
            </Button>
          </div>
          <div className="w-full h-full">
            <VoiceTranscript history={[]} fullScreen />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-black/40 backdrop-blur-md border-t border-purple-500/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md transform rotate-45" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Cuttlefish Labs
                  </h3>
                  <p className="text-sm text-purple-300/70">AI-Powered Innovation Platform</p>
                </div>
              </div>
              <p className="text-purple-200/80 mb-6 max-w-md">
                Experience the next generation of AI-powered tools with our interactive cuttlefish interface. 
                Discover RAG chat, voice processing, and intelligent applications.
              </p>
              <div className="flex items-center gap-4">
                <a href="mailto:contact@cuttlefishlabs.com" className="p-2 text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-purple-300 hover:text-white transition-colors">Features</a></li>
                <li><a href="#about" className="text-purple-300 hover:text-white transition-colors">About</a></li>
                <li><a href="#docs" className="text-purple-300 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#api" className="text-purple-300 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#blog" className="text-purple-300 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#tutorials" className="text-purple-300 hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#support" className="text-purple-300 hover:text-white transition-colors">Support</a></li>
                <li><a href="#privacy" className="text-purple-300 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-purple-500/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-purple-300/70">
              © 2024 Cuttlefish Labs. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="text-xs text-purple-300/50">Made with ❤️ by Cuttlefish Labs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
