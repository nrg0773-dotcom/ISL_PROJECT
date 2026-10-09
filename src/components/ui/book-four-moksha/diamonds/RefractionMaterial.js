import { ShaderMaterial, Vector2 } from 'three'

export default class RefractionMaterial extends ShaderMaterial {
  constructor(environment, backfaces, resolution) {
    super({
      vertexShader: `
        varying vec3 worldNormal;
        varying vec3 viewDirection;
        void main() {
          vec4 transformedNormal = vec4(normal, 0.0);
          vec4 transformedPosition = vec4(position, 1.0);
          #ifdef USE_INSTANCING
            transformedNormal = instanceMatrix * transformedNormal;
            transformedPosition = instanceMatrix * transformedPosition;
          #endif
          worldNormal = normalize(modelViewMatrix * transformedNormal).xyz;
          viewDirection = normalize(
            (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition
          );
          gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D envMap;
        uniform sampler2D backfaceMap;
        uniform vec2 resolution;
        varying vec3 worldNormal;
        varying vec3 viewDirection;
        float fresnelFunc(vec3 direction, vec3 normal) {
          return pow(1.05 + dot(direction, normal), 100.0);
        }
        void main() {
          vec2 uv = gl_FragCoord.xy / resolution;
          vec3 normal = worldNormal * 0.3 -
            texture2D(backfaceMap, uv).rgb * 0.7;
          vec2 refractedUv = uv +
            refract(viewDirection, normal, 1.0 / 1.5).xy;
          vec3 color = texture2D(envMap, refractedUv).rgb;
          gl_FragColor = vec4(
            mix(color, vec3(0.4), fresnelFunc(viewDirection, normal)),
            1.0
          );
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      uniforms: {
        envMap: { value: environment },
        backfaceMap: { value: backfaces },
        resolution: { value: new Vector2(...resolution) },
      },
    })
  }
}
