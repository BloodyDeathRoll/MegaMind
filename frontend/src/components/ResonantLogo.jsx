import { useEffect, useRef } from 'react'
import p5 from 'p5'

// ── Ported from drift.html ───────────────────────────────────────────────────

function mkRng(seed) {
  let s = (seed >>> 0) || 1
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const AXIS_ROLES = [
  { id: 'proximity',  label: 'mouse pull'    },
  { id: 'breathe',   label: 'breathe speed' },
  { id: 'wander',    label: 'wander drift'  },
  { id: 'glow',      label: 'glow radius'   },
  { id: 'count',     label: 'orb count'     },
  { id: 'speed',     label: 'drift speed'   },
  { id: 'colorTemp', label: 'color warmth'  },
  { id: 'ripple',    label: 'ripple force'  },
  { id: 'fade',      label: 'trail fade'    },
  { id: 'noiseFlow', label: 'noise flow'    },
]

const PALETTES = [
  { bg: [6,6,10],   orbs: [[180,200,255],[220,240,255],[255,255,255],[160,180,240]]  },
  { bg: [10,6,4],   orbs: [[255,200,140],[255,220,180],[255,240,220],[240,180,120]]  },
  { bg: [4,8,6],    orbs: [[140,220,180],[180,255,220],[220,255,240],[100,200,160]]  },
  { bg: [8,4,10],   orbs: [[200,160,255],[220,190,255],[240,220,255],[180,140,240]]  },
  { bg: [6,8,10],   orbs: [[160,220,240],[180,235,255],[220,245,255],[140,200,220]]  },
  { bg: [10,8,4],   orbs: [[255,220,160],[255,235,190],[255,245,220],[240,210,140]]  },
  { bg: [6,4,8],    orbs: [[200,140,220],[220,170,240],[235,200,250],[180,120,200]]  },
  { bg: [4,6,8],    orbs: [[140,190,220],[170,210,240],[200,230,255],[120,170,200]]  },
  { bg: [8,8,6],    orbs: [[220,220,180],[235,235,200],[250,250,220],[200,200,160]]  },
  { bg: [4,4,4],    orbs: [[180,180,200],[210,210,225],[240,240,250],[160,160,180]]  },
]

function randomizeUniverse(seed) {
  const r = mkRng(seed)
  const pal = PALETTES[Math.floor(r() * PALETTES.length)]

  const rolesCopy = [...AXIS_ROLES]
  const xi = Math.floor(r() * rolesCopy.length)
  const xRole = rolesCopy.splice(xi, 1)[0]
  const yRole = rolesCopy[Math.floor(r() * rolesCopy.length)]

  const baseCount   = 12 + Math.floor(r() * 28)
  const baseSpeed   = 0.15 + r() * 0.4
  const baseBreathe = 0.004 + r() * 0.012
  const baseWander  = 0.0008 + r() * 0.003
  const baseGlow    = 0.3 + r() * 0.5
  const baseProx    = 0.12 + r() * 0.25
  const baseRipple  = 1.5 + r() * 3.0
  const baseFade    = 12 + Math.floor(r() * 20)
  const baseNoiseFlow = 0.0005 + r() * 0.002
  const minSize     = 4 + r() * 8
  const maxSize     = minSize + 8 + r() * 20
  const drawLines   = r() < 0.55
  const lineMaxDist = 0.12 + r() * 0.18

  return {
    seed, pal, xRole, yRole,
    baseCount, baseSpeed, baseBreathe, baseWander,
    baseGlow, baseProx, baseRipple, baseFade,
    baseNoiseFlow, minSize, maxSize, drawLines, lineMaxDist,
  }
}

function resolveAxis(roleId, v) {
  switch (roleId) {
    case 'proximity':  return { proxRadius:   0.04 + v * 0.35 }
    case 'breathe':    return { breatheSpeed: 0.001 + v * 0.025 }
    case 'wander':     return { wanderAmt:    0.0002 + v * 0.005 }
    case 'glow':       return { glowMult:     0.1 + v * 1.2 }
    case 'count':      return { countMult:    0.3 + v * 1.4 }
    case 'speed':      return { speedMult:    0.1 + v * 2.0 }
    case 'colorTemp':  return { colorTemp:    v }
    case 'ripple':     return { rippleForce:  0.2 + v * 5.0 }
    case 'fade':       return { fadeAmt:      4 + Math.round(v * 35) }
    case 'noiseFlow':  return { noiseFlow:    0.0001 + v * 0.004 }
    default:           return {}
  }
}

// ── React component ──────────────────────────────────────────────────────────
export default function ResonantLogo({ className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sketch = (sk) => {
      let W, H, params, pg, t = 0
      let orbs = [], ripples = []
      let mx = 0.5, my = 0.5, smx = 0.5, smy = 0.5

      function getSize() {
        return { w: container.clientWidth || 2, h: container.clientHeight || 2 }
      }

      function makeOrb(r) {
        const p = params
        return {
          x:  r() * W,
          y:  r() * H,
          vx: (r() - 0.5) * p.baseSpeed,
          vy: (r() - 0.5) * p.baseSpeed,
          baseR: p.minSize + r() * (p.maxSize - p.minSize),
          r:  0,
          breatheOffset: r() * Math.PI * 2,
          breatheAmt: 0.2 + r() * 0.4,
          noiseOff: r() * 100,
          col: p.pal.orbs[Math.floor(r() * p.pal.orbs.length)],
          alpha: 100 + Math.floor(r() * 120),
        }
      }

      function buildOrbs() {
        const r = mkRng(params.seed + 1)
        orbs = []
        for (let i = 0; i < params.baseCount; i++) orbs.push(makeOrb(r))
      }

      function init() {
        sk.noiseSeed(params.seed)
        buildOrbs()
        ripples = []
        if (pg) pg.remove()
        pg = sk.createGraphics(W, H)
        pg.pixelDensity(1)
        pg.colorMode(sk.RGB, 255, 255, 255, 255)
        const bg = params.pal.bg
        pg.background(bg[0], bg[1], bg[2])
        t = 0
      }

      sk.setup = function () {
        const sz = getSize()
        W = sz.w; H = sz.h
        sk.createCanvas(W, H)
        sk.pixelDensity(1)
        sk.colorMode(sk.RGB, 255, 255, 255, 255)
        sk.frameRate(60)
        params = randomizeUniverse(Math.floor(Math.random() * 999999))
        init()
      }

      sk.mouseMoved   = function () {
        mx = Math.max(0, Math.min(1, sk.mouseX / W))
        my = Math.max(0, Math.min(1, sk.mouseY / H))
      }
      sk.mouseDragged = function () {
        mx = Math.max(0, Math.min(1, sk.mouseX / W))
        my = Math.max(0, Math.min(1, sk.mouseY / H))
      }

      sk.mousePressed = function () {
        ripples.push({ x: sk.mouseX, y: sk.mouseY, r: 10, alpha: 80 })
        params = randomizeUniverse(Math.floor(Math.random() * 999999))
        init()
      }

      sk.windowResized = function () {
        const sz = getSize()
        W = sz.w; H = sz.h
        sk.resizeCanvas(W, H)
        init()
      }

      const ro = new ResizeObserver(() => {
        const sz = getSize()
        if (sz.w !== W || sz.h !== H) {
          W = sz.w; H = sz.h
          sk.resizeCanvas(W, H)
          init()
        }
      })
      ro.observe(container)
      const _origRemove = sk.remove.bind(sk)
      sk.remove = function () { ro.disconnect(); _origRemove() }

      sk.draw = function () {
        t++
        smx += (mx - smx) * 0.03
        smy += (my - smy) * 0.03

        const p = params
        const pal = p.pal, bg = pal.bg

        const rx2 = resolveAxis(p.xRole.id, smx)
        const ry2 = resolveAxis(p.yRole.id, smy)
        const res  = Object.assign({}, rx2, ry2)

        const proxR    = (res.proxRadius   ?? p.baseProx)     * Math.min(W, H)
        const bSpd     = res.breatheSpeed  ?? p.baseBreathe
        const wander   = res.wanderAmt     ?? p.baseWander
        const glowM    = res.glowMult      ?? p.baseGlow
        const spdM     = res.speedMult     ?? 1.0
        const rippleF  = res.rippleForce   ?? p.baseRipple
        const fadeAmt  = res.fadeAmt       ?? p.baseFade
        const nFlow    = res.noiseFlow     ?? p.baseNoiseFlow
        const cTemp    = res.colorTemp     ?? 0.5
        const countM   = res.countMult     ?? 1.0

        // Smooth count modulation
        const targetCount = Math.round(p.baseCount * countM)
        while (orbs.length < targetCount) {
          const r = mkRng(p.seed + orbs.length * 97 + t)
          orbs.push(makeOrb(r))
        }
        if (orbs.length > targetCount + 2) orbs.splice(targetCount)

        // Fade background (trail effect)
        pg.noStroke()
        pg.fill(bg[0], bg[1], bg[2], fadeAmt)
        pg.rect(0, 0, W, H)

        // Ripples
        ripples = ripples.filter(r => r.alpha > 0)
        for (const rp of ripples) {
          rp.r += 4; rp.alpha -= 3
          pg.noFill()
          pg.stroke(255, 255, 255, rp.alpha)
          pg.strokeWeight(0.8)
          pg.ellipse(rp.x, rp.y, rp.r * 2, rp.r * 2)
        }

        const mxPx = smx * W, myPx = smy * H
        const n = orbs.length

        // Connection lines
        if (p.drawLines) {
          const maxD = p.lineMaxDist * Math.min(W, H)
          for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
              const dx = orbs[i].x - orbs[j].x
              const dy = orbs[i].y - orbs[j].y
              const d  = Math.sqrt(dx * dx + dy * dy)
              if (d < maxD) {
                const a = Math.round((1 - d / maxD) * 35)
                const c = orbs[i].col
                pg.stroke(c[0], c[1], c[2], a)
                pg.strokeWeight(0.5)
                pg.noFill()
                pg.line(orbs[i].x, orbs[i].y, orbs[j].x, orbs[j].y)
              }
            }
          }
        }

        // Update + draw orbs
        for (let i = 0; i < n; i++) {
          const o = orbs[i]

          // Noise wander
          const na = sk.noise(o.x * nFlow, o.y * nFlow, t * 0.005 + o.noiseOff) * Math.PI * 4
          o.vx += (Math.cos(na) * wander - o.vx * 0.02) * spdM
          o.vy += (Math.sin(na) * wander - o.vy * 0.02) * spdM

          // Mouse proximity push
          const dx = o.x - mxPx, dy = o.y - myPx
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < proxR && d > 1) {
            const f = (1 - d / proxR) * 0.5
            o.vx += (dx / d) * f
            o.vy += (dy / d) * f
          }

          // Ripple push
          for (const rp of ripples) {
            const rdx = o.x - rp.x, rdy = o.y - rp.y
            const rd  = Math.sqrt(rdx * rdx + rdy * rdy)
            const rim = Math.abs(rd - rp.r)
            if (rim < 30 && rd > 1) {
              const f = (1 - rim / 30) * rippleF * 0.04 * (rp.alpha / 80)
              o.vx += (rdx / rd) * f
              o.vy += (rdy / rd) * f
            }
          }

          o.vx *= 0.96; o.vy *= 0.96
          o.x  += o.vx * spdM
          o.y  += o.vy * spdM

          // Wrap edges
          if (o.x < -50) o.x = W + 50
          if (o.x > W + 50) o.x = -50
          if (o.y < -50) o.y = H + 50
          if (o.y > H + 50) o.y = -50

          // Breathe
          o.r = o.baseR * (1 + Math.sin(t * bSpd + o.breatheOffset) * o.breatheAmt)

          // Color temperature
          const c = [...o.col]
          if (cTemp !== 0.5) {
            const warm = (cTemp - 0.5) * 30
            c[0] = Math.min(255, Math.max(0, c[0] + warm))
            c[2] = Math.min(255, Math.max(0, c[2] - warm))
          }

          const alpha = o.alpha

          // Layered glow
          pg.noStroke()
          pg.fill(c[0], c[1], c[2], Math.round(alpha * 0.06 * glowM))
          pg.ellipse(o.x, o.y, o.r * 2 * (2 + glowM * 2.5), o.r * 2 * (2 + glowM * 2.5))
          pg.fill(c[0], c[1], c[2], Math.round(alpha * 0.12 * glowM))
          pg.ellipse(o.x, o.y, o.r * 2 * (1.5 + glowM), o.r * 2 * (1.5 + glowM))

          // Core
          pg.fill(c[0], c[1], c[2], Math.round(alpha * 0.5))
          pg.ellipse(o.x, o.y, o.r * 2, o.r * 2)

          // Specular highlight
          pg.fill(255, 255, 255, Math.round(alpha * 0.25))
          pg.ellipse(o.x - o.r * 0.28, o.y - o.r * 0.28, o.r * 0.45, o.r * 0.45)
        }

        sk.image(pg, 0, 0)
      }
    }

    const p5Instance = new p5(sketch, container)
    return () => p5Instance.remove()
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', cursor: 'pointer', overflow: 'hidden' }}
      title="Click to randomize"
    />
  )
}
