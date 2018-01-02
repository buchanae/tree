var container = document.getElementById("container");

var scene = new THREE.Scene()

//Create a WebGLRenderer and turn on shadows in the renderer
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xeeeeee)

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
container.appendChild(renderer.domElement)

viewerHeight = container.clientHeight;
viewerWidth = container.clientWidth;
aspectRatio = viewerWidth / viewerHeight;
renderer.setSize(viewerWidth, viewerHeight);


//Create a DirectionalLight and turn on shadows for the light
var light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
light.position.set( 1, 1, 1 ); 			//default; light shining from top
light.castShadow = true;            // default false
scene.add( light );

scene.add( new THREE.AmbientLight( 0xffffff, 0.2) );

//Set up shadow properties for the light
light.shadow.mapSize.width = 512;  // default
light.shadow.mapSize.height = 512; // default
light.shadow.camera.near = 0.5;    // default
light.shadow.camera.far = 500;     // default

//Create a sphere that cast shadows (but does not receive them)
var sphereGeometry = new THREE.SphereBufferGeometry( 5, 32, 32 );
var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
sphere.castShadow = true; //default is false
sphere.receiveShadow = false; //default
scene.add( sphere );

//Create a plane that receives shadows (but does not cast them)
var planeGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 32, 32 );
var planeMaterial = new THREE.MeshStandardMaterial( { color: 0x00ff00 } )
var plane = new THREE.Mesh( planeGeometry, planeMaterial );

plane.position.y = -2
plane.rotation.x = Math.PI * -0.5

plane.receiveShadow = true;
scene.add( plane );

//Create a helper for the shadow camera (optional)
var helper = new THREE.CameraHelper( light.shadow.camera );

var camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10000 )
camera.position.y = 10
camera.position.z = 30
camera.lookAt(new THREE.Vector3(0, 0, 0))

renderer.render(scene, camera)
