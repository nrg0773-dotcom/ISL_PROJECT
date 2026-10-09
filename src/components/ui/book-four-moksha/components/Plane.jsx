import { forwardRef, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import './CustomMaterial'
import { useBlock } from '../blocks'
import state, { lerp } from '../store'

const Plane = forwardRef(function Plane(
  {
    color = 'white',
    shift = 1,
    opacity = 1,
    args,
    map,
    ...props
  },
  ref,
) {
  const { viewportHeight, offset } = useBlock()
  const material = useRef(null)
  const last = useRef(state.top.current)
  const offsetFactor = (offset + 1) / state.sections

  useFrame(() => {
    if (!material.current) return
    const currentTop = state.top.current
    material.current.scale = lerp(
      material.current.scale,
      offsetFactor - currentTop / ((state.pages - 1) * viewportHeight),
      0.1,
    )
    material.current.shift = lerp(
      material.current.shift,
      ((currentTop - last.current) / shift) * 1.5,
      0.1,
    )
    last.current = currentTop
  })

  return (
    <mesh ref={ref} {...props}>
      <planeGeometry args={args} />
      <customMaterial
        ref={material}
        color={color}
        map={map}
        transparent
        opacity={opacity}
      />
    </mesh>
  )
})

export default Plane
