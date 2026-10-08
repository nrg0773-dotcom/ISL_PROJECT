# Book 2: pmndrs occlusion example

## Task

Replace Book 2's previous phone/Spline experience with the pmndrs
`mixing-html-and-webgl-w-occlusion` example. Keep the experience local to
Book 2 and leave other book routes unchanged.

The replacement includes the example's floating laptop model, full-screen
hero-page HTML, Drei HTML/WebGL occlusion, lighting, shadows, and orbit
controls. The hero page scrolls inside the laptop display.

## Current implementation

- `content/book-2/book.json` selects the experience.
- `src/components/ui/book-two-occlusion-experience.jsx` contains the laptop
  scene and route-level bookshelf navigation.
- `src/components/ui/book-two-occlusion-experience.jsx` renders the scrollable
  HTML cards, floating Drei text, and laptop scene.
- `src/components/ui/book-two-occlusion/assets/` contains the locally bundled
  laptop model.
- The pmndrs MIT license notice is at `public/PMNDRS-LICENSE.txt`.

## Earlier issue

The previous `interactive-spline-scene-live-html` attempt displayed the phone
and custom content, but the hands and surrounding scene did not reproduce
correctly. That implementation and its Spline model were removed when Book 2
was switched to the complete laptop-and-occlusion example.

## Verification

The production build succeeds. Browser verification confirmed that the laptop
model and HTML page render together on the Book 2 route. The scroll-linked 3D
text now follows the card progress with a crossfade transition.
