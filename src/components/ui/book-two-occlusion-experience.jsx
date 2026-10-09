import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Billboard,
  ContactShadows,
  Environment,
  Float,
  Html,
  OrbitControls,
  Text,
  useGLTF,
} from '@react-three/drei'
import * as THREE from 'three'
import { useNavigate, useParams } from 'react-router-dom'
import macModel from './book-two-occlusion/assets/mac-draco.glb?url'

const LOBSTER_TWO_FONT =
  'https://fonts.gstatic.com/s/lobstertwo/v22/BngMUXZGTXPUvIoyV6yN59fK.ttf'
const STORY_SCRIPT_FONT =
  'https://fonts.gstatic.com/s/storyscript/v3/mem5YaSw02SQ0OlzDuR8Isk-VQ.ttf'

function ReadingPage({
  cards,
  readingPage,
  onActiveCardChange,
  onScrollPercentageChange,
}) {
  const handleScroll = (event) => {
    const element = event.currentTarget
    const scrollableDistance = element.scrollHeight - element.clientHeight
    const scrollPercentage =
      scrollableDistance > 0 ? (element.scrollTop / scrollableDistance) * 100 : 0
    onScrollPercentageChange(scrollPercentage)
    const viewportCenter =
      element.getBoundingClientRect().top +
      element.getBoundingClientRect().height / 2
    const cardsInView = [...element.querySelectorAll('.book-two-reading-card')]
    const activeIndex = cardsInView.reduce(
      (closestIndex, card, index) => {
        const bounds = card.getBoundingClientRect()
        const distance = Math.abs(bounds.top + bounds.height / 2 - viewportCenter)
        return distance < closestIndex.distance
          ? { index, distance }
          : closestIndex
      },
      { index: 0, distance: Infinity },
    ).index
    onActiveCardChange(activeIndex)
  }

  return (
    <div
      className="book-two-occlusion-content"
      onPointerDown={(event) => event.stopPropagation()}
      onScroll={handleScroll}
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <div className="book-two-occlusion-wrapper">
        <header className="book-two-reading-header">
          <p>{readingPage?.eyebrow ?? ''}</p>
          <h1>{readingPage?.title ?? ''}</h1>
        </header>
        {cards.map((card, index) => (
          <section
            className="book-two-reading-card"
            key={`${card.title}-${index}`}
          >
            <p className="book-two-reading-index">
              FIELD NOTE / {String(index + 1).padStart(2, '0')}
            </p>
            <h2>{card.title}</h2>
            <p className="book-two-reading-copy">{card.paragraph}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

function getColorAtPercentage(colorStops, percentage, property) {
  if (!colorStops?.length) return new THREE.Color('#ffffff')

  const upperIndex = colorStops.findIndex(
    (stop) => stop.percentage >= percentage,
  )
  if (upperIndex === -1) {
    return new THREE.Color(colorStops[colorStops.length - 1][property])
  }
  if (upperIndex === 0) {
    return new THREE.Color(colorStops[0][property])
  }

  const lowerStop = colorStops[upperIndex - 1]
  const upperStop = colorStops[upperIndex]
  const range = upperStop.percentage - lowerStop.percentage
  const amount =
    range > 0 ? (percentage - lowerStop.percentage) / range : 0

  return new THREE.Color(lowerStop[property]).lerp(
    new THREE.Color(upperStop[property]),
    amount,
  )
}

function FloatingChapterText({
  floatingText,
  colorStops,
  activeIndex,
  scrollPercentage,
}) {
  const fromTitle = useRef(null)
  const toTitle = useRef(null)
  const fromParagraph = useRef(null)
  const toParagraph = useRef(null)
  const progress = useRef(0)
  const displayedIndex = useRef(activeIndex)
  const { size } = useThree()
  const compactLayout = size.width / size.height < 0.8
  const textPosition = compactLayout
    ? [2.75, -8, -5]
    : [-4, 0.1, -5.5]
  const [transition, setTransition] = useState({
    from: activeIndex,
    to: activeIndex,
  })
  const targetTitleColor = useMemo(
    () => getColorAtPercentage(colorStops, scrollPercentage, 'title'),
    [colorStops, scrollPercentage],
  )
  const targetParagraphColor = useMemo(
    () => getColorAtPercentage(colorStops, scrollPercentage, 'paragraph'),
    [colorStops, scrollPercentage],
  )

  useEffect(() => {
    if (displayedIndex.current === activeIndex) return
    setTransition({ from: displayedIndex.current, to: activeIndex })
    displayedIndex.current = activeIndex
    progress.current = 0
  }, [activeIndex])

  useFrame((_, delta) => {
    progress.current = Math.min(1, progress.current + delta * 2.8)
    const eased = THREE.MathUtils.smoothstep(progress.current, 0, 1)
    const outgoingOpacity = 1 - eased
    const colorLerp = 1 - Math.exp(-delta * 8)

    if (fromTitle.current) {
      fromTitle.current.material.opacity = outgoingOpacity
      fromTitle.current.material.color.lerp(targetTitleColor, colorLerp)
      fromTitle.current.position.y = 1.45 + eased * 0.24
    }
    if (fromParagraph.current) {
      fromParagraph.current.material.opacity = outgoingOpacity
      fromParagraph.current.material.color.lerp(
        targetParagraphColor,
        colorLerp,
      )
      fromParagraph.current.position.y = 0.83 + eased * 0.24
    }
    if (toTitle.current) {
      toTitle.current.material.opacity = eased
      toTitle.current.material.color.lerp(targetTitleColor, colorLerp)
      toTitle.current.position.y = 1.21 + eased * 0.24
    }
    if (toParagraph.current) {
      toParagraph.current.material.opacity = eased
      toParagraph.current.material.color.lerp(
        targetParagraphColor,
        colorLerp,
      )
      toParagraph.current.position.y = 0.59 + eased * 0.24
    }
  })

  return (
    <Float floatIntensity={0.12} rotationIntensity={0.025} speed={1.5}>
      <Billboard position={textPosition} follow>
        <group scale={compactLayout ? 1.65 : 1}>
        <Text
          ref={fromTitle}
          anchorX="left"
          anchorY="bottom"
          color="#ffffff"
          font={LOBSTER_TWO_FONT}
          fontSize={compactLayout ? 0.34 : 0.4}
          maxWidth={compactLayout ? 3.4 : 3}
          fillOpacity={1}
          material-transparent
        >
          {floatingText[transition.from]?.title ?? ''}
        </Text>
        <Text
          ref={fromParagraph}
          anchorX="left"
          anchorY="top"
          color="#c9c8d0"
          font={STORY_SCRIPT_FONT}
          fontSize={compactLayout ? 0.18 : 0.2}
          lineHeight={1.45}
          maxWidth={compactLayout ? 3.4 : 3}
          fillOpacity={1}
          material-transparent
        >
          {floatingText[transition.from]?.paragraph ?? ''}
        </Text>
        <Text
          ref={toTitle}
          anchorX="left"
          anchorY="bottom"
          color="#ffffff"
          font={LOBSTER_TWO_FONT}
          fontSize={compactLayout ? 0.34 : 0.4}
          maxWidth={compactLayout ? 3.4 : 3}
          fillOpacity={1}
          material-transparent
        >
          {floatingText[transition.to]?.title ?? ''}
        </Text>
        <Text
          ref={toParagraph}
          anchorX="left"
          anchorY="top"
          color="#c9c8d0"
          font={STORY_SCRIPT_FONT}
          fontSize={compactLayout ? 0.18 : 0.2}
          lineHeight={1.45}
          maxWidth={compactLayout ? 3.4 : 3}
          fillOpacity={1}
          material-transparent
        >
          {floatingText[transition.to]?.paragraph ?? ''}
        </Text>
        </group>
      </Billboard>
    </Float>
  )
}

function ResponsiveCamera() {
  const { camera, size } = useThree()

  useEffect(() => {
    const aspect = size.width / size.height
    const distance = Math.max(15, 11.5 / (1.04 * aspect))
    camera.position.set(-distance / 3, 0, -distance)
    camera.updateProjectionMatrix()
  }, [camera, size.height, size.width])

  return null
}

function Model({
  cards,
  readingPage,
  onActiveCardChange,
  onScrollPercentageChange,
  ...props
}) {
  const group = useRef(null)
  const { nodes, materials } = useGLTF(macModel)

  useFrame((state) => {
    if (!group.current) return
    const time = state.clock.getElapsedTime()
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      Math.cos(time / 2) / 20 + 0.25,
      0.1,
    )
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      Math.sin(time / 4) / 20,
      0.1,
    )
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      Math.sin(time / 8) / 20,
      0.1,
    )
    group.current.position.y = THREE.MathUtils.lerp(
      group.current.position.y,
      (-2 + Math.sin(time / 2)) / 2,
      0.1,
    )
  })

  return (
    <group ref={group} {...props} dispose={null}>
      <group rotation-x={-0.425} position={[0, -0.04, 0.41]}>
        <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh
            material={materials.aluminium}
            geometry={nodes.Cube008.geometry}
          />
          <mesh
            material={materials['matte.001']}
            geometry={nodes.Cube008_1.geometry}
          />
          <mesh geometry={nodes.Cube008_2.geometry}>
            <Html
              className="book-two-html-anchor"
              rotation-x={-Math.PI / 2}
              position={[0, 0.05, -0.09]}
              transform
              occlude
            >
              <ReadingPage
                cards={cards}
                readingPage={readingPage}
                onActiveCardChange={onActiveCardChange}
                onScrollPercentageChange={onScrollPercentageChange}
              />
            </Html>
          </mesh>
        </group>
      </group>
      <mesh
        material={materials.keys}
        geometry={nodes.keyboard.geometry}
        position={[1.79, 0, 3.45]}
      />
      <group position={[0, -0.1, 3.39]}>
        <mesh
          material={materials.aluminium}
          geometry={nodes.Cube002.geometry}
        />
        <mesh
          material={materials.trackpad}
          geometry={nodes.Cube002_1.geometry}
        />
      </group>
      <mesh
        material={materials.touchbar}
        geometry={nodes.touchbar.geometry}
        position={[0, -0.03, 1.2]}
      />
    </group>
  )
}

export default function BookTwoOcclusionExperience({
  cards = [],
  floatingText = [],
  floatingTextColorStops = [],
  readingPage,
}) {
  const navigate = useNavigate()
  const { bookId } = useParams()
  const [activeIndex, setActiveIndex] = useState(0)
  const [scrollPercentage, setScrollPercentage] = useState(0)

  return (
    <main className="book-two-occlusion-scene" data-active-card={activeIndex}>
      <Canvas
        className="book-two-occlusion-canvas"
        camera={{ position: [-5, 0, -15], fov: 55 }}
      >
        <ResponsiveCamera />
        <pointLight position={[10, 10, 10]} intensity={1.5 * Math.PI} decay={0} />
        <Suspense fallback={null}>
          <group rotation={[0, Math.PI, 0]} position={[0, 1, 0]}>
            <Model
              cards={cards}
              readingPage={readingPage}
              onActiveCardChange={setActiveIndex}
              onScrollPercentageChange={setScrollPercentage}
            />
          </group>
          <FloatingChapterText
            floatingText={floatingText}
            colorStops={floatingTextColorStops}
            activeIndex={activeIndex}
            scrollPercentage={scrollPercentage}
          />
          <Environment preset="city" />
        </Suspense>
        <ContactShadows position={[0, -4.5, 0]} scale={20} blur={2} far={4.5} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.2}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
      <button
        type="button"
        onClick={() =>
          navigate('/', {
            state: { skipRouteRipple: true, focusBookId: bookId },
          })
        }
        className="absolute right-5 top-5 z-20 rounded-full border border-white/25 bg-black/45 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-md transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-8 sm:top-7"
      >
        Back to bookshelf
      </button>
    </main>
  )
}
