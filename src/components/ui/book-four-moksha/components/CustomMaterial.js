import { Color, ShaderMaterial } from 'three'
import { extend } from '@react-three/fiber'

export class CustomMaterial extends ShaderMaterial {
  constructor() {
    super({
      vertexShader: `
        uniform float shift;
        varying vec2 vUv;
        void main() {
          vec3 pos = position;
          pos.y += sin(uv.x * 3.1415926535897932384626433832795) * shift * 0.25;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tex;
        uniform float hasTexture;
        uniform float shift;
        uniform float scale;
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          vec2 uv = (vUv - vec2(0.5)) * (1.0 - scale) + vec2(0.5);
          vec2 offset = shift / 4.0 * vec2(cos(1.55), sin(1.55));
          vec4 red = texture2D(tex, uv + offset);
          vec4 base = texture2D(tex, uv);
          vec4 blue = texture2D(tex, uv - offset);
          if (hasTexture == 1.0) gl_FragColor = vec4(red.r, base.g, blue.b, base.a);
          else gl_FragColor = vec4(color, opacity);
        }
      `,
      uniforms: {
        tex: { value: null },
        hasTexture: { value: 0 },
        scale: { value: 0 },
        shift: { value: 0 },
        opacity: { value: 1 },
        color: { value: new Color('white') },
      },
    })
  }

  set scale(value) {
    this.uniforms.scale.value = value
  }

  get scale() {
    return this.uniforms.scale.value
  }

  set shift(value) {
    this.uniforms.shift.value = value
  }

  get shift() {
    return this.uniforms.shift.value
  }

  set map(value) {
    this.uniforms.hasTexture.value = Number(Boolean(value))
    this.uniforms.tex.value = value
  }

  get map() {
    return this.uniforms.tex.value
  }

  get color() {
    return this.uniforms.color.value
  }
}

Object.defineProperty(CustomMaterial.prototype, 'opacity', {
  configurable: true,
  get() {
    return this.uniforms.opacity.value
  },
  set(value) {
    if (this.uniforms) this.uniforms.opacity.value = value
  },
})

extend({ CustomMaterial })
