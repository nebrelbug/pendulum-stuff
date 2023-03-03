import { evaluate_cmap } from "./colormaps"
import { pendulums, update, updateGeometry } from "./worker"
import { count } from "./config"

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module"
})

/* THREE setup */

import * as THREE from "three"
import Stats from "stats.js"

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  40, // degrees
  window.innerWidth / window.innerHeight, // aspect ratio
  1, // near
  500 // far
)

camera.position.set(0, 0, 100)
camera.lookAt(0, 0, 0)

var stats = new Stats()
stats.showPanel(1) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

const renderer = new THREE.WebGLRenderer({
  // antialias: false, // may or may not be worth it
  powerPreference: "high-performance"
})

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// create an empty geometry
var geometry = new THREE.BufferGeometry()

var vertices = []
var colors = []

for (var i = 0; i < pendulums.length; i++) {
  let [x1, y1, x2, y2] = update(pendulums[i])

  // add pairs of points for each line segment
  vertices.push(0, 0, 0) // start point of first line
  vertices.push(x1, y1, 0) // end point of first line
  vertices.push(x1, y1, 0) // start point of second line
  vertices.push(x2, y2, 0) // end point of second line

  let colorStep = i * (1 / pendulums.length)
  let rgb = evaluate_cmap(colorStep, "terrain_r", false)
  // faves: nipy_spectral, plasma, Blues, OrRd, terrain_r
  // White in back is nice
  // Colors are good

  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255

  // add pairs of colors for each line segment
  colors.push(r, g, b) // start color of first line
  colors.push(r, g, b) // end color of first line
  colors.push(r, g, b) // start color of second line
  colors.push(r, g, b) // end color of second line
}

var typedVerticesArray = new Float32Array(vertices)
var typedColorsArray = new Float32Array(colors)

geometry.setAttribute(
  "position",
  new THREE.BufferAttribute(typedVerticesArray, 3)
)

geometry.setAttribute("color", new THREE.BufferAttribute(typedColorsArray, 3))

var material = new THREE.LineBasicMaterial({
  vertexColors: true,
  opacity: 0.1,
  transparent: true
})

var line = new THREE.LineSegments(geometry, material)

let init = line.geometry.attributes.position.array

let sharedFloats = new Float32Array(new SharedArrayBuffer(12 * count * 4))

sharedFloats.set(init, 0)

line.geometry.attributes.position.array = sharedFloats

worker.postMessage(sharedFloats)

scene.add(line)

/* END NEW STUFF */

function updateLine() {
  line.geometry.attributes.position.array = sharedFloats
  ;(line as THREE.LineSegments).geometry.attributes.position.needsUpdate = true
}

function animate() {
  requestAnimationFrame(animate)

  stats.begin()

  renderer.render(scene, camera)

  stats.end()
}

animate()

worker.onmessage = function () {
  updateLine()
}
