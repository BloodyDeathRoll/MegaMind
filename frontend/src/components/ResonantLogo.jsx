import { useEffect, useRef } from 'react'
import p5 from 'p5'

export default function ResonantLogo({ className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sketch = (sk) => {
      let time = 0
      let f = 2
      let tf = 0.003
      let col
      let c
      let range

      function updateAnimation() {
        f = sk.random(1, 5)
        range = sk.random(0, 90)
        col = sk.color(range, 80, 15, 10)
        c = sk.color(sk.map(sk.noise(time), 0, 1, range, range + 10), 80, 90)
        tf = sk.random(0.001, 0.005)
      }

      sk.setup = () => {
        const cnv = sk.createCanvas(container.offsetWidth, container.offsetHeight)
        cnv.parent(container)
        sk.colorMode(sk.HSB, 100)
        sk.frameRate(60)
        range = sk.random(0, 90)
        col = sk.color(100, 0, 0, 10)
        sk.background(col)
        c = sk.color(100, 0, 100)
        updateAnimation()
      }

      sk.draw = () => {
        sk.fill(col)
        sk.noStroke()
        sk.rect(0, 0, sk.width, sk.height)

        sk.stroke(c)
        let x = 0
        while (x < sk.width) {
          sk.point(x, 50 + (sk.height - 50) * sk.noise(x / 700, time * 2))
          x += f
        }
        time += tf

        if (sk.frameCount >= 240 && sk.frameCount % 240 === 0) {
          updateAnimation()
        }
      }

      sk.mousePressed = () => {
        updateAnimation()
      }

      sk.windowResized = () => {
        sk.resizeCanvas(container.offsetWidth, container.offsetHeight)
      }
    }

    const p = new p5(sketch)
    return () => p.remove()
  }, [])

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />
}
