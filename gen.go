package main

import (
	"fmt"
	"strings"
  "text/template"
  "os"
)

// http://www.opengl-tutorial.org/assets/faq_quaternions/index.html#Q11

// All matrices are in column-major format (transposed from what would be intuitive)
// because of Open/WebGL's choice to have a column-major data layout.

var rotateX = strings.Fields(`
1  0     0    0
0  cos   sin  0
0  -sin  cos  0
0  0     0    1
`)

var rotateY = strings.Fields(`
cos   0   -sin   0
0     1   0     0
sin  0   cos   0
0     0   0     1
`)

var rotateZ = strings.Fields(`
cos  sin   0   0
-sin   cos   0   0
0     0     1   0
0     0     0   1
`)

var scale = strings.Fields(`
x     0    0    0
0     y    0    0
0     0    z    0
0     0    0    1
`)

var translate = strings.Fields(`
1     0    0    0
0     1    0    0
0     0    1    0
x     y    z    1
`)

var clone = strings.Fields(`
1     0    0    0
0     1    0    0
0     0    1    0
0     0    0    1
`)

var multiply = strings.Fields(`
b00 b10 b20 b30
b01 b11 b21 b31
b02 b12 b22 b32
b03 b13 b23 b33
`)

var tmpl = template.Must(template.New("script").Parse(`
function rotateX(m, src, dst, angle) {
  var cos = Math.cos(angle)
  var sin = Math.sin(angle)
{{ call .gen .rotateX true }}
}

function rotateY(m, src, dst, angle) {
  var cos = Math.cos(angle)
  var sin = Math.sin(angle)
{{ call .gen .rotateY true }}
}

function rotateZ(m, src, dst, angle) {
  var cos = Math.cos(angle)
  var sin = Math.sin(angle)
{{ call .gen .rotateZ true }}
}

function scale(m, src, dst, x, y, z) {
{{ call .gen .scale true }}
}

function translate(m, src, dst, x, y, z) {
{{ call .gen .translate true }}
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
{{ call .gen .multiply true }}
}

function clone(m, src, dst) {
{{ call .gen .clone false }}
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
`))

func main() {
	data := map[string]interface{}{
    "gen": gen,
    "rotateX": rotateX,
	  "rotateY": rotateY,
	  "rotateZ": rotateZ,
    "scale": scale,
    "translate": translate,
    "clone": clone,
    "multiply": multiply,
  }
  err := tmpl.Execute(os.Stdout, data)
  fmt.Fprintln(os.Stderr, err)
}


type index struct {
  row, col int
}
func (i index) rowMajor() int {
  return i.row * 4 + i.col
}
func (i index) colMajor() int {
  return i.col * 4 + i.row
}

type mult struct {
  a, b index
  multiplier string
}

type op struct {
  mults []mult
  index
}

func gen(matrix []string, optimize bool) string {
  // Track which indices of the source matrix are used,
  // in order to generate assignments to temporary variables for them.
  vars := map[index]int{}
  // Track all the multiplications.
  ops := []op{}

  // Iterate over the rows/cols of a 4x4 matrix.
	for col := 0; col < 4; col++ {
    for row := 0; row < 4; row++ {

      var mults []mult
			for j := 0; j < 4; j++ {

        a := index{row, j}
        b := index{j, col}
				multiplier := matrix[b.colMajor()]

        // Drop multiplicates by zero.
				if multiplier == "0" {
					continue
				}
				mults = append(mults, mult{a, b, multiplier})
			}

      p := index{row, col}
      ops = append(ops, op{mults, p})
		}
	}

  if optimize {
    min := []op{}
    for _, op := range ops {
      // If the operations constructed above resulted in a single item being
      // multiplied by 1, then this operation can be dropped completely.
      if len(op.mults) == 1 && op.mults[0].multiplier == "1" {
        continue
      }
      min = append(min, op)

      // Generate code for multiplication and addition.
      for _, m := range op.mults {
        vars[m.a]++
      }
    }
    ops = min
  }

  // Generate assignments to temporary variables.
  out := ""
  for k, v := range vars {
    if v > 1 {
      out += fmt.Sprintf("  var z%d%d = m[src + %d]\n", k.col, k.row, k.colMajor())
    }
  }

  for _, op := range ops {

    var s []string
    for _, m := range op.mults {
      var src string
      if vars[m.a] > 1 {
        src = fmt.Sprintf("z%d%d", m.a.col, m.a.row)
      } else {
        src = fmt.Sprintf("m[src + %d]", m.a.colMajor())
      }

      if m.multiplier == "1" {
        s = append(s, src)
      } else {
        s = append(s, fmt.Sprintf("%s * %s", src, m.multiplier))
      }
    }

    out += fmt.Sprintf("  m[dst + %d] = %s\n", op.index.colMajor(), strings.Join(s, " + "))
  }
  out = strings.TrimSuffix(out, "\n")
  return out
}
