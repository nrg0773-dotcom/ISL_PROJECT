import { lazy, Suspense, useLayoutEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  NewsletterBookshelf,
} from '@/components/ui/newsletter-bookshelf'
import { LiquidGlassCarousel } from '@/components/ui/liquid-glass-carousel'
import { RippleTransition } from '@/components/ui/ripple-transition'
import VantaBackgroundControls from '@/components/ui/vanta-background-controls'
import bookManifest from '../content/books.json'
import windowContent from '../content/window.json'
import { submergedSceneUrl } from '@/lib/model-urls'

const BookTwoOcclusionExperience = lazy(() =>
  import('@/components/ui/book-two-occlusion-experience').then((module) => ({
    default: module.default,
  })),
)
const BookThreeVikingShipExperience = lazy(() =>
  import('@/components/ui/book-three-viking-ship-experience').then(
    (module) => ({
      default: module.default,
    }),
  ),
)
const BookFourMokshaExperience = lazy(() =>
  import('@/components/ui/book-four-moksha-experience').then((module) => ({
    default: module.default,
  })),
)
const BookFiveSubmergedExperience = lazy(() =>
  import('@/components/ui/book-five-submerged-experience').then((module) => ({
    default: module.default,
  })),
)

const bookDataFiles = import.meta.glob('../content/book-*/book.json', {
  eager: true,
  import: 'default',
})

const books = bookManifest.books.map((manifestBook) => {
  const bookData = bookDataFiles[`../content/${manifestBook.directory}/book.json`]
  if (!bookData) {
    throw new Error(`Missing content file for ${manifestBook.directory}.`)
  }
  return { ...bookData, ...manifestBook }
})

const bookTransitionPresets = {
  'book-1': {
    transitionStyle: 'mosaic',
    duration: 1.2,
    waveSpeed: 1.2,
    sigma: 0.13,
    waveFreq: 4,
    pushAmt: 0.17,
    caStrength: 0.025,
    glow: 0.62,
    noiseWarp: 1.2,
  },
  'book-2': {
    transitionStyle: 'curtain',
    duration: 1.25,
    waveSpeed: 1.25,
    sigma: 0.12,
    waveFreq: 4,
    pushAmt: 0.11,
    caStrength: 0.008,
    glow: 0.82,
    noiseWarp: 0.35,
  },
  'book-3': {
    transitionStyle: 'diagonal',
    duration: 1.2,
    waveSpeed: 1.35,
    sigma: 0.18,
    waveFreq: 3,
    pushAmt: 0.16,
    caStrength: 0.018,
    glow: 0.48,
    noiseWarp: 0.5,
  },
  'book-4': {
    transitionStyle: 'radial',
    duration: 1.4,
    waveSpeed: 1.45,
    sigma: 0.2,
    waveFreq: 5,
    pushAmt: 0.13,
    caStrength: 0.014,
    glow: 0.58,
    noiseWarp: 0.6,
    pinch: true,
  },
  'book-5': {
    transitionStyle: 'underwater',
    duration: 1.5,
    waveSpeed: 1.5,
    sigma: 0.22,
    waveFreq: 7,
    pushAmt: 0.24,
    caStrength: 0.055,
    glow: 0.86,
    noiseWarp: 1.8,
  },
}

function escapeSvgText(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    }
    return entities[character]
  })
}

function transitionArtwork(book, isInterior) {
  const experienceBackgrounds = {
    'submerged-era': '#071d22',
    moksha: '#0c0f13',
    'viking-ship': '#fff0ea',
    'mixing-html-and-webgl-w-occlusion': '#f9cee0',
  }
  const background = isInterior
    ? experienceBackgrounds[book.experience] ?? '#171717'
    : book.color
  const foreground = isInterior && book.experience === 'viking-ship'
    ? '#332521'
    : book.foil ?? '#f2ead8'
  const title = escapeSvgText(book.title)
  const subtitle = escapeSvgText(book.subtitle ?? '')
  const edition = escapeSvgText(book.spineTitle ?? book.date ?? '')
  const artwork = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="${background}"/>
          <stop offset="1" stop-color="#111318"/>
        </linearGradient>
        <radialGradient id="glow">
          <stop stop-color="${foreground}" stop-opacity=".28"/>
          <stop offset="1" stop-color="${foreground}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#background)"/>
      <circle cx="${isInterior ? 1070 : 1140}" cy="430" r="490" fill="url(#glow)"/>
      <path d="M0 720 C360 600 700 890 1440 650 V900 H0Z" fill="${foreground}" opacity=".07"/>
      <path d="M0 770 C470 650 900 930 1440 700" fill="none" stroke="${foreground}" stroke-opacity=".22" stroke-width="2"/>
      <text x="104" y="132" fill="${foreground}" fill-opacity=".78" font-family="monospace" font-size="20" letter-spacing="5">${edition}</text>
      <text x="104" y="430" fill="${foreground}" font-family="Georgia,serif" font-size="76">${title}</text>
      <text x="108" y="494" fill="${foreground}" fill-opacity=".78" font-family="Arial,sans-serif" font-size="25">${subtitle}</text>
      <path d="M108 558 H250" stroke="${foreground}" stroke-width="4"/>
      <text x="108" y="820" fill="${foreground}" fill-opacity=".65" font-family="monospace" font-size="16" letter-spacing="4">${isInterior ? 'OPENING EDITION' : 'THE BRIEF / ARCHIVE'}</text>
      <circle cx="1130" cy="430" r="175" fill="none" stroke="${foreground}" stroke-opacity=".34" stroke-width="2"/>
      <circle cx="1130" cy="430" r="122" fill="none" stroke="${foreground}" stroke-opacity=".22" stroke-width="2"/>
      <circle cx="1130" cy="430" r="68" fill="none" stroke="${foreground}" stroke-opacity=".18" stroke-width="2"/>
    </svg>
  `
  return `data:image/svg+xml,${encodeURIComponent(artwork)}`
}

function BookshelfPage({ onOpenBook }) {
  const location = useLocation()
  const focusBookId = location.state?.focusBookId

  return (
    <main
      className="dark relative isolate min-h-screen bg-[#20232b] px-5 pb-5 pt-6 text-[#f5f5f3] sm:px-8 sm:pt-8"
    >
      <VantaBackgroundControls />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-end justify-between gap-4 border-b border-[#38383d] pb-5">
        <div>
          <p
            className="font-mono uppercase tracking-[0.18em]"
            style={{
              color: windowContent.eyebrow.color,
              fontSize: windowContent.eyebrow.fontSize,
            }}
          >
            {windowContent.eyebrow.text}
          </p>
          <h1
            className="mt-2 font-serif leading-none"
            style={{
              color: windowContent.title.color,
              fontSize: windowContent.title.fontSize,
            }}
          >
            {windowContent.title.text}
          </h1>
        </div>
        <p className="font-mono text-xs tabular-nums text-[#a1a1aa]">
          {String(books.length).padStart(2, '0')} EDITIONS
        </p>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-7xl overflow-hidden border border-[#38383d]">
        <NewsletterBookshelf
          className="min-h-[380px]"
          height="calc(100dvh - 140px)"
          items={books}
          initialBookId={focusBookId}
          onOpen={onOpenBook}
        />
      </div>
    </main>
  )
}

function BookSpace() {
  const { bookId } = useParams()
  const book = books.find((item) => item.id === bookId)

  if (!book) return <Navigate to="/" replace />

  if (book.experience === 'submerged-era') {
    return (
      <Suspense
        fallback={
          <main className="flex h-dvh items-center justify-center bg-[#071d22] font-mono text-xs uppercase tracking-[0.18em] text-white/60">
            Loading submerged era
          </main>
        }
      >
        <BookFiveSubmergedExperience
          journey={book.journey}
          model={{ ...book.submergedEra, modelUrl: submergedSceneUrl }}
        />
      </Suspense>
    )
  }

  if (book.experience === 'moksha') {
    return (
      <Suspense
        fallback={
          <main className="flex h-dvh items-center justify-center bg-[#0c0f13] font-mono text-xs uppercase tracking-[0.18em] text-white/60">
            Loading edition
          </main>
        }
      >
        <BookFourMokshaExperience
          book={book}
          sections={book.moksha?.sections ?? []}
          images={book.moksha?.images ?? []}
          closing={book.moksha?.closing ?? ''}
        />
      </Suspense>
    )
  }

  if (book.experience === 'viking-ship') {
    return (
      <Suspense
        fallback={
          <main className="flex h-dvh items-center justify-center bg-[#fff0ea] font-mono text-xs uppercase tracking-[0.18em] text-[#332521]/70">
            Loading voyage
          </main>
        }
      >
        <BookThreeVikingShipExperience journey={book.journey} />
      </Suspense>
    )
  }

  if (book.experience === 'mixing-html-and-webgl-w-occlusion') {
    return (
      <Suspense
        fallback={
          <main className="flex h-dvh items-center justify-center bg-[#f9cee0] font-mono text-xs uppercase tracking-[0.18em] text-[#351a36]/70">
            Loading book
          </main>
        }
      >
        <BookTwoOcclusionExperience
          cards={book.cards ?? []}
          floatingText={book.floatingText ?? []}
          floatingTextColorStops={book.floatingTextColorStops ?? []}
          readingPage={book.readingPage}
        />
      </Suspense>
    )
  }

  const hasContent = book.carouselItems?.length > 0

  return (
    <main
      aria-label="Book private space"
      className={hasContent ? 'h-dvh overflow-hidden bg-white' : 'min-h-screen bg-[#f3f1eb]'}
      data-book-id={bookId}
    >
      {hasContent && (
        <LiquidGlassCarousel
          className="h-full min-h-0"
          items={book.carouselItems}
        />
      )}
    </main>
  )
}

function AppRoutes({ location, onOpenBook }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<BookshelfPage onOpenBook={onOpenBook} />} />
      <Route path="/books/:bookId" element={<BookSpace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RoutedPages() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationType = useNavigationType()
  const [currentLocation, setCurrentLocation] = useState(location)
  const [previousLocation, setPreviousLocation] = useState(null)
  const [bookTransition, setBookTransition] = useState(null)

  const beginBookTransition = (book) => {
    if (!bookTransition) {
      setBookTransition({ book, phase: 'animating' })
    }
  }
  const finishBookTransition = () => {
    if (!bookTransition || bookTransition.phase !== 'animating') return
    setBookTransition({ ...bookTransition, phase: 'revealing' })
    navigate(`/books/${bookTransition.book.id}`, {
      state: { skipRouteRipple: true },
    })
  }
  const clearBookTransition = (event) => {
    if (
      event.target === event.currentTarget &&
      event.propertyName === 'opacity' &&
      bookTransition?.phase === 'revealing'
    ) {
      setBookTransition(null)
    }
  }
  const transitionBook = bookTransition?.book
  const transitionImages = useMemo(
    () => transitionBook
      ? [
          transitionArtwork(transitionBook, false),
          transitionArtwork(transitionBook, true),
        ]
      : [],
    [transitionBook],
  )

  useLayoutEffect(() => {
    if (location.state?.skipRouteRipple) {
      setPreviousLocation(null)
      setCurrentLocation(location)
      return
    }

    if (navigationType === 'POP') {
      setPreviousLocation(null)
      setCurrentLocation(location)
      return
    }

    if (location.pathname === currentLocation.pathname) {
      if (location.key !== currentLocation.key) setCurrentLocation(location)
      return
    }

    setPreviousLocation(currentLocation)
    setCurrentLocation(location)
  }, [currentLocation, location, navigationType])

  return (
    <>
      {previousLocation && (
        <div
          key={`outgoing-${previousLocation.key}`}
          aria-hidden="true"
          className="route-frame route-frame-outgoing"
          inert
        >
          <AppRoutes
            location={previousLocation}
            onOpenBook={beginBookTransition}
          />
        </div>
      )}
      <div
        key={`current-${currentLocation.key}`}
        className={previousLocation ? 'route-frame route-frame-ripple' : 'route-frame'}
        onAnimationEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.animationName === 'route-ripple-reveal'
          ) {
            setPreviousLocation(null)
          }
        }}
      >
        <AppRoutes
          location={currentLocation}
          onOpenBook={beginBookTransition}
        />
      </div>
      {bookTransition && (
        <div
          className={`book-transition-overlay ${
            bookTransition.phase === 'revealing'
              ? 'is-revealing'
              : ''
          }`}
          onTransitionEnd={clearBookTransition}
        >
          <RippleTransition
            key={bookTransition.book.id}
            aria-hidden="true"
            background="#111318"
            borderRadius={0}
            className="h-dvh min-h-0 w-full"
            images={transitionImages}
            label={`Opening ${bookTransition.book.title}`}
            onComplete={finishBookTransition}
            onError={finishBookTransition}
            playOnMount
            role="presentation"
            tabIndex={-1}
            {...bookTransitionPresets[bookTransition.book.directory]}
          />
        </div>
      )}
    </>
  )
}

function App() {
  const Router = __STANDALONE__ ? HashRouter : BrowserRouter

  return (
    <Router>
      <RoutedPages />
    </Router>
  )
}

export default App
