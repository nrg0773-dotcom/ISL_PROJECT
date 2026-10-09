import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Object3D,
  WebGLRenderTarget,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useLoader } from '@react-three/fiber'
import diamondModel from '../assets/diamond.glb?url'
import state, { lerp } from '../store'
import BackfaceMaterial from './BackfaceMaterial'
import RefractionMaterial from './RefractionMaterial'
import { useBlock } from '../blocks'

const dummy = new Object3D()
const REFRACTION_SCALE = 0.65

function Diamonds() {
  const { nodes } = useLoader(GLTFLoader, diamondModel)
  const geometry = nodes.pCone1_lambert1_0.geometry
  const { size, gl, scene, camera, clock } = useThree()
  const { contentMaxWidth, sectionHeight, mobile } = useBlock()
  const model = useRef(null)
  const ratio = gl.getPixelRatio()
  const [environment, backfaces, backfaceMaterial, refractionMaterial] =
    useMemo(() => {
      const width = Math.max(
        1,
        Math.floor(size.width * ratio * REFRACTION_SCALE),
      )
      const height = Math.max(
        1,
        Math.floor(size.height * ratio * REFRACTION_SCALE),
      )
      const screenWidth = Math.max(1, Math.floor(size.width * ratio))
      const screenHeight = Math.max(1, Math.floor(size.height * ratio))
      const environmentTarget = new WebGLRenderTarget(width, height)
      const backfaceTarget = new WebGLRenderTarget(width, height)
      const backface = new BackfaceMaterial()
      const refraction = new RefractionMaterial(
        environmentTarget.texture,
        backfaceTarget.texture,
        [screenWidth, screenHeight],
      )
      return [environmentTarget, backfaceTarget, backface, refraction]
    }, [ratio, size.height, size.width])

  useLayoutEffect(() => {
    geometry.center()
  }, [geometry])

  useEffect(
    () => () => {
      environment.dispose()
      backfaces.dispose()
      backfaceMaterial.dispose()
      refractionMaterial.dispose()
    },
    [backfaceMaterial, backfaces, environment, refractionMaterial],
  )

  useFrame(() => {
    if (!model.current) return
    state.diamonds.forEach((diamond, index) => {
      const time = clock.getElapsedTime() / 2
      const scale = (contentMaxWidth / 35) * diamond.scale
      diamond.pos.set(
        mobile ? 0 : diamond.x,
        lerp(
          diamond.pos.y,
          -sectionHeight * diamond.offset * diamond.factor +
            (state.top.current / state.zoom) * diamond.factor,
          0.1,
        ),
        0,
      )
      dummy.position.copy(diamond.pos)
      if (index === state.diamonds.length - 1) {
        dummy.rotation.set(0, time, 0)
      } else {
        dummy.rotation.set(time, time, time)
      }
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      model.current.setMatrixAt(index, dummy.matrix)
    })
    model.current.instanceMatrix.needsUpdate = true

    const width = Math.max(
      1,
      Math.floor(size.width * ratio * REFRACTION_SCALE),
    )
    const height = Math.max(
      1,
      Math.floor(size.height * ratio * REFRACTION_SCALE),
    )
    if (environment.width !== width || environment.height !== height) {
      environment.setSize(width, height)
      backfaces.setSize(width, height)
    }
    refractionMaterial.uniforms.resolution.value.set(
      Math.max(1, Math.floor(size.width * ratio)),
      Math.max(1, Math.floor(size.height * ratio)),
    )

    const previousAutoClear = gl.autoClear
    const previousMaterial = model.current.material
    const previousTarget = gl.getRenderTarget()
    const previousLayer = camera.layers.mask
    try {
      gl.autoClear = false
      model.current.layers.set(1)
      model.current.visible = false
      camera.layers.set(0)
      gl.setRenderTarget(environment)
      gl.clear(true, true, true)
      gl.render(scene, camera)

      model.current.visible = true
      camera.layers.set(1)
      model.current.material = backfaceMaterial
      gl.setRenderTarget(backfaces)
      gl.clear(true, true, true)
      gl.render(scene, camera)

      camera.layers.set(0)
      model.current.material = previousMaterial
      gl.setRenderTarget(null)
      gl.clear(true, true, true)
      gl.render(scene, camera)

      camera.layers.set(1)
      model.current.material = refractionMaterial
      gl.clearDepth()
      gl.render(scene, camera)
    } finally {
      gl.setRenderTarget(previousTarget)
      camera.layers.mask = previousLayer
      model.current.material = previousMaterial
      model.current.visible = true
      gl.autoClear = previousAutoClear
    }
  }, 1)

  return (
    <instancedMesh
      ref={model}
      args={[geometry, refractionMaterial, state.diamonds.length]}
      position={[0, 0, 50]}
      layers={1}
      frustumCulled={false}
    />
  )
}

export default Diamonds
