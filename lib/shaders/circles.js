'use strict';

var inherits = require('inherits');

module.exports = CirclesShaderMaterial;

/**
 * @exports threearena/shaders/circles
 */
function CirclesShaderMaterial () {

  THREE.ShaderMaterial.apply(this, [ {
    shading: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    transparent: true,

    uniforms: {
      time: { type: 'f', value: 1.0 },
      resolution: { type: 'v2', value: new THREE.Vector2() }
    },
    vertexShader: '' +
      ' varying vec2 vUv;       ' +
      ' void main()             ' +
      ' {                       ' +
      '    vUv = uv;            ' +
      '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );   ' +
      '    gl_Position = projectionMatrix * mvPosition;                 ' +
      ' }',

    fragmentShader: '' +
      'uniform vec2 resolution;         ' +
      'uniform float time;              ' +
      'varying vec2 vUv;                ' +

      'vec2 center = vec2(0.5,0.5);     ' +
      'float speed = 0.5;               ' +
      'float invAr = resolution.y / resolution.x; ' +

      'void main(void) {                ' +
      '        vec2 position = vUv;     ' +

      ' vec2 uv = gl_FragCoord.xy * 1.0 / resolution.xy; ' + // screen space
      '        vec2 uv = 1.0 * position;    ' + // object face space

      '  vec3 col = vec4(uv,1,1).xyz;       ' +

      '  vec3 texcol;                       ' +

      '  float x = (center.x-uv.x);         ' +
      '  float y = (center.y-uv.y) *invAr;  ' +

      '   float r = -sqrt(x*x + y*y); /* uncoment this line to symmetric ripples */  ' +
      '  float r = -(x*x + y*y);            ' +
      '  float z = 0.5 + 0.5*sin((r+time*speed)/0.013); ' +

      '  texcol.x = z;                      ' +
      '  texcol.y = z;                      ' +
      '  texcol.z = z;                      ' +

      '   gl_FragColor = vec4(col*texcol,0.1);   ' +
      '  gl_FragColor = vec4(texcol,col);   ' +
      '} '
  }]);
}

inherits(CirclesShaderMaterial, THREE.ShaderMaterial);
