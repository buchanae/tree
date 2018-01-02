
function Renderer() {
  this.container = document.getElementById("container");
  this.container.innerHTML = ""
  this.renderer = new THREE.WebGLRenderer({ antialias: true })
  this.renderer.setClearColor(0xeeeeee)
  this.renderer.shadowMap.enabled = true;
  this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
  //this.renderer.shadowMap.type = THREE.PCFShadowMap;

  this.container.appendChild(this.renderer.domElement)

  viewerHeight = this.container.clientHeight;
  viewerWidth = this.container.clientWidth;
  aspectRatio = viewerWidth / viewerHeight;
  this.renderer.setSize(viewerWidth, viewerHeight);

  this.materials = {
    basic: new THREE.MeshBasicMaterial(),
    //phong: new THREE.MeshPhongMaterial(),
    lambert: new THREE.MeshLambertMaterial(),
    standard: new THREE.MeshStandardMaterial(),
    //toon: new THREE.MeshToonMaterial(),
    //physical: new THREE.MeshPhysicalMaterial(),
    //depth: new THREE.MeshDepthMaterial(),
  }
  this.geometries = {
    cylinder: new THREE.CylinderBufferGeometry(1, 1, 1, 15, 2, false),
    sphere: new THREE.SphereBufferGeometry(1, 1, 1),
    box: new THREE.BoxBufferGeometry(1, 1, 1),
  }
  this.mat = new THREE.ShaderMaterial({
    vertexColors: true,
    lights: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.common,
      THREE.UniformsLib.specularmap,
      THREE.UniformsLib.envmap,
      THREE.UniformsLib.aomap,
      THREE.UniformsLib.lightmap,
      THREE.UniformsLib.emissivemap,
      THREE.UniformsLib.lights,
      {
        emissive: { value: new THREE.Color( 0x000000 ) },
      }
    ]),
    vertexShader: vertexShader,
    fragmentShader: THREE.ShaderChunk.meshlambert_frag
  })
  this.depthMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge( [
      THREE.UniformsLib.common,
      THREE.UniformsLib.displacementmap,
      THREE.UniformsLib.specularmap,
      THREE.UniformsLib.envmap,
      THREE.UniformsLib.aomap,
      THREE.UniformsLib.lightmap,
      THREE.UniformsLib.emissivemap,
      THREE.UniformsLib.lights,
      {
        emissive: { value: new THREE.Color( 0x000000 ) },
      }
    ] ),

    vertexShader: depthShader,
    fragmentShader: depthFrag,
  })

  var scene = new THREE.Scene()
  var root = new THREE.Group()
  scene.add(root)
  var scale = 1
  //root.scale.set(scale, scale, scale)
  var tree = new THREE.Group()
  tree.scale.set(0.5, 0.5, 0.5)

  var camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10000 )
  var lookat = new THREE.Vector3(0, 50, 0)
  this.lookat = lookat
  camera.position.y = 100 * scale
  camera.position.z = 300 * scale

  scene.add(tree)
  root.add( new THREE.AmbientLight( 0xffffff, 0.4) );


  //Create a DirectionalLight and turn on shadows for the light
  var lightG = new THREE.Group()
  var light = new THREE.DirectionalLight( 0xffffff, 0.6 );
  light.position.set( 0, 50, 40 ); 			//default; light shining from top
  light.castShadow = true;            // default false
  lightG.rotation.y = 0.8
  setInterval(function() {
    lightG.rotation.y += 0.03
  }, 30)
  lightG.add(light)
  root.add( lightG );

  //Set up shadow properties for the light
  light.shadow.mapSize.width = 2000;  // default
  light.shadow.mapSize.height = 2000; // default
  light.shadow.camera.top = 150
  light.shadow.camera.right = 150
  light.shadow.camera.left = -150
  light.shadow.camera.bottom = -10
  light.shadow.camera.near = 0.01;    // default
  light.shadow.camera.far = 5000;     // default
  //light.shadow.bias = 0.001

  dirLightShadowMapViewer = new THREE.ShadowMapViewer( light );
  dirLightShadowMapViewer.position.x = 10;
  dirLightShadowMapViewer.position.y = 10;
  dirLightShadowMapViewer.size.width = 256;
  dirLightShadowMapViewer.size.height = 256;
  dirLightShadowMapViewer.update(); //Required when setting position or size directly
  this.dirLightShadowMapViewer = dirLightShadowMapViewer;

  var sphereGeometry = new THREE.SphereBufferGeometry( 500, 32, 32 );
  //var sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
  var sphere = new THREE.Mesh( sphereGeometry, this.mat );
  sphere.castShadow = true;
  sphere.receiveShadow = false;
  //tree.add( sphere );

  var planeGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 32, 32 );
  var planeMaterial = new THREE.MeshStandardMaterial( { color: 0x00ff00 } )
  var plane = new THREE.Mesh( planeGeometry, planeMaterial );
  plane.receiveShadow = true;
  plane.rotation.x = Math.PI * -0.5
  root.add( plane );

  this.camera = camera
  this.scene = scene
  this.tree = tree

  camera.lookAt(this.lookat)
  this.renderer.render(scene, camera)
}


Renderer.prototype.Render = function(groups) {

  var insts = []

  for (var i = 0; i < groups.length; i++) {
    var group = groups[i]
    var geo = this.geometries[group.geometry]

    // Instances geometry provides a performance boost by reusing
    // a single geometry for multiple instances.
    var inst = new THREE.InstancedBufferGeometry()
    insts.push(inst)
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

    inst.computeVertexNormals()

    var mesh = new THREE.Mesh(inst, this.mat)
    mesh.frustumCulled = false
    mesh.castShadow = true
    //mesh.receiveShadow = true
    mesh.customDepthMaterial = this.depthMat

    this.tree.add(mesh)
  }

  this.tree.frustumCulled = false

  var dragging = false
  var previous = null
  var scrollMult = 2
  var dragXMult = 0.1
  var dragYMult = 0.5

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
    camera.position.z += Math.sign(e.deltaY) * scrollMult
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
        tree.rotation.y += dx * dragXMult
      } else {
        lookat.y += dy * dragYMult
      }

      previous = e
    }
  })

  var renderer = this.renderer
  var scene = this.scene
  var tree = this.tree
  var camera = this.camera
  var lookat = this.lookat

  function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
    this.dirLightShadowMapViewer.render(renderer)
    camera.lookAt(lookat)
  }
  animate()
}

