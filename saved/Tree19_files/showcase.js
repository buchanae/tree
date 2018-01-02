// Camera object focus/look at controls
// consider
// - aspect ratio
// -

/*
Suppose we had a method camera.focusOn( object ). How would that method work?

Would it move the camera? To where? Would it change the camera field-of-view? The zoom? The rotation? Would it change all four properties? What are the constraints on camera movement/orientation? Note that OrbitControls has constraint parameters. What happens if the solution violates those constraints? etc. etc. etc...

With objects that have skewed proportions (very wide relative to height, vice versa) the bounding
sphere would be less than ideal?
*/

var CameraFitUtils = {
  // TODO could replace "bbox" with "object" or "sphere" (bounding sphere)
  //      but I'm not familiar with the pros/cons of box vs sphere.
  //      I do feel that it's better not to ask for an object, because box/sphere
  //      is the minimum information needed.
  solvePosition(camera, bbox) {
    var fovRadians = Math.PI * (camera.fov / 360);
    var distance = (bbox.max.y / 2) / Math.tan(fovRadians);

    if (distance > camera.far) {
      console.warn("CameraFitUtils solved for a distance which is greater than the camera frustrum's far plane");
    }

    return new THREE.Vector3(0, bbox.max.y / 2, bbox.max.z + distance + 70);
  },

  solveFov(camera, object) {
    // var boundingSphere = object
    // // TODO in this case it's probably better to use the bounding sphere?.
    // var distance = camera.position
    // Math.arctan(bbox.max.y - bbox.min.y / camera.position.
  }
};

function Showcase(tree, opts, container) {
  var scene = new THREE.Scene();
  scene.add(tree);

  var viewerHeight, viewerWidth, aspectRatio;
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xeeeeee);
  container.appendChild( renderer.domElement );

  function updateSize() {
    viewerHeight = container.clientHeight;
    viewerWidth = container.clientWidth;
    aspectRatio = viewerWidth / viewerHeight;
    renderer.setSize(viewerWidth, viewerHeight);
  }
  updateSize();

  var bboxHelper = new THREE.BoxHelper(tree, 0x00ff00);
  bboxHelper.update();
  scene.add(bboxHelper);

  var camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);

  camera.position.set(0, 20, 40);
  camera.lookAt(new THREE.Vector3(0, 20, 0));

  // camera.position.y = bbox.max.y * 0.1;
  // camera.position.y = bbox.max.y;
  // camera.lookAt(new Vec(0, bbox.max.y / 2 - 2, 0));

  // Top down
  // camera.position.x = 0;
  // camera.position.y = 20;
  // camera.position.z = 0;
  // camera.lookAt(new Vec(0, 0, 0));


  window.addEventListener('resize', updateSize);

  scene.add( new THREE.AmbientLight( 0x666666 ) );
  var directionalLight = new THREE.DirectionalLight( 0xffffff, opts.lightIntensity );
  directionalLight.position.set( 20, 100, 80 ).normalize();
  scene.add( directionalLight );



  function fit() {
    // TODO doesn't work for growing
     //var bbox = new THREE.Box3();
     //bbox.setFromObject(tree);
     //var position = CameraFitUtils.solvePosition(camera, bbox);
     //camera.position.copy(position);
  }

  function play() {
    if (opts.play) {
      requestAnimationFrame(play);
      render();
    }
  }

  function render() {
    renderer.render(scene, camera);
  }

  return {
    fit: fit,
    play: play,
    render: render,
  }
}
