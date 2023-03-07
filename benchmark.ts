import { benchmarkUpdate as b1 } from "./math.js"
// import { benchmarkUpdate as b2 } from "./math-2.js"

import b from "benny"

b.suite(
  "Double pendulum physics",

  b.add("math.ts", () => {
    b1()
  }),

  // b.add("math-2.ts", () => {
  //   b2()
  // }),

  b.add("Reduce five elements", () => {
    ;[1, 2, 3, 4, 5].reduce((a, b) => a + b)
  }),

  b.cycle(),
  b.complete(),
  b.save({ file: "reduce", version: "1.0.0" }),
  b.save({ file: "reduce", format: "chart.html" })
)
