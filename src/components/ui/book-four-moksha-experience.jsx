import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import {
  LinearFilter,
  TextureLoader,
} from 'three'
import { useNavigate, useParams } from 'react-router-dom'
import { Text, MultilineText } from './book-four-moksha/components/Text'
import Diamonds from './book-four-moksha/diamonds/Diamonds'
import Plane from './book-four-moksha/components/Plane'
import { Block, useBlock } from './book-four-moksha/blocks'
import state, { lerp, setParagraphs } from './book-four-moksha/store'
import './book-four-moksha/components/CustomMaterial'

const imageAssets = import.meta.glob(
  './book-four-moksha/assets/*.{jpeg,jpg}',
  { eager: true, import: 'default', query: '?url' },
)

function Startup() {
  const ref = useRef(null)

  useFrame(() => {
    if (ref.current?.material) {
      ref.current.material.opacity = lerp(
        ref.current.material.opacity,
        0,
        0.025,
      )
    }
  })

  return (
    <Plane
      ref={ref}
      color="#0e0e0f"
      position={[0, 0, 200]}
      scale={[100, 100, 1]}
    />
  )
}

function Paragraph({ image, index, offset, factor, header, aspect, text }) {
  const { contentMaxWidth: width, canvasWidth, margin, mobile } = useBlock()
  const imageScale = aspect < 1 && !mobile ? 0.65 : 1
  const alignRight = (canvasWidth - width * imageScale - margin) / 2
  const pixelWidth = width * state.zoom * imageScale
  const left = index % 2 === 0
  const color = '#ffffff'

  return (
    <Block factor={factor} offset={offset}>
      <group position={[left ? -alignRight : alignRight, 0, 0]}>
        <Plane
          map={image}
          args={[1, 1, 32, 32]}
          shift={75}
          size={imageScale}
          aspect={aspect}
          scale={[
            width * imageScale,
            (width * imageScale) / aspect,
            1,
          ]}
          frustumCulled={false}
        />
        <Html
          style={{
            width: pixelWidth / (mobile ? 1 : 2),
            color: '#ffffff',
            textAlign: left ? 'left' : 'right',
          }}
          position={[
            left || mobile ? (-width * imageScale) / 2 : 0,
            (-width * imageScale) / 2 / aspect - 0.4,
            1,
          ]}
        >
          <div tabIndex={index}>{text}</div>
        </Html>
        <Text
          left={left}
          right={!left}
          size={width * 0.04}
          color={color}
          top
          position={[
            ((left ? -width : width) * imageScale) / 2,
            (width * imageScale) / aspect / 2 + 0.5,
            -1,
          ]}
        >
          {header}
        </Text>
        <Block factor={0.2}>
          <Text
            opacity={0.5}
            size={width * 0.5}
            color="#1a1e2a"
            position={[
              ((left ? width : -width) / 2) * imageScale,
              (width * imageScale) / aspect,
              -10,
            ]}
          >
            {String(index + 1).padStart(2, '0')}
          </Text>
        </Block>
      </group>
    </Block>
  )
}

function Content({ book, closing }) {
  const images = useLoader(
    TextureLoader,
    state.paragraphs.map(({ image }) => image),
  )
  useEffect(() => {
    images.forEach((texture) => (texture.minFilter = LinearFilter))
  }, [images])
  const {
    contentMaxWidth: width,
    canvasWidth,
    canvasHeight,
    mobile,
  } = useBlock()

  return (
    <>
      <Block factor={1} offset={0}>
        <Block factor={1.2}>
          <Text
            left
            size={width * 0.15}
            position={[-width / 3.2, 0.5, -1]}
            color="#ffffff"
          >
            MOKSHA
          </Text>
        </Block>
        <Block factor={1}>
          <Html
            className="bottom-left"
            style={{ color: 'white' }}
            position={[-canvasWidth / 2, -canvasHeight / 2, 0]}
          >
            {book.subtitle}
            {mobile ? <br /> : ' '}
          </Html>
        </Block>
      </Block>
      <Block factor={1.2} offset={5.7}>
        <MultilineText
          top
          left
          size={width * 0.15}
          lineHeight={width / 5}
          position={[-width / 3.5, 0, -1]}
          color="#ffffff"
          text={'MOKSHA\n04'}
        />
      </Block>
      {state.paragraphs.map((paragraph, index) => (
        <Paragraph key={`${paragraph.header}-${index}`} {...paragraph} image={images[index]} index={index} />
      ))}
      {state.stripes.map(({ offset, color, height }, index) => (
        <Block key={index} factor={-1.5} offset={offset}>
          <Plane
            args={[50, height, 32, 32]}
            shift={-4}
            color={color}
            rotation={[0, 0, Math.PI / 8]}
            position={[0, 0, -10]}
          />
        </Block>
      ))}
      <Block factor={1.25} offset={8}>
        <Html
          style={{ color: 'white' }}
          className="bottom-left"
          position={[-canvasWidth / 2, -canvasHeight / 2, 0]}
        >
          {closing}
        </Html>
      </Block>
    </>
  )
}

export default function BookFourMokshaExperience({
  book,
  sections,
  images,
  closing,
}) {
  const navigate = useNavigate()
  const { bookId } = useParams()
  const scrollArea = useRef(null)
  const resolvedImages = useMemo(
    () =>
      images.map((image) => {
        const imageUrl = imageAssets[`./book-four-moksha/assets/${image}`]
        if (!imageUrl) {
          throw new Error(`Missing Book 4 image asset: ${image}`)
        }
        return imageUrl
      }),
    [images],
  )
  if (resolvedImages.length < sections.length) {
    throw new Error('Book 4 needs one configured image for each section.')
  }

  const paragraphs = useMemo(
    () =>
      sections.map((section, index) => ({
        offset: section.offset,
        factor: section.factor,
        header: section.header,
        image: resolvedImages[index],
        aspect: section.aspect,
        text: section.text,
      })),
    [resolvedImages, sections],
  )
  setParagraphs(paragraphs)

  const handleScroll = (event) => {
    state.top.current = event.currentTarget.scrollTop
  }

  useEffect(() => {
    if (scrollArea.current) state.top.current = scrollArea.current.scrollTop
  }, [])

  return (
    <main className="book-four-moksha-scene">
      <Canvas
        className="book-four-moksha-canvas"
        linear
        dpr={[1, 1.35]}
        orthographic
        camera={{ zoom: state.zoom, position: [0, 0, 500] }}
      >
        <Suspense
          fallback={
            <Html center className="loading">
              Loading...
            </Html>
          }
        >
          <Content book={book} closing={closing} />
          <Diamonds />
          <Startup />
        </Suspense>
      </Canvas>
      <div
        className="book-four-moksha-scroll-area"
        ref={scrollArea}
        onScroll={handleScroll}
        aria-label="Scroll through Book 4"
        role="region"
        tabIndex={0}
      >
        {Array.from({ length: state.sections }, (_, index) => (
          <div className="book-four-moksha-scroll-section" key={index} />
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
