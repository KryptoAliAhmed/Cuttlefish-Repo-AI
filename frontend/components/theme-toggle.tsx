"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const isDark = (resolvedTheme ?? theme) === "dark"

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {isDark ? (
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </div>
      )}
    </button>
  )
}




