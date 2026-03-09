import { useEffect, useRef } from 'react'
import p5 from 'p5'

// ── Ported from resonant-membrane.html ──────────────────────────────────────

function mulberry32(seed) {
  let s = seed >>> 0
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const PALETTES = [
  { bg: [2, 4, 14],   a: [30, 80, 200],   b: [0, 220, 180],   c: [255, 255, 255] },
  { bg: [8, 3, 2],    a: [220, 60, 20],   b: [255, 180, 30],  c: [255, 240, 200] },
  { bg: [4, 2, 12],   a: [100, 20, 200],  b: [220, 80, 255],  c: [200, 230, 255] },
  { bg: [3, 8, 14],   a: [20, 140, 220],  b: [180, 240, 255], c: [255, 255, 255] },
  { bg: [2, 8, 2],    a: [20, 200, 80],   b: [180, 255, 60],  c: [255, 255, 200] },
  { bg: [10, 4, 6],   a: [200, 80, 100],  b: [255, 160, 120], c: [255, 230, 220] },
  { bg: [4, 4, 6],    a: [80, 90, 120],   b: [160, 170, 210], c: [240, 244, 255] },
  { bg: [10, 5, 0],   a: [200, 100, 0],   b: [255, 200, 0],   c: [255, 255, 180] },
  { bg: [8, 2, 10],   a: [180, 0, 120],   b: [255, 60, 200],  c: [255, 200, 255] },
  { bg: [2, 8, 8],    a: [0, 160, 140],   b: [100, 255, 220], c: [220, 255, 250] },
]

const AXIS_ROLES = [
  { id: 'srcFreq',      label: 'wave frequency' },
  { id: 'srcCount',     label: 'source count'   },
  { id: 'timeScale',    label: 'time speed'     },
  { id: 'contours',     label: 'contour levels' },
  { id: 'lineWeight',   label: 'line weight'    },
  { id: 'rotation',     label: 'field rotation' },
  { id: 'colorShift',   label: 'color shift'    },
  { id: 'amplitude',    label: 'amplitude'      },
  { id: 'interference', label: 'interference'   },
  { id: 'drift',        label: 'source drift'   },
]

function randomizeAll(seed) {
  const r = mulberry32(seed)
  const pal = PALETTES[Math.floor(r() * PALETTES.length)]
  const rolesCopy = [...AXIS_ROLES]
  const xi = Math.floor(r() * rolesCopy.length)
  const xRole = rolesCopy.splice(xi, 1)[0]
  const yRole = rolesCopy[Math.floor(r() * rolesCopy.length)]

  const srcCount = 2 + Math.floor(r() * 4)
  const sources = []
  for (let i = 0; i < srcCount; i++) {
    sources.push({
      nx: 0.1 + r() * 0.8, ny: 0.1 + r() * 0.8,
      freq: 0.8 + r() * 3.5,
      phase: r() * Math.PI * 2,
      amp: 0.4 + r() * 0.8,
      driftX: (r() - 0.5) * 0.0006, driftY: (r() - 0.5) * 0.0006,
      freqDrift: (r() - 0.5) * 0.0002,
    })
  }

  const styleRoll = r()
  const style = styleRoll < 0.4 ? 'contour' : styleRoll < 0.7 ? 'field' : 'hybrid'

  return {
    seed, pal, xRole, yRole, sources, style,
    baseContours:   4  + Math.floor(r() * 12),
    baseLineWeight: 0.4 + r() * 1.8,
    glowLayers:     Math.floor(r() * 3),
    baseFieldRes:   3  + Math.floor(r() * 5),
    baseTimeScale:  0.004 + r() * 0.02,
    colorMode:      Math.floor(r() * 3),
    noiseAmt:       r() * 0.1,
    noiseScale:     0.003 + r() * 0.012,
    baseRotation:   r() * Math.PI * 2,
    rotateSpeed:    (r() - 0.5) * 0.0003,
    baseSrcFreq:    0.03,
  }
}

function interferenceVal(x, y, t, sources, W, H, rotation, freqMult, ampMult) {
  const cx = W / 2, cy = H / 2, dx = x - cx, dy = y - cy
  const rx = dx * Math.cos(rotation) - dy * Math.sin(rotation) + cx
  const ry = dx * Math.sin(rotation) + dy * Math.cos(rotation) + cy
  let val = 0
  for (const src of sources) {
    const sx = src.nx * W, sy = src.ny * H
    const dist = Math.sqrt((rx - sx) ** 2 + (ry - sy) ** 2)
    val += src.amp * ampMult * Math.sin(dist * src.freq * freqMult - t + src.phase)
  }
  return val / sources.length
}

function resolveAxis(roleId, v) {
  switch (roleId) {
    case 'srcFreq':      return { freqMult:     0.01 + v * 0.09 }
    case 'srcCount':     return { srcCountMod:  Math.max(1, Math.round(v * 5)) }
    case 'timeScale':    return { timeScale:     0.001 + v * 0.06 }
    case 'contours':     return { contours:      2 + Math.round(v * 22) }
    case 'lineWeight':   return { lineWeight:    0.2 + v * 4.0 }
    case 'rotation':     return { rotation:      (v - 0.5) * Math.PI * 3 }
    case 'colorShift':   return { colorShift:    v }
    case 'amplitude':    return { ampMult:       0.1 + v * 2.5 }
    case 'interference': return { freqMult:      0.005 + v * v * 0.12 }
    case 'drift':        return { driftMult:     v * 3.0 }
    default:             return {}
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
      let mx = 0.5, my = 0.5, smx = 0.5, smy = 0.5

      function getSize() {
        return { w: container.clientWidth || 2, h: container.clientHeight || 2 }
      }

      function init() {
        sk.noiseSeed(params.seed)
        if (pg) pg.remove()
        pg = sk.createGraphics(W, H)
        pg.pixelDensity(1)
        pg.colorMode(sk.RGB, 255, 255, 255, 255)
        pg.noSmooth()
        pg.background(params.pal.bg[0], params.pal.bg[1], params.pal.bg[2])
        t = 0
      }

      sk.setup = function () {
        const sz = getSize()
        W = sz.w; H = sz.h
        sk.createCanvas(W, H)
        sk.pixelDensity(1)
        sk.noSmooth()
        sk.frameRate(60)
        params = randomizeAll(Math.floor(Math.random() * 999999))
        init()
      }

      sk.mouseMoved = function () {
        mx = Math.max(0, Math.min(1, sk.mouseX / W))
        my = Math.max(0, Math.min(1, sk.mouseY / H))
      }
      sk.mouseDragged = function () {
        mx = Math.max(0, Math.min(1, sk.mouseX / W))
        my = Math.max(0, Math.min(1, sk.mouseY / H))
      }

      sk.mousePressed = function () {
        params = randomizeAll(Math.floor(Math.random() * 999999))
        init()
      }

      sk.windowResized = function () {
        const sz = getSize()
        W = sz.w; H = sz.h
        sk.resizeCanvas(W, H)
        init()
      }

      // Also handle container resize (e.g. panel layout changes)
      const ro = new ResizeObserver(() => {
        const sz = getSize()
        if (sz.w !== W || sz.h !== H) {
          W = sz.w; H = sz.h
          sk.resizeCanvas(W, H)
          init()
        }
      })
      ro.observe(container)
      // Store cleanup on sk so it can be called in remove
      const _origRemove = sk.remove.bind(sk)
      sk.remove = function () { ro.disconnect(); _origRemove() }

      sk.draw = function () {
        t++
        smx += (mx - smx) * 0.04
        smy += (my - smy) * 0.04

        const p = params
        const pal = p.pal, bg = pal.bg

        const rx2 = resolveAxis(p.xRole.id, smx)
        const ry2 = resolveAxis(p.yRole.id, smy)
        const res = Object.assign({}, rx2, ry2)

        const freqMult    = res.freqMult    ?? p.baseSrcFreq
        const ampMult     = res.ampMult     ?? 1.0
        const timeScale   = res.timeScale   ?? p.baseTimeScale
        const contours    = res.contours    ?? p.baseContours
        const lineWeight  = res.lineWeight  ?? p.baseLineWeight
        const rotation    = res.rotation !== undefined ? res.rotation : (p.baseRotation + t * p.rotateSpeed)
        const colorShift  = res.colorShift  ?? 0
        const driftMult   = res.driftMult   ?? 1.0
        const srcCountMod = res.srcCountMod ?? p.sources.length
        const activeSrcs  = p.sources.slice(0, Math.min(srcCountMod, p.sources.length))
        const tScaled     = t * timeScale * 60

        for (const src of p.sources) {
          src.nx = Math.max(0.05, Math.min(0.95, src.nx + src.driftX * driftMult))
          src.ny = Math.max(0.05, Math.min(0.95, src.ny + src.driftY * driftMult))
          src.freq += src.freqDrift
          if (src.freq < 0.3 || src.freq > 5.5) src.freqDrift *= -1
          if (src.nx <= 0.05 || src.nx >= 0.95) src.driftX *= -1
          if (src.ny <= 0.05 || src.ny >= 0.95) src.driftY *= -1
        }

        // ── Field rendering ──
        if (p.style === 'field' || p.style === 'hybrid') {
          const fieldRes = p.baseFieldRes
          pg.loadPixels()
          const cols = Math.ceil(W / fieldRes), rows = Math.ceil(H / fieldRes)
          for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
              const x = col * fieldRes + fieldRes * 0.5
              const y = row * fieldRes + fieldRes * 0.5
              let v = interferenceVal(x, y, tScaled, activeSrcs, W, H, rotation, freqMult, ampMult)
              if (p.noiseAmt > 0) v += (sk.noise(x * p.noiseScale, y * p.noiseScale, t * 0.005) - 0.5) * p.noiseAmt * 2
              const norm = Math.max(0, Math.min(1, (v + 1) * 0.5 + colorShift * 0.3 - 0.15))
              let r2, g, b
              if (p.colorMode === 0) {
                const t2 = norm < 0.5 ? norm * 2 : (norm - 0.5) * 2
                const c1 = norm < 0.5 ? bg : pal.a, c2 = norm < 0.5 ? pal.a : pal.c
                r2 = c1[0] + (c2[0] - c1[0]) * t2; g = c1[1] + (c2[1] - c1[1]) * t2; b = c1[2] + (c2[2] - c1[2]) * t2
              } else if (p.colorMode === 1) {
                const t3 = norm * 3
                if (t3 < 1) { const f = t3; r2 = bg[0] + (pal.a[0] - bg[0]) * f; g = bg[1] + (pal.a[1] - bg[1]) * f; b = bg[2] + (pal.a[2] - bg[2]) * f }
                else if (t3 < 2) { const f = t3 - 1; r2 = pal.a[0] + (pal.b[0] - pal.a[0]) * f; g = pal.a[1] + (pal.b[1] - pal.a[1]) * f; b = pal.a[2] + (pal.b[2] - pal.a[2]) * f }
                else { const f = t3 - 2; r2 = pal.b[0] + (pal.c[0] - pal.b[0]) * f; g = pal.b[1] + (pal.c[1] - pal.b[1]) * f; b = pal.b[2] + (pal.c[2] - pal.b[2]) * f }
              } else {
                const band = Math.floor(norm * 6) / 6
                r2 = bg[0] + (pal.b[0] - bg[0]) * band; g = bg[1] + (pal.b[1] - bg[1]) * band; b = bg[2] + (pal.b[2] - bg[2]) * band
              }
              for (let py = 0; py < fieldRes && (row * fieldRes + py) < H; py++) {
                for (let px = 0; px < fieldRes && (col * fieldRes + px) < W; px++) {
                  const pidx = ((row * fieldRes + py) * W + (col * fieldRes + px)) * 4
                  pg.pixels[pidx] = Math.round(r2); pg.pixels[pidx + 1] = Math.round(g)
                  pg.pixels[pidx + 2] = Math.round(b); pg.pixels[pidx + 3] = 255
                }
              }
            }
          }
          pg.updatePixels()
          sk.image(pg, 0, 0)
        } else {
          sk.background(bg[0], bg[1], bg[2])
        }

        // ── Contour rendering (marching squares) ──
        if (p.style === 'contour' || p.style === 'hybrid') {
          const gridStep = Math.max(W / 150, 4)
          for (let li = 0; li < contours; li++) {
            const threshold = -1 + (li / (contours - 1)) * 2
            const tl = (li + colorShift * contours) % contours / Math.max(contours - 1, 1)
            let lr, lg, lb
            if (tl < 0.5) { const f = tl * 2; lr = pal.a[0] + (pal.b[0] - pal.a[0]) * f; lg = pal.a[1] + (pal.b[1] - pal.a[1]) * f; lb = pal.a[2] + (pal.b[2] - pal.a[2]) * f }
            else { const f = (tl - 0.5) * 2; lr = pal.b[0] + (pal.c[0] - pal.b[0]) * f; lg = pal.b[1] + (pal.c[1] - pal.b[1]) * f; lb = pal.b[2] + (pal.c[2] - pal.b[2]) * f }

            for (let gl = p.glowLayers; gl >= 0; gl--) {
              sk.stroke(lr, lg, lb, gl === 0 ? 220 : Math.max(30 - gl * 10, 8))
              sk.strokeWeight(gl === 0 ? lineWeight : lineWeight + gl * 2.5)
              sk.noFill()
              for (let y = 0; y < H - gridStep; y += gridStep) {
                for (let x = 0; x < W - gridStep; x += gridStep) {
                  const v00 = interferenceVal(x,             y,             tScaled, activeSrcs, W, H, rotation, freqMult, ampMult)
                  const v10 = interferenceVal(x + gridStep,  y,             tScaled, activeSrcs, W, H, rotation, freqMult, ampMult)
                  const v01 = interferenceVal(x,             y + gridStep,  tScaled, activeSrcs, W, H, rotation, freqMult, ampMult)
                  const v11 = interferenceVal(x + gridStep,  y + gridStep,  tScaled, activeSrcs, W, H, rotation, freqMult, ampMult)
                  const c00 = v00 > threshold ? 1 : 0
                  const c10 = v10 > threshold ? 1 : 0
                  const c01 = v01 > threshold ? 1 : 0
                  const c11 = v11 > threshold ? 1 : 0
                  const ci = c00 | (c10 << 1) | (c01 << 2) | (c11 << 3)
                  if (ci === 0 || ci === 15) continue

                  function l1d(a, b, th) { return Math.abs(b - a) < 0.0001 ? 0.5 : (th - a) / (b - a) }
                  const tT = l1d(v00, v10, threshold), tB = l1d(v01, v11, threshold)
                  const tL = l1d(v00, v01, threshold), tR = l1d(v10, v11, threshold)
                  const top    = { x: x + tT * gridStep, y }
                  const bottom = { x: x + tB * gridStep, y: y + gridStep }
                  const left   = { x, y: y + tL * gridStep }
                  const right  = { x: x + gridStep, y: y + tR * gridStep }

                  sk.beginShape(sk.LINES)
                  switch (ci) {
                    case  1: case 14: sk.vertex(top.x,    top.y);    sk.vertex(left.x,   left.y);   break
                    case  2: case 13: sk.vertex(top.x,    top.y);    sk.vertex(right.x,  right.y);  break
                    case  3: case 12: sk.vertex(left.x,   left.y);   sk.vertex(right.x,  right.y);  break
                    case  4: case 11: sk.vertex(bottom.x, bottom.y); sk.vertex(left.x,   left.y);   break
                    case  5: case 10: sk.vertex(top.x,    top.y);    sk.vertex(bottom.x, bottom.y); break
                    case  6: case  9: sk.vertex(top.x,    top.y);    sk.vertex(left.x,   left.y);
                                      sk.vertex(bottom.x, bottom.y); sk.vertex(right.x,  right.y);  break
                    case  7: case  8: sk.vertex(bottom.x, bottom.y); sk.vertex(right.x,  right.y);  break
                  }
                  sk.endShape()
                }
              }
            }
          }
        }
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
