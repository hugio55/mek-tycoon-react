'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vx: number  // velocity x
  vy: number  // velocity y
  radius: number
  color: string
  cleared: boolean
  falling: boolean
  settled: boolean
  stackHeight: number  // how high this particle is stacked
}

interface Hole {
  x: number  // relative position (0-1)
  y: number  // relative position (0-1)
  radius: number  // relative size (0-1)
}

interface Level {
  id: number
  name: string
  shape: 'circle' | 'square' | 'triangle' | 'hexagon' | 'star' | 'heart'
  holes: Hole[]  // swiss cheese holes
  targetPercent: number
  timeLimit: number
}

const LEVELS: Level[] = [
  { 
    id: 1, 
    name: 'Circle Clear', 
    shape: 'circle',
    holes: [
      { x: 0.5, y: 0.5, radius: 0.25 }  // bigger hole in center
    ],
    targetPercent: 85, 
    timeLimit: 30 
  },
  { 
    id: 2, 
    name: 'Square Sweep', 
    shape: 'square',
    holes: [
      { x: 0.3, y: 0.3, radius: 0.18 },
      { x: 0.7, y: 0.7, radius: 0.18 }
    ],
    targetPercent: 90, 
    timeLimit: 35 
  },
  { 
    id: 3, 
    name: 'Triangle Tackle', 
    shape: 'triangle',
    holes: [
      { x: 0.5, y: 0.4, radius: 0.2 }
    ],
    targetPercent: 80, 
    timeLimit: 25 
  },
  { 
    id: 4, 
    name: 'Hexagon Hunt', 
    shape: 'hexagon',
    holes: [
      { x: 0.35, y: 0.5, radius: 0.15 },
      { x: 0.65, y: 0.5, radius: 0.15 },
      { x: 0.5, y: 0.3, radius: 0.12 }
    ],
    targetPercent: 85, 
    timeLimit: 40 
  },
  { 
    id: 5, 
    name: 'Star Scatter', 
    shape: 'star',
    holes: [
      { x: 0.5, y: 0.5, radius: 0.18 },
      { x: 0.3, y: 0.4, radius: 0.1 },
      { x: 0.7, y: 0.4, radius: 0.1 }
    ],
    targetPercent: 75, 
    timeLimit: 35 
  },
  { 
    id: 6, 
    name: 'Heart Harvest', 
    shape: 'heart',
    holes: [
      { x: 0.35, y: 0.35, radius: 0.14 },
      { x: 0.65, y: 0.35, radius: 0.14 },
      { x: 0.5, y: 0.6, radius: 0.16 }
    ],
    targetPercent: 80, 
    timeLimit: 40 
  }
]

export default function ShapeKnockdown2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const groundMapRef = useRef<Map<string, number>>(new Map())  // track ground height at each position
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const trailRef = useRef<{ x: number; y: number; age: number }[]>([])
  const animationFrameRef = useRef<number>()
  
  const [currentLevel, setCurrentLevel] = useState(0)
  const [score, setScore] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [gameStarted, setGameStarted] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [hitWall, setHitWall] = useState(false)
  const [instantLoss, setInstantLoss] = useState(false)
  const [showLevelSelect, setShowLevelSelect] = useState(true)

  const isPointInShape = useCallback((x: number, y: number, shape: string, centerX: number, centerY: number, size: number) => {
    const relX = x - centerX
    const relY = y - centerY
    
    switch (shape) {
      case 'circle':
        return Math.sqrt(relX * relX + relY * relY) <= size
      
      case 'square':
        return Math.abs(relX) <= size && Math.abs(relY) <= size
      
      case 'triangle': {
        const h = size * Math.sqrt(3) / 2
        const inBottom = relY <= size / 2
        const inLeft = relY >= -size && relX >= -relY * 2 / Math.sqrt(3) - size
        const inRight = relY >= -size && relX <= relY * 2 / Math.sqrt(3) + size
        return inBottom && inLeft && inRight
      }
      
      case 'hexagon': {
        const angle = Math.atan2(relY, relX)
        const radius = Math.sqrt(relX * relX + relY * relY)
        const sectorAngle = Math.PI / 3
        const nearestVertex = Math.round(angle / sectorAngle) * sectorAngle
        const localAngle = angle - nearestVertex
        const maxRadius = size / Math.cos(localAngle)
        return radius <= Math.min(maxRadius, size)
      }
      
      case 'star': {
        const angle = Math.atan2(relY, relX)
        const radius = Math.sqrt(relX * relX + relY * relY)
        // Create a 5-pointed star shape
        const numPoints = 5
        const anglePerPoint = (Math.PI * 2) / numPoints
        // Normalize angle to 0-2π
        const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2)
        const pointIndex = Math.floor(normalizedAngle / anglePerPoint)
        const localAngle = normalizedAngle - (pointIndex * anglePerPoint)
        
        // Interpolate between inner and outer radius
        const innerRadius = size * 0.4
        const outerRadius = size
        
        // Calculate the angle within the current segment
        const halfAngle = anglePerPoint / 2
        let maxRadius
        if (localAngle < halfAngle) {
          // First half - from outer to inner
          const t = localAngle / halfAngle
          maxRadius = outerRadius - (outerRadius - innerRadius) * t
        } else {
          // Second half - from inner to outer
          const t = (localAngle - halfAngle) / halfAngle
          maxRadius = innerRadius + (outerRadius - innerRadius) * t
        }
        
        return radius <= maxRadius
      }
      
      case 'heart': {
        const scale = size / 100
        const sx = relX / scale
        const sy = relY / scale
        const heart = Math.pow(sx * sx + sy * sy - 100, 3) - sx * sx * sy * sy * sy
        return heart <= 0
      }
      
      default:
        return false
    }
  }, [])

  const initializeLevel = useCallback((level: Level) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Match SpellCaster's canvas size - smaller shape
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const size = Math.min(canvas.width, canvas.height) * 0.2  // Much smaller for performance
    
    particlesRef.current = []
    const particles: Particle[] = []
    
    // Dense particles like SpellCaster
    const particleSpacing = 2  // Dense spacing like SpellCaster
    const bounds = size * 2
    
    for (let x = centerX - size; x <= centerX + size; x += particleSpacing) {
      for (let y = centerY - size; y <= centerY + size; y += particleSpacing) {
        
        // Check if point is inside main shape
        if (isPointInShape(x, y, level.shape, centerX, centerY, size)) {
          // Check if point is NOT inside any hole
          let insideHole = false
          for (const hole of level.holes) {
            const holeX = centerX + (hole.x - 0.5) * size * 2
            const holeY = centerY + (hole.y - 0.5) * size * 2
            const holeRadius = hole.radius * size
            const dist = Math.sqrt(Math.pow(x - holeX, 2) + Math.pow(y - holeY, 2))
            if (dist < holeRadius) {
              insideHole = true
              break
            }
          }
          
          if (!insideHole) {
            // Add slight randomness like SpellCaster
            const offsetX = (Math.random() - 0.5) * particleSpacing * 0.3
            const offsetY = (Math.random() - 0.5) * particleSpacing * 0.3
            
            // Random color for visual variety
            const hue = Math.random() * 60 + 30 // Yellow to orange range
            particles.push({
              x: x + offsetX,
              y: y + offsetY,
              vx: 0,
              vy: 0,
              radius: particleSpacing * 0.4,
              color: `hsl(${hue}, 100%, 50%)`,
              cleared: false,
              falling: false,
              settled: false,
              stackHeight: 0
            })
          }
        }
      }
    }
    
    particlesRef.current = particles
    groundMapRef.current.clear()  // reset ground height map
    setScore(0)
    setTimeRemaining(level.timeLimit)
    setGameStarted(false)
    setHitWall(false)
    setInstantLoss(false)
  }, [isPointInShape])

  const drawHoles = useCallback((ctx: CanvasRenderingContext2D, level: Level, centerX: number, centerY: number, size: number) => {
    // Draw holes as red danger zones
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 2
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'
    
    for (const hole of level.holes) {
      const holeX = centerX + (hole.x - 0.5) * size * 2
      const holeY = centerY + (hole.y - 0.5) * size * 2
      const holeRadius = hole.radius * size
      
      ctx.beginPath()
      ctx.arc(holeX, holeY, holeRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }, [])
  
  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: string, centerX: number, centerY: number, size: number) => {
    ctx.beginPath()
    
    switch (shape) {
      case 'circle':
        ctx.arc(centerX, centerY, size, 0, Math.PI * 2)
        break
      
      case 'square':
        ctx.rect(centerX - size, centerY - size, size * 2, size * 2)
        break
      
      case 'triangle':
        ctx.moveTo(centerX, centerY - size)
        ctx.lineTo(centerX - size * 0.866, centerY + size * 0.5)
        ctx.lineTo(centerX + size * 0.866, centerY + size * 0.5)
        ctx.closePath()
        break
      
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i
          const x = centerX + size * Math.cos(angle)
          const y = centerY + size * Math.sin(angle)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        break
      
      case 'star':
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i
          const radius = i % 2 === 0 ? size : size * 0.5
          const x = centerX + radius * Math.cos(angle - Math.PI / 2)
          const y = centerY + radius * Math.sin(angle - Math.PI / 2)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        break
      
      case 'heart':
        const scale = size / 100
        ctx.moveTo(centerX, centerY + 40 * scale)
        ctx.bezierCurveTo(
          centerX, centerY + 30 * scale,
          centerX - 50 * scale, centerY - 30 * scale,
          centerX - 50 * scale, centerY - 30 * scale
        )
        ctx.bezierCurveTo(
          centerX - 50 * scale, centerY - 60 * scale,
          centerX - 20 * scale, centerY - 70 * scale,
          centerX, centerY - 50 * scale
        )
        ctx.bezierCurveTo(
          centerX + 20 * scale, centerY - 70 * scale,
          centerX + 50 * scale, centerY - 60 * scale,
          centerX + 50 * scale, centerY - 30 * scale
        )
        ctx.bezierCurveTo(
          centerX + 50 * scale, centerY - 30 * scale,
          centerX, centerY + 30 * scale,
          centerX, centerY + 40 * scale
        )
        break
    }
    
    ctx.strokeStyle = '#fab617'
    ctx.lineWidth = 3
    ctx.stroke()
  }, [])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add gradient background
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    )
    gradient.addColorStop(0, 'rgba(250, 182, 23, 0.05)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    const level = LEVELS[currentLevel]
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const size = Math.min(canvas.width, canvas.height) * 0.2  // Match initialization size
    
    // Draw shape outline
    drawShape(ctx, level.shape, centerX, centerY, size)
    
    // Draw holes (danger zones)
    drawHoles(ctx, level, centerX, centerY, size)
    
    // Update and draw particles
    const groundLevel = canvas.height - 20  // ground level
    
    particlesRef.current.forEach(particle => {
      if (!particle.cleared) {
        // Apply gravity to falling particles
        if (particle.falling && !particle.settled) {
          particle.vy += 0.5  // gravity
          particle.vx *= 0.98  // air friction
          particle.vy *= 0.98
          
          particle.x += particle.vx
          particle.y += particle.vy
          
          // Get ground height at this x position
          const gridX = Math.floor(particle.x / 10) * 10
          const groundKey = `${gridX}`
          const currentGroundHeight = groundMapRef.current.get(groundKey) || 0
          const effectiveGround = groundLevel - currentGroundHeight
          
          // Check if particle hit the ground or stacked particles
          if (particle.y + particle.radius >= effectiveGround) {
            particle.y = effectiveGround - particle.radius
            particle.vy = 0
            particle.vx = 0
            particle.settled = true
            particle.stackHeight = currentGroundHeight
            
            // Update ground height at this position
            groundMapRef.current.set(groundKey, currentGroundHeight + particle.radius * 2)
            
            // Also update neighboring positions for smoother stacking
            groundMapRef.current.set(`${gridX - 10}`, Math.max(
              groundMapRef.current.get(`${gridX - 10}`) || 0,
              currentGroundHeight + particle.radius
            ))
            groundMapRef.current.set(`${gridX + 10}`, Math.max(
              groundMapRef.current.get(`${gridX + 10}`) || 0,
              currentGroundHeight + particle.radius
            ))
          }
          
          // Keep particles in bounds
          if (particle.x < particle.radius) {
            particle.x = particle.radius
            particle.vx *= -0.5
          }
          if (particle.x > canvas.width - particle.radius) {
            particle.x = canvas.width - particle.radius
            particle.vx *= -0.5
          }
        }
        
        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.falling ? `${particle.color}88` : particle.color
        ctx.fill()
        
        // Add glow effect for non-falling particles
        if (!particle.falling) {
          ctx.shadowBlur = 10
          ctx.shadowColor = particle.color
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
    })
    
    // Draw trail
    trailRef.current = trailRef.current.filter(point => {
      point.age++
      return point.age < 20
    })
    
    trailRef.current.forEach(point => {
      const alpha = 1 - (point.age / 20)
      ctx.beginPath()
      ctx.arc(point.x, point.y, 8 - point.age * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(100, 255, 100, ${alpha * 0.5})`
      ctx.fill()
    })
    
    // Draw hit wall effect
    if (hitWall) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    // Draw instant loss effect
    if (instantLoss) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = 'bold 48px Orbitron'
      ctx.fillStyle = '#ff0000'
      ctx.textAlign = 'center'
      ctx.fillText('INSTANT LOSS!', canvas.width / 2, canvas.height / 2)
    }
    
    if (!instantLoss) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }, [currentLevel, drawShape, drawHoles, hitWall, instantLoss])

  useEffect(() => {
    if (!showLevelSelect) {
      // Setup canvas size
      const container = containerRef.current
      const canvas = canvasRef.current
      if (container && canvas) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
      
      initializeLevel(LEVELS[currentLevel])
      animate()
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [currentLevel, showLevelSelect, initializeLevel, animate])

  useEffect(() => {
    if (gameStarted && timeRemaining > 0 && !levelComplete) {
      const timer = setTimeout(() => setTimeRemaining(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0) {
      setLevelComplete(true)
    }
  }, [gameStarted, timeRemaining, levelComplete])

  useEffect(() => {
    const clearedCount = particlesRef.current.filter(p => p.cleared).length
    const percent = (clearedCount / particlesRef.current.length) * 100
    
    if (percent >= LEVELS[currentLevel].targetPercent && !levelComplete) {
      setLevelComplete(true)
    }
  }, [score, currentLevel, levelComplete])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (levelComplete || showLevelSelect) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    isDrawingRef.current = true
    lastPosRef.current = { x, y }
    
    if (!gameStarted) {
      setGameStarted(true)
    }
  }, [levelComplete, showLevelSelect, gameStarted])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current || levelComplete || instantLoss) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const level = LEVELS[currentLevel]
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const size = Math.min(canvas.width, canvas.height) * 0.2  // Match initialization size
    
    // Check if still inside shape
    if (!isPointInShape(x, y, level.shape, centerX, centerY, size)) {
      setHitWall(true)
      isDrawingRef.current = false
      setTimeout(() => setHitWall(false), 500)
      return
    }
    
    // Check if hit a hole (instant loss)
    for (const hole of level.holes) {
      const holeX = centerX + (hole.x - 0.5) * size * 2
      const holeY = centerY + (hole.y - 0.5) * size * 2
      const holeRadius = hole.radius * size
      const dist = Math.sqrt(Math.pow(x - holeX, 2) + Math.pow(y - holeY, 2))
      if (dist < holeRadius) {
        setInstantLoss(true)
        isDrawingRef.current = false
        setLevelComplete(true)
        return
      }
    }
    
    // Add to trail
    trailRef.current.push({ x, y, age: 0 })
    
    // Check for particle collisions
    particlesRef.current.forEach(particle => {
      if (!particle.cleared && !particle.falling) {
        const dist = Math.sqrt(
          Math.pow(particle.x - x, 2) + Math.pow(particle.y - y, 2)
        )
        
        if (dist < particle.radius + 10) {
          // Make particle fall instead of disappearing
          particle.falling = true
          particle.cleared = true  // count as cleared
          particle.vx = (Math.random() - 0.5) * 4  // random horizontal velocity
          particle.vy = -Math.random() * 2  // slight upward velocity
          setScore(prev => prev + 1)
        }
      }
    })
    
    lastPosRef.current = { x, y }
  }, [currentLevel, levelComplete, instantLoss, isPointInShape])

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false
  }, [])

  const resetLevel = () => {
    initializeLevel(LEVELS[currentLevel])
    setLevelComplete(false)
    setInstantLoss(false)
  }

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(prev => prev + 1)
      setLevelComplete(false)
    }
  }

  if (showLevelSelect) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <h1 className="text-4xl font-orbitron text-yellow-400 text-center mb-8">
            Shape Knockdown
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {LEVELS.map((level, index) => (
              <button
                key={level.id}
                onClick={() => {
                  setCurrentLevel(index)
                  setShowLevelSelect(false)
                }}
                className="bg-gray-900 border-2 border-yellow-500/30 rounded-lg p-6 hover:border-yellow-500 transition-all"
              >
                <div className="text-xl font-orbitron text-yellow-400 mb-2">
                  {level.name}
                </div>
                <div className="text-gray-400 text-sm">
                  Shape: {level.shape}
                </div>
                <div className="text-gray-400 text-sm">
                  Target: {level.targetPercent}%
                </div>
                <div className="text-gray-400 text-sm">
                  Time: {level.timeLimit}s
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const level = LEVELS[currentLevel]
  const clearedCount = particlesRef.current.filter(p => p.cleared).length
  const totalCount = particlesRef.current.length
  const percent = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0
  const success = percent >= level.targetPercent && !instantLoss

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Stats Bar */}
      <div className="w-full max-w-md mb-4">
        <div className="bg-gray-900 rounded-lg p-3 border border-yellow-500/30">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-orbitron text-yellow-400">
              {level.name}
            </h2>
            <div className="flex gap-4 text-sm">
              <span className="text-green-400">
                {percent}% / {level.targetPercent}%
              </span>
              <span className="text-yellow-400 font-bold">
                {timeRemaining}s
              </span>
              {hitWall && (
                <span className="text-red-500 font-bold animate-pulse">
                  WALL!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Canvas Container - matches SpellCaster */}
      <div className="relative w-full max-w-md" style={{ aspectRatio: '1' }} ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="w-full h-full border-2 border-yellow-500/50 rounded bg-gray-900 cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
      </div>
      
      {/* Level Complete Modal */}
      {levelComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-black/90 rounded-lg p-8 border border-yellow-500/30 max-w-md">
            <h2 className="text-3xl font-orbitron text-yellow-400 mb-4">
              Level Complete!
            </h2>
            <div className="space-y-2 mb-6">
              <div className="text-cyan-400">Cleared: {percent}%</div>
              <div className="text-white">Target: {level.targetPercent}%</div>
              <div className={`text-2xl font-bold ${success ? 'text-green-400' : 'text-red-400'}`}>
                {instantLoss ? 'HIT A HOLE - INSTANT LOSS!' : success ? 'SUCCESS!' : 'TRY AGAIN'}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLevelSelect(true)}
                className="flex-1 px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg border border-gray-500/50 transition-all"
              >
                Level Select
              </button>
              {success && currentLevel < LEVELS.length - 1 && (
                <button
                  onClick={nextLevel}
                  className="flex-1 px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg border border-yellow-500/50 transition-all"
                >
                  Next Level
                </button>
              )}
              <button
                onClick={resetLevel}
                className="flex-1 px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg border border-gray-500/50 transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}