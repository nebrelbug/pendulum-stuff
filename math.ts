// TODO: should be based on clock time rather than FPS

import type { BufferAttribute } from "three"

const count = 100000

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

type Pendulum = [number, number, number, number]
// theta1, theta2, dTheta1, dTheta2

// Borrowed from https://github.com/micaeloliveira/physics-sandbox/blob/feature/new-styling/assets/javascripts/pendulum.js, then adjusted for improved performance and friction

export function update(p: Pendulum) {
  let mu = 1 + m1 / m2

  let [theta1, theta2, dTheta1, dTheta2] = p

  let thetaDiff = theta1 - theta2

  let cosThetaDiff = cos(thetaDiff)
  let sinThetaDiff = sin(thetaDiff)

  let sinTheta1 = sin(theta1)
  let sinTheta2 = sin(theta2)

  let cosTheta1 = cos(theta1)
  let cosTheta2 = cos(theta2)

  let d2Theta1 =
    (g * (sinTheta2 * cosThetaDiff - mu * sinTheta1) -
      (l2 * dTheta2 * dTheta2 + l1 * dTheta1 * dTheta1 * cosThetaDiff) *
        sinThetaDiff) /
    (l1 * (mu - cosThetaDiff * cosThetaDiff))

  let d2Theta2 =
    (mu * g * (sinTheta1 * cosThetaDiff - sinTheta2) +
      (mu * l1 * dTheta1 * dTheta1 + l2 * dTheta2 * dTheta2 * cosThetaDiff) *
        sinThetaDiff) /
    (l2 * (mu - cosThetaDiff * cosThetaDiff))

  d2Theta1 += -d2Theta1 * friction
  d2Theta2 += -d2Theta2 * friction

  p[2] += d2Theta1 * speed
  p[3] += d2Theta2 * speed

  p[2] += -p[2] * friction
  p[3] += -p[3] * friction

  p[0] += p[2] * speed
  p[1] += p[3] * speed

  return [
    l1 * sinTheta1,
    -l1 * cosTheta1,
    l1 * sinTheta1 + l2 * sinTheta2,
    -l1 * cosTheta1 - l2 * cosTheta2
  ]
}

let pendulums: Pendulum[] = []

for (var i = 0; i < count; i++) {
  let newP: Pendulum = [
    ((defaultTheta1 + i * (1 / count)) * PI) / 180,
    ((defaultTheta2 + i * (1 / count)) * PI) / 180,
    0,
    0
  ]

  pendulums.push(newP)
}

export { pendulums }

export function updateGeometry(line: THREE.LineSegments) {
  for (var i = 0; i < pendulums.length; i++) {
    let [x1, y1, x2, y2] = update(pendulums[i])

    let geoPosition = line.geometry.attributes.position as GeoPosition

    // There are 12 elements of each pendulum.

    geoPosition.array[i * 12 + 3] = x1
    geoPosition.array[i * 12 + 4] = y1

    geoPosition.array[i * 12 + 6] = x1
    geoPosition.array[i * 12 + 7] = y1

    geoPosition.array[i * 12 + 9] = x2
    geoPosition.array[i * 12 + 10] = y2
  }

  line.geometry.attributes.position.needsUpdate = true
}

export function benchmarkUpdate() {
  for (var i = 0; i < pendulums.length; i++) {
    update(pendulums[i])
  }
}

// Unimportant TypeScript stuff

interface NewArrayLike<T> extends ArrayLike<T> {
  [n: number]: T
}

interface GeoPosition extends BufferAttribute {
  array: NewArrayLike<number>
}
