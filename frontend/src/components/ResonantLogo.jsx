import { useEffect, useRef } from 'react'

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_t;
uniform sampler2D u_prev;

vec3 hash3(vec2 p) {
  vec3 q = vec3(dot(p,vec2(127.1,311.7)),
                dot(p,vec2(269.5,183.3)),
                dot(p,vec2(419.2,371.9)));
  return fract(sin(q)*43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(dot(hash3(i        ).xy, f-vec2(0,0)),
                 dot(hash3(i+vec2(1,0)).xy, f-vec2(1,0)), u.x),
             mix(dot(hash3(i+vec2(0,1)).xy, f-vec2(0,1)),
                 dot(hash3(i+vec2(1,1)).xy, f-vec2(1,1)), u.x), u.y);
}

float fbm(vec2 p, int oct) {
  float v = 0.0; float a = 0.5; float freq = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= oct) break;
    v += a * noise(p * freq);
    a    *= 0.5;
    freq *= 2.17;
    p = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5)) * p;
  }
  return v;
}

vec3 palette(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 0.5);
  vec3 d = vec3(0.80, 0.90, 0.30);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p  = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

  float T = u_t * 0.18;

  vec2 q = vec2(fbm(p + vec2(0.0,  0.0), 6),
                fbm(p + vec2(5.2,  1.3), 6));

  vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7, 9.2) + 0.15*T, 6),
                fbm(p + 4.0*q + vec2(8.3, 2.8) + 0.12*T, 6));

  vec2 s = vec2(fbm(p + 3.5*r + vec2(3.1, 4.4) + 0.09*T, 5),
                fbm(p + 3.5*r + vec2(7.2, 0.6) + 0.07*T, 5));

  float f = fbm(p + 2.8*s, 5);
  f = fbm(p + f + 0.6*sin(T*0.7 + f*6.28), 5);

  float lens = 0.5 + 0.5 * fbm(4.0*p + 0.5*vec2(sin(T*0.31), cos(T*0.27)), 4);
  f = mix(f, lens, 0.28);

  vec3 col = palette(f + T * 0.04);

  float vig = 1.0 - 0.55 * dot(uv - 0.5, uv - 0.5) * 4.0;
  col *= vig;

  vec3 prev = texture2D(u_prev, uv).rgb;
  col = mix(prev, col, 0.045);

  gl_FragColor = vec4(col, 1.0);
}
`

export default function ResonantLogo({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) return

    function compile(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uRes  = gl.getUniformLocation(prog, 'u_res')
    const uT    = gl.getUniformLocation(prog, 'u_t')
    const uPrev = gl.getUniformLocation(prog, 'u_prev')

    function makeFBO(w, h) {
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const fbo = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return { tex, fbo }
    }

    let W = canvas.clientWidth
    let H = canvas.clientHeight
    canvas.width = W
    canvas.height = H
    gl.viewport(0, 0, W, H)

    let fbos = [makeFBO(W, H), makeFBO(W, H)]
    let ping = 0

    const ro = new ResizeObserver(() => {
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = W
      canvas.height = H
      gl.viewport(0, 0, W, H)
      fbos = [makeFBO(W, H), makeFBO(W, H)]
    })
    ro.observe(canvas)

    let t0 = null
    let rafId
    function frame(ts) {
      if (!t0) t0 = ts
      const t = (ts - t0) * 0.001

      gl.uniform2f(uRes, W, H)
      gl.uniform1f(uT, t)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fbos[ping].tex)
      gl.uniform1i(uPrev, 0)

      const next = 1 - ping
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[next].fbo)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.bindTexture(gl.TEXTURE_2D, fbos[next].tex)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      ping = next
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
