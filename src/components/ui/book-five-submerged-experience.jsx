import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useNavigate, useParams } from 'react-router-dom'
import { lobsterTwoFont, storyScriptFont } from '@/lib/book-fonts'

function Rig({ children, paused, cycle, intervalSeconds, onPause }) {
  const elapsed = useRef(0)
  const orbitElapsed = useRef(0)
  const currentCycle = useRef(cycle)
  const pauseTriggered = useRef(false)
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 1.2, -2.3)
    camera.lookAt(0, 0, -1)
  }, [camera])

  useFrame((_, delta) => {
    if (currentCycle.current !== cycle) {
      currentCycle.current = cycle
      elapsed.current = 0
      pauseTriggered.current = false
    }

    if (paused) return

    const step = Math.min(delta, intervalSeconds - elapsed.current)
    elapsed.current += step
    orbitElapsed.current += step
    const angle =
      (orbitElapsed.current * Math.PI * 2) / (intervalSeconds * 2.5)
    camera.position.set(
      1.3 * Math.sin(angle),
      1.2,
      -1 - 1.3 * Math.cos(angle),
    )
    camera.lookAt(0, 0, -1)

    if (elapsed.current >= intervalSeconds && !pauseTriggered.current) {
      pauseTriggered.current = true
      onPause()
    }
  })

  return children
}

function JourneyText({ note, index, total, visible }) {
  const group = useRef(null)
  const textObjects = useRef([])
  const opacity = useRef(0)
  const renderedNoteRef = useRef(note)
  const [displayedNote, setDisplayedNote] = useState(note)
  const [displayedIndex, setDisplayedIndex] = useState(index)
  const { camera, size } = useThree()
  const direction = useRef(new THREE.Vector3())
  const planeDistance = 6
  const planeHeight =
    2 * planeDistance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  const planeWidth = planeHeight * (size.width / size.height)
  const textScale = Math.min(1, planeWidth / 10, planeHeight / 6)

  useFrame((_, delta) => {
    const targetOpacity = visible ? 1 : 0
    opacity.current +=
      (targetOpacity - opacity.current) * (1 - Math.exp(-delta * 8))
    if (!visible && opacity.current < 0.015 && renderedNoteRef.current !== note) {
      renderedNoteRef.current = note
      setDisplayedNote(note)
      setDisplayedIndex(index)
    }

    for (const text of textObjects.current) {
      if (!text?.material) continue
      text.material.transparent = true
      text.material.opacity = opacity.current
    }

    if (!group.current) return

    camera.getWorldDirection(direction.current)
    group.current.position
      .copy(camera.position)
      .addScaledVector(direction.current, planeDistance)
    group.current.quaternion.copy(camera.quaternion)
  })

  const renderedNote = displayedNote
  const left = -planeWidth * 0.43
  const maxWidth = planeWidth * 0.86
  const baseParagraphSize = 0.48 * textScale
  const estimatedLineCount = Math.max(
    1,
    Math.ceil(
      renderedNote.paragraph.length /
        Math.max(1, Math.floor(maxWidth / (baseParagraphSize * 0.58))),
    ),
  )
  const paragraphHeight =
    estimatedLineCount * baseParagraphSize * 1.28
  const paragraphFontSize =
    baseParagraphSize *
    Math.min(1, (planeHeight * 0.25) / paragraphHeight)

  return (
    <group ref={group} renderOrder={10}>
      <Float floatIntensity={0} rotationIntensity={0} speed={0}>
        <Text
          ref={(text) => {
            textObjects.current[0] = text
          }}
          renderOrder={10}
          position={[left, planeHeight * 0.29, 0]}
          anchorX="left"
          anchorY="middle"
          color="#ffffff"
          fontSize={0.27 * textScale}
          letterSpacing={0.1}
          maxWidth={maxWidth}
          material-depthTest={false}
          material-depthWrite={false}
          material-fog={false}
          material-toneMapped={false}
        >
          VOYAGE NOTE / {String(displayedIndex + 1).padStart(2, '0')} OF{' '}
          {String(total).padStart(2, '0')}
        </Text>
        <Text
          ref={(text) => {
            textObjects.current[1] = text
          }}
          renderOrder={10}
          position={[left, planeHeight * 0.13, 0]}
          anchorX="left"
          anchorY="middle"
          color="#ffffff"
          font={lobsterTwoFont}
          fontSize={0.98 * textScale}
          maxWidth={maxWidth}
          material-depthTest={false}
          material-depthWrite={false}
          material-fog={false}
          material-toneMapped={false}
        >
          {renderedNote.title}
        </Text>
        <Text
          ref={(text) => {
            textObjects.current[2] = text
          }}
          renderOrder={10}
          position={[left, planeHeight * 0.015, 0]}
          anchorX="left"
          anchorY="top"
          color="#ffffff"
          font={storyScriptFont}
          fontSize={paragraphFontSize}
          lineHeight={1.28}
          maxWidth={maxWidth}
          material-depthTest={false}
          material-depthWrite={false}
          material-fog={false}
          material-toneMapped={false}
        >
          {renderedNote.paragraph}
        </Text>
        <Text
          ref={(text) => {
            textObjects.current[3] = text
          }}
          renderOrder={10}
          position={[0, -planeHeight * 0.32, 0]}
          anchorX="center"
          anchorY="middle"
          color="#ffffff"
          fontSize={0.31 * textScale}
          letterSpacing={0.08}
          maxWidth={maxWidth}
          material-depthTest={false}
          material-depthWrite={false}
          material-fog={false}
          material-toneMapped={false}
        >
          PRESS {String(renderedNote.continueKey ?? 'A').toUpperCase()} TO CONTINUE
        </Text>
      </Float>
    </group>
  )
}

function SubmergedModel({ modelUrl, modelDepth }) {
  const { scene } = useGLTF(modelUrl)
  const model = useMemo(() => scene.clone(true), [scene])
  const { center, scale } = useMemo(() => {
    model.updateMatrixWorld(true)
    const bounds = new THREE.Box3().makeEmpty()
    model.traverse((object) => {
      if (!object.isMesh || !object.visible) return
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      if (
        materials.every(
          (material) => material.transparent && material.opacity <= 0,
        )
      ) {
        return
      }
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox()
      bounds.union(
        object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld),
      )
    })
    if (bounds.isEmpty()) {
      throw new Error('The submerged model has no visible geometry to frame.')
    }
    const center = bounds.getCenter(new THREE.Vector3())
    const dimensions = bounds.getSize(new THREE.Vector3())
    return {
      center,
      scale: modelDepth / Math.max(dimensions.z, 0.001),
    }
  }, [model, modelDepth])

  useEffect(() => {
    model.traverse((object) => {
      if (object.isMesh) object.frustumCulled = false
    })
  }, [model])

  return (
    <group scale={scale} dispose={null}>
      <group position={center.clone().negate()}>
        <primitive object={model} dispose={null} />
      </group>
    </group>
  )
}

export default function BookFiveSubmergedExperience({ journey, model }) {
  const navigate = useNavigate()
  const { bookId } = useParams()
  const notes = journey?.notes ?? []
  const intervalSeconds =
    Number.isFinite(journey?.intervalSeconds) && journey.intervalSeconds > 0
      ? journey.intervalSeconds
      : 10
  const continueKey = journey?.continueKey?.toLowerCase() ?? 'a'
  const [cycle, setCycle] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [activeNoteIndex, setActiveNoteIndex] = useState(0)

  const continueJourney = useCallback(() => {
    if (!isPaused || notes.length === 0) return
    setActiveNoteIndex((index) => (index + 1) % notes.length)
    setCycle((currentCycle) => currentCycle + 1)
    setIsPaused(false)
  }, [isPaused, notes.length])

  useEffect(() => {
    if (!isPaused) return undefined

    const handleKeyDown = (event) => {
      if (event.key.toLowerCase() !== continueKey || event.repeat) return
      event.preventDefault()
      continueJourney()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [continueKey, continueJourney, isPaused])

  return (
    <main className="book-five-submerged-scene">
      <Canvas
        className="book-five-submerged-canvas"
        linear
        camera={{ position: [0, 1.2, -2.3], fov: 65, near: 0.05, far: 100 }}
        dpr={[1, 1.25]}
      >
        <color attach="background" args={['#071d22']} />
        <fog attach="fog" args={['#071d22', 12, 40]} />
        <ambientLight intensity={4 * Math.PI} />
        <Suspense fallback={null}>
          <Rig
            paused={isPaused || notes.length === 0}
            cycle={cycle}
            intervalSeconds={intervalSeconds}
            onPause={() => setIsPaused(true)}
          >
            <SubmergedModel
              modelUrl={model.modelUrl}
              modelDepth={model.targetDepth ?? 8}
            />
          </Rig>
          {notes[activeNoteIndex] && (
            <JourneyText
              note={notes[activeNoteIndex]}
              index={activeNoteIndex}
              total={notes.length}
              visible={isPaused}
            />
          )}
        </Suspense>
        <Environment preset="sunset" />
      </Canvas>
      <button
        type="button"
        onClick={() =>
          navigate('/', {
            state: { skipRouteRipple: true, focusBookId: bookId },
          })
        }
        className="absolute right-5 top-5 z-20 rounded-full border border-white/20 bg-[#071d22]/65 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#e0eee8] shadow-sm backdrop-blur-md transition-colors hover:bg-[#071d22]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5f4e9] sm:right-8 sm:top-7"
      >
        Back to bookshelf
      </button>
      <a
        className="book-five-submerged-credit"
        href="https://sketchfab.com/3d-models/submerged-era-e46a97e8ffff454f90ca5c5535e89090"
        rel="noreferrer"
        target="_blank"
      >
        SUBMERGED ERA / OMAR FARUQ TAWSIF / CC BY 4.0
      </a>
    </main>
  )
}
