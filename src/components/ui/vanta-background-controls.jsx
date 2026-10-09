import { useMemo, useState } from 'react'
import { Leva, useControls } from 'leva'
import VantaBackground from '@/components/ui/vanta-background'

function toVantaColor(color) {
  return Number.parseInt(color.replace('#', ''), 16)
}

export default function VantaBackgroundControls() {
  const [birdGeometryRevision, setBirdGeometryRevision] = useState(0)
  const rebuildBirdGeometry = () => {
    setBirdGeometryRevision((revision) => revision + 1)
  }

  const { effectType } = useControls('Background', {
    effectType: {
      value: 'clouds',
      options: {
        Clouds: 'clouds',
        Birds: 'birds',
      },
    },
  })

  const cloudControls = useControls('Clouds', {
    backgroundColor: { value: '#171717' },
    skyColor: { value: '#f0e7ca' },
    cloudColor: { value: '#ffffff' },
    cloudShadowColor: { value: '#272622' },
    sunColor: { value: '#000000' },
    sunGlareColor: { value: '#000000' },
    sunlightColor: { value: '#000000' },
    scale: { value: 3, min: 1, max: 10, step: 1 },
    speed: { value: 0.5, min: 0, max: 3, step: 0.05 },
    cameraHeight: { value: 0.42, min: 0, max: 1, step: 0.01 },
  })

  const birdControls = useControls('Birds', {
    backgroundColor: { value: '#07192f' },
    color1: { value: '#ff0000', onEditEnd: rebuildBirdGeometry },
    color2: { value: '#00d1ff', onEditEnd: rebuildBirdGeometry },
    colorMode: {
      value: 'variance',
      options: {
        'Random per bird': 'variance',
        'Random gradients': 'varianceGradient',
        Gradient: 'gradient',
        Mix: 'mix',
      },
      onEditEnd: rebuildBirdGeometry,
    },
    quantity: {
      value: 5,
      min: 2,
      max: 6,
      step: 1,
      label: 'Bird grid exponent (4^n birds)',
      onEditEnd: rebuildBirdGeometry,
    },
    birdSize: {
      value: 1,
      min: 0.25,
      max: 3,
      step: 0.05,
      onEditEnd: rebuildBirdGeometry,
    },
    wingSpan: {
      value: 30,
      min: 5,
      max: 60,
      step: 1,
      onEditEnd: rebuildBirdGeometry,
    },
    speedLimit: { value: 5, min: 1, max: 10, step: 0.1 },
    separation: { value: 20, min: 1, max: 100, step: 1 },
    alignment: { value: 20, min: 1, max: 100, step: 1 },
    cohesion: { value: 20, min: 1, max: 100, step: 1 },
  })

  const cloudOptions = useMemo(
    () => ({
      backgroundColor: toVantaColor(cloudControls.backgroundColor),
      skyColor: toVantaColor(cloudControls.skyColor),
      cloudColor: toVantaColor(cloudControls.cloudColor),
      cloudShadowColor: toVantaColor(cloudControls.cloudShadowColor),
      sunColor: toVantaColor(cloudControls.sunColor),
      sunGlareColor: toVantaColor(cloudControls.sunGlareColor),
      sunlightColor: toVantaColor(cloudControls.sunlightColor),
      scale: cloudControls.scale,
      scaleMobile: 6,
      speed: cloudControls.speed,
      cameraHeight: cloudControls.cameraHeight,
    }),
    [cloudControls],
  )

  const birdOptions = useMemo(
    () => ({
      backgroundColor: toVantaColor(birdControls.backgroundColor),
      color1: toVantaColor(birdControls.color1),
      color2: toVantaColor(birdControls.color2),
      colorMode: birdControls.colorMode,
      quantity: birdControls.quantity,
      birdSize: birdControls.birdSize,
      wingSpan: birdControls.wingSpan,
      speedLimit: birdControls.speedLimit,
      separation: birdControls.separation,
      alignment: birdControls.alignment,
      cohesion: birdControls.cohesion,
    }),
    [birdControls],
  )

  return (
    <>
      <Leva collapsed={false} />
      <VantaBackground
        effectType={effectType}
        options={effectType === 'clouds' ? cloudOptions : birdOptions}
        geometryRevision={birdGeometryRevision}
      />
    </>
  )
}
