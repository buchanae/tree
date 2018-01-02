// The shape (aka geometry) of a node.
var Geometries = {
  default: "cylinder",
  box: "box",
  cylinder: "cylinder",
  sphere: "sphere",
}

// Materials determine how a node looks: renderer algorithm, color, texture, etc.
var Materials = {
  default: "lambert",
}

// Global options controlling the simulation.
var Options = {
  // Total years to simulate growth.
  years: 300,
}

function Group(length) {
  this.geometry = Geometries.box
  this.material = Materials.default
  this.length = length

  this.local = new Float32Array(length * 16)
  this.transform = new Float32Array(length * 16)
  identity(this.transform, 0)
  this.color = new Float32Array(length * 3)
}

Main()
function Main() {
  var renderer = new Renderer()
  var branches = []
  var genLeaves = true

  var loc = [
    0, 0,
    400, -150,
    -400, -150,
    410, -150,
    -410, -150,
  ]

  // For performance profiling in Chrome devtools
  console.time("gen")

  // Generate multiple trees
  for (let j = 0; j < 1; j++) {
    var trunk = new Group(Options.years)
    branches.push(trunk)

    // Set the position of the tree
    translate(trunk.transform, 0, 0, loc[j * 2], 0, loc[j * 2+ 1] )

    // Grow the trunk, and get the trunks branches
    let sub = grow(trunk, {
      geo: Geometries.box,
      seed: j,
      thickness: 25,
      height: 2,
      offset: 0,
      minBranchAge: 55,
      branchChance: 1.9,
      //branchChance: 0,
      upness: 0.3,
      jitChance: 0,
      jamt: 1.7,
      djamt: 0.03,
    })

    // Grow the trunk's branches
    for (let i = 0; i < sub.length; i++) {
      grow(sub[i], {
        seed: j + i,
        geo: Geometries.box,
        height: 1,
        offset: 0,
        thickness: 5,
        minBranchAge: 25,
        branchChance: 0,
        trend: -0.003,
        upness: 0.3,
        jitChance: 0.2,
        jamt: 0.1,
        djamt: 0.03,
      })
      branches.push(sub[i])

      // Generate leaves.
      if (genLeaves) {
        var l = leaves(sub[i], {
          seed: j + i + 1,
          count: Math.floor(sub[i].length * 3),
          geo: Geometries.box,
          jamt: {
            x: 100,
            y: 0,
            z: 10,
          },
          size: 8,
        })
        branches.push(l)
      }
    }
  }

  // For performance profiling in Chrome devtools
  console.timeEnd("gen")

  var total = 0
  for (let i = 0; i < branches.length; i++) {
    total += branches[i].length
  }
  console.log("total", total)

  console.time("render")
  renderer.Render(branches)
  console.timeEnd("render")
}

function grow(branch, opts) {
  branch.geometry = opts.geo
  var sub = []
  var rand = new Random(opts.seed)
  var curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.6, 0, 0 ),
    new THREE.Vector3( 0.5, 50, 0 ),
    new THREE.Vector3( 0.2, 90, 0 ),
    new THREE.Vector3( 0.01,  100, 0 )
  ])

  for (var i = 0; i < branch.length; i++) {

    var cj = i * 3
    branch.color[cj] = 0.9
    branch.color[cj + 1] = 0.6
    branch.color[cj + 2] = 0.35

    var j = i * 16
    var pj = (i - 1) * 16
    var age = i
    var b = branch
    var perc = age / branch.length
    var thickness = opts.thickness * (1 - perc)

    // Initialize local transform to identity matrix
    identity(b.local, j)

    // Scale the local mesh size
    scale(b.local, j, j, thickness, opts.height, thickness)

    // There's no parent of the first node, so there's nothing to project below.
    if (i == 0) {
      continue
    }

    // Clone parent transform
    clone(b.transform, b.transform, pj, j)

    // Trend branches up/downward
    if (opts.trend) {
      rotateX(b.transform, j, j, opts.trend)
    }

    // Jitter branch direction
    if (age > 10 && rand.Chance(opts.jitChance)) {
      rotateX(b.transform, j, j, rand.Range(-opts.djamt, opts.djamt))
      //rotateY(b.transform, j, j, rand.Range(-0.08, 0.08))
      rotateZ(b.transform, j, j, rand.Range(-opts.djamt, opts.djamt))
    }

    // Node height
    translate(b.transform, j, j, 0, opts.height + opts.offset, 0)

    // Jitter node position
    if (rand.Chance(opts.jitChance)) {
      translate(b.transform, j, j,
        rand.Range(-opts.jamt, opts.jamt),
        0,
        rand.Range(-opts.jamt, opts.jamt)
      )
    }

    // Generate branches
    if (age > opts.minBranchAge && 
        rand.Chance(perc) && 
        rand.Chance(opts.branchChance)) {

      var z = curve.getPointAt(perc)
      var length = Math.floor(
        Math.max(0, branch.length * z.x + rand.Range(-10, 10)))

      var g = new Group(length)
      clone(b.transform, g.transform, j, 0)
      rotateY(g.transform, 0, 0, rand.Angle())
      rotateX(g.transform, 0, 0, Math.PI / 2 - opts.upness)
      sub.push(g)
    }
  }

  return sub
}

function leaves(branch, opts) {
  var rand = new Random(opts.seed)
  var g = new Group(opts.count)
  g.geometry = opts.geo

  for (var i = 0; i < opts.count; i++) {
    var cj = i * 3
    var j = i * 16
    identity(g.local, j)

    translate(g.local, j, j,
      rand.Range(-opts.jamt.x, opts.jamt.x),
      rand.Range(-opts.jamt.y, opts.jamt.y),
      rand.Range(-opts.jamt.z, opts.jamt.z))
    
    if (rand.Chance(0.003)) {
      scale(g.local, j, j, 7, 7, 7)
      g.geometry = Geometries.sphere

      g.color[cj] = 0.9
      g.color[cj + 1] = 0
      g.color[cj + 2] = 0
    } else {
      scale(g.local, j, j, 4, 4, 4)

      g.color[cj] = 0
      g.color[cj + 1] = rand.Range(0.8, 1)
      g.color[cj + 2] = 0
    }

    var k = Math.floor(
      rand.Range(
        Math.max(
          2, branch.length * 0.25),
        branch.length))

    var bk = k * 16
    clone(branch.transform, g.transform, bk, j)
  }
  return g
}
