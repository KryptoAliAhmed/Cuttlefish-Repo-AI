# 🐙 Cuttlefish Labs – Bioluminescent Widget

> **"Cuttlefish Labs is building the new protocol for civilization — sovereign AI infrastructure, carbon-negative by design, governed transparently on-chain."**

This is an interactive 3D widget for the Cuttlefish Labs brand: a glowing, rainbow bioluminescent cuttlefish floating in the dark, representing our alien intelligence & sovereign compute future.

![GitHub Repo stars](https://img.shields.io/github/stars/yourusername/cuttlefish-widget?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/cuttlefish-widget?style=social)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Deploy this widget

\[![Deploy with Vercel](https://vercel.com/button)\](https://vercel.com/import)
\[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)\](https://app.netlify.com/start/deploy)

---

## 🔧 Local development

Clone the repo and start the development server:

\`\`\`bash
git clone https://github.com/yourusername/cuttlefish-widget.git
cd cuttlefish-widget
npm install
npm run dev
\`\`\`

Then open your browser at http://localhost:3000

## 🌌 About the glow shader

This widget uses React Three Fiber with a custom GLSL shader to produce:

- Rainbow bioluminescent glow inspired by jellyfish & ctenophores
- Soft pulse animations & slow rotations
- Interactive emotional states (idle, curious, thinking, excited, cautious)
- Mouse tracking for natural movement
- Ready to embed in any site or product

## ✨ Features

- **🌈 Rainbow Shader**: Dynamic color cycling with time-based animations
- **🎮 Interactive States**: 5 emotional states with unique behaviors
- **🖱️ Mouse Tracking**: Smooth cursor following for natural interaction
- **📱 Responsive**: Works on desktop and mobile devices
- **⚡ Performance**: Optimized Three.js rendering with proper disposal
- **🎨 Customizable**: Easy to modify colors, animations, and behaviors

## 🛠️ Tech Stack

- **React 18** with Next.js 14
- **React Three Fiber** for 3D rendering
- **Three.js** for WebGL graphics
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Custom GLSL Shaders** for bioluminescent effects

## 📦 Usage

The widget can be embedded in any React application:

\`\`\`tsx
import CuttlefishWidget from './components/cuttlefish-widget'

function App() {
  return (
    <div className="w-full h-screen">
      <CuttlefishWidget />
    </div>
  )
}
\`\`\`

## 🎯 Roadmap

- [ ] Audio-reactive pulsing
- [ ] Particle bubble effects
- [ ] Multiple cuttlefish schooling behavior
- [ ] VR/AR support
- [ ] Blockchain integration for governance

## ✨ License

MIT © Cuttlefish Labs
