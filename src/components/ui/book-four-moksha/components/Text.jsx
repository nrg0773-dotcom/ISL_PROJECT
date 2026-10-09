import { useCallback, useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { Vector3 } from 'three'
import moonFont from '../assets/MOONGET_Heavy.blob?url'
import state, { lerp } from '../store'
import './CustomMaterial'

function Text({
  children,
  size = 1,
  left,
  right,
  top,
  bottom,
  color = 'white',
  opacity = 1,
  height = 0.01,
  font = moonFont,
  ...props
}) {
  const data = useLoader(FontLoader, font)
  const geometry = useMemo(
    () =>
      new TextGeometry(children, {
        font: data,
        size: 1,
        depth: height,
        curveSegments: 32,
      }),
    [children, data, height],
  )
  const onUpdate = useCallback(
    (mesh) => {
      const bounds = new Vector3()
      mesh.geometry.computeBoundingBox()
      mesh.geometry.boundingBox.getSize(bounds)
      mesh.position.x = left ? 0 : right ? -bounds.x : -bounds.x / 2
      mesh.position.y = top ? 0 : bottom ? -bounds.y : -bounds.y / 2
    },
    [bottom, left, right, top],
  )
  const material = useRef(null)
  const last = useRef(state.top.current)

  useFrame(() => {
    if (!material.current) return
    const currentTop = state.top.current
    material.current.shift = lerp(
      material.current.shift,
      (currentTop - last.current) / 100,
      0.1,
    )
    last.current = currentTop
  })

  return (
    <group {...props} scale={[size, size, 0.1]}>
      <mesh geometry={geometry} onUpdate={onUpdate} frustumCulled={false}>
        <customMaterial
          ref={material}
          color={color}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  )
}

function MultilineText({ text, size = 1, lineHeight = 1, position = [0, 0, 0], ...props }) {
  return text.split('\n').map((line, index) => (
    <Text
      key={`${index}-${line}`}
      size={size}
      {...props}
      position={[position[0], position[1] - index * lineHeight, position[2]]}
    >
      {line}
    </Text>
  ))
}

export { Text, MultilineText }
