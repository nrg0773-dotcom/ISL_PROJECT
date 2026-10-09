# React + Vite

## Book content

Book data lives in separate folders under `content/`:

- `content/books.json` is the small index of book IDs, folders, and cover
  colors. The `id`, `directory`, and `color` fields belong here.
- `content/book-1/book.json` through `content/book-5/book.json` contain the
  content for each individual book.

Edit a book's `book.json` to change its `title`, `spineTitle`, `date`,
`subtitle`, or `carouselItems`. Carousel entries each have a `title`,
`description`, and `category`. Book 1's existing slider reads its items from
`content/book-1/book.json`; other books can have slider content by adding
entries to their own `carouselItems` arrays.

Book 2 uses the pmndrs
[mixing-html-and-webgl-w-occlusion](https://github.com/pmndrs/examples/tree/main/examples/mixing-html-and-webgl-w-occlusion)
example: a floating laptop model with scrollable HTML cards rendered as
occluded content on its display. Edit the `cards` in
`content/book-2/book.json`; scrolling through them transitions the Drei 3D
heading and paragraph beside the laptop. The model is kept locally under
`src/components/ui/book-two-occlusion/`. The pmndrs MIT license is included
at `public/PMNDRS-LICENSE.txt`.

Book 4's original Moksha-inspired copy and image filenames live in
`content/book-4/book.json`. Update `moksha.images` to select different local
`.jpg` or `.jpeg` assets from `src/components/ui/book-four-moksha/assets/`;
each section uses the image at the matching position in the list.
The Book 4 scrolling layout, custom text and image materials, and refractive
diamond field are adapted from the MIT-licensed
[pmndrs Moksha example](https://github.com/pmndrs/examples/tree/main/examples/moksha).
Its license notice is included at `public/PMNDRS-LICENSE.txt`.

Book 5 uses a timed 3D model journey with floating Drei text and `A`-key
progression, adapted from Book 3. Edit `journey.notes` and its timing settings
in `content/book-5/book.json`; `submergedEra.targetDepth` controls the model's
depth in the scene. The model and textures are hosted in
`public/models/book-five-submerged/`; keep that folder structure intact so
the model's relative asset references resolve. The model is by Omar Faruq
Tawsif under CC BY 4.0; attribution is displayed in the experience and
included at `public/SUBMERGED-ERA-LICENSE.txt`.

Run `npm run dev` to preview changes, `npm run lint` to lint the project, and
`npm run build` to create a production build.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
