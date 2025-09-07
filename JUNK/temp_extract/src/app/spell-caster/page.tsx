'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import BackgroundEffects from '@/components/BackgroundEffects'
import './spell-caster.css'

interface Point {
  x: number
  y: number
  time: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  hue: number
  saturation: number
  lightness: number
  glow?: boolean
  bounces?: number  // Track wall bounces
  color?: string | null  // Store rarity color for critical hits
}

interface Fragment3D {
  x: number
  y: number
  z: number  // Depth coordinate
  vx: number
  vy: number
  vz: number  // Velocity in z
  rotX: number  // Rotation around X axis
  rotY: number  // Rotation around Y axis
  rotZ: number  // Rotation around Z axis
  rotVelX: number  // Angular velocity X
  rotVelY: number  // Angular velocity Y
  rotVelZ: number  // Angular velocity Z
  width: number
  height: number
  depth: number
  color: string
  settled?: boolean
}

interface FloatingText {
  x: number
  y: number
  text: string
  color: string
  life: number
  vy: number
}

interface SpellPath {
  x: number
  y: number
}

interface EssenceCost {
  type: string
  amount: number
  color: string
  icon: string
  owned: number
  max: number
}

type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'God Tier'

interface Spell {
  name: string
  path: SpellPath[]
  color: string
  rarity: Rarity
  minDamage: number
  maxDamage: number
  essenceCost: EssenceCost[]
}

interface DrawnPoint {
  x: number
  y: number
  accuracy: number
}

// Rarity colors
const RARITY_COLORS: Record<Rarity, string> = {
  'Common': '#808080',
  'Uncommon': '#00ff00',
  'Rare': '#0099ff',
  'Epic': '#9900ff',
  'Legendary': '#ff8800',
  'God Tier': '#ff0000'
}

// Mock player essence inventory with smaller amounts
const PLAYER_ESSENCE = {
  Fire: { owned: 0.45, max: 1.0 },
  Energy: { owned: 0.78, max: 1.0 },
  Lightning: { owned: 0.32, max: 1.0 },
  Frost: { owned: 0.56, max: 1.0 },
  Water: { owned: 0.89, max: 1.0 },
  Arcane: { owned: 0.23, max: 1.0 },
  Chaos: { owned: 0.67, max: 1.0 }
}

// Limited to 6 spells in 2x3 grid
const SPELLS: { [key: string]: Spell } = {
  fireball: {
    name: 'Fireball',
    path: (() => {
      const points: SpellPath[] = []
      const segments = 24
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        points.push({
          x: 0.5 + Math.cos(angle) * 0.25,
          y: 0.5 + Math.sin(angle) * 0.25
        })
      }
      return points
    })(),
    color: '#ff6b00',
    rarity: 'Common',
    minDamage: 10,
    maxDamage: 30,
    essenceCost: [
      { type: 'Fire', amount: 0.03, color: '#ff6b00', icon: '🔥', ...PLAYER_ESSENCE.Fire },
      { type: 'Energy', amount: 0.02, color: '#fab617', icon: '⚡', ...PLAYER_ESSENCE.Energy }
    ]
  },
  lightning: {
    name: 'Lightning',
    path: [
      { x: 0.5, y: 0.2 },
      { x: 0.35, y: 0.3 },
      { x: 0.65, y: 0.4 },
      { x: 0.4, y: 0.5 },
      { x: 0.6, y: 0.6 },
      { x: 0.45, y: 0.7 },
      { x: 0.5, y: 0.8 }
    ],
    color: '#ffff00',
    rarity: 'Uncommon',
    minDamage: 15,
    maxDamage: 45,
    essenceCost: [
      { type: 'Lightning', amount: 0.04, color: '#ffff00', icon: '⚡', ...PLAYER_ESSENCE.Lightning },
      { type: 'Energy', amount: 0.03, color: '#fab617', icon: '✨', ...PLAYER_ESSENCE.Energy }
    ]
  },
  frostMaze: {
    name: 'Frost Maze',
    path: [
      { x: 0.2, y: 0.2 },
      { x: 0.8, y: 0.2 },
      { x: 0.8, y: 0.35 },
      { x: 0.3, y: 0.35 },
      { x: 0.3, y: 0.5 },
      { x: 0.7, y: 0.5 },
      { x: 0.7, y: 0.65 },
      { x: 0.4, y: 0.65 },
      { x: 0.4, y: 0.8 },
      { x: 0.8, y: 0.8 }
    ],
    color: '#00ccff',
    rarity: 'Rare',
    minDamage: 20,
    maxDamage: 60,
    essenceCost: [
      { type: 'Frost', amount: 0.05, color: '#00ccff', icon: '❄️', ...PLAYER_ESSENCE.Frost },
      { type: 'Water', amount: 0.03, color: '#4488ff', icon: '💧', ...PLAYER_ESSENCE.Water }
    ]
  },
  arcaneRune: {
    name: 'Arcane Rune',
    path: (() => {
      const points: SpellPath[] = []
      const pattern = [
        { x: 0.5, y: 0.2 },
        { x: 0.3, y: 0.25 },
        { x: 0.2, y: 0.4 },
        { x: 0.3, y: 0.5 },
        { x: 0.5, y: 0.45 },
        { x: 0.7, y: 0.5 },
        { x: 0.8, y: 0.4 },
        { x: 0.7, y: 0.25 },
        { x: 0.5, y: 0.2 },
        { x: 0.5, y: 0.45 },
        { x: 0.5, y: 0.7 },
        { x: 0.35, y: 0.75 },
        { x: 0.25, y: 0.7 },
        { x: 0.35, y: 0.65 },
        { x: 0.5, y: 0.7 },
        { x: 0.65, y: 0.65 },
        { x: 0.75, y: 0.7 },
        { x: 0.65, y: 0.75 },
        { x: 0.5, y: 0.7 }
      ]
      return pattern
    })(),
    color: '#8b00ff',
    rarity: 'Epic',
    minDamage: 25,
    maxDamage: 75,
    essenceCost: [
      { type: 'Arcane', amount: 0.06, color: '#8b00ff', icon: '🔮', ...PLAYER_ESSENCE.Arcane },
      { type: 'Chaos', amount: 0.04, color: '#ff00ff', icon: '🌀', ...PLAYER_ESSENCE.Chaos }
    ]
  },
  spiral: {
    name: 'Spiral',
    path: (() => {
      const points: SpellPath[] = []
      const segments = 40
      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const angle = t * Math.PI * 2 * 2.5
        const radius = 0.05 + t * 0.2
        points.push({
          x: 0.5 + Math.cos(angle) * radius,
          y: 0.5 + Math.sin(angle) * radius
        })
      }
      return points
    })(),
    color: '#ff8800',
    rarity: 'Legendary',
    minDamage: 30,
    maxDamage: 85,
    essenceCost: [
      { type: 'Energy', amount: 0.07, color: '#fab617', icon: '✨', ...PLAYER_ESSENCE.Energy },
      { type: 'Arcane', amount: 0.05, color: '#8b00ff', icon: '🔮', ...PLAYER_ESSENCE.Arcane }
    ]
  },
  godRune: {
    name: 'God Rune',
    path: (() => {
      const points: SpellPath[] = []
      // Create a star pattern
      const outerRadius = 0.3
      const innerRadius = 0.12
      const spikes = 5
      for (let i = 0; i <= spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
        const radius = i % 2 === 0 ? outerRadius : innerRadius
        points.push({
          x: 0.5 + Math.cos(angle) * radius,
          y: 0.5 + Math.sin(angle) * radius
        })
      }
      return points
    })(),
    color: '#ff0000',
    rarity: 'God Tier',
    minDamage: 50,
    maxDamage: 150,
    essenceCost: [
      { type: 'Chaos', amount: 0.10, color: '#ff00ff', icon: '🌀', ...PLAYER_ESSENCE.Chaos },
      { type: 'Arcane', amount: 0.08, color: '#8b00ff', icon: '🔮', ...PLAYER_ESSENCE.Arcane }
    ]
  }
}

export default function SpellCaster() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const trailCanvasRef = useRef<HTMLCanvasElement>(null)
  const guideCanvasRef = useRef<HTMLCanvasElement>(null)
  const pathCanvasRef = useRef<HTMLCanvasElement>(null)
  const flareCanvasRef = useRef<HTMLCanvasElement>(null)
  const thumbnailRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({})
  const animationRef = useRef<number>()
  const timerRef = useRef<number>()
  const shakeRef = useRef<number>(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [drawnPath, setDrawnPath] = useState<DrawnPoint[]>([])
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null)
  const [castResult, setCastResult] = useState<string>('')
  const [currentDamage, setCurrentDamage] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [score, setScore] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(5000) // 5 seconds in ms
  const [timerActive, setTimerActive] = useState<boolean>(false)
  const [playerEssence, setPlayerEssence] = useState(PLAYER_ESSENCE)
  const [essenceFlash, setEssenceFlash] = useState<{ [key: string]: boolean }>({})
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [guideSegments, setGuideSegments] = useState<{ x1: number, y1: number, x2: number, y2: number, broken: boolean }[]>([])
  
  const lastPointRef = useRef<Point | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const fragmentsRef = useRef<Fragment3D[]>([])
  const startTimeRef = useRef<number>(0)
  const accuracyPointsRef = useRef<number[]>([])
  const averageAccuracyRef = useRef<number>(0)
  const touchPositionRef = useRef<{ x: number, y: number } | null>(null)
  const guideIntervalRef = useRef<number>()

  // Create particles with rarity colors for critical hits
  const createParticle = (x: number, y: number, accuracy: number, isTouch: boolean = false): Particle => {
    // Random direction for explosive effect
    const angle = Math.random() * Math.PI * 2
    const speed = isTouch && accuracy >= 0.9 ? Math.random() * 8 + 5 : Math.random() * 5 + 3
    
    // Different particle effects based on accuracy
    let hue: number
    let saturation: number = 100
    let lightness: number = 50
    let size: number
    let particleColor: string | null = null
    
    if (accuracy >= 0.9) {
      // Critical hit - use spell rarity color
      if (selectedSpell && SPELLS[selectedSpell]) {
        const rarityColor = RARITY_COLORS[SPELLS[selectedSpell].rarity]
        particleColor = rarityColor
      }
      size = isTouch ? Math.random() * 5 + 3 : Math.random() * 3 + 2
      // Trigger shake effect
      if (isTouch && accuracy >= 0.95) shakeRef.current = 4
    } else if (accuracy >= 0.5) {
      // Medium - white sparks
      hue = 0
      saturation = 0
      lightness = 100
      size = isTouch ? Math.random() * 4 + 2 : Math.random() * 2 + 1
    } else {
      // Bad - tiny white sparks
      hue = 0
      saturation = 0
      lightness = 100
      size = isTouch ? Math.random() * 3 + 1 : Math.random() * 2 + 1
    }
    
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size,
      hue,
      saturation,
      lightness,
      glow: isTouch && accuracy >= 0.7,
      bounces: 0,
      color: particleColor  // Store rarity color if critical
    } as Particle
  }

  // More punishing damage calculation with time penalty
  const calculateDamage = (accuracy: number, spell: Spell, timeFactor: number = 1): number => {
    const scaledAccuracy = Math.max(0, Math.min(1, accuracy))
    
    // Much more punishing curve - exponential instead of logarithmic
    const curve = Math.pow(scaledAccuracy, 2.5) // Exponential curve, very punishing for low accuracy
    
    const damageRange = spell.maxDamage - spell.minDamage
    const damage = spell.minDamage + (damageRange * curve * timeFactor)
    
    return Math.round(damage)
  }

  // Draw spell thumbnail
  const drawSpellThumbnail = (canvas: HTMLCanvasElement, spell: Spell) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = RARITY_COLORS[spell.rarity]
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    ctx.beginPath()
    spell.path.forEach((point, index) => {
      const x = point.x * canvas.width
      const y = point.y * canvas.height
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    
    // Add start point indicator
    ctx.fillStyle = RARITY_COLORS[spell.rarity]
    ctx.beginPath()
    ctx.arc(spell.path[0].x * canvas.width, spell.path[0].y * canvas.height, 3, 0, Math.PI * 2)
    ctx.fill()
  }


  // Check if user path intersects guide and break it
  const checkAndBreakGuideSegments = useCallback((x: number, y: number, accuracy: number) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const px = x * rect.width
    const py = y * rect.height
    
    setGuideSegments(prev => prev.map(seg => {
      if (seg.broken) return seg
      
      // Check distance to segment center
      const midX = (seg.x1 + seg.x2) / 2
      const midY = (seg.y1 + seg.y2) / 2
      const dist = Math.sqrt((px - midX) ** 2 + (py - midY) ** 2)
      
      // Break if close enough and accurate
      if (dist < 12 && accuracy >= 0.9) {
        // Create 3D fragments
        const segLength = Math.sqrt((seg.x2 - seg.x1) ** 2 + (seg.y2 - seg.y1) ** 2)
        const numFragments = Math.max(4, Math.floor(segLength / 8))
        
        for (let i = 0; i < numFragments; i++) {
          const t = i / numFragments
          const fragX = seg.x1 + (seg.x2 - seg.x1) * t + (Math.random() - 0.5) * 5
          const fragY = seg.y1 + (seg.y2 - seg.y1) * t + (Math.random() - 0.5) * 5
          
          // Create 3D rectangular prism chunks
          fragmentsRef.current.push({
            x: fragX,
            y: fragY,
            z: 0,  // Start at guide depth
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * -2 - 1,  // Initial upward velocity
            vz: (Math.random() - 0.5) * 3,  // Depth velocity
            rotX: Math.random() * Math.PI * 2,
            rotY: Math.random() * Math.PI * 2,
            rotZ: Math.random() * Math.PI * 2,
            rotVelX: (Math.random() - 0.5) * 0.3,
            rotVelY: (Math.random() - 0.5) * 0.3,
            rotVelZ: (Math.random() - 0.5) * 0.3,
            width: Math.random() * 12 + 8,
            height: Math.random() * 8 + 6,
            depth: Math.random() * 6 + 4,
            color: RARITY_COLORS[SPELLS[selectedSpell!].rarity]
          })
        }
        return { ...seg, broken: true }
      }
      return seg
    }))
  }, [selectedSpell])

  // Helper function to draw 3D rectangular prism
  const draw3DPrism = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, depth: number, color: string) => {
    // Simple isometric 3D projection
    const isoX = 0.866  // cos(30°)
    const isoY = 0.5    // sin(30°)
    
    // Face vertices
    const front = [
      { x: x - width/2, y: y - height/2 },
      { x: x + width/2, y: y - height/2 },
      { x: x + width/2, y: y + height/2 },
      { x: x - width/2, y: y + height/2 }
    ]
    
    const back = [
      { x: x - width/2 + depth * isoX, y: y - height/2 - depth * isoY },
      { x: x + width/2 + depth * isoX, y: y - height/2 - depth * isoY },
      { x: x + width/2 + depth * isoX, y: y + height/2 - depth * isoY },
      { x: x - width/2 + depth * isoX, y: y + height/2 - depth * isoY }
    ]
    
    // Draw back face (darker)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.moveTo(back[0].x, back[0].y)
    back.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fill()
    
    // Draw top face (medium)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.moveTo(front[0].x, front[0].y)
    ctx.lineTo(front[1].x, front[1].y)
    ctx.lineTo(back[1].x, back[1].y)
    ctx.lineTo(back[0].x, back[0].y)
    ctx.closePath()
    ctx.fill()
    
    // Draw right face (lighter)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.moveTo(front[1].x, front[1].y)
    ctx.lineTo(front[2].x, front[2].y)
    ctx.lineTo(back[2].x, back[2].y)
    ctx.lineTo(back[1].x, back[1].y)
    ctx.closePath()
    ctx.fill()
    
    // Draw front face (brightest)
    ctx.fillStyle = color
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.moveTo(front[0].x, front[0].y)
    front.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fill()
    
    // Draw edges for definition
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 1
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.moveTo(front[0].x, front[0].y)
    front.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.stroke()
  }

  // Draw guide path - 3D rectangular prism that breaks
  const drawGuidePath = useCallback(() => {
    if (!guideCanvasRef.current || !selectedSpell) return
    const canvas = guideCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const spell = SPELLS[selectedSpell]
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw 3D prism segments that haven't been broken
    guideSegments.forEach((seg) => {
      if (!seg.broken) {
        // Calculate segment angle and midpoint
        const dx = seg.x2 - seg.x1
        const dy = seg.y2 - seg.y1
        const midX = (seg.x1 + seg.x2) / 2
        const midY = (seg.y1 + seg.y2) / 2
        const segLength = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        
        // Draw 3D prism for this segment
        ctx.save()
        ctx.translate(midX, midY)
        ctx.rotate(angle)
        draw3DPrism(ctx, 0, 0, segLength, 12, 8, RARITY_COLORS[spell.rarity])
        ctx.restore()
      }
    })
    
    // Draw glow effect
    ctx.shadowBlur = 15
    ctx.shadowColor = RARITY_COLORS[spell.rarity]
    ctx.globalAlpha = 0.3
    guideSegments.forEach((seg) => {
      if (!seg.broken) {
        ctx.strokeStyle = RARITY_COLORS[spell.rarity]
        ctx.lineWidth = 20
        ctx.beginPath()
        ctx.moveTo(seg.x1, seg.y1)
        ctx.lineTo(seg.x2, seg.y2)
        ctx.stroke()
      }
    })
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
    
    // Draw start point
    ctx.fillStyle = RARITY_COLORS[spell.rarity]
    ctx.font = 'bold 16px Inter'
    ctx.fillText('START', spell.path[0].x * canvas.width - 30, spell.path[0].y * canvas.height - 12)
    ctx.beginPath()
    ctx.arc(spell.path[0].x * canvas.width, spell.path[0].y * canvas.height, 8, 0, Math.PI * 2)
    ctx.fill()
  }, [selectedSpell, guideSegments])

  // Draw user path with smoothing
  const drawUserPath = useCallback(() => {
    if (!pathCanvasRef.current || drawnPath.length === 0) return
    const canvas = pathCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = 0.5 // 50% opacity for user line
    
    // Enable smoothing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Draw with quadratic curves for smoothing
    if (drawnPath.length > 2) {
      for (let i = 1; i < drawnPath.length - 1; i++) {
        const prev = drawnPath[i - 1]
        const curr = drawnPath[i]
        const next = drawnPath[i + 1]
        
        // Calculate control point
        const cpx = curr.x * canvas.width
        const cpy = curr.y * canvas.height
        
        // Color gradient from white (accurate) to red (inaccurate)
        let color: string
        if (curr.accuracy >= 0.9) {
          // White for very accurate
          color = 'white'
        } else if (curr.accuracy >= 0.3) {
          // Gradient from white to red
          const t = (curr.accuracy - 0.3) / 0.6
          const r = 255
          const g = Math.round(255 * t)
          const b = Math.round(255 * t)
          color = `rgb(${r}, ${g}, ${b})`
        } else {
          // Pure red for very inaccurate
          color = '#ff0000'
        }
        
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height)
        ctx.quadraticCurveTo(
          cpx, cpy,
          (curr.x + next.x) / 2 * canvas.width,
          (curr.y + next.y) / 2 * canvas.height
        )
        ctx.stroke()
      }
    } else {
      // Fallback for short paths
      for (let i = 1; i < drawnPath.length; i++) {
        const prev = drawnPath[i - 1]
        const curr = drawnPath[i]
        
        let color: string
        if (curr.accuracy >= 0.98) {
          color = 'white'
        } else if (curr.accuracy >= 0.85) {
          const lightness = 70 + curr.accuracy * 15
          color = `hsl(200, 100%, ${lightness}%)`
        } else if (curr.accuracy >= 0.6) {
          const t = (curr.accuracy - 0.6) / 0.25
          const hue = 60 + t * 140
          color = `hsl(${hue}, 100%, 55%)`
        } else if (curr.accuracy >= 0.3) {
          const hue = 60 - (0.6 - curr.accuracy) * 60
          color = `hsl(${hue}, 100%, 50%)`
        } else {
          const lightness = 40 + curr.accuracy * 20
          color = `hsl(0, 100%, ${lightness}%)`
        }
        
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height)
        ctx.lineTo(curr.x * canvas.width, curr.y * canvas.height)
        ctx.stroke()
      }
    }
    
    ctx.globalAlpha = 1 // Reset opacity
  }, [drawnPath])

  // Draw lens flare at touch point
  const drawLensFlare = useCallback(() => {
    if (!flareCanvasRef.current || !touchPositionRef.current || !isDrawing) return
    const canvas = flareCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const x = touchPositionRef.current.x
    const y = touchPositionRef.current.y
    
    // Main glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.2, 'rgba(255, 255, 200, 0.4)')
    gradient.addColorStop(0.5, 'rgba(250, 182, 23, 0.2)')
    gradient.addColorStop(1, 'rgba(250, 182, 23, 0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(x - 40, y - 40, 80, 80)
    
    // Lens flare rays
    const time = Date.now() * 0.002
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i + time
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30)
      ctx.stroke()
    }
    
    // Center bright spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }, [isDrawing])

  // Calculate distance from point to path
  const getDistanceToPath = (point: Point, spell: Spell): number => {
    if (!canvasRef.current) return Infinity
    const rect = canvasRef.current.getBoundingClientRect()
    
    let minDistance = Infinity
    for (let i = 0; i < spell.path.length - 1; i++) {
      const p1 = spell.path[i]
      const p2 = spell.path[i + 1]
      
      const A = point.x - p1.x
      const B = point.y - p1.y
      const C = p2.x - p1.x
      const D = p2.y - p1.y
      
      const dot = A * C + B * D
      const lenSq = C * C + D * D
      let param = -1
      
      if (lenSq !== 0) param = dot / lenSq
      
      let xx, yy
      
      if (param < 0) {
        xx = p1.x
        yy = p1.y
      } else if (param > 1) {
        xx = p2.x
        yy = p2.y
      } else {
        xx = p1.x + param * C
        yy = p1.y + param * D
      }
      
      const dx = point.x - xx
      const dy = point.y - yy
      const distance = Math.sqrt(dx * dx + dy * dy) * rect.width
      
      if (distance < minDistance) {
        minDistance = distance
      }
    }
    
    return minDistance
  }

  // Handle mouse/touch start  
  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current || !selectedSpell) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    
    setIsDrawing(true)
    setHasDrawn(false)
    setCurrentPath([{ x, y, time: Date.now() }])
    setDrawnPath([])
    setCastResult('')
    setCurrentDamage(0)
    setElapsedTime(0)
    setScore(0)  // Reset score
    setTimeRemaining(5000)  // Reset to 5 seconds
    setTimerActive(true)  // Start timer
    lastPointRef.current = { x, y, time: Date.now() }
    startTimeRef.current = Date.now()
    accuracyPointsRef.current = []
    averageAccuracyRef.current = 0
    touchPositionRef.current = { x: x * rect.width, y: y * rect.height }
    
    // Start timer and score updater
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, 5000 - elapsed)
      setElapsedTime(elapsed)
      setTimeRemaining(remaining)
      
      // Auto-end when time runs out
      if (remaining === 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = undefined
        }
        setIsDrawing(false)
        setHasDrawn(true)
        setTimerActive(false)
        touchPositionRef.current = null
      }
    }, 16)  // 60fps update
  }, [selectedSpell])

  // Handle mouse/touch move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing || !canvasRef.current || !selectedSpell) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    
    touchPositionRef.current = { x: x * rect.width, y: y * rect.height }
    
    const point = { x, y, time: Date.now() }
    setCurrentPath(prev => [...prev, point])
    
    // Calculate accuracy and score
    const spell = SPELLS[selectedSpell]
    const distance = getDistanceToPath(point, spell)
    const maxDistance = 80 // Distance threshold
    const accuracy = Math.max(0, 1 - distance / maxDistance)
    accuracyPointsRef.current.push(accuracy)
    
    // NEW SCORING: Reward being on the line, penalize being far
    let scoreGain = 0
    if (distance < 10) {
      // Very close to center - big points!
      scoreGain = 10
    } else if (distance < 25) {
      // On the guideline - good points
      scoreGain = 5
    } else if (distance < 50) {
      // Near the guideline - small points
      scoreGain = 2
    } else {
      // Far from guideline - lose points (discourages scribbling)
      scoreGain = -3
    }
    
    setScore(prev => Math.max(0, prev + scoreGain))  // Can't go below 0
    
    // Update average accuracy for damage calculation
    averageAccuracyRef.current = accuracyPointsRef.current.reduce((a, b) => a + b, 0) / accuracyPointsRef.current.length
    const currentDmg = calculateDamage(averageAccuracyRef.current, spell, 1)  // No time penalty in damage
    setCurrentDamage(currentDmg)
    
    // Check if we should break guide segments
    checkAndBreakGuideSegments(x, y, accuracy)
    
    // Add to drawn path
    setDrawnPath(prev => [...prev, { x, y, accuracy }])
    
    // Create intense particles at touch point
    if (lastPointRef.current) {
      const dx = x - lastPointRef.current.x
      const dy = y - lastPointRef.current.y
      const pathDistance = Math.sqrt(dx * dx + dy * dy)
      const steps = Math.max(1, Math.floor(pathDistance * rect.width / 5))
      
      for (let i = 0; i < steps; i++) {
        const t = i / steps
        const px = lastPointRef.current.x + dx * t
        const py = lastPointRef.current.y + dy * t
        
        // More particles when on the guideline
        const particleCount = accuracy >= 0.9 ? 12 : accuracy >= 0.7 ? 8 : accuracy >= 0.5 ? 4 : 2
        for (let j = 0; j < particleCount; j++) {
          particlesRef.current.push(createParticle(
            px * rect.width,
            py * rect.height,
            accuracy,
            true
          ))
        }
        
        // Burst when perfect
        if (accuracy >= 0.95) {
          for (let k = 0; k < 8; k++) {
            const burstParticle = createParticle(px * rect.width, py * rect.height, accuracy, true)
            burstParticle.vx *= 1.5
            burstParticle.vy *= 1.5
            particlesRef.current.push(burstParticle)
          }
        }
      }
    }
    
    lastPointRef.current = point
  }, [isDrawing, selectedSpell])

  // Handle mouse/touch end
  const handleEnd = useCallback(() => {
    if (!isDrawing || !selectedSpell) return
    setIsDrawing(false)
    setHasDrawn(true)
    setTimerActive(false)
    touchPositionRef.current = null
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = undefined
    }
    
    const spell = SPELLS[selectedSpell]
    const endTime = Date.now()
    const timeTaken = (endTime - startTimeRef.current) / 1000
    
    // Keep drawn path visible
    drawUserPath()
    
    // Calculate scores with harsher penalties
    const avgAccuracy = accuracyPointsRef.current.length > 0 
      ? accuracyPointsRef.current.reduce((a, b) => a + b, 0) / accuracyPointsRef.current.length 
      : 0
    
    const elapsedSeconds = (endTime - startTimeRef.current) / 1000
    const timePenalty = Math.max(0.15, 1 - (elapsedSeconds * 0.15)) // Lose 15% per second
    const finalDamage = calculateDamage(avgAccuracy, spell, timePenalty)
    setCurrentDamage(finalDamage)
    
    // Check if spell was successful
    if (avgAccuracy >= 0.3) {
      castSpell(selectedSpell, finalDamage)
      
      // Deduct essence with flash effect
      const newEssence = { ...playerEssence }
      const flashEffects: { [key: string]: boolean } = {}
      spell.essenceCost.forEach(cost => {
        if (newEssence[cost.type]) {
          newEssence[cost.type] = {
            ...newEssence[cost.type],
            owned: Math.max(0, newEssence[cost.type].owned - cost.amount)
          }
          flashEffects[cost.type] = true
        }
      })
      setPlayerEssence(newEssence)
      setEssenceFlash(flashEffects)
      setTimeout(() => setEssenceFlash({}), 500)
    } else {
      setCastResult('Too inaccurate!')
    }
    
    setCurrentPath([])
    lastPointRef.current = null
    accuracyPointsRef.current = []
    averageAccuracyRef.current = 0
    shakeRef.current = 0
  }, [isDrawing, selectedSpell, drawUserPath, playerEssence])

  // Cast spell effect
  const castSpell = (spell: string, damage: number) => {
    setCastResult(`${SPELLS[spell].name}! ${damage} DMG`)
    
    // Explosion effect
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      for (let i = 0; i < 40; i++) {
        const angle = (Math.PI * 2 * i) / 40
        const speed = Math.random() * 10 + 5
        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: Math.random() * 5 + 3,
          hue: 60,
          saturation: 100,
          lightness: 50 + Math.random() * 30,
          glow: true
        })
      }
    }
    
    setTimeout(() => {
      setSelectedSpell(null)
      setCastResult('')
      setDrawnPath([])
      setHasDrawn(false)
      setCurrentDamage(0)
      setElapsedTime(0)
      // Clear fragments when spell is done
      fragmentsRef.current = []
      if (pathCanvasRef.current) {
        const ctx = pathCanvasRef.current.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, pathCanvasRef.current.width, pathCanvasRef.current.height)
      }
      if (guideCanvasRef.current) {
        const ctx = guideCanvasRef.current.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, guideCanvasRef.current.width, guideCanvasRef.current.height)
      }
    }, 2000)
  }

  // Update floating texts
  useEffect(() => {
    if (floatingTexts.length === 0) return
    
    const interval = setInterval(() => {
      setFloatingTexts(prev => prev.map(text => ({
        ...text,
        y: text.y + text.vy,
        vy: text.vy + 0.1,
        life: text.life - 0.02
      })).filter(text => text.life > 0))
    }, 16)
    
    return () => clearInterval(interval)
  }, [floatingTexts.length])

  // Animation loop with screen shake
  useEffect(() => {
    const canvas = canvasRef.current
    const trailCanvas = trailCanvasRef.current
    const flareCanvas = flareCanvasRef.current
    if (!canvas || !trailCanvas || !flareCanvas) return
    
    const ctx = canvas.getContext('2d')
    const trailCtx = trailCanvas.getContext('2d')
    if (!ctx || !trailCtx) return
    
    const animate = () => {
      // Apply screen shake
      if (shakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * shakeRef.current
        const shakeY = (Math.random() - 0.5) * shakeRef.current
        canvas.style.transform = `translate(${shakeX}px, ${shakeY}px)`
        trailCanvas.style.transform = `translate(${shakeX}px, ${shakeY}px)`
        shakeRef.current *= 0.9
        if (shakeRef.current < 0.1) {
          shakeRef.current = 0
          canvas.style.transform = ''
          trailCanvas.style.transform = ''
        }
      }
      
      // Clear canvases
      ctx.fillStyle = hasDrawn ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      trailCtx.fillStyle = hasDrawn ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.02)'
      trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height)
      
      // Update particles with wall bouncing physics
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx
        particle.y += particle.vy
        
        // Wall bouncing with energy loss
        const bounceDamping = 0.7
        if (particle.x <= particle.size || particle.x >= canvas.width - particle.size) {
          particle.vx *= -bounceDamping
          particle.x = particle.x <= particle.size ? particle.size : canvas.width - particle.size
          particle.bounces = (particle.bounces || 0) + 1
        }
        if (particle.y <= particle.size || particle.y >= canvas.height - particle.size) {
          particle.vy *= -bounceDamping
          particle.y = particle.y <= particle.size ? particle.size : canvas.height - particle.size
          particle.bounces = (particle.bounces || 0) + 1
        }
        
        // Apply gravity and air resistance
        particle.vx *= 0.98
        particle.vy += 0.5  // Gravity
        
        // Fade out after multiple bounces or time
        particle.life -= hasDrawn ? 0.02 : 0.01
        if (particle.bounces && particle.bounces > 3) {
          particle.life -= 0.02  // Fade faster after bouncing
        }
        
        if (particle.life <= 0) return false
        
        // Draw particle
        ctx.globalAlpha = particle.life * 0.8
        if (particle.color) {
          // Use rarity color for critical hits
          ctx.fillStyle = particle.color
          ctx.shadowBlur = particle.size * 2
          ctx.shadowColor = particle.color
        } else {
          ctx.fillStyle = `hsl(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%)`
          ctx.shadowBlur = 0
        }
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        
        // Draw glow
        if (particle.glow && particle.life > 0.3) {
          trailCtx.globalAlpha = particle.life * 0.4
          const gradient = trailCtx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 3
          )
          gradient.addColorStop(0, `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, 1)`)
          gradient.addColorStop(1, `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, 0)`)
          trailCtx.fillStyle = gradient
          trailCtx.fillRect(
            particle.x - particle.size * 3,
            particle.y - particle.size * 3,
            particle.size * 6,
            particle.size * 6
          )
        }
        
        return true
      })
      
      // Update 3D fragments with realistic physics
      fragmentsRef.current.forEach((fragment, idx) => {
        if (!fragment.settled) {
          fragment.x += fragment.vx
          fragment.y += fragment.vy
          fragment.z += fragment.vz
          fragment.vy += 0.6  // Gravity
          fragment.vx *= 0.96  // Air resistance
          fragment.vz *= 0.96
          
          // Update rotations
          fragment.rotX += fragment.rotVelX
          fragment.rotY += fragment.rotVelY
          fragment.rotZ += fragment.rotVelZ
          fragment.rotVelX *= 0.98
          fragment.rotVelY *= 0.98
          fragment.rotVelZ *= 0.98
          
          // Check collision with floor
          if (fragment.y + fragment.height/2 >= canvas.height - 20) {
            fragment.y = canvas.height - 20 - fragment.height/2
            fragment.vy *= -0.3  // Bounce with energy loss
            fragment.vx *= 0.7
            fragment.vz *= 0.7
            fragment.rotVelX *= 0.5
            fragment.rotVelY *= 0.5
            fragment.rotVelZ *= 0.5
            
            if (Math.abs(fragment.vy) < 1 && Math.abs(fragment.vx) < 0.5) {
              fragment.settled = true
              fragment.vy = 0
              fragment.vx = 0
              fragment.vz = 0
              fragment.rotVelX = 0
              fragment.rotVelY = 0
              fragment.rotVelZ = 0
            }
          }
          
          // Check collision with walls
          if (fragment.x - fragment.width/2 <= 0 || fragment.x + fragment.width/2 >= canvas.width) {
            fragment.vx *= -0.5
            fragment.x = fragment.x - fragment.width/2 <= 0 ? fragment.width/2 : canvas.width - fragment.width/2
          }
          
          // Check collision with other settled fragments (3D stacking)
          fragmentsRef.current.forEach((other, otherIdx) => {
            if (idx !== otherIdx && other.settled) {
              const dx = fragment.x - other.x
              const dy = fragment.y - other.y
              const dz = fragment.z - other.z
              const minDistX = (fragment.width + other.width) / 2
              const minDistY = (fragment.height + other.height) / 2
              const minDistZ = (fragment.depth + other.depth) / 2
              
              // 3D AABB collision
              if (Math.abs(dx) < minDistX && 
                  Math.abs(dz) < minDistZ &&
                  fragment.y + fragment.height/2 > other.y - other.height/2 &&
                  fragment.y - fragment.height/2 < other.y + other.height/2) {
                
                // Stack on top
                if (fragment.vy > 0 && fragment.y < other.y) {
                  fragment.y = other.y - other.height/2 - fragment.height/2
                  fragment.vy *= -0.2
                  fragment.vx *= 0.5
                  fragment.vz *= 0.5
                  
                  // Settle if slow enough
                  if (Math.abs(fragment.vy) < 0.8) {
                    fragment.settled = true
                    fragment.vy = 0
                    fragment.vx = 0
                    fragment.vz = 0
                    fragment.rotVelX = 0
                    fragment.rotVelY = 0
                    fragment.rotVelZ = 0
                  }
                }
              }
            }
          })
        }
        
        // Draw 3D fragment
        ctx.save()
        ctx.globalAlpha = fragment.settled ? 1 : 0.95
        
        // Apply 3D transformations
        const scale = 1 - fragment.z / 500  // Perspective scaling
        const projectedX = fragment.x + fragment.z * 0.2
        const projectedY = fragment.y - fragment.z * 0.1
        
        ctx.translate(projectedX, projectedY)
        
        // Apply rotations (simplified)
        const cos = Math.cos(fragment.rotZ)
        const sin = Math.sin(fragment.rotZ)
        
        // Draw 3D prism with rotation
        const vertices = [
          // Front face
          { x: -fragment.width/2 * scale, y: -fragment.height/2 * scale, z: -fragment.depth/2 },
          { x: fragment.width/2 * scale, y: -fragment.height/2 * scale, z: -fragment.depth/2 },
          { x: fragment.width/2 * scale, y: fragment.height/2 * scale, z: -fragment.depth/2 },
          { x: -fragment.width/2 * scale, y: fragment.height/2 * scale, z: -fragment.depth/2 },
          // Back face
          { x: -fragment.width/2 * scale, y: -fragment.height/2 * scale, z: fragment.depth/2 },
          { x: fragment.width/2 * scale, y: -fragment.height/2 * scale, z: fragment.depth/2 },
          { x: fragment.width/2 * scale, y: fragment.height/2 * scale, z: fragment.depth/2 },
          { x: -fragment.width/2 * scale, y: fragment.height/2 * scale, z: fragment.depth/2 }
        ]
        
        // Rotate vertices
        const rotatedVertices = vertices.map(v => ({
          x: v.x * cos - v.y * sin,
          y: v.x * sin + v.y * cos + v.z * 0.3,  // Add z to y for isometric effect
          z: v.z
        }))
        
        // Draw faces (painter's algorithm - back to front)
        // Top face
        ctx.fillStyle = fragment.color
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(rotatedVertices[0].x, rotatedVertices[0].y)
        ctx.lineTo(rotatedVertices[1].x, rotatedVertices[1].y)
        ctx.lineTo(rotatedVertices[5].x, rotatedVertices[5].y)
        ctx.lineTo(rotatedVertices[4].x, rotatedVertices[4].y)
        ctx.closePath()
        ctx.fill()
        
        // Right face
        ctx.fillStyle = fragment.color
        ctx.globalAlpha = 0.85
        ctx.beginPath()
        ctx.moveTo(rotatedVertices[1].x, rotatedVertices[1].y)
        ctx.lineTo(rotatedVertices[2].x, rotatedVertices[2].y)
        ctx.lineTo(rotatedVertices[6].x, rotatedVertices[6].y)
        ctx.lineTo(rotatedVertices[5].x, rotatedVertices[5].y)
        ctx.closePath()
        ctx.fill()
        
        // Front face (brightest)
        ctx.fillStyle = fragment.color
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.moveTo(rotatedVertices[0].x, rotatedVertices[0].y)
        ctx.lineTo(rotatedVertices[1].x, rotatedVertices[1].y)
        ctx.lineTo(rotatedVertices[2].x, rotatedVertices[2].y)
        ctx.lineTo(rotatedVertices[3].x, rotatedVertices[3].y)
        ctx.closePath()
        ctx.fill()
        
        // Add highlight for depth
        const highlight = ctx.createLinearGradient(0, -fragment.height/2 * scale, 0, fragment.height/2 * scale)
        highlight.addColorStop(0, 'rgba(255,255,255,0.3)')
        highlight.addColorStop(1, 'rgba(0,0,0,0.3)')
        ctx.fillStyle = highlight
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(rotatedVertices[0].x, rotatedVertices[0].y)
        ctx.lineTo(rotatedVertices[1].x, rotatedVertices[1].y)
        ctx.lineTo(rotatedVertices[2].x, rotatedVertices[2].y)
        ctx.lineTo(rotatedVertices[3].x, rotatedVertices[3].y)
        ctx.closePath()
        ctx.fill()
        
        ctx.restore()
      })
      
      // Draw lens flare
      drawLensFlare()
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [hasDrawn, drawLensFlare])

  // Draw thumbnails
  useEffect(() => {
    Object.entries(SPELLS).forEach(([key, spell]) => {
      const canvas = thumbnailRefs.current[key]
      if (canvas) {
        drawSpellThumbnail(canvas, spell)
      }
    })
  }, [])

  // Initialize guide segments when spell is selected
  useEffect(() => {
    if (selectedSpell && guideCanvasRef.current) {
      const spell = SPELLS[selectedSpell]
      const canvas = guideCanvasRef.current
      const segments: typeof guideSegments = []
      
      // Create many small segments for better breaking effect
      for (let i = 0; i < spell.path.length - 1; i++) {
        const p1 = spell.path[i]
        const p2 = spell.path[i + 1]
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const numSegments = Math.max(1, Math.floor(distance * canvas.width / 15)) // Break into ~15px segments
        
        for (let j = 0; j < numSegments; j++) {
          const t1 = j / numSegments
          const t2 = (j + 1) / numSegments
          segments.push({
            x1: (p1.x + dx * t1) * canvas.width,
            y1: (p1.y + dy * t1) * canvas.height,
            x2: (p1.x + dx * t2) * canvas.width,
            y2: (p1.y + dy * t2) * canvas.height,
            broken: false
          })
        }
      }
      setGuideSegments(segments)
    }
  }, [selectedSpell])
  
  // Draw guide path continuously
  useEffect(() => {
    if (selectedSpell) {
      // Set up animation frame loop for smooth updates
      let animationId: number
      const animate = () => {
        drawGuidePath()
        animationId = requestAnimationFrame(animate)
      }
      animationId = requestAnimationFrame(animate)
      
      return () => {
        cancelAnimationFrame(animationId)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = undefined
        }
      }
    }
  }, [selectedSpell, drawGuidePath])

  // Draw user path
  useEffect(() => {
    drawUserPath()
  }, [drawnPath, drawUserPath])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvases = [canvasRef.current, trailCanvasRef.current, guideCanvasRef.current, pathCanvasRef.current, flareCanvasRef.current]
      if (canvases.every(c => c)) {
        const container = canvasRef.current!.parentElement
        if (container) {
          canvases.forEach(canvas => {
            if (canvas) {
              canvas.width = container.clientWidth
              canvas.height = container.clientHeight
            }
          })
          
          if (selectedSpell) {
            drawGuidePath()
          }
          if (drawnPath.length > 0) {
            drawUserPath()
          }
        }
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedSpell, drawGuidePath, drawnPath, drawUserPath])

  return (
    <div className="spell-caster-game">
      <BackgroundEffects />
      
      <div className="game-header">
        <h1>SPELL CASTER</h1>
        <p>Trace the pattern - Stay on the line for maximum points!</p>
      </div>
      
      {/* Large prominent timer bar */}
      {selectedSpell && (
        <div className="countdown-bar-container">
          <div 
            className="countdown-bar-fill" 
            style={{
              width: `${(timeRemaining / 5000) * 100}%`,
              backgroundColor: timeRemaining < 1000 ? '#ff4444' : timeRemaining < 2000 ? '#ffaa44' : '#44ff44'
            }}
          />
          <div className="countdown-text">
            {(timeRemaining / 1000).toFixed(1)}s
          </div>
        </div>
      )}
      
      {/* Score display */}
      {score > 0 && (
        <div className="score-display">
          SCORE: {score}
        </div>
      )}
      
      <div className="canvas-container">
        {selectedSpell && (
          <div className="damage-bar-container">
            <div className="damage-label damage-min">{SPELLS[selectedSpell].minDamage}</div>
            <div className="damage-bar">
              <div 
                className="damage-bar-fill" 
                style={{
                  width: `${((currentDamage - SPELLS[selectedSpell].minDamage) / (SPELLS[selectedSpell].maxDamage - SPELLS[selectedSpell].minDamage)) * 100}%`
                }}
              />
              {currentDamage > 0 && (
                <div className="damage-current">{currentDamage}</div>
              )}
            </div>
            <div className="damage-label damage-max">{SPELLS[selectedSpell].maxDamage}</div>
          </div>
        )}
        <canvas
          ref={guideCanvasRef}
          className="guide-canvas"
        />
        <canvas
          ref={pathCanvasRef}
          className="path-canvas"
        />
        <canvas
          ref={flareCanvasRef}
          className="flare-canvas"
        />
        <canvas
          ref={trailCanvasRef}
          className="trail-canvas"
        />
        <canvas
          ref={canvasRef}
          className="main-canvas"
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => {
            const touch = e.touches[0]
            handleStart(touch.clientX, touch.clientY)
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0]
            handleMove(touch.clientX, touch.clientY)
          }}
          onTouchEnd={handleEnd}
        />
        {castResult && (
          <div className="cast-result">{castResult}</div>
        )}
        {!selectedSpell && (
          <div className="select-prompt">Select a spell below to begin</div>
        )}
      </div>
      
      {/* Floating text elements */}
      {floatingTexts.map((text, idx) => (
        <div
          key={idx}
          style={{
            position: 'fixed',
            left: text.x,
            top: text.y,
            color: text.color,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            opacity: text.life,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            textShadow: '0 0 5px rgba(0,0,0,0.8)',
            zIndex: 1000
          }}
        >
          {text.text}
        </div>
      ))}
      
      <div className="spell-grid">
        {Object.entries(SPELLS).map(([key, spell]) => (
          <div 
            key={key} 
            className={`spell-card`}
            style={{ borderColor: selectedSpell === key ? RARITY_COLORS[spell.rarity] : RARITY_COLORS[spell.rarity] + '40' }}
            onClick={() => {
              setSelectedSpell(key)
              setHasDrawn(false)
              setDrawnPath([])
              
              // Flash essence bars and show floating cost
              const spell = SPELLS[key]
              const flashEffects: { [key: string]: boolean } = {}
              
              spell.essenceCost.forEach((cost, idx) => {
                flashEffects[cost.type] = true
              })
              
              setEssenceFlash(flashEffects)
              setTimeout(() => setEssenceFlash({}), 300)
            }}
          >
            <div className="spell-card-left">
              <canvas
                ref={(el) => thumbnailRefs.current[key] = el}
                className="spell-thumbnail"
                width={60}
                height={60}
              />
              <div className="spell-info">
                <div className="spell-name" style={{ color: RARITY_COLORS[spell.rarity] }}>
                  {spell.name}
                </div>
                <div className="spell-stats">
                  <span className="spell-rarity" style={{ color: RARITY_COLORS[spell.rarity] }}>
                    {spell.rarity}
                  </span>
                  <span className="spell-damage">
                    <span className="spell-damage-label">Damage:</span>
                    {spell.minDamage}-{spell.maxDamage}
                  </span>
                </div>
              </div>
            </div>
            <div className="spell-card-right">
              {spell.essenceCost.map((essence, idx) => (
                <div key={idx} className="essence-row">
                  <span className="essence-icon">{essence.icon}</span>
                  <div className="essence-bar-container">
                    <div className="essence-label">
                      {essence.type}
                    </div>
                    <div className="essence-bar">
                      <div 
                        className={`essence-bar-fill ${essenceFlash[essence.type] ? 'flash' : ''}`}
                        style={{
                          width: `${(essence.owned / essence.max) * 100}%`,
                          backgroundColor: essence.color
                        }}
                      />
                    </div>
                    <div className="essence-tooltip">
                      {essence.owned.toFixed(2)}/{essence.max.toFixed(2)} remaining
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}