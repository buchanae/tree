
function rotateX(m, src, dst, angle) {
  var cos = Math.cos(angle)
  var sin = Math.sin(angle)
  var z22 = m[src + 10]
  var z13 = m[src + 7]
  var z23 = m[src + 11]
  var z10 = m[src + 4]
  var z20 = m[src + 8]
  var z11 = m[src + 5]
  var z21 = m[src + 9]
  var z12 = m[src + 6]
  m[dst + 4] = z10 * cos + z20 * sin
  m[dst + 5] = z11 * cos + z21 * sin
  m[dst + 6] = z12 * cos + z22 * sin
  m[dst + 7] = z13 * cos + z23 * sin
  m[dst + 8] = z10 * -sin + z20 * cos
  m[dst + 9] = z11 * -sin + z21 * cos
  m[dst + 10] = z12 * -sin + z22 * cos
  m[dst + 11] = z13 * -sin + z23 * cos
}

function rotateY(m, src, dst, angle) {
  var cos = Math.cos(angle)
  var sin = Math.sin(angle)
  var z21 = m[src + 9]
  var z02 = m[src + 2]
  var z22 = m[src + 10]
  var z03 = m[src + 3]
  var z23 = m[src + 11]
  var z00 = m[src + 0]
  var z20 = m[src + 8]
  var z01 = m[src + 1]
  m[dst + 0] = z00 * cos + z20 * -sin
  m[dst + 1] = z01 * cos + z21 * -sin
  m[dst + 2] = z02 * cos + z22 * -sin
  m[dst + 3] = z03 * cos + z23 * -sin
  m[dst + 8] = z00 * sin + z20 * cos
  m[dst + 9] = z01 * sin + z21 * cos
  m[dst + 10] = z02 * sin + z22 * cos
  m[dst + 11] = z03 * sin + z23 * cos
}

function rotateZ(m, src, dst, angle) {
  var cos = Math.cos(angle)
  var sin = Math.sin(angle)
  var z01 = m[src + 1]
  var z11 = m[src + 5]
  var z02 = m[src + 2]
  var z12 = m[src + 6]
  var z03 = m[src + 3]
  var z13 = m[src + 7]
  var z00 = m[src + 0]
  var z10 = m[src + 4]
  m[dst + 0] = z00 * cos + z10 * sin
  m[dst + 1] = z01 * cos + z11 * sin
  m[dst + 2] = z02 * cos + z12 * sin
  m[dst + 3] = z03 * cos + z13 * sin
  m[dst + 4] = z00 * -sin + z10 * cos
  m[dst + 5] = z01 * -sin + z11 * cos
  m[dst + 6] = z02 * -sin + z12 * cos
  m[dst + 7] = z03 * -sin + z13 * cos
}

function scale(m, src, dst, x, y, z) {
  m[dst + 0] = m[src + 0] * x
  m[dst + 1] = m[src + 1] * x
  m[dst + 2] = m[src + 2] * x
  m[dst + 3] = m[src + 3] * x
  m[dst + 4] = m[src + 4] * y
  m[dst + 5] = m[src + 5] * y
  m[dst + 6] = m[src + 6] * y
  m[dst + 7] = m[src + 7] * y
  m[dst + 8] = m[src + 8] * z
  m[dst + 9] = m[src + 9] * z
  m[dst + 10] = m[src + 10] * z
  m[dst + 11] = m[src + 11] * z
}

function translate(m, src, dst, x, y, z) {
  m[dst + 12] = m[src + 0] * x + m[src + 4] * y + m[src + 8] * z + m[src + 12]
  m[dst + 13] = m[src + 1] * x + m[src + 5] * y + m[src + 9] * z + m[src + 13]
  m[dst + 14] = m[src + 2] * x + m[src + 6] * y + m[src + 10] * z + m[src + 14]
  m[dst + 15] = m[src + 3] * x + m[src + 7] * y + m[src + 11] * z + m[src + 15]
}

function multiply(m, src, dst, b) {
  var b30 = m[b + 12]
  var b02 = m[b + 2]
  var b03 = m[b + 3]
  var b20 = m[b + 8]
  var b21 = m[b + 9]
  var b12 = m[b + 6]
  var b13 = m[b + 7]
  var b11 = m[b + 5]
  var b22 = m[b + 10]
  var b32 = m[b + 14]
  var b23 = m[b + 11]
  var b33 = m[b + 15]
  var b31 = m[b + 13]
  var b10 = m[b + 4]
  var b01 = m[b + 1]
  var b00 = m[b + 0]
  var z12 = m[src + 6]
  var z22 = m[src + 10]
  var z33 = m[src + 15]
  var z00 = m[src + 0]
  var z32 = m[src + 14]
  var z30 = m[src + 12]
  var z21 = m[src + 9]
  var z02 = m[src + 2]
  var z23 = m[src + 11]
  var z10 = m[src + 4]
  var z20 = m[src + 8]
  var z01 = m[src + 1]
  var z11 = m[src + 5]
  var z31 = m[src + 13]
  var z03 = m[src + 3]
  var z13 = m[src + 7]
  m[dst + 0] = z00 * b00 + z10 * b10 + z20 * b20 + z30 * b30
  m[dst + 1] = z01 * b00 + z11 * b10 + z21 * b20 + z31 * b30
  m[dst + 2] = z02 * b00 + z12 * b10 + z22 * b20 + z32 * b30
  m[dst + 3] = z03 * b00 + z13 * b10 + z23 * b20 + z33 * b30
  m[dst + 4] = z00 * b01 + z10 * b11 + z20 * b21 + z30 * b31
  m[dst + 5] = z01 * b01 + z11 * b11 + z21 * b21 + z31 * b31
  m[dst + 6] = z02 * b01 + z12 * b11 + z22 * b21 + z32 * b31
  m[dst + 7] = z03 * b01 + z13 * b11 + z23 * b21 + z33 * b31
  m[dst + 8] = z00 * b02 + z10 * b12 + z20 * b22 + z30 * b32
  m[dst + 9] = z01 * b02 + z11 * b12 + z21 * b22 + z31 * b32
  m[dst + 10] = z02 * b02 + z12 * b12 + z22 * b22 + z32 * b32
  m[dst + 11] = z03 * b02 + z13 * b12 + z23 * b22 + z33 * b32
  m[dst + 12] = z00 * b03 + z10 * b13 + z20 * b23 + z30 * b33
  m[dst + 13] = z01 * b03 + z11 * b13 + z21 * b23 + z31 * b33
  m[dst + 14] = z02 * b03 + z12 * b13 + z22 * b23 + z32 * b33
  m[dst + 15] = z03 * b03 + z13 * b13 + z23 * b23 + z33 * b33
}

function clone(m, n, src, dst) {
  n[dst + 0] = m[src + 0]
  n[dst + 1] = m[src + 1]
  n[dst + 2] = m[src + 2]
  n[dst + 3] = m[src + 3]
  n[dst + 4] = m[src + 4]
  n[dst + 5] = m[src + 5]
  n[dst + 6] = m[src + 6]
  n[dst + 7] = m[src + 7]
  n[dst + 8] = m[src + 8]
  n[dst + 9] = m[src + 9]
  n[dst + 10] = m[src + 10]
  n[dst + 11] = m[src + 11]
  n[dst + 12] = m[src + 12]
  n[dst + 13] = m[src + 13]
  n[dst + 14] = m[src + 14]
  n[dst + 15] = m[src + 15]
}

function identity(m, dst) {
  m[dst + 0] = 1
  m[dst + 1] = 0
  m[dst + 2] = 0
  m[dst + 3] = 0
  m[dst + 4] = 0
  m[dst + 5] = 1
  m[dst + 6] = 0
  m[dst + 7] = 0
  m[dst + 8] = 0
  m[dst + 9] = 0
  m[dst + 10] = 1
  m[dst + 11] = 0
  m[dst + 12] = 0
  m[dst + 13] = 0
  m[dst + 14] = 0
  m[dst + 15] = 1
}

function dumpMatrix(m, j) {
  m = m.slice(j, j + 16)
  console.log([
    [m[0], m[1], m[2],  m[3]].join(" "),
    [m[4], m[5], m[6],  m[7]].join(" "),
    [m[8], m[9], m[10], m[11]].join(" "),
    [m[12], m[13], m[14], m[15]].join(" "),
  ].join("\n"))
}
