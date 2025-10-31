'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1D9BF0',
    },
    background: {
      default: '#000000',
      paper: '#16181C',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8B98A5',
    },
    divider: '#2F3336',
  },
})

const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1D9BF0',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F7F9F9',
    },
    text: {
      primary: '#0F1419',
      secondary: '#536471',
    },
    divider: '#EFF3F4',
  },
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark')

  useEffect(() => {
    // 從 localStorage 讀取主題設定
    const savedMode = localStorage.getItem('theme') as ThemeMode
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode)
    }
  }, [])

  useEffect(() => {
    // 儲存主題設定到 localStorage
    localStorage.setItem('theme', mode)
    
    // 同步 Tailwind 的 dark mode
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [mode])

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const theme = mode === 'dark' ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

export function useThemeMode() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProvider')
  }
  return context
}

