var vertexShader = `
#define LAMBERT

varying vec3 vLightFront;

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <bsdfs>
#include <lights_pars>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

attribute vec4 transform1;
attribute vec4 transform2;
attribute vec4 transform3;
attribute vec4 transform4;

attribute vec4 local1;
attribute vec4 local2;
attribute vec4 local3;
attribute vec4 local4;

void main() {

  mat4 transform = mat4(transform1, transform2, transform3, transform4);
  mat4 local = mat4(local1, local2, local3, local4);

	//vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	//vUv2 = uv2;

	vColor.xyz = color.xyz;
  vec3 objectNormal = vec3( normal );

	//#include <morphnormal_vertex>
	//#include <skinbase_vertex>
	//#include <skinnormal_vertex>

  vec4 nt = modelMatrix * transform * local * vec4(normalMatrix * objectNormal, 1.0);
  vec3 transformedNormal = nt.xyz;

  vec4 t = transform * local * vec4(position, 1.0);
  //vec3 transformed = t.xyz;

	//#include <morphtarget_vertex>
	//#include <skinning_vertex>

  vec4 mvPosition = modelViewMatrix * t;
  gl_Position = projectionMatrix * mvPosition;

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vec4 worldPosition = modelMatrix * t;

	#include <envmap_vertex>
	#include <lights_lambert_vertex>
	#include <shadowmap_vertex>
}
`

var depthShader = `
#include <common>
#include <uv_pars_vertex>
#include <clipping_planes_pars_vertex>

attribute vec4 transform1;
attribute vec4 transform2;
attribute vec4 transform3;
attribute vec4 transform4;

attribute vec4 local1;
attribute vec4 local2;
attribute vec4 local3;
attribute vec4 local4;

void main() {
  mat4 transform = mat4(transform1, transform2, transform3, transform4);
  mat4 local = mat4(local1, local2, local3, local4);

	//#include <uv_vertex>
  //#include <beginnormal_vertex>

  //vec4 nt = transform * local * vec4(normalMatrix * objectNormal, 1.0);
  //vec3 transformedNormal = nt.xyz;

	//#include <displacementmap_vertex>

  vec4 t = transform * local * vec4(position, 1.0);

  vec4 mvPosition = modelViewMatrix * t;
  gl_Position = projectionMatrix * mvPosition;

	//#include <clipping_planes_vertex>
}

`

var depthFrag = `

#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {
	gl_FragColor = vec4( 1, 1, 1, 0 );
}
`
