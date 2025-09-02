'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// Simple linear spell patterns with essence costs
const SPELL_PATTERNS = {
  lightning: {
    name: 'Lightning',
    fluxRange: { min: 15, max: 70 },
    color: '#FFFF00',
    essenceCost: [
      { type: 'Lightning', amount: 0.04, icon: '⚡' },
      { type: 'Energy', amount: 0.03, icon: '✨' }
    ],
    points: [
      { x: 0.3, y: 0.2 },
      { x: 0.4, y: 0.3 },
      { x: 0.5, y: 0.25 },
      { x: 0.6, y: 0.4 },
      { x: 0.7, y: 0.35 },
      { x: 0.8, y: 0.5 }
    ]
  },
  wave: {
    name: 'Wave',
    fluxRange: { min: 12, max: 60 },
    color: '#FFCC00',
    essenceCost: [
      { type: 'Water', amount: 0.03, icon: '💧' },
      { type: 'Energy', amount: 0.02, icon: '✨' }
    ],
    points: [
      { x: 0.2, y: 0.4 },
      { x: 0.3, y: 0.3 },
      { x: 0.4, y: 0.4 },
      { x: 0.5, y: 0.3 },
      { x: 0.6, y: 0.4 },
      { x: 0.7, y: 0.3 },
      { x: 0.8, y: 0.4 }
    ]
  },
  arc: {
    name: 'Arc',
    fluxRange: { min: 20, max: 80 },
    color: '#CCFF00',
    essenceCost: [
      { type: 'Arcane', amount: 0.06, icon: '🔮' },
      { type: 'Chaos', amount: 0.04, icon: '🌀' }
    ],
    points: [
      { x: 0.2, y: 0.5 },
      { x: 0.3, y: 0.35 },
      { x: 0.4, y: 0.25 },
      { x: 0.5, y: 0.2 },
      { x: 0.6, y: 0.25 },
      { x: 0.7, y: 0.35 },
      { x: 0.8, y: 0.5 }
    ]
  },
  zigzag: {
    name: 'Zigzag',
    fluxRange: { min: 10, max: 50 },
    color: '#FF9900',
    essenceCost: [
      { type: 'Fire', amount: 0.03, icon: '🔥' },
      { type: 'Energy', amount: 0.02, icon: '⚡' }
    ],
    points: [
      { x: 0.2, y: 0.3 },
      { x: 0.35, y: 0.5 },
      { x: 0.5, y: 0.3 },
      { x: 0.65, y: 0.5 },
      { x: 0.8, y: 0.3 }
    ]
  },
  stairs: {
    name: 'Stairs',
    fluxRange: { min: 18, max: 65 },
    color: '#FF80CC',
    essenceCost: [
      { type: 'Energy', amount: 0.07, icon: '✨' },
      { type: 'Arcane', amount: 0.05, icon: '🔮' }
    ],
    points: [
      { x: 0.25, y: 0.5 },
      { x: 0.35, y: 0.5 },
      { x: 0.35, y: 0.4 },
      { x: 0.45, y: 0.4 },
      { x: 0.45, y: 0.3 },
      { x: 0.55, y: 0.3 },
      { x: 0.55, y: 0.2 },
      { x: 0.65, y: 0.2 }
    ]
  },
  spiral: {
    name: 'Spiral',
    fluxRange: { min: 25, max: 75 },
    color: '#80CCFF',
    essenceCost: [
      { type: 'Frost', amount: 0.05, icon: '❄️' },
      { type: 'Water', amount: 0.03, icon: '💧' }
    ],
    points: ((): { x: number; y: number }[] => {
      const points = []
      for (let t = 0; t < Math.PI * 2; t += 0.3) {
        const r = t / (Math.PI * 2) * 0.2
        points.push({
          x: 0.5 + Math.cos(t) * r,
          y: 0.35 + Math.sin(t) * r
        })
      }
      return points
    })()
  }
}

interface Fragment {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  rotation: number
  rotationSpeed: number
  color: string
  opacity: number
}

interface GuideParticle {
  x: number
  y: number
  visible: boolean
  size: number
  color: string
  opacity: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

// Helper function to check if a point is near the path
function isPointNearPath(
  x: number, 
  y: number, 
  points: {x: number, y: number}[], 
  canvas: HTMLCanvasElement,
  threshold: number
): boolean {
  // Check distance to each line segment in the path
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    const x1 = p1.x * canvas.width
    const y1 = p1.y * canvas.height
    const x2 = p2.x * canvas.width
    const y2 = p2.y * canvas.height
    
    // Calculate distance from point to line segment
    const A = x - x1
    const B = y - y1
    const C = x2 - x1
    const D = y2 - y1
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    
    if (lenSq !== 0) {
      param = dot / lenSq
    }
    
    let xx, yy
    
    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }
    
    const distX = x - xx
    const distY = y - yy
    const distance = Math.sqrt(distX * distX + distY * distY)
    
    if (distance <= threshold) {
      return true
    }
  }
  
  return false
}

export default function SpellCasterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [currentSpell, setCurrentSpell] = useState<keyof typeof SPELL_PATTERNS>('lightning')
  const [fluxGenerated, setFluxGenerated] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [isDrawing, setIsDrawing] = useState(false)
  const [totalFlux, setTotalFlux] = useState(0)
  const [screenShake, setScreenShake] = useState(0)
  const [wallHitEffect, setWallHitEffect] = useState<{x: number, y: number} | null>(null)
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(100)
  const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null)
  const totalParticlesRef = useRef(0)
  const hitParticlesRef = useRef(0)
  
  // Game state refs
  const fragmentsRef = useRef<Fragment[]>([])
  const particlesRef = useRef<Particle[]>([])
  const guideParticlesRef = useRef<GuideParticle[]>([])
  const guidePathRef = useRef<Path2D | null>(null)
  const userPathRef = useRef<{ x: number; y: number }[]>([])
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null)

  // Initialize guide particles using outline-fill approach
  const initializeGuideParticles = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const spell = SPELL_PATTERNS[currentSpell]
    if (spell.points.length < 2) return
    
    // Create a smooth path for the guideline
    const path = new Path2D()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Build the smooth path using quadratic curves
    path.moveTo(spell.points[0].x * canvas.width, spell.points[0].y * canvas.height)
    
    for (let i = 1; i < spell.points.length - 1; i++) {
      const p0 = spell.points[i - 1]
      const p1 = spell.points[i]
      const p2 = spell.points[i + 1]
      
      // Control point for smooth curve
      const cp = {
        x: p1.x * canvas.width,
        y: p1.y * canvas.height
      }
      
      // End point is midway to next point for smooth connection
      const end = {
        x: (p1.x + p2.x) / 2 * canvas.width,
        y: (p1.y + p2.y) / 2 * canvas.height
      }
      
      path.quadraticCurveTo(cp.x, cp.y, end.x, end.y)
    }
    
    // Last segment
    const lastPoint = spell.points[spell.points.length - 1]
    path.lineTo(lastPoint.x * canvas.width, lastPoint.y * canvas.height)
    
    guidePathRef.current = path
    
    // Generate particles to fill the path area
    const particles: GuideParticle[] = []
    const lineWidth = 30 // Thickness of the guideline
    const particleSpacing = 1 // Much denser particle grid
    
    // Find bounding box of the path
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    spell.points.forEach(p => {
      minX = Math.min(minX, p.x * canvas.width)
      minY = Math.min(minY, p.y * canvas.height)
      maxX = Math.max(maxX, p.x * canvas.width)
      maxY = Math.max(maxY, p.y * canvas.height)
    })
    
    // Expand bounds by line width
    minX -= lineWidth
    minY -= lineWidth
    maxX += lineWidth
    maxY += lineWidth
    
    // Create a grid of particles and check if they're inside the stroke
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    for (let x = minX; x <= maxX; x += particleSpacing) {
      for (let y = minY; y <= maxY; y += particleSpacing) {
        // Check if point is within the stroke area
        // We do this by checking distance to the path
        if (isPointNearPath(x, y, spell.points, canvas, lineWidth / 2)) {
          // Minimal randomness for denser packing
          const offsetX = (Math.random() - 0.5) * particleSpacing * 0.3
          const offsetY = (Math.random() - 0.5) * particleSpacing * 0.3
          
          particles.push({
            x: x + offsetX,
            y: y + offsetY,
            visible: true,
            size: 1.2, // Uniform size for batch rendering
            color: spell.color,
            opacity: 0.9 // Uniform opacity for batch rendering
          })
        }
      }
    }
    
    guideParticlesRef.current = particles
    totalParticlesRef.current = particles.length
    hitParticlesRef.current = 0
    setProgress(0)
  }, [currentSpell])

  // Check and remove particles near mouse position
  const checkAndBreakParticles = useCallback((mouseX: number, mouseY: number) => {
    const hitRadius = 15 // Exact width of the line (30px diameter / 2)
    const spell = SPELL_PATTERNS[currentSpell]
    
    guideParticlesRef.current.forEach(particle => {
      if (!particle.visible) return
      
      const dx = mouseX - particle.x
      const dy = mouseY - particle.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < hitRadius) {
        particle.visible = false
        hitParticlesRef.current++
        setProgress((hitParticlesRef.current / totalParticlesRef.current) * 100)
        
        // Create larger falling fragments
        if (Math.random() < 0.25) { // 25% chance
          const size = 2 + Math.random() * 3 // Much bigger: 2-5px
          fragmentsRef.current.push({
            x: particle.x,
            y: particle.y,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3 - 1,
            width: size,
            height: size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.5,
            color: particle.color,
            opacity: 1 // Full opacity
          })
        }
        
        // Rarely create dust to reduce particle count
        if (Math.random() < 0.05) { // Only 5% chance
          particlesRef.current.push({
            x: particle.x,
            y: particle.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 0.5,
            color: spell.color
          })
        }
      }
    })
  }, [currentSpell])

  // Handle mouse/touch events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setIsDrawing(true)
    userPathRef.current = [{ x: x / canvas.width, y: y / canvas.height }]
    lastMousePosRef.current = { x, y }
    setWallHitEffect(null) // Clear any previous wall hit
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Check if cursor is within guideline boundaries (invisible walls)
    const spell = SPELL_PATTERNS[currentSpell]
    const lineWidth = 35 // Slightly wider than visual line for tolerance
    const isInBounds = isPointNearPath(x, y, spell.points, canvas, lineWidth / 2)
    
    if (!isInBounds) {
      // Hit the wall!
      setWallHitEffect({ x, y })
      setScreenShake(10)
      
      // Create red sparks at collision point
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 0.4,
          color: '#FF0000'
        })
      }
      
      // Stop drawing when hitting wall
      setIsDrawing(false)
      setTimeout(() => {
        setScreenShake(0)
        setWallHitEffect(null)
      }, 200)
      return
    }
    
    // Add cursor particle effect - ancient dust being disturbed
    if (lastMousePosRef.current) {
      const dx = x - lastMousePosRef.current.x
      const dy = y - lastMousePosRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > 1) { // More sensitive to movement
        // Create ancient dust particles being excavated
        const particleCount = Math.min(8, Math.floor(distance / 2))
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = Math.random() * 3 + 1
          const size = 1.5 + Math.random() * 3 // Visible dust chunks
          
          fragmentsRef.current.push({
            x: x + Math.cos(angle) * 5,
            y: y + Math.sin(angle) * 5,
            vx: Math.cos(angle) * speed - dx * 0.05,
            vy: Math.sin(angle) * speed + Math.random() * 2,
            width: size,
            height: size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.4,
            color: spell.color,
            opacity: 0.6 + Math.random() * 0.4
          })
        }
        
        // Add some dust particles for atmosphere
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push({
            x: x + (Math.random() - 0.5) * 15,
            y: y + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2,
            life: 0.3,
            color: spell.color
          })
        }
      }
    }
    
    userPathRef.current.push({ x: x / canvas.width, y: y / canvas.height })
    checkAndBreakParticles(x, y)
    lastMousePosRef.current = { x, y }
    setCursorPos({ x, y })
  }, [isDrawing, checkAndBreakParticles, currentSpell])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    setCursorPos(null)
    
    // Calculate accuracy and flux
    const spell = SPELL_PATTERNS[currentSpell]
    const userPath = userPathRef.current
    
    if (userPath.length > 5) {
      // Simple accuracy calculation based on path similarity
      let totalDistance = 0
      let comparisons = 0
      
      userPath.forEach(point => {
        let minDist = Infinity
        spell.points.forEach(spellPoint => {
          const dist = Math.sqrt(
            Math.pow(point.x - spellPoint.x, 2) + 
            Math.pow(point.y - spellPoint.y, 2)
          )
          minDist = Math.min(minDist, dist)
        })
        totalDistance += minDist
        comparisons++
      })
      
      const avgDistance = totalDistance / comparisons
      const newAccuracy = Math.max(0, Math.min(100, 100 - avgDistance * 200))
      setAccuracy(Math.round(newAccuracy))
      
      // Calculate flux
      const fluxRange = spell.fluxRange.max - spell.fluxRange.min
      const flux = spell.fluxRange.min + (fluxRange * (newAccuracy / 100))
      const fluxAmount = Math.round(flux)
      setFluxGenerated(fluxAmount)
      setTotalFlux(prev => prev + fluxAmount)
      
      // Clear user path after a longer delay
      setTimeout(() => {
        userPathRef.current = []
      }, 2000)
      
      // Reset guide particles after a delay
      setTimeout(() => {
        // Reset particles if most are gone
        const visibleCount = guideParticlesRef.current.filter(p => p.visible).length
        if (visibleCount < guideParticlesRef.current.length * 0.2) {
          initializeGuideParticles()
        }
      }, 4000)
    } else {
      // If drawing was too short, don't reset immediately
      userPathRef.current = []
    }
  }, [isDrawing, currentSpell, initializeGuideParticles])

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas with solid black for better performance
    ctx.save()
    
    // Apply screen shake if active
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake
      const shakeY = (Math.random() - 0.5) * screenShake
      ctx.translate(shakeX, shakeY)
      setScreenShake(prev => Math.max(0, prev - 1)) // Decay shake
    }
    
    ctx.fillStyle = '#000000'
    ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20) // Slightly larger to cover shake
    
    // Draw wall area (outside path) with different color
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Create a mask for the path area
    if (guidePathRef.current) {
      ctx.save()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 45 // Wider than visual line to show walls
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalCompositeOperation = 'destination-out'
      ctx.stroke(guidePathRef.current)
      ctx.restore()
      
      // Draw the path area background
      ctx.save()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 35 // Actual playable area
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke(guidePathRef.current)
      ctx.restore()
      
      // Draw visible walls
      ctx.save()
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 37
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([5, 5])
      ctx.stroke(guidePathRef.current)
      ctx.restore()
    }
    
    // Draw the smooth outline path first (for debugging, can remove later)
    if (guidePathRef.current && false) { // Set to true to see outline
      ctx.strokeStyle = SPELL_PATTERNS[currentSpell].color
      ctx.lineWidth = 30
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 0.2
      ctx.stroke(guidePathRef.current)
    }
    
    // Ultra-optimized particle rendering using a single path
    const spell = SPELL_PATTERNS[currentSpell]
    if (guideParticlesRef.current.length > 0) {
      ctx.fillStyle = spell.color
      ctx.globalAlpha = 0.9
      
      // Batch render particles using a single path for maximum performance
      ctx.beginPath()
      
      // Group particles by visibility for faster iteration
      let particleCount = 0
      const maxParticlesPerBatch = 5000 // Batch size for mobile performance
      
      for (let i = 0; i < guideParticlesRef.current.length; i++) {
        const particle = guideParticlesRef.current[i]
        if (!particle.visible) continue
        
        // Add rectangle to path
        const halfSize = particle.size / 2
        ctx.rect(
          particle.x - halfSize,
          particle.y - halfSize,
          particle.size,
          particle.size
        )
        
        particleCount++
        
        // Render in batches to prevent path overflow
        if (particleCount >= maxParticlesPerBatch) {
          ctx.fill()
          ctx.beginPath()
          particleCount = 0
        }
      }
      
      // Fill remaining particles
      if (particleCount > 0) {
        ctx.fill()
      }
    }
    
    // Draw start point only
    if (spell.points.length > 0) {
      ctx.globalAlpha = 1
      
      // Start point with glow effect
      const startX = spell.points[0].x * canvas.width
      const startY = spell.points[0].y * canvas.height
      
      // Glow
      const gradient = ctx.createRadialGradient(startX, startY, 0, startX, startY, 12)
      gradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)')
      gradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.3)')
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(startX, startY, 12, 0, Math.PI * 2)
      ctx.fill()
      
      // Core dot
      ctx.fillStyle = '#00FF00'
      ctx.beginPath()
      ctx.arc(startX, startY, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Don't draw user path - removed for cleaner look
    
    // Update and draw particles
    ctx.globalAlpha = 1
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.3 // gravity
      particle.life -= 0.02
      
      if (particle.life <= 0) return false
      
      ctx.globalAlpha = particle.life
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, 2 + particle.life * 3, 0, Math.PI * 2)
      ctx.fill()
      
      return true
    })
    
    // Update and draw fragments with simplified collision
    ctx.globalAlpha = 1
    
    // Limit fragment collision checks for performance
    const maxCollisionChecks = 10
    
    fragmentsRef.current = fragmentsRef.current.filter(fragment => {
      // Physics update
      fragment.vy += 0.5 // gravity
      fragment.x += fragment.vx
      fragment.y += fragment.vy
      fragment.rotation += fragment.rotationSpeed
      fragment.vx *= 0.98 // air resistance
      
      // Simplified collision - only check nearby fragments
      let hasCollided = false
      let checksPerformed = 0
      
      for (let other of fragmentsRef.current) {
        if (other === fragment || checksPerformed >= maxCollisionChecks) break
        checksPerformed++
        
        // Quick distance check first
        const roughDist = Math.abs(fragment.y - other.y)
        if (roughDist > 20) continue // Skip if too far
        
        // Simple AABB collision
        const dx = Math.abs(fragment.x - other.x)
        const dy = roughDist
        const minDistX = (fragment.width + other.width) / 2
        const minDistY = (fragment.height + other.height) / 2
        
        // Check if fragments are colliding
        if (dx < minDistX && dy < minDistY && fragment.vy > 0) {
          // Stack on top if falling from above
          if (fragment.y < other.y) {
            fragment.y = other.y - fragment.height - 0.1
            fragment.vy = 0
            fragment.vx *= 0.5
            fragment.rotationSpeed *= 0.3
            hasCollided = true
            break
          }
        }
      }
      
      // Floor collision with small bounce for bigger particles
      if (!hasCollided && fragment.y + fragment.height > canvas.height) {
        fragment.y = canvas.height - fragment.height
        if (Math.abs(fragment.vy) > 1) {
          fragment.vy *= -0.3 // Small bounce
        } else {
          fragment.vy = 0
        }
        fragment.vx *= 0.7
        fragment.rotationSpeed *= 0.5
      }
      
      // Wall collisions
      if (fragment.x < 0 || fragment.x + fragment.width > canvas.width) {
        fragment.vx *= -0.5
        fragment.x = Math.max(0, Math.min(canvas.width - fragment.width, fragment.x))
      }
      
      // Fade out fragments slower so they pile up more
      if (fragment.y > canvas.height - 80 && Math.abs(fragment.vx) < 0.1 && Math.abs(fragment.vy) < 0.1) {
        fragment.opacity -= 0.003 // Much slower fade for better pileup
      }
      
      if (fragment.opacity <= 0) return false
      
      // Draw fragment (simplified)
      ctx.save()
      ctx.globalAlpha = fragment.opacity
      ctx.translate(fragment.x + fragment.width/2, fragment.y + fragment.height/2)
      ctx.rotate(fragment.rotation)
      ctx.fillStyle = fragment.color
      ctx.fillRect(-fragment.width/2, -fragment.height/2, fragment.width, fragment.height)
      ctx.restore()
      
      return true
    })
    
    // Draw cursor light flare effect
    if (cursorPos && isDrawing) {
      ctx.globalAlpha = 0.6
      const flareGradient = ctx.createRadialGradient(
        cursorPos.x, cursorPos.y, 0,
        cursorPos.x, cursorPos.y, 30
      )
      flareGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)')
      flareGradient.addColorStop(0.3, 'rgba(255, 255, 150, 0.4)')
      flareGradient.addColorStop(1, 'rgba(255, 255, 100, 0)')
      ctx.fillStyle = flareGradient
      ctx.beginPath()
      ctx.arc(cursorPos.x, cursorPos.y, 30, 0, Math.PI * 2)
      ctx.fill()
      
      // Add center glow
      ctx.globalAlpha = 0.9
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(cursorPos.x, cursorPos.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Draw wall hit effect
    if (wallHitEffect) {
      ctx.globalAlpha = 0.5
      const gradient = ctx.createRadialGradient(
        wallHitEffect.x, wallHitEffect.y, 0,
        wallHitEffect.x, wallHitEffect.y, 40
      )
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)')
      gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.3)')
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(wallHitEffect.x, wallHitEffect.y, 40, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
    
    animationRef.current = requestAnimationFrame(animate)
  }, [currentSpell, screenShake, wallHitEffect, cursorPos, isDrawing])

  // Initialize canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate])
  
  // Initialize guide particles when spell changes or canvas resizes
  useEffect(() => {
    initializeGuideParticles()
    setTimeRemaining(100)
  }, [currentSpell, initializeGuideParticles])
  
  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          setIsDrawing(false)
          return 0
        }
        return prev - 0.5
      })
    }, 100) // Update every 100ms
    
    return () => clearInterval(timer)
  }, [])

  const switchSpell = (spellKey: keyof typeof SPELL_PATTERNS) => {
    // Don't allow switching while drawing
    if (isDrawing) return
    
    setCurrentSpell(spellKey)
    initializeGuideParticles()
  }

  const resetGame = () => {
    setTotalFlux(0)
    setFluxGenerated(0)
    setAccuracy(100)
    fragmentsRef.current = []
    particlesRef.current = []
    userPathRef.current = []
    initializeGuideParticles()
    setTimeRemaining(100)
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-4">
        <h1 className="text-2xl font-bold text-yellow-400 text-center mb-2">FLUX CASTER</h1>
        <div className="bg-gray-900 border border-yellow-500/50 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-yellow-400 text-sm">Total Flux:</span>
            <span className="text-yellow-400 font-bold">{totalFlux}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-sm">Last Cast:</span>
            <span className="text-green-400 font-bold">{fluxGenerated} flux</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Accuracy:</span>
            <span className={`font-bold ${accuracy > 80 ? 'text-green-400' : accuracy > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {accuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="w-full max-w-md mb-2">
        {/* Particles Hit Progress */}
        <div className="relative h-6 bg-gray-800 rounded-full border border-gray-700 mb-2 overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Math.round(progress)}% Complete
            </span>
          </div>
        </div>
        
        {/* Countdown Timer */}
        <div className="relative h-4 bg-gray-800 rounded-full border border-gray-700 overflow-hidden">
          <div 
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-orange-500 rounded-full transition-all duration-100"
            style={{ width: `${timeRemaining}%` }}
          >
            <div className="absolute inset-0 bg-white/10" />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-md" style={{ aspectRatio: '1' }}>
        <canvas 
          ref={canvasRef}
          className={`w-full h-full border-2 border-yellow-500/50 rounded bg-gray-900 cursor-crosshair ${
            wallHitEffect ? 'border-red-500' : ''
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
        
        {isDrawing && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold animate-pulse">
            TRACING
          </div>
        )}
        
        <div className="absolute top-2 right-2 text-xs text-gray-400">
          <div className="text-green-400">● Start Point</div>
        </div>
      </div>

      {/* Spell Selection */}
      <div className="w-full max-w-md mt-4">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(SPELL_PATTERNS).map(([key, spell]) => (
            <button
              key={key}
              onClick={() => switchSpell(key as keyof typeof SPELL_PATTERNS)}
              disabled={isDrawing}
              className={`relative p-2 rounded border transition-all ${
                isDrawing 
                  ? 'opacity-50 cursor-not-allowed' 
                  : currentSpell === key 
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' 
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-yellow-500/50'
              }`}
            >
              {/* Spell Shape Preview */}
              <div className="relative h-12 mb-1">
                <canvas
                  ref={el => {
                    if (el && !el.dataset.initialized) {
                      el.dataset.initialized = 'true'
                      el.width = 80
                      el.height = 48
                      const ctx = el.getContext('2d')
                      if (ctx) {
                        // Draw spell path
                        ctx.strokeStyle = spell.color
                        ctx.lineWidth = 2
                        ctx.lineCap = 'round'
                        ctx.globalAlpha = 0.8
                        
                        ctx.beginPath()
                        spell.points.forEach((point, i) => {
                          const x = point.x * el.width
                          const y = point.y * el.height
                          if (i === 0) {
                            ctx.moveTo(x, y)
                          } else {
                            ctx.lineTo(x, y)
                          }
                        })
                        ctx.stroke()
                        
                        // Draw start dot
                        ctx.fillStyle = '#00FF00'
                        ctx.globalAlpha = 1
                        ctx.beginPath()
                        ctx.arc(
                          spell.points[0].x * el.width,
                          spell.points[0].y * el.height,
                          3, 0, Math.PI * 2
                        )
                        ctx.fill()
                      }
                    }
                  }}
                  className="w-full h-full"
                />
              </div>
              
              <div className="font-bold text-xs">{spell.name}</div>
              
              {/* Essence Cost */}
              <div className="flex justify-center gap-1 mt-1">
                {spell.essenceCost.map((essence, idx) => (
                  <div key={idx} className="text-[10px] flex items-center">
                    <span>{essence.icon}</span>
                    <span className="ml-0.5 opacity-75">{essence.amount}</span>
                  </div>
                ))}
              </div>
              
              <div className="text-xs opacity-75 mt-1">
                {spell.fluxRange.min}-{spell.fluxRange.max} flux
              </div>
            </button>
          ))}
        </div>
        
        <button 
          onClick={resetGame}
          className="w-full mt-4 bg-gray-800 text-yellow-400 px-4 py-2 rounded border border-yellow-500/30 hover:bg-gray-700 transition-colors"
        >
          Reset Game
        </button>
      </div>
    </div>
  )
}