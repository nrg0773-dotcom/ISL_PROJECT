import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import {
  Environment,
  Html,
  useGLTF,
} from '@react-three/drei'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import * as THREE from 'three'
import { useNavigate, useParams } from 'react-router-dom'
import moonFont from './book-four-moksha/assets/MOONGET_Heavy.blob?url'
import diamondModel from './book-four-moksha/assets/diamond.glb?url'
import imageOne from './book-four-moksha/assets/photo-1515036551567-bf1198cccc35.jpeg'
import imageTwo from './book-four-moksha/assets/photo-1519608487953-e999c86e7455.jpeg'
import imageThree from './book-four-moksha/assets/ph1.jpg'
import imageFour from './book-four-moksha/assets/ph3.jpg'
import imageFive from './book-four-moksha/assets/photo-1533577116850-9cc66cad8a9b.jpeg'
import imageSix from './book-four-moksha/assets/photo-1548191265-cc70d3d45ba1.jpeg'

const images = [imageOne, imageTwo, imageThree, imageFour, imageFive, imageSix]
const ZOOM = 60
const ARTICLE_LAYOUT = [
  { offset: 1, factor: 1.75 },
  { offset: 2.25, factor: 2 },
  { offset: 3.5, factor: 2.25 },
  { offset: 4.75, factor: 2 },
  { offset: 6, factor: 1.75 },
]

function ScrollBlock({ children, offset = 0, factor = 1, scrollState }) {
  const group = useRef(null)
  const { viewport } = useThree()

  useFrame((_, delta) => {
    if (!group.current) return
    const targetY =
      -viewport.height * offset * factor +
      (scrollState.current.top / ZOOM) * factor
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      targetY,
      10,
      delta,
    )
  })

  return <group ref={group}>{children}</group>
}

function MokshaImage({ image, aspect, scrollState, ...props }) {
  const texture = useLoader(THREE.TextureLoader, image)
  const material = useRef(null)
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(1, 1, 32, 32),
    [],
  )

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.needsUpdate = true
  }, [texture])

  useFrame((_, delta) => {
    if (!material.current) return
    material.current.uniforms.uShift.value = THREE.MathUtils.damp(
      material.current.uniforms.uShift.value,
      scrollState.current.shift,
      8,
      delta,
    )
  })

  return (
    <mesh
      geometry={geometry}
      scale={[props.width, props.width / aspect, 1]}
      position={props.position}
      rotation={props.rotation}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={material}
        uniforms={{
          uMap: { value: texture },
          uShift: { value: 0 },
        }}
        vertexShader={`
          uniform float uShift;
          varying vec2 vUv;
          void main() {
            vec3 pos = position;
            pos.y += sin(uv.x * 3.141592653589793) * uShift * 0.25;
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D uMap;
          uniform float uShift;
          varying vec2 vUv;
          void main() {
            vec2 offset = (uShift / 4.0) * vec2(cos(1.55), sin(1.55));
            vec4 red = texture2D(uMap, vUv + offset);
            vec4 base = texture2D(uMap, vUv);
            vec4 blue = texture2D(uMap, vUv - offset);
            gl_FragColor = vec4(red.r, base.g, blue.b, base.a);
          }
        `}
      />
    </mesh>
  )
}

function MokshaHeading({
  children,
  size = 0.5,
  maxWidth = Infinity,
  color,
  position,
  align = 'left',
}) {
  const font = useLoader(FontLoader, moonFont)
  const geometry = useMemo(() => {
    const textGeometry = new TextGeometry(children, {
      font,
      size: 1,
      depth: 0.025,
      curveSegments: 8,
      bevelEnabled: false,
    })
    textGeometry.computeBoundingBox()
    const bounds = textGeometry.boundingBox
    if (bounds) {
      const width = bounds.max.x - bounds.min.x
      const height = bounds.max.y - bounds.min.y
      textGeometry.translate(
        align === 'right' ? -bounds.max.x : align === 'center' ? -width / 2 : -bounds.min.x,
        -height / 2,
        0,
      )
    }
    return textGeometry
  }, [align, children, font])
  const bounds = geometry.boundingBox
  const textWidth = bounds ? bounds.max.x - bounds.min.x : 0
  const fittedSize =
    textWidth > 0 ? Math.min(size, maxWidth / textWidth) : size

  return (
    <mesh
      geometry={geometry}
      position={position}
      scale={fittedSize}
      frustumCulled={false}
    >
      <meshStandardMaterial color={color} roughness={0.72} />
    </mesh>
  )
}

function Article({ section, index, scrollState }) {
  const { viewport, size } = useThree()
  const mobile = size.width < 700
  const contentWidth = viewport.width * (mobile ? 0.8 : 0.6)
  const onLeft = index % 2 === 0
  const { offset, factor } = ARTICLE_LAYOUT[index]
  const imageAspect = [1.51, 1.5, 1.5037, 0.665, 1.55, 1.77][index]
  const imageScale = imageAspect < 1 && !mobile ? 0.65 : 1
  const imageWidth = contentWidth * imageScale
  const imageHeight = imageWidth / imageAspect
  const margin = viewport.width * (mobile ? 0.2 : 0.1)
  const groupX = (viewport.width - imageWidth - margin) / 2

  return (
    <ScrollBlock offset={offset} factor={factor} scrollState={scrollState}>
      <group position={[onLeft ? -groupX : groupX, 0, 0]}>
        <MokshaImage
          image={images[index]}
          aspect={imageAspect}
          width={imageWidth}
          position={[0, 0, 0]}
          rotation={[0, 0, onLeft ? -0.035 : 0.035]}
          scrollState={scrollState}
        />
        <MokshaHeading
          size={contentWidth * 0.04}
          maxWidth={imageWidth}
          color={index % 2 ? '#d40749' : '#2fe8c3'}
          position={[
            onLeft || mobile ? -imageWidth / 2 : 0,
            imageHeight / 2 + 0.5,
            -0.1,
          ]}
          align={onLeft ? 'left' : 'right'}
        >
          {section.header}
        </MokshaHeading>
        <Html
          position={[
            onLeft || mobile ? -imageWidth / 2 : 0,
            -imageHeight / 2 - 0.4,
            0.25,
          ]}
          style={{
            width: `${Math.max(240, contentWidth * ZOOM * (mobile ? 1 : 0.5))}px`,
            color: '#d0d2d5',
            fontFamily: '"Geist Variable", sans-serif',
            fontSize: '15px',
            lineHeight: 1.65,
            textAlign: onLeft || mobile ? 'left' : 'right',
            pointerEvents: 'none',
          }}
        >
          {section.text}
        </Html>
        <ScrollBlock offset={0} factor={0.2} scrollState={scrollState}>
          <MokshaHeading
            size={Math.min(1.4, viewport.width * 0.13)}
            maxWidth={viewport.width * 0.72}
            color="#1a1e2a"
            position={[onLeft ? imageWidth / 2 : -imageWidth / 2, imageHeight, -0.2]}
            align={onLeft ? 'left' : 'right'}
          >
            {String(index + 1).padStart(2, '0')}
          </MokshaHeading>
        </ScrollBlock>
      </group>
    </ScrollBlock>
  )
}

function DiamondField({ scrollState }) {
  const mesh = useRef(null)
  const { nodes } = useGLTF(diamondModel)
  const { viewport, size, gl, scene, camera } = useThree()
  useLayoutEffect(() => {
    mesh.current?.layers.set(1)
  }, [])
  const geometry = useMemo(
    () => nodes.pCone1_lambert1_0.geometry.clone().center(),
    [nodes],
  )
  const renderTargets = useMemo(() => {
    const pixelRatio = gl.getPixelRatio()
    const width = Math.max(1, Math.floor(size.width * pixelRatio))
    const height = Math.max(1, Math.floor(size.height * pixelRatio))
    const environment = new THREE.WebGLRenderTarget(width, height)
    const backfaces = new THREE.WebGLRenderTarget(width, height)
    const backfaceMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldNormal;
        void main() {
          vec4 transformedNormal = vec4(normal, 0.0);
          vec4 transformedPosition = vec4(position, 1.0);
          #ifdef USE_INSTANCING
            transformedNormal = instanceMatrix * transformedNormal;
            transformedPosition = instanceMatrix * transformedPosition;
          #endif
          vWorldNormal = normalize(modelViewMatrix * transformedNormal).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldNormal;
        void main() {
          gl_FragColor = vec4(vWorldNormal, 1.0);
        }
      `,
      side: THREE.BackSide,
    })
    const refractionMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldNormal;
        varying vec3 vViewDirection;
        void main() {
          vec4 transformedNormal = vec4(normal, 0.0);
          vec4 transformedPosition = vec4(position, 1.0);
          #ifdef USE_INSTANCING
            transformedNormal = instanceMatrix * transformedNormal;
            transformedPosition = instanceMatrix * transformedPosition;
          #endif
          vWorldNormal = normalize(modelViewMatrix * transformedNormal).xyz;
          vViewDirection = normalize(
            (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition
          );
          gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uEnvironment;
        uniform sampler2D uBackfaces;
        uniform vec2 uResolution;
        varying vec3 vWorldNormal;
        varying vec3 vViewDirection;
        float fresnel(vec3 viewDirection, vec3 normal) {
          return pow(1.05 + dot(viewDirection, normal), 100.0);
        }
        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution;
          vec3 normal = vWorldNormal * 0.3 -
            texture2D(uBackfaces, uv).rgb * 0.7;
          vec2 refractedUv = uv +
            refract(vViewDirection, normal, 1.0 / 1.5).xy;
          vec3 color = texture2D(uEnvironment, refractedUv).rgb;
          gl_FragColor = vec4(
            mix(color, vec3(0.4), fresnel(vViewDirection, normal)),
            1.0
          );
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      uniforms: {
        uEnvironment: { value: environment.texture },
        uBackfaces: { value: backfaces.texture },
        uResolution: { value: new THREE.Vector2(width, height) },
      },
    })
    return { environment, backfaces, backfaceMaterial, refractionMaterial }
  }, [gl, size.height, size.width])
  useEffect(
    () => () => {
      renderTargets.environment.dispose()
      renderTargets.backfaces.dispose()
      renderTargets.backfaceMaterial.dispose()
      renderTargets.refractionMaterial.dispose()
    },
    [renderTargets],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const placements = useMemo(
    () => [
      { x: 0, offset: 1, scale: 14, factor: 1 },
      { x: 0.08, offset: 1.1, scale: 1.8, factor: 2.1 },
      { x: -0.16, offset: 2, scale: 1.8, factor: 2.5 },
      { x: 0, offset: 3.2, scale: 1.8, factor: 1.75 },
      { x: 0, offset: 4, scale: 1.8, factor: 2.5 },
      { x: 0.08, offset: 5.5, scale: 2.25, factor: 0.85 },
      { x: -0.16, offset: 6.4, scale: 1.8, factor: 1.2 },
      { x: 0.28, offset: 7, scale: 4.5, factor: 1 },
    ],
    [],
  )

  useFrame(({ clock }) => {
    if (!mesh.current) return
    placements.forEach((placement, index) => {
      const scale = (viewport.width * 0.6 / 35) * placement.scale
      dummy.position.set(
        size.width < 700 ? 0 : viewport.width * placement.x,
        -viewport.height * placement.offset * placement.factor +
          (scrollState.current.top / ZOOM) * placement.factor,
        5,
      )
      dummy.rotation.set(
        clock.elapsedTime * 0.16,
        clock.elapsedTime * (index === placements.length - 1 ? 0.25 : 0.16),
        clock.elapsedTime * 0.12,
      )
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    const { environment, backfaces, backfaceMaterial, refractionMaterial } =
      renderTargets
    const pixelRatio = gl.getPixelRatio()
    const width = Math.max(1, Math.floor(size.width * pixelRatio))
    const height = Math.max(1, Math.floor(size.height * pixelRatio))
    if (environment.width !== width || environment.height !== height) {
      environment.setSize(width, height)
      backfaces.setSize(width, height)
    }
    refractionMaterial.uniforms.uResolution.value.set(width, height)

    const previousAutoClear = gl.autoClear
    const previousMaterial = mesh.current.material
    const previousTarget = gl.getRenderTarget()
    const previousCameraLayers = camera.layers.mask
    const previousVisible = mesh.current.visible

    try {
      gl.autoClear = false
      mesh.current.layers.set(1)
      mesh.current.visible = false

      camera.layers.set(0)
      gl.setRenderTarget(environment)
      gl.clear(true, true, true)
      gl.render(scene, camera)

      mesh.current.visible = previousVisible
      camera.layers.set(1)
      mesh.current.material = backfaceMaterial
      gl.setRenderTarget(backfaces)
      gl.clear(true, true, true)
      gl.render(scene, camera)

      camera.layers.set(0)
      mesh.current.material = previousMaterial
      gl.setRenderTarget(null)
      gl.clear(true, true, true)
      gl.render(scene, camera)

      camera.layers.set(1)
      mesh.current.material = refractionMaterial
      gl.clearDepth()
      gl.render(scene, camera)
    } finally {
      gl.setRenderTarget(previousTarget)
      camera.layers.mask = previousCameraLayers
      mesh.current.material = previousMaterial
      mesh.current.visible = previousVisible
      gl.autoClear = previousAutoClear
    }
  }, 1)

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, renderTargets.refractionMaterial, placements.length]}
      position={[0, 0, 5]}
      frustumCulled={false}
    />
  )
}

function ScrollShiftDecay({ scrollState }) {
  useFrame((_, delta) => {
    scrollState.current.shift = THREE.MathUtils.damp(
      scrollState.current.shift,
      0,
      5,
      delta,
    )
  })

  return null
}

function MokshaScene({ book, sections, closing, scrollState }) {
  const { viewport } = useThree()

  return (
    <>
      <color attach="background" args={['#0c0f13']} />
      <fog attach="fog" args={['#0c0f13', 24, 95]} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[5, 10, 8]} intensity={2} />
      <ScrollShiftDecay scrollState={scrollState} />
      <Suspense fallback={null}>
        <ScrollBlock offset={0.28} factor={1.2} scrollState={scrollState}>
          <MokshaHeading
            size={Math.min(1.35, viewport.width * 0.17)}
            maxWidth={viewport.width * 0.82}
            color="#d40749"
            position={[-viewport.width * 0.4, viewport.height * 0.26, 0]}
          >
            {book.title.toUpperCase()}
          </MokshaHeading>
          <Html
            position={[-viewport.width / 2, -viewport.height / 2 + 1, 0]}
            style={{
              maxWidth: '420px',
              color: '#f4eee9',
              fontFamily: '"Geist Variable", sans-serif',
              fontSize: '15px',
              lineHeight: 1.6,
              pointerEvents: 'none',
            }}
          >
            Scroll to explore / Edition 04
          </Html>
        </ScrollBlock>
        {sections.map((section, index) => (
          <Article
            key={`${section.header}-${index}`}
            section={section}
            index={index}
            scrollState={scrollState}
          />
        ))}
        <ScrollBlock offset={7} factor={1} scrollState={scrollState}>
          <MokshaHeading
            size={Math.min(0.8, viewport.width * 0.1)}
            maxWidth={viewport.width * 0.48}
            color="#2fe8c3"
            position={[-viewport.width * 0.38, viewport.height * 0.3, 0]}
            align="left"
          >
            {closing}
          </MokshaHeading>
        </ScrollBlock>
        <DiamondField scrollState={scrollState} />
        <Environment preset="city" />
      </Suspense>
    </>
  )
}

export default function BookFourMokshaExperience({ book, sections, closing }) {
  const navigate = useNavigate()
  const { bookId } = useParams()
  const scrollArea = useRef(null)
  const scrollState = useRef({ top: 0, shift: 0 })

  const handleScroll = (event) => {
    const currentTop = event.currentTarget.scrollTop
    const distance = currentTop - scrollState.current.top
    scrollState.current.top = currentTop
    scrollState.current.shift = THREE.MathUtils.clamp(
      (distance / 75) * 1.5,
      -1.5,
      1.5,
    )
  }

  return (
    <main className="book-four-moksha-scene">
      <Canvas
        className="book-four-moksha-canvas"
        orthographic
        camera={{ zoom: ZOOM, position: [0, 0, 50] }}
        dpr={[1, 1.5]}
      >
        <MokshaScene
          book={book}
          sections={sections}
          closing={closing}
          scrollState={scrollState}
        />
      </Canvas>
      <div
        ref={scrollArea}
        className="book-four-moksha-scroll-area"
        onScroll={handleScroll}
        aria-label="Scroll through Book 4"
        role="region"
        tabIndex={0}
      >
        {Array.from({ length: sections.length + 3 }, (_, index) => (
          <div
            className="book-four-moksha-scroll-section"
            key={index}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          navigate('/', {
            state: { skipRouteRipple: true, focusBookId: bookId },
          })
        }
        className="absolute right-5 top-5 z-20 rounded-full border border-white/20 bg-black/35 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-8 sm:top-7"
      >
        Back to bookshelf
      </button>
    </main>
  )
}

useGLTF.preload(diamondModel)
