
function Renderer() {
  this.container = document.getElementById("container");
  this.container.innerHTML = ""
  this.renderer = new THREE.WebGLRenderer({ antialias: true })
  this.renderer.setClearColor(0xeeeeee)
  this.container.appendChild(this.renderer.domElement)

  viewerHeight = this.container.clientHeight;
  viewerWidth = this.container.clientWidth;
  aspectRatio = viewerWidth / viewerHeight;
  this.renderer.setSize(viewerWidth, viewerHeight);

  this.materials = {
    basic: new THREE.MeshBasicMaterial(),
    phong: new THREE.MeshPhongMaterial(),
    lambert: new THREE.MeshLambertMaterial(),
    standard: new THREE.MeshStandardMaterial(),
    toon: new THREE.MeshToonMaterial(),
    physical: new THREE.MeshPhysicalMaterial(),
    depth: new THREE.MeshDepthMaterial(),
  }
  this.geometries = {
    cylinder: new THREE.CylinderBufferGeometry(1, 1, 1, 5, 2, false),
    sphere: new THREE.SphereBufferGeometry(1, 1, 1),
    box: new THREE.BoxBufferGeometry(1, 1, 1),
  }
}


Renderer.prototype.Render = function(groups) {
  var scene = new THREE.Scene()
  var tree = new THREE.Group()
  scene.add(tree)

  /*
  var testgeo = new THREE.BoxGeometry(1, 1, 1)
  var testmat = new THREE.MeshLambertMaterial();
  var testmesh = new THREE.Mesh(testgeo, testmat)
  testmesh.position.x = 5;
  testmesh.position.y = 15;
  testmesh.rotation.y = -0.5;
  tree.add(testmesh)
  */

  for (var i = 0; i < groups.length; i++) {
    var group = groups[i]
    var geo = this.geometries[group.geometry]

    // Instances geometry provides a performance boost by reusing
    // a single geometry for multiple instances.
    var inst = new THREE.InstancedBufferGeometry()
    inst.index = geo.index
    inst.attributes.position = geo.attributes.position
    inst.attributes.uv = geo.attributes.uv

    // Add per-instance attributes, such as transform, color, etc.
    var color = new THREE.InstancedBufferAttribute(group.color, 3)
    inst.addAttribute("color", color)

    var transform = new THREE.InstancedInterleavedBuffer(group.transform, 16)
    // THREE has no support for a mat4 vertex attribute, so have to hack it
    // into four separate vec4s
    inst.addAttribute("transform1",
      new THREE.InterleavedBufferAttribute(transform, 4, 0, false))
    inst.addAttribute("transform2",
      new THREE.InterleavedBufferAttribute(transform, 4, 4, false))
    inst.addAttribute("transform3",
      new THREE.InterleavedBufferAttribute(transform, 4, 8, false))
    inst.addAttribute("transform4",
      new THREE.InterleavedBufferAttribute(transform, 4, 12, false))

    var local = new THREE.InstancedInterleavedBuffer(group.local, 16)
    // THREE has no support for a mat4 vertex attribute, so have to hack it
    // into four separate vec4s
    inst.addAttribute("local1",
      new THREE.InterleavedBufferAttribute(local, 4, 0, false))
    inst.addAttribute("local2",
      new THREE.InterleavedBufferAttribute(local, 4, 4, false))
    inst.addAttribute("local3",
      new THREE.InterleavedBufferAttribute(local, 4, 8, false))
    inst.addAttribute("local4",
      new THREE.InterleavedBufferAttribute(local, 4, 12, false))

    var mat = new THREE.ShaderMaterial({
      vertexColors: true,
      lights: true,
      //side:THREE.DoubleSide,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.common,
        THREE.UniformsLib.specularmap,
        THREE.UniformsLib.envmap,
        THREE.UniformsLib.aomap,
        THREE.UniformsLib.lightmap,
        THREE.UniformsLib.emissivemap,
        THREE.UniformsLib.lights,
        {
          //emissive: { value: new THREE.Color( 0x000000 ) },
        }
      ]),
      vertexShader: vertexShader,
      fragmentShader: THREE.ShaderChunk.meshlambert_frag
    })
    inst.computeVertexNormals()

    var mesh = new THREE.Mesh(inst, mat)
    mesh.frustumCulled = false
    tree.add(mesh)
  }

  scene.add( new THREE.AmbientLight( 0xffffff, 0.2) );

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
  directionalLight.position.set( 20, 100, 80 ).normalize();
  scene.add( directionalLight );

  var camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10000 )
  camera.position.y = 400
  camera.position.z = 950

  //camera.zoom = 2
  var lookat = new THREE.Vector3(0, 370, 0)
  camera.lookAt(lookat)

  //var controls = new THREE.OrbitControls( camera );
  //var controls = new THREE.FirstPersonControls(camera)
  //controls.movementSpeed = 10;
  //controls.lookSpeed = 0.1;
  //controls.activeLook = false

  var renderer = this.renderer
	//var clock = new THREE.Clock();
  tree.frustumCulled = false

  var dragging = false
  var previous = null

  this.container.addEventListener("mousedown", function(e) {
    dragging = true
    previous = e
  })
  this.container.addEventListener("mouseup", function() {
    dragging = false
    previous = null
  })
  this.container.addEventListener("mouseout", function() {
    dragging = false
    previous = null
  })

  this.container.addEventListener("mousewheel", function(e) {
    e.preventDefault()
    camera.position.z += Math.sign(e.deltaY) * 2
    if (camera.position.z < 10) {
      camera.position.z = 10
    }
  })

  this.container.addEventListener("mousemove", function(e) {
    if (dragging) {

      if (previous == null) {
        previous = e
        return
      }

      var dx = e.screenX - previous.screenX
      var dy = e.screenY - previous.screenY

      var direction
      if (Math.abs(dy) > Math.abs(dx)) {
        direction = "y"
      } else {
        direction = "x"
      }

      if (direction == "x") {
        tree.rotation.y += dx * 0.1
      } else {
        lookat.y += dy * 0.1
      }

      previous = e
    }
  })

  function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
    camera.lookAt(lookat)
  }
  animate()
}

