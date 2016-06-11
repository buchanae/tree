
function Showcase(tree, container) {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor(0xffffff);
  container.appendChild( renderer.domElement );

  scene.add(tree);

  scene.add( new THREE.AmbientLight( 0x666666 ) );

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
  directionalLight.position.set( 3, 10, 1 ).normalize();
  scene.add( directionalLight );

  camera.position.x = 0;
  camera.position.y = 5;
  camera.position.z = 30;
  camera.lookAt(new Vec(0, 20, 0));

  // Top down
  // camera.position.x = 0;
  // camera.position.y = 20;
  // camera.position.z = 0;
  // camera.lookAt(new Vec(0, 0, 0));

  setInterval(function() {
    tree.rotation.y += 0.05;
  }, 50);


  function render() {
    requestAnimationFrame( render );
    renderer.render( scene, camera );
  }
  render();
}
