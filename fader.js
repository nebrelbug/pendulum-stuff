var fader_defaults = {
  in: 500,
  stay: 2000,
  out: 500,
  delaynext: 1000
}

function fader_set_defaults(new_defaults) {
  var attrs = ["in", "stay", "out", "delaynext"]
  for (var ind = 0; ind < attrs.length; ind++) {
    if (new_defaults[attrs[ind]]) {
      fader_defaults[attrs[ind]] = new_defaults[attrs[ind]]
    }
  }
}

function fader_start() {
  var fades = document.querySelectorAll(".fader")
  if (fades.length == 0) {
    return
  }

  var events = []
  for (var ind = 0; ind < fades.length; ind++) {
    events.push({
      objref: fades[ind],
      in: fades[ind].dataset.in
        ? Number(fades[ind].dataset.in)
        : fader_defaults.in,
      stay: fades[ind].dataset.stay
        ? Number(fades[ind].dataset.stay)
        : fader_defaults.stay,
      out: fades[ind].dataset.out
        ? Number(fades[ind].dataset.out)
        : fader_defaults.out,
      delaynext: fades[ind].dataset.delaynext
        ? Number(fades[ind].dataset.delaynext)
        : fader_defaults.delaynext
    })
  }
  main_fader(events, 0)
}

var event_count = 0

function main_fader(events, ind) {
  var evt = events[ind]

  event_count += 1
  $(evt.objref).fadeIn(evt.in, function () {
    setTimeout(function () {
      $(evt.objref).fadeOut(evt.out, function () {
        event_count -= 1
      })
    }, evt.stay)
  })

  if (ind < events.length - 1) {
    setTimeout(function () {
      main_fader(events, ind + 1)
    }, evt.delaynext)
  } else {
    setTimeout(function () {
      try_to_loop(events)
    }, evt.delaynext)
  }
}

function try_to_loop(events) {
  // loop back to the beginning
  if (event_count > 0) {
    setTimeout(function () {
      try_to_loop(events)
    }, 1000)
  } else {
    main_fader(events, 0)
  }
}
