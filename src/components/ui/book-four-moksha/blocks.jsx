import { createContext, useContext, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import state, { lerp } from './store'

const offsetContext = createContext(0)

function Block({ children, offset, factor, ...props }) {
  const { offset: parentOffset, sectionHeight } = useBlock()
  const ref = useRef(null)
  const blockOffset = offset !== undefined ? offset : parentOffset

  useFrame(() => {
    if (!ref.current) return
    const currentTop = state.top.current
    ref.current.position.y = lerp(
      ref.current.position.y,
      (currentTop / state.zoom) * factor,
      0.1,
    )
  })

  return (
    <offsetContext.Provider value={blockOffset}>
      <group {...props} position={[0, -sectionHeight * blockOffset * factor, 0]}>
        <group ref={ref}>{children}</group>
      </group>
    </offsetContext.Provider>
  )
}

function useBlock() {
  const { size, viewport } = useThree()
  const offset = useContext(offsetContext)
  const { sections, pages, zoom } = state
  const viewportWidth = viewport.width * zoom
  const viewportHeight = viewport.height * zoom
  const canvasWidth = viewportWidth / zoom
  const canvasHeight = viewportHeight / zoom
  const mobile = size.width < 700
  const margin = canvasWidth * (mobile ? 0.2 : 0.1)
  const contentMaxWidth = canvasWidth * (mobile ? 0.8 : 0.6)
  const sectionHeight = (canvasHeight * (pages - 1)) / (sections - 1)

  return {
    offset,
    viewportWidth,
    viewportHeight,
    canvasWidth,
    canvasHeight,
    mobile,
    margin,
    contentMaxWidth,
    sectionHeight,
  }
}

export { Block, useBlock }
