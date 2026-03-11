import { useEffect, useRef } from 'react'
import p5 from 'p5'

export default function ResonantLogo({ className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sketch = (sk) => {
      // ── Seeded RNG ─────────────────────────────────────────────
      function mkRng(seed) {
        let s = (seed >>> 0) || 1
        return () => {
          s |= 0; s = s + 0x6D2B79F5 | 0
          let t = Math.imul(s ^ s >>> 15, 1 | s)
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
          return ((t ^ t >>> 14) >>> 0) / 4294967296
        }
      }

      // ── Palettes ───────────────────────────────────────────────
      const PALETTES = [
        { bg:[2,4,8],   fg:[0,180,255],   accent:[0,255,200],   dim:[0,80,120]   },
        { bg:[4,8,4],   fg:[0,255,120],   accent:[180,255,80],  dim:[0,100,40]   },
        { bg:[8,4,2],   fg:[255,120,0],   accent:[255,200,60],  dim:[120,40,0]   },
        { bg:[6,2,10],  fg:[180,80,255],  accent:[255,80,200],  dim:[80,20,120]  },
        { bg:[2,6,8],   fg:[60,200,240],  accent:[200,240,255], dim:[20,80,100]  },
        { bg:[2,2,2],   fg:[200,210,220], accent:[255,255,255], dim:[60,70,80]   },
        { bg:[8,6,2],   fg:[255,210,60],  accent:[255,255,160], dim:[120,90,0]   },
        { bg:[2,4,6],   fg:[80,180,220],  accent:[160,230,255], dim:[20,60,90]   },
        { bg:[6,2,4],   fg:[255,60,120],  accent:[255,160,180], dim:[120,0,40]   },
        { bg:[3,5,3],   fg:[100,220,160], accent:[200,255,220], dim:[30,80,50]   },
      ]
      const CONFIGS = ['orbital','lattice','constellation','field','radial','hybrid']
      const AXIS_ROLES = [
        { id:'breatheRate',  }, { id:'breatheDepth' }, { id:'rotSpeed'    },
        { id:'noiseFlow'    }, { id:'linkDist'      }, { id:'glowAmt'     },
        { id:'pulseSpeed'   }, { id:'density'       }, { id:'fadeRate'    },
        { id:'mouseField'   },
      ]

      function resolveAxis(roleId, v) {
        switch(roleId) {
          case 'breatheRate':  return { breatheRate:  0.0005 + v * 0.008  }
          case 'breatheDepth': return { breatheDepth: 0.02   + v * 0.4    }
          case 'rotSpeed':     return { rotSpeed:     0.0001 + v * 0.003  }
          case 'noiseFlow':    return { noiseFlow:    0.0002 + v * 0.004  }
          case 'linkDist':     return { linkDist:     0.04   + v * 0.18   }
          case 'glowAmt':      return { glowAmt:      0.0    + v * 2.0    }
          case 'pulseSpeed':   return { pulseSpeed:   0.002  + v * 0.04   }
          case 'density':      return { density:      0.3    + v * 1.4    }
          case 'fadeRate':     return { fadeRate:     6      + v * 40     }
          case 'mouseField':   return { mouseField:   0.0    + v * 1.0    }
          default:             return {}
        }
      }

      function randomizeUniverse(seed) {
        const r = mkRng(seed)
        const pal    = PALETTES[Math.floor(r() * PALETTES.length)]
        const config = CONFIGS[Math.floor(r() * CONFIGS.length)]
        const rolesCopy = [...AXIS_ROLES]
        const xi    = Math.floor(r() * rolesCopy.length)
        const xRole = rolesCopy.splice(xi, 1)[0]
        const yRole = rolesCopy[Math.floor(r() * rolesCopy.length)]
        return {
          seed, pal, config, xRole, yRole,
          baseBreathRate:  0.001 + r() * 0.003,
          baseBreathDepth: 0.08  + r() * 0.25,
          baseRotSpeed:    0.0003+ r() * 0.0015,
          baseNoiseFlow:   0.0005+ r() * 0.002,
          baseGlow:        0.3   + r() * 0.8,
          basePulseSpeed:  0.005 + r() * 0.025,
          baseLinkDist:    0.07  + r() * 0.12,
          baseFadeRate:    14    + Math.floor(r() * 22),
          baseMouseField:  0.3   + r() * 0.5,
          centerX:         0.3   + r() * 0.4,
          centerY:         0.3   + r() * 0.4,
          ringCount:       2     + Math.floor(r() * 5),
          baseParticleCount: 180 + Math.floor(r() * 320),
          gridCols:        8     + Math.floor(r() * 16),
          gridRows:        6     + Math.floor(r() * 10),
          clusterCount:    3     + Math.floor(r() * 6),
          particleSize:    1.0   + r() * 1.5,
          trailMode:       r() < 0.45,
        }
      }

      function buildParticles(p, W, H) {
        const r = mkRng(p.seed + 77)
        const cx = p.centerX * W, cy = p.centerY * H
        const pts = []

        if (p.config === 'orbital' || p.config === 'hybrid') {
          for (let ring = 0; ring < p.ringCount; ring++) {
            const radius  = (0.08 + ring * 0.08 + r() * 0.04) * Math.min(W, H)
            const count   = 20 + ring * 18 + Math.floor(r() * 20)
            const rotDir  = r() < 0.5 ? 1 : -1
            const tiltFreq = 0.3 + r() * 1.2
            const tiltAmp  = 0.05 + r() * 0.2
            for (let i = 0; i < count; i++) {
              pts.push({
                type:'orbital', ring, radius, baseAngle:(i/count)*Math.PI*2,
                angleOff:r()*Math.PI*2, rotDir, tiltFreq, tiltAmp, cx, cy,
                breathOff:r()*Math.PI*2, size:p.particleSize*(0.6+r()*0.8),
                alpha:120+Math.floor(r()*100), noiseOff:r()*100,
                col: r()<0.7?'fg':'accent',
              })
            }
          }
        }

        if (p.config === 'lattice') {
          const gW = W/(p.gridCols+1), gH = H/(p.gridRows+1)
          for (let col = 1; col <= p.gridCols; col++) {
            for (let row = 1; row <= p.gridRows; row++) {
              const jx=(r()-0.5)*gW*0.3, jy=(r()-0.5)*gH*0.3
              pts.push({
                type:'lattice', bx:col*gW+jx, by:row*gH+jy, x:col*gW+jx, y:row*gH+jy,
                vx:0, vy:0, col:r()<0.15?'accent':'fg', col2:'dim',
                alpha:80+Math.floor(r()*100), size:p.particleSize*(0.5+r()*0.8),
                pulseOff:r()*Math.PI*2, noiseOff:r()*100, breathOff:r()*Math.PI*2,
                isNode:r()<0.12,
              })
            }
          }
        }

        if (p.config === 'constellation') {
          for (let c = 0; c < p.clusterCount; c++) {
            const clCx=(0.1+r()*0.8)*W, clCy=(0.1+r()*0.8)*H
            const clR=(0.06+r()*0.14)*Math.min(W,H)
            const n=6+Math.floor(r()*20)
            for (let i = 0; i < n; i++) {
              const a=r()*Math.PI*2, d=r()*clR
              pts.push({
                type:'constellation', cluster:c,
                x:clCx+Math.cos(a)*d, y:clCy+Math.sin(a)*d,
                bx:clCx+Math.cos(a)*d, by:clCy+Math.sin(a)*d,
                clCx, clCy, alpha:100+Math.floor(r()*120),
                size:p.particleSize*(0.5+r()*1.0), breathOff:r()*Math.PI*2,
                noiseOff:r()*100, pulseOff:r()*Math.PI*2,
                col:r()<0.2?'accent':'fg', isBright:r()<0.15,
              })
            }
          }
        }

        if (p.config === 'field' || p.config === 'hybrid') {
          const count = p.config==='hybrid' ? Math.floor(p.baseParticleCount*0.4) : p.baseParticleCount
          for (let i = 0; i < count; i++) {
            pts.push({
              type:'field', x:r()*W, y:r()*H, vx:(r()-0.5)*0.3, vy:(r()-0.5)*0.3,
              alpha:60+Math.floor(r()*100), size:p.particleSize*(0.4+r()*0.7),
              noiseOff:r()*100, breathOff:r()*Math.PI*2,
              age:Math.floor(r()*200), maxAge:150+Math.floor(r()*250),
              col:r()<0.15?'accent':'fg',
            })
          }
        }

        if (p.config === 'radial') {
          const armCount=3+Math.floor(r()*5), perArm=30+Math.floor(r()*50)
          for (let arm = 0; arm < armCount; arm++) {
            const armAngle=(arm/armCount)*Math.PI*2+r()*0.3
            for (let i = 0; i < perArm; i++) {
              const t2=i/perArm, d=t2*Math.min(W,H)*(0.25+r()*0.2)
              pts.push({
                type:'radial', arm, armAngle, d, spread:(r()-0.5)*0.15*Math.PI,
                cx, cy, alpha:200-Math.floor(t2*160), size:p.particleSize*(1.2-t2*0.7),
                breathOff:r()*Math.PI*2, noiseOff:r()*100, col:t2<0.2?'accent':'fg',
              })
            }
          }
        }

        return pts
      }

      function drawFrame(pg2, pts, params, W, H, t2, smx2, smy2, res) {
        const p = params, pal = p.pal, bg = pal.bg
        const breathRate  = res.breatheRate  ?? p.baseBreathRate
        const breathDepth = res.breatheDepth ?? p.baseBreathDepth
        const rotSpeed    = res.rotSpeed     ?? p.baseRotSpeed
        const noiseFlow   = res.noiseFlow    ?? p.baseNoiseFlow
        const glowAmt     = res.glowAmt      ?? p.baseGlow
        const linkDist    = (res.linkDist    ?? p.baseLinkDist) * Math.min(W, H)
        const fadeRate    = res.fadeRate     ?? p.baseFadeRate
        const mouseField  = res.mouseField   ?? p.baseMouseField
        const density     = res.density      ?? 1.0
        const mxPx = smx2 * W, myPx = smy2 * H

        const getCol = (key) => key==='fg' ? pal.fg : key==='accent' ? pal.accent : pal.dim

        if (p.trailMode) {
          pg2.noStroke(); pg2.fill(bg[0],bg[1],bg[2],fadeRate); pg2.rect(0,0,W,H)
        } else {
          pg2.background(bg[0],bg[1],bg[2])
        }

        const globalBreath = Math.sin(t2 * breathRate) * breathDepth

        // Connection lines
        const linkPts = pts.filter(pt => pt.type==='lattice' || pt.type==='constellation')
        for (let i = 0; i < linkPts.length; i++) {
          for (let j = i+1; j < linkPts.length; j++) {
            const a=linkPts[i], b=linkPts[j]
            if (a.cluster!==undefined && a.cluster!==b.cluster) continue
            const dx=a.x-b.x, dy=a.y-b.y, d=Math.sqrt(dx*dx+dy*dy)
            if (d < linkDist) {
              const t3=1-d/linkDist, c=getCol(a.col2??'dim')
              const alpha=Math.round(t3*28*(1+globalBreath))
              pg2.stroke(c[0],c[1],c[2],alpha); pg2.strokeWeight(0.4)
              pg2.noFill(); pg2.line(a.x,a.y,b.x,b.y)
            }
          }
        }

        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i]
          const breathPhase = Math.sin(t2 * breathRate + pt.breathOff) * breathDepth

          if (pt.type === 'orbital') {
            pt.angleOff += rotSpeed * pt.rotDir
            const ang=pt.baseAngle+pt.angleOff
            const tilt=Math.sin(t2*breathRate*pt.tiltFreq+pt.breathOff)*pt.tiltAmp
            const r2=pt.radius*(1+breathPhase*0.3)
            pt.x=pt.cx+Math.cos(ang)*r2; pt.y=pt.cy+Math.sin(ang)*r2*(0.4+0.6*(1-Math.abs(tilt)))
            const mdx=mxPx-pt.x, mdy=myPx-pt.y, md=Math.sqrt(mdx*mdx+mdy*mdy)
            if (md<120&&md>1) { const f=(1-md/120)*mouseField*0.6; pt.x+=mdx/md*f; pt.y+=mdy/md*f }
          }
          if (pt.type === 'lattice') {
            const na=sk.noise(pt.bx*noiseFlow,pt.by*noiseFlow,t2*0.003)*Math.PI*4
            pt.vx+=Math.cos(na)*0.03; pt.vy+=Math.sin(na)*0.03
            pt.vx*=0.92; pt.vy*=0.92
            pt.vx+=(pt.bx-pt.x)*0.008; pt.vy+=(pt.by-pt.y)*0.008
            pt.x+=pt.vx; pt.y+=pt.vy
            const mdx=pt.x-mxPx, mdy=pt.y-myPx, md=Math.sqrt(mdx*mdx+mdy*mdy)
            if (md<80&&md>1) { const f=(1-md/80)*mouseField*0.4; pt.x+=mdx/md*f; pt.y+=mdy/md*f }
          }
          if (pt.type === 'constellation') {
            const na=sk.noise(pt.bx*noiseFlow,pt.by*noiseFlow,t2*0.002)*Math.PI*2
            pt.x+=Math.cos(na)*0.08; pt.y+=Math.sin(na)*0.08
            pt.x+=(pt.bx-pt.x)*0.003; pt.y+=(pt.by-pt.y)*0.003
          }
          if (pt.type === 'field') {
            const na=sk.noise(pt.x*noiseFlow,pt.y*noiseFlow,t2*0.003+pt.noiseOff)*Math.PI*4
            pt.vx+=Math.cos(na)*0.06; pt.vy+=Math.sin(na)*0.06
            pt.vx*=0.94; pt.vy*=0.94; pt.x+=pt.vx; pt.y+=pt.vy; pt.age++
            if (pt.x<0||pt.x>W||pt.y<0||pt.y>H||pt.age>pt.maxAge) {
              const rr=mkRng(params.seed+i+t2)
              pt.x=rr()*W; pt.y=rr()*H; pt.vx=0; pt.vy=0; pt.age=0
            }
          }
          if (pt.type === 'radial') {
            const a=pt.armAngle+pt.spread+t2*rotSpeed*pt.arm*0.3
            pt.x=pt.cx+Math.cos(a)*pt.d*(1+breathPhase*0.15)
            pt.y=pt.cy+Math.sin(a)*pt.d*(1+breathPhase*0.15)
          }

          const c=getCol(pt.col)
          const alpha=Math.round(pt.alpha*(1+breathPhase*0.4)*Math.min(density,1.4))
          const sz=(pt.size??1)*(1+breathPhase*0.2)
          pg2.noStroke()
          if (glowAmt>0.05) {
            pg2.fill(c[0],c[1],c[2],Math.round(alpha*0.05*glowAmt)); pg2.ellipse(pt.x,pt.y,sz*10*glowAmt,sz*10*glowAmt)
            pg2.fill(c[0],c[1],c[2],Math.round(alpha*0.12*glowAmt)); pg2.ellipse(pt.x,pt.y,sz*5*glowAmt,sz*5*glowAmt)
          }
          pg2.fill(c[0],c[1],c[2],alpha); pg2.ellipse(pt.x,pt.y,sz*2,sz*2)
          if (pt.isNode||pt.isBright) {
            const ac=pal.accent
            pg2.fill(ac[0],ac[1],ac[2],Math.round(alpha*0.9)); pg2.ellipse(pt.x,pt.y,sz*2.5,sz*2.5)
            if (pt.isNode) {
              const tl=sz*3
              pg2.stroke(ac[0],ac[1],ac[2],Math.round(alpha*0.4)); pg2.strokeWeight(0.5); pg2.noFill()
              pg2.line(pt.x-tl,pt.y,pt.x+tl,pt.y); pg2.line(pt.x,pt.y-tl,pt.x,pt.y+tl)
            }
          }
          if (pt.type==='field') {
            const spd=Math.sqrt(pt.vx*pt.vx+pt.vy*pt.vy)
            if (spd>0.05) {
              const dl=Math.min(spd*4,6)
              pg2.stroke(c[0],c[1],c[2],Math.round(alpha*0.5)); pg2.strokeWeight(sz*0.7); pg2.noFill()
              pg2.line(pt.x,pt.y,pt.x-pt.vx/spd*dl,pt.y-pt.vy/spd*dl)
            }
          }
        }

        // Scanning line
        const scanY=((t2*0.003)%1.0)*H
        pg2.noFill()
        pg2.stroke(pal.fg[0],pal.fg[1],pal.fg[2],12); pg2.strokeWeight(1); pg2.line(0,scanY,W,scanY)
        pg2.stroke(pal.fg[0],pal.fg[1],pal.fg[2],5);  pg2.strokeWeight(3); pg2.line(0,scanY,W,scanY)
      }

      let W, H, params, pts, pg, frameT = 0
      let mx = 0.5, my = 0.5, smx = 0.5, smy = 0.5

      function getSize() { return { w: container.clientWidth || 2, h: container.clientHeight || 2 } }

      function init() {
        const sz = getSize(); W = sz.w; H = sz.h
        sk.noiseSeed(params.seed)
        pts = buildParticles(params, W, H)
        if (pg) pg.remove()
        pg = sk.createGraphics(W, H)
        pg.pixelDensity(1)
        pg.colorMode(sk.RGB, 255, 255, 255, 255)
        pg.background(...params.pal.bg)
        frameT = 0
      }

      sk.setup = function() {
        const sz = getSize(); W = sz.w; H = sz.h
        sk.createCanvas(W, H)
        sk.pixelDensity(1)
        sk.colorMode(sk.RGB, 255, 255, 255, 255)
        sk.frameRate(60)
        params = randomizeUniverse(Math.floor(Math.random() * 999999))
        init()
      }

      sk.mouseMoved   = function() { mx=Math.max(0,Math.min(1,sk.mouseX/W)); my=Math.max(0,Math.min(1,sk.mouseY/H)) }
      sk.mouseDragged = function() { mx=Math.max(0,Math.min(1,sk.mouseX/W)); my=Math.max(0,Math.min(1,sk.mouseY/H)) }

      sk.mousePressed = function() {
        params = randomizeUniverse(Math.floor(Math.random() * 999999))
        init()
      }

      sk.windowResized = function() {
        const sz = getSize(); W = sz.w; H = sz.h
        sk.resizeCanvas(W, H); init()
      }

      const ro = new ResizeObserver(() => {
        const sz = getSize()
        if (sz.w !== W || sz.h !== H) { W = sz.w; H = sz.h; sk.resizeCanvas(W, H); init() }
      })
      ro.observe(container)
      const _origRemove = sk.remove.bind(sk)
      sk.remove = function() { ro.disconnect(); _origRemove() }

      sk.draw = function() {
        frameT++
        smx += (mx-smx)*0.03; smy += (my-smy)*0.03
        const rx = resolveAxis(params.xRole.id, smx)
        const ry = resolveAxis(params.yRole.id, smy)
        const res = Object.assign({}, rx, ry)
        drawFrame(pg, pts, params, W, H, frameT, smx, smy, res)
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
