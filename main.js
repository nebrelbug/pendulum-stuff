import { evaluate_cmap } from "./colormaps"
import { pendulums, update, updateGeometry } from "./math"

/* THREE setup */

import * as THREE from "three"
import Stats from "stats.js"

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  40, // degrees
  window.innerWidth / window.innerHeight, // aspect ratio
  1, // near
  100 // far
)

camera.position.set(0, 0, 50)
camera.lookAt(0, -15, 0)

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

var z = 0.0
for (var i = 0; i < pendulums.length; i++) {
  let [x1, y1, x2, y2] = update(pendulums[i])
  z = i / pendulums.length
  // add pairs of points for each line segment
  vertices.push(0, 0, z) // start point of first line
  vertices.push(x1, y1, z) // end point of first line
  vertices.push(x1, y1, z) // start point of second line
  vertices.push(x2, y2, z) // end point of second line

  let colorStep = i * (1 / pendulums.length)
  let rgb = evaluate_cmap(colorStep, "terrain_r", false)

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
  opacity: 0.2,
  transparent: true
  // linewidth: 10
})

var line = new THREE.LineSegments(geometry, material)
scene.add(line)

/* END NEW STUFF */

function updateLine() {
  scene.traverse(function (line) {
    if (line.type === "LineSegments") {
      updateGeometry(line)
    }
  })
}

function animate() {
  requestAnimationFrame(animate)

  stats.begin()

  updateLine()

  renderer.render(scene, camera)

  stats.end()
}

animate()
