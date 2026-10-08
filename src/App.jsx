import { lazy, Suspense, useLayoutEffect, useState } from 'react'
import {
  BrowserRouter,
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
import bookManifest from '../content/books.json'

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

function BookshelfPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingDestination, setPendingDestination] = useState(null)
  const focusBookId = location.state?.focusBookId

  const openBook = (book) => {
    if (!pendingDestination) setPendingDestination(`/books/${book.id}`)
  }

  return (
    <main
      className={`min-h-screen bg-[#f3f1eb] px-5 pb-5 pt-6 text-[#20211f] sm:px-8 sm:pt-8${pendingDestination ? ' route-page-exit' : ''}`}
      onAnimationEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.animationName === 'route-ripple-exit' &&
          pendingDestination
        ) {
          navigate(pendingDestination, { state: { skipRouteRipple: true } })
        }
      }}
    >
      <header className="mx-auto flex w-full max-w-7xl items-end justify-between gap-4 border-b border-[#d7d4cb] pb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77766f]">
            The Brief / Archive
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-none sm:text-4xl">
            Your bookshelf
          </h1>
        </div>
        <p className="font-mono text-xs tabular-nums text-[#77766f]">
          {String(books.length).padStart(2, '0')} EDITIONS
        </p>
      </header>

      <div className="mx-auto w-full max-w-7xl overflow-hidden border border-[#dedbd2]">
        <NewsletterBookshelf
          className="min-h-[380px]"
          height="calc(100dvh - 140px)"
          items={books}
          initialBookId={focusBookId}
          onOpen={openBook}
        />
      </div>
    </main>
  )
}

function BookSpace() {
  const { bookId } = useParams()
  const book = books.find((item) => item.id === bookId)

  if (!book) return <Navigate to="/" replace />

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

function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<BookshelfPage />} />
      <Route path="/books/:bookId" element={<BookSpace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RoutedPages() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [currentLocation, setCurrentLocation] = useState(location)
  const [previousLocation, setPreviousLocation] = useState(null)

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
          <AppRoutes location={previousLocation} />
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
        <AppRoutes location={currentLocation} />
      </div>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <RoutedPages />
    </BrowserRouter>
  )
}

export default App
