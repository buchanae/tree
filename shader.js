var vertexShader = `
#define LAMBERT

varying vec3 vLightFront;

#ifdef DOUBLE_SIDED

	varying vec3 vLightBack;

#endif

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

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

  vec4 t = transform * local * vec4(position, 1.0);
  vec3 transformed = t.xyz;

	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );

	#include <envmap_vertex>
	#include <lights_lambert_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}
`
