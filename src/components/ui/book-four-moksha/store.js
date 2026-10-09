import { Vector3 } from 'three'

const state = {
  sections: 9,
  pages: 8,
  zoom: 75,
  paragraphs: [],
  stripes: [
    { offset: 0, color: '#000', height: 13 },
    { offset: 6.3, color: '#000', height: 20 },
  ],
  diamonds: [
    { x: 0, offset: 0.15, scale: 14, factor: 4 },
    { x: 2, offset: 1.1, scale: 1.8, factor: 2.1 },
    { x: -5, offset: 2, scale: 1.8, factor: 2.5 },
    { x: 0, offset: 3.2, scale: 1.8, factor: 1.75 },
    { x: 0, offset: 4, scale: 1.8, factor: 2.5 },
    { x: 2, offset: 5.5, scale: 2.25, factor: 0.85 },
    { x: -5, offset: 7, scale: 1.8, factor: 2 },
    { x: 0, offset: 8, scale: 2.5, factor: 6 },
  ].map((diamond) => ({ ...diamond, pos: new Vector3() })),
  top: { current: 0 },
}

export function lerp(start, end, amount) {
  return start + (end - start) * amount
}

export function setParagraphs(paragraphs) {
  state.paragraphs = paragraphs
}

export default state
