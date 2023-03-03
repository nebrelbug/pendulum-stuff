const count = 100

// TODO: should be based on clock time rather than FPS

import { evaluate_cmap } from "./colormaps"

/* THREE setup */

import * as THREE from "three"
import Stats from "stats.js"

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  45, // degrees
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
  antialias: false, // may or may not be worth it
  powerPreference: "high-performance"
})

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

/* CONSTANTS */

const PI = Math.PI
const sin = Math.sin
const cos = Math.cos

/* CONFIG */

var g = 9.81
var speed = 0.05
var friction = 0.0002 // ideal may be 0.0002
var m1 = 10
var m2 = 10
var l1 = 15
var l2 = 15

const defaultTheta1 = 80
const defaultTheta2 = 90

/* PENDULUM CLASS (refactor to vectorize) */

class Pendulum {
  theta1: number
  theta2: number
  dTheta1: number
  dTheta2: number

  constructor(theta1 = 80, theta2 = 90) {
    this.theta1 = (theta1 * PI) / 180
    this.theta2 = (theta2 * PI) / 180

    this.dTheta1 = 0
    this.dTheta2 = 0
  }
}

// Borrowed from https://github.com/micaeloliveira/physics-sandbox/blob/feature/new-styling/assets/javascripts/pendulum.js
function update(p: Pendulum) {
  let mu = 1 + m1 / m2

  let { theta1, theta2, dTheta1, dTheta2 } = p

  let thetaDiff = theta1 - theta2

  let cosThetaDiff = cos(thetaDiff)

  let d2Theta1 =
    (g * (sin(theta2) * cosThetaDiff - mu * sin(theta1)) -
      (l2 * dTheta2 * dTheta2 + l1 * dTheta1 * dTheta1 * cosThetaDiff) *
        sin(thetaDiff)) /
    (l1 * (mu - cosThetaDiff * cosThetaDiff))

  let d2Theta2 =
    (mu * g * (sin(theta1) * cosThetaDiff - sin(theta2)) +
      (mu * l1 * dTheta1 * dTheta1 + l2 * dTheta2 * dTheta2 * cosThetaDiff) *
        sin(thetaDiff)) /
    (l2 * (mu - cosThetaDiff * cosThetaDiff))

  d2Theta1 += -d2Theta1 * friction
  d2Theta2 += -d2Theta2 * friction

  p.dTheta1 += d2Theta1 * speed
  p.dTheta2 += d2Theta2 * speed

  p.dTheta1 += -p.dTheta1 * friction
  p.dTheta2 += -p.dTheta2 * friction

  p.theta1 += p.dTheta1 * speed
  p.theta2 += p.dTheta2 * speed

  return {
    x1: l1 * Math.sin(theta1),
    y1: -l1 * Math.cos(theta1),
    x2: l1 * Math.sin(theta1) + l2 * Math.sin(theta2),
    y2: -l1 * Math.cos(theta1) - l2 * Math.cos(theta2)
  }
}

let pendulums: Pendulum[] = []

for (var i = 0; i < count; i++) {
  let newP = new Pendulum(
    defaultTheta1 + i * (1 / count),
    defaultTheta2 + i * (1 / count)
  )

  pendulums.push(newP)
}

/* NEW STUFF */

// create an empty geometry
var geometry = new THREE.BufferGeometry()

// create an array of vertices
var vertices = []
// create an array of colors
var colors = []

for (var i = 0; i < pendulums.length; i++) {
  let { x1, y1, x2, y2 } = update(pendulums[i])

  // add pairs of points for each line segment
  vertices.push(0, 0, 0) // start point of first line
  vertices.push(x1, y1, 0) // end point of first line
  vertices.push(x1, y1, 0) // start point of second line
  vertices.push(x2, y2, 0) // end point of second line
  // and so on...

  let colorStep = i * (1 / pendulums.length)
  let rgb = evaluate_cmap(colorStep, "plasma", false)

  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255

  // add pairs of colors for each line segment
  colors.push(r, g, b) // start color of first line
  colors.push(r, g, b) // end color of first line
  colors.push(r, g, b) // start color of second line
  colors.push(r, g, b) // end color of second line
  // and so on...
}

// convert the array to a typed array
var typedArray = new Float32Array(vertices)

// set the geometry position attribute
geometry.setAttribute("position", new THREE.BufferAttribute(typedArray, 3))

// convert the array to a typed array
var typedArray = new Float32Array(colors)

// set the geometry color attribute
geometry.setAttribute("color", new THREE.BufferAttribute(typedArray, 3))

// create a material for the line with vertex colors enabled
var material = new THREE.LineBasicMaterial({
  vertexColors: true,
  opacity: 0.6,
  transparent: true
})

// create a LineSegments object from the geometry and material
var line = new THREE.LineSegments(geometry, material)

// add the line to the scene
scene.add(line)

/* END NEW STUFF */

function updateGeometry() {
  scene.traverse(function (line) {
    if (line.type === "LineSegments") {
      for (var i = 0; i < pendulums.length; i++) {
        let { x1, y1, x2, y2 } = update(pendulums[i])

        // There are 12 elements of each pendulum.

        line.geometry.attributes.position.array[i * 12 + 3] = x1
        line.geometry.attributes.position.array[i * 12 + 4] = y1

        line.geometry.attributes.position.array[i * 12 + 6] = x1
        line.geometry.attributes.position.array[i * 12 + 7] = y1

        line.geometry.attributes.position.array[i * 12 + 9] = x2
        line.geometry.attributes.position.array[i * 12 + 10] = y2
      }

      line.geometry.attributes.position.needsUpdate = true
    }
  })
}

function animate() {
  requestAnimationFrame(animate)

  stats.begin()

  updateGeometry()

  stats.end()

  renderer.render(scene, camera)
}
requestAnimationFrame(animate)
