var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


var tree = Version4();
scene.add(tree);

scene.add( new THREE.AmbientLight( 0x111111 ) );
var directionalLight = new THREE.DirectionalLight( /*Math.random() * */ 0xffffff);

directionalLight.position.x = 25;
directionalLight.position.y = 25;
directionalLight.position.z = 25;
// directionalLight.position.normalize();
scene.add( directionalLight );

camera.position.x = 0;
camera.position.y = 5;
camera.position.z = 10;
// camera.lookAt(new Vec(0, 0, 0));

// Top down
// camera.position.x = 0;
// camera.position.y = 20;
// camera.position.z = 0;
// camera.lookAt(new Vec(0, 0, 0));

// tree.rotation.y += Math.PI / 2;
setInterval(function() {
  // tree.rotation.y += 0.05;
  tree.rotateOnAxis(Y_AXIS, 0.05);
}, 50);


function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();
