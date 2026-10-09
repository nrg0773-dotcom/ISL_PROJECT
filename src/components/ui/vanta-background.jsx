import { useEffect, useRef } from 'react'

export default function VantaBackground({ effectType, options, geometryRevision }) {
  const element = useRef(null)
  const effectRef = useRef(null)
  const effectTypeRef = useRef(null)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    const effect = effectRef.current
    if (!effect || effectTypeRef.current !== effectType) return

    const { cameraHeight, ...vantaOptions } = options
    effect.setOptions(effectType === 'clouds' ? vantaOptions : options)
    if (effectType === 'clouds') {
      effect.resize()
      effect.mouseY = effect.height * cameraHeight
      effect.mouseEaseY = effect.mouseY
      effect.triggerMouseMove(effect.mouseX, effect.mouseY)
    }
  }, [effectType, options])

  useEffect(() => {
    let effect
    let cancelled = false

    const initialize = async () => {
      let previousThree
      let vantaThree
      try {
        const legacyThree = await import('three-vanta')
        vantaThree = { ...legacyThree, VertexColors: true }
        previousThree = window.THREE
        window.THREE = vantaThree
        if (effectType === 'clouds') {
          const originalWidth = window.innerWidth
          const originalWidthDescriptor = Object.getOwnPropertyDescriptor(
            window,
            'innerWidth',
          )
          try {
            Object.defineProperty(window, 'innerWidth', {
              configurable: true,
              value: Math.max(originalWidth, 600),
            })
            await import('vanta/dist/vanta.clouds.min.js')
          } finally {
            if (originalWidthDescriptor) {
              Object.defineProperty(window, 'innerWidth', originalWidthDescriptor)
            } else {
              delete window.innerWidth
            }
          }
        } else {
          await import('vanta/dist/vanta.birds.min.js')
        }

        if (cancelled || !element.current) return
        const initializeVanta = window.VANTA?.[effectType.toUpperCase()]
        if (typeof initializeVanta !== 'function') {
          throw new Error(`Vanta ${effectType} failed to load its effect initializer.`)
        }

        const currentOptions = optionsRef.current
        const { cameraHeight, ...vantaOptions } = currentOptions
        effect = initializeVanta({
          el: element.current,
          THREE: vantaThree,
          ...(effectType === 'clouds' ? vantaOptions : currentOptions),
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
        })
        effectRef.current = effect
        effectTypeRef.current = effectType
        if (effectType === 'clouds') {
          effect.mouseY = effect.height * cameraHeight
          effect.mouseEaseY = effect.mouseY
          effect.triggerMouseMove(effect.mouseX, effect.mouseY)
        }
      } finally {
        if (vantaThree && window.THREE === vantaThree) {
          if (previousThree) window.THREE = previousThree
          else delete window.THREE
        }
      }
    }

    initialize().catch((error) => {
      if (!cancelled) {
        console.error('Unable to initialize the Vanta background.', error)
      }
    })

    return () => {
      cancelled = true
      effect?.destroy()
      if (effectRef.current === effect) {
        effectRef.current = null
        effectTypeRef.current = null
      }
    }
  }, [effectType, geometryRevision])

  return <div ref={element} aria-hidden="true" className="vanta-background" />
}
