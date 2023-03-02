const count = 50000

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
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

const renderer = new THREE.WebGLRenderer()
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
  m1: number
  m2: number
  l1: number
  l2: number
  theta1: number
  theta2: number
  dTheta1: number
  dTheta2: number

  constructor(
    theta1 = 80,
    theta2 = 90,
    mass1 = m1,
    mass2 = m2,
    length1 = l1,
    length2 = l2
  ) {
    this.m1 = mass1
    this.m2 = mass2
    this.l1 = length1
    this.l2 = length2

    this.theta1 = (theta1 * PI) / 180
    this.theta2 = (theta2 * PI) / 180

    this.dTheta1 = 0
    this.dTheta2 = 0
  }
}

// Borrowed from https://github.com/micaeloliveira/physics-sandbox/blob/feature/new-styling/assets/javascripts/pendulum.js
function update(p: Pendulum) {
  let mu = 1 + p.m1 / p.m2

  let { theta1, theta2, dTheta1, dTheta2, l1, l2 } = p

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

for (var i = 0; i < pendulums.length; i++) {
  const points: THREE.Vector2[] = []

  let { x1, y1, x2, y2 } = update(pendulums[i])

  points.push(new THREE.Vector2(0, 0))
  points.push(new THREE.Vector2(x1, y1))
  points.push(new THREE.Vector2(x2, y2))

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  //create a blue LineBasicMaterial

  let colorStep = i * (1 / pendulums.length)
  let rgb = evaluate_cmap(colorStep, "plasma", false)

  console.log(rgb)

  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`),
    opacity: 0.6,
    transparent: true
  })

  const line = new THREE.Line(geometry, material)

  line.name = i.toString()

  scene.add(line)
}

function updateGeometry() {
  scene.traverse(function (line) {
    if (line.type === "Line") {
      // console.log(pendulums[line.name as unknown as number] as Pendulum)

      let { x1, y1, x2, y2 } = update(pendulums[line.name as unknown as number])
      line.geometry.attributes.position.array[3] = x1
      line.geometry.attributes.position.array[4] = y1
      line.geometry.attributes.position.array[6] = x2
      line.geometry.attributes.position.array[7] = y2
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
