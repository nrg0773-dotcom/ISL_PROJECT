import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment,
  Float,
  OrbitControls,
  Text,
  useEnvironment,
  useGLTF,
} from '@react-three/drei'
import * as THREE from 'three'
import { useNavigate, useParams } from 'react-router-dom'
import shipModel from './book-three-viking-ship/thor-and-the-midgard-serpent-transformed.glb?url'
import { lobsterTwoFont, storyScriptFont } from '@/lib/book-fonts'

function Rig({
  children,
  paused,
  cycle,
  intervalSeconds,
  transitionSeconds,
  onPause,
}) {
  const outer = useRef(null)
  const inner = useRef(null)
  const simulationTime = useRef(0)
  const elapsed = useRef(0)
  const currentCycle = useRef(cycle)
  const pauseTriggered = useRef(false)

  useFrame((_, delta) => {
    if (!outer.current || !inner.current) return

    if (currentCycle.current !== cycle) {
      currentCycle.current = cycle
      elapsed.current = 0
      pauseTriggered.current = false
    }

    const frameDelta = Math.min(delta, 0.05)
    if (paused) return

    elapsed.current += frameDelta
    if (elapsed.current >= intervalSeconds) {
      elapsed.current = intervalSeconds
      if (!pauseTriggered.current) {
        pauseTriggered.current = true
        onPause()
      }
      return
    }

    const transition = Math.min(transitionSeconds, intervalSeconds / 2)
    const easeIn = THREE.MathUtils.smoothstep(
      elapsed.current,
      0,
      transition,
    )
    const easeOut = THREE.MathUtils.smoothstep(
      intervalSeconds - elapsed.current,
      0,
      transition,
    )
    const motionFactor = Math.min(easeIn, easeOut)
    simulationTime.current += frameDelta * motionFactor
    const time = simulationTime.current

    outer.current.position.y = THREE.MathUtils.damp(
      outer.current.position.y,
      0,
      2.5,
      frameDelta,
    )
    inner.current.rotation.y = THREE.MathUtils.damp(
      inner.current.rotation.y,
      Math.sin(time / 8) * Math.PI,
      2.5,
      frameDelta,
    )
    inner.current.position.z = THREE.MathUtils.damp(
      inner.current.position.z,
      5 + -Math.sin(time / 2) * 10,
      2.5,
      frameDelta,
    )
    inner.current.position.y = THREE.MathUtils.damp(
      inner.current.position.y,
      -5 + Math.sin(time / 2) * 2,
      2.5,
      frameDelta,
    )
  })

  return (
    <group position={[0, -100, 0]} ref={outer}>
      <group ref={inner}>{children}</group>
    </group>
  )
}

function JourneyText({
  note,
  index,
  total,
  visible,
  transitionSeconds,
}) {
  const group = useRef(null)
  const eyebrow = useRef(null)
  const title = useRef(null)
  const paragraph = useRef(null)
  const prompt = useRef(null)
  const { camera, size } = useThree()
  const direction = useRef(new THREE.Vector3())
  const visibility = useRef(0)
  const compactScale = Math.min(1, size.width / size.height / 0.65)
  const targetOpacity = visible ? 1 : 0

  useFrame((_, delta) => {
    if (!group.current) return
    const transitionSpeed = 4.6 / Math.max(transitionSeconds, 0.1)
    visibility.current = THREE.MathUtils.damp(
      visibility.current,
      targetOpacity,
      transitionSpeed,
      delta,
    )
    camera.getWorldDirection(direction.current)
    group.current.position
      .copy(camera.position)
      .addScaledVector(direction.current, 10 + visibility.current * 0.5)
    group.current.quaternion.copy(camera.quaternion)
    group.current.scale.setScalar(
      compactScale * (0.94 + visibility.current * 0.06),
    )
    ;[eyebrow, title, paragraph, prompt].forEach((textRef) => {
      if (textRef.current) textRef.current.fillOpacity = visibility.current
    })
  })

  return (
    <group ref={group} scale={compactScale}>
      <Float floatIntensity={0.1} rotationIntensity={0.015} speed={0.8}>
        <Text
        ref={eyebrow}
        position={[-4.25, 1.35, 0]}
        anchorX="left"
        anchorY="middle"
        color="#171411"
        fontSize={0.24}
        letterSpacing={0.12}
        maxWidth={8.5}
        material-transparent
        material-depthTest={false}
        fillOpacity={0}
        >
        VOYAGE NOTE / {String(index + 1).padStart(2, '0')} OF{' '}
        {String(total).padStart(2, '0')}
        </Text>
        <Text
        ref={title}
        position={[-4.25, 0.35, 0]}
        anchorX="left"
        anchorY="middle"
        color="#171411"
        font={lobsterTwoFont}
        fontSize={0.82}
        maxWidth={8.5}
        material-transparent
        material-depthTest={false}
        fillOpacity={0}
        >
        {note.title}
        </Text>
        <Text
        ref={paragraph}
        position={[-4.25, -0.4, 0]}
        anchorX="left"
        anchorY="top"
        color="#171411"
        font={storyScriptFont}
        fontSize={0.42}
        lineHeight={1.35}
        maxWidth={8.5}
        material-transparent
        material-depthTest={false}
        fillOpacity={0}
        >
        {note.paragraph}
        </Text>
        <Text
        ref={prompt}
        position={[0, -1.75, 0]}
        anchorX="center"
        anchorY="middle"
        color="#171411"
        fontSize={0.28}
        letterSpacing={0.08}
        maxWidth={8.5}
        material-transparent
        material-depthTest={false}
        fillOpacity={0}
        >
        PRESS {String(note.continueKey ?? 'A').toUpperCase()} TO CONTINUE
        </Text>
      </Float>
    </group>
  )
}

function ShipModel({ dimmed, transitionSeconds }) {
  const { nodes, materials } = useGLTF(shipModel)
  const environment = useEnvironment({ preset: 'sunset' })
  const modelGroup = useRef(null)
  const fadeMaterials = useRef([])
  const modelOpacity = useRef(1)

  useEffect(() => {
    if (!modelGroup.current) return undefined

    const materialPairs = []
    modelGroup.current.traverse((object) => {
      if (!object.isMesh) return
      const originals = Array.isArray(object.material)
        ? object.material
        : [object.material]
      const faded = originals.map((material) => {
        const clone = material.clone()
        clone.transparent = true
        materialPairs.push({ mesh: object, material, clone })
        return clone
      })
      object.material = Array.isArray(object.material) ? faded : faded[0]
    })
    fadeMaterials.current = materialPairs

    return () => {
      materialPairs.forEach(({ mesh, material, clone }) => {
        const currentMaterials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        const restored = currentMaterials.map((current) =>
          current === clone ? material : current,
        )
        mesh.material = Array.isArray(mesh.material) ? restored : restored[0]
        clone.dispose()
      })
      fadeMaterials.current = []
    }
  }, [])

  useFrame((_, delta) => {
    modelOpacity.current = THREE.MathUtils.damp(
      modelOpacity.current,
      dimmed ? 0.18 : 1,
      4.6 / Math.max(transitionSeconds, 0.1),
      delta,
    )
    fadeMaterials.current.forEach(({ clone }) => {
      clone.opacity = modelOpacity.current
    })
  })

  return (
    <group ref={modelGroup} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} scale={0.01}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <group rotation={[-Math.PI / 2, 0, 0]} scale={100}>
            <mesh
              material={materials.EyeFire}
              geometry={nodes.Circle011_EyeFire_0.geometry}
            />
            <mesh
              material={materials.SerpentBake}
              geometry={nodes.Circle011_SerpentBake_0.geometry}
              material-metalness={0}
            />
          </group>
          <group
            position={[-1018.2, -380.53, 1332.67]}
            rotation={[-1.05, 0.72, -0.08]}
            scale={100}
          >
            <mesh
              material={materials.EyeFire}
              geometry={nodes.Hide003_EyeFire_0.geometry}
            />
            <mesh
              material={materials.Boat2Bake}
              geometry={nodes.Hide003_Boat2Bake_0.geometry}
            />
          </group>
          <group
            position={[349.57, 32.32, 176.64]}
            rotation={[-1.73, -0.23, -2.65]}
            scale={100}
          >
            <mesh
              material={materials.EyeFire}
              geometry={nodes.Keel002_EyeFire_0.geometry}
            />
            <mesh
              material={materials.Boat1Bake}
              geometry={nodes.Keel002_Boat1Bake_0.geometry}
            />
          </group>
          <group
            position={[0, 27.07, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[100, 100, 170.02]}
          >
            <mesh geometry={nodes.Plane044_WaterBake_0.geometry}>
              <meshPhysicalMaterial
                color="skyblue"
                transmission={1}
                thickness={5}
                roughness={0}
                envMap={environment}
                envMapIntensity={2}
                clearcoat={1}
              />
            </mesh>
          </group>
          <group rotation={[-Math.PI / 2, 0, 0]} scale={100}>
            <mesh
              material={materials.RockBake}
              geometry={nodes.Rock021_RockBake_0.geometry}
              material-metalness={0.5}
            />
          </group>
          <group scale={100}>
            <mesh
              material={materials.Objects}
              geometry={nodes.VikingShipObjects001_Objects_0.geometry}
            />
            <mesh
              material={materials.Objects}
              geometry={nodes.VikingShipObjects001_Objects_0_1.geometry}
            />
          </group>
        </group>
      </group>
    </group>
  )
}

export default function BookThreeVikingShipExperience({ journey }) {
  const navigate = useNavigate()
  const { bookId } = useParams()
  const notes = journey?.notes ?? []
  const intervalSeconds =
    Number.isFinite(journey?.intervalSeconds) && journey.intervalSeconds > 0
      ? journey.intervalSeconds
      : 5
  const transitionSeconds =
    Number.isFinite(journey?.transitionSeconds) &&
    journey.transitionSeconds > 0
      ? journey.transitionSeconds
      : 1
  const textTransitionSeconds =
    Number.isFinite(journey?.textTransitionSeconds) &&
    journey.textTransitionSeconds > 0
      ? journey.textTransitionSeconds
      : 0.8
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
    <main className="book-three-viking-ship-scene">
      <Canvas
        linear
        camera={{ position: [0, 15, 30], fov: 70 }}
        dpr={[1, 1.75]}
      >
        <color attach="background" args={[0xfff0ea]} />
        <fog attach="fog" args={[0xfff0ea, 10, 60]} />
        <ambientLight intensity={4 * Math.PI} />
        <Suspense fallback={null}>
          <Rig
            paused={isPaused || notes.length === 0}
            cycle={cycle}
            intervalSeconds={intervalSeconds}
            transitionSeconds={transitionSeconds}
            onPause={() => setIsPaused(true)}
          >
            <ShipModel
              dimmed={isPaused}
              transitionSeconds={textTransitionSeconds}
            />
          </Rig>
          {notes[activeNoteIndex] && (
            <Suspense fallback={null}>
              <JourneyText
                note={notes[activeNoteIndex]}
                index={activeNoteIndex}
                total={notes.length}
                visible={isPaused}
                transitionSeconds={textTransitionSeconds}
              />
            </Suspense>
          )}
        </Suspense>
        <Environment preset="sunset" />
        <OrbitControls enabled={!isPaused} />
      </Canvas>
      <button
        type="button"
        onClick={() =>
          navigate('/', {
            state: { skipRouteRipple: true, focusBookId: bookId },
          })
        }
        className="absolute right-5 top-5 z-20 rounded-full border border-black/20 bg-white/65 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#332521] shadow-sm backdrop-blur-md transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#332521] sm:right-8 sm:top-7"
      >
        Back to bookshelf
      </button>
    </main>
  )
}

useGLTF.preload(shipModel)
