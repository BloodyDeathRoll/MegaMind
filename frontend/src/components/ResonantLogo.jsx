import { useEffect, useRef } from 'react'
import p5 from 'p5'

// ── Ported from animations/infinite-regeneration.html ────────────

// ── React component ──────────────────────────────────────────────
export default function ResonantLogo({ className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sketch = (sk) => {
      // Constants
      const N         = 20000
      const FIELD_W   = 4000
      const FIELD_H   = 2800
      const FIELD_D   = 7000
      const VOL_SCALE = 0.00080
      const VOL_T     = 0.00028
      const CAM_SPEED = 2.2
      const FOV       = 600
      const GRID_W    = 48
      const GRID_H    = 30
      const FBM_OCT   = 4
      const FBM_FREQ  = 0.020
      const FBM_STR   = 55
      const FBM_T     = 0.00010

      // Typed arrays — allocated once
      const px    = new Float32Array(N)
      const py    = new Float32Array(N)
      const pz    = new Float32Array(N)
      const psize = new Float32Array(N)
      const pasp  = new Float32Array(N)
      const gdx   = new Float32Array(GRID_W * GRID_H)
      const gdy   = new Float32Array(GRID_W * GRID_H)

      let W, H
      let camZ = 0, camX = 0, camY = 0, camVX = 0, camVY = 0
      let noiseOX = 0, noiseOY = 0, noiseOZ = 0
      let camStartX = 0, camStartY = 0
      let frameT = 0
      let smx = 0.5, smy = 0.5, tmx = 0.5, tmy = 0.5

      function getSize() {
        return { w: container.clientWidth || 2, h: container.clientHeight || 2 }
      }

      function randomise() {
        noiseOX   = Math.random() * 10000 - 5000
        noiseOY   = Math.random() * 10000 - 5000
        noiseOZ   = Math.random() * 10000 - 5000
        camStartX = (Math.random() - 0.5) * FIELD_W * 0.4
        camStartY = (Math.random() - 0.5) * FIELD_H * 0.4
        camX = camStartX; camY = camStartY
        camZ = 0; camVX = 0; camVY = 0
        frameT = 0
      }

      function spawnParticle(i, fullDepth) {
        px[i]    = (sk.random() - 0.5) * FIELD_W + camStartX
        py[i]    = (sk.random() - 0.5) * FIELD_H + camStartY
        pz[i]    = fullDepth
          ? camZ + sk.random() * FIELD_D
          : camZ + FIELD_D * 0.85 + sk.random() * FIELD_D * 0.18
        psize[i] = 1.0 + sk.random() * 11.0
        pasp[i]  = 0.15 + sk.random() * sk.random() * 0.85
      }

      function bakeFractalGrid(ft) {
        const ox = noiseOX * 0.001
        const oy = noiseOY * 0.001
        const ot = ft + noiseOZ * 0.001
        for (let gy = 0; gy < GRID_H; gy++) {
          for (let gx = 0; gx < GRID_W; gx++) {
            let dx = 0, dy = 0, amp = 1.0, freq = FBM_FREQ, ma = 0
            for (let o = 0; o < FBM_OCT; o++) {
              const fx = gx * freq + ox
              const fy = gy * freq + oy
              const fz = ot + o * 5.9
              dx += (sk.noise(fx, fy,       fz) - 0.5) * amp
              dy += (sk.noise(fx, fy + 400, fz) - 0.5) * amp
              ma += amp; amp *= 0.50; freq *= 2.05
            }
            const idx = gy * GRID_W + gx
            gdx[idx] = (dx / ma) * FBM_STR
            gdy[idx] = (dy / ma) * FBM_STR
          }
        }
      }

      function sampleDisplace(sx, sy) {
        const gxf = (sx / W) * (GRID_W - 1)
        const gyf = (sy / H) * (GRID_H - 1)
        const gx0 = Math.max(0, Math.min(GRID_W - 2, gxf | 0))
        const gy0 = Math.max(0, Math.min(GRID_H - 2, gyf | 0))
        const tx  = gxf - gx0, ty = gyf - gy0
        const i00 = gy0 * GRID_W + gx0
        return [
          gdx[i00]*(1-tx)*(1-ty) + gdx[i00+1]*tx*(1-ty) + gdx[i00+GRID_W]*(1-tx)*ty + gdx[i00+GRID_W+1]*tx*ty,
          gdy[i00]*(1-tx)*(1-ty) + gdy[i00+1]*tx*(1-ty) + gdy[i00+GRID_W]*(1-tx)*ty + gdy[i00+GRID_W+1]*tx*ty,
        ]
      }

      sk.setup = function() {
        const sz = getSize()
        W = sz.w; H = sz.h
        sk.createCanvas(W, H)
        sk.pixelDensity(1)
        sk.frameRate(60)
        sk.noStroke()
        randomise()
        for (let i = 0; i < N; i++) spawnParticle(i, true)
      }

      sk.mouseMoved   = function() { tmx = Math.max(0, Math.min(1, sk.mouseX / W)); tmy = Math.max(0, Math.min(1, sk.mouseY / H)) }
      sk.mouseDragged = function() { tmx = Math.max(0, Math.min(1, sk.mouseX / W)); tmy = Math.max(0, Math.min(1, sk.mouseY / H)) }

      sk.mousePressed = function() {
        randomise()
        for (let i = 0; i < N; i++) spawnParticle(i, true)
      }

      sk.windowResized = function() {
        const sz = getSize()
        W = sz.w; H = sz.h
        sk.resizeCanvas(W, H)
      }

      const ro = new ResizeObserver(() => {
        const sz = getSize()
        if (sz.w !== W || sz.h !== H) {
          W = sz.w; H = sz.h
          sk.resizeCanvas(W, H)
        }
      })
      ro.observe(container)
      const _origRemove = sk.remove.bind(sk)
      sk.remove = function() { ro.disconnect(); _origRemove() }

      sk.draw = function() {
        frameT++

        smx += (tmx - smx) * 0.025
        smy += (tmy - smy) * 0.025
        camVX += ((smx - 0.5) * 1.1 - camVX) * 0.03
        camVY += ((smy - 0.5) * 0.65 - camVY) * 0.03
        camX  += camVX
        camY  += camVY
        camZ  += CAM_SPEED

        const nt = camZ * VOL_T
        const ft = frameT * FBM_T
        const cx = W / 2, cy = H / 2

        bakeFractalGrid(ft)
        sk.background(0)

        for (let i = 0; i < N; i++) {
          const dz = pz[i] - camZ

          if (dz < -10) {
            spawnParticle(i, false)
            continue
          }
          if (dz > FIELD_D) continue

          const scale  = FOV / (Math.max(dz, 1) + FOV)
          const rawSx  = cx + (px[i] - camX) * scale
          const rawSy  = cy + (py[i] - camY) * scale

          const margin = FBM_STR + 28
          if (rawSx + margin < 0 || rawSx - margin > W ||
              rawSy + margin < 0 || rawSy - margin > H) continue

          const [ddx, ddy] = sampleDisplace(rawSx, rawSy)
          const sx = rawSx + ddx
          const sy = rawSy + ddy

          const nv = sk.noise(
            (px[i] - camStartX) * VOL_SCALE + noiseOX * 0.0005,
            (py[i] - camStartY) * VOL_SCALE + noiseOY * 0.0005,
            pz[i]               * VOL_SCALE * 0.20 + noiseOZ * 0.0005 + nt
          )

          const sz2 = psize[i] * scale * (0.3 + nv * 1.1)
          if (sz2 < 0.3) continue

          const NEAR_FADE = 300
          const df       = 1.0 - dz / FIELD_D
          const nearFade = dz < NEAR_FADE ? dz / NEAR_FADE : 1.0
          const alpha    = df * df * nearFade * 255 | 0
          if (alpha < 3) continue

          const angle = nv * 6.2832
          const asp   = pasp[i] * (0.6 + nv * 0.8)

          sk.fill(255, 255, 255, alpha)
          sk.translate(sx, sy)
          sk.rotate(angle)
          sk.ellipse(0, 0, sz2 * 2, sz2 * 2 * asp)
          sk.rotate(-angle)
          sk.translate(-sx, -sy)
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
