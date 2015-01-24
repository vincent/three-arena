'use strict';

var TWEEN = require('tween');
var inherits = require('inherits');

module.exports = LifebarShaderMaterial;

/**
 * @exports threearena/shaders/lifebar
 */
function LifebarShaderMaterial () {

  this.shaderOptions = {

    shading: THREE.AdditiveBlending,
    // side: THREE.DoubleSide,
    transparent: true,
    overdraw: 1.0,

    uniforms: {
      background: { type: 'c', value: new THREE.Color(0x000000) },

      bar1Color: { type: 'c', value: new THREE.Color(0xFF0000) },
      bar1Size: { type: 'f', value: 1.0 },
      bar1WarningSpeed: { type: 'f', value: 0.0 },

      bar2Color: { type: 'c', value: new THREE.Color(0x0000FF) },
      bar2Size: { type: 'f', value: 1.0 },
      bar2WarningSpeed: { type: 'f', value: 0.0 },

      time: { type: 'f', value: 1.0 },
      resolution: { type: 'v2', value: new THREE.Vector2() }
    },

    vertexShader: [
      'varying vec2 vUv;',
      'void main()',
      '{',
      '   vUv = uv;',
      '   vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
      '   gl_Position = projectionMatrix * mvPosition;',
      '}' ].join(''),

    fragmentShader: [
      'varying vec2 vUv;',
      'uniform float lifeWarning;',
      'uniform float manaWarning;',
      'uniform float warningSpeed;',

      'uniform float time;',
      'uniform vec2 mouse;',
      'uniform vec2 resolution;',

      'uniform vec4 background;',
      'uniform vec3 bar2Color;',
      'uniform float bar2Size;',
      'uniform vec3 bar1Color;',
      'uniform float bar1Size;',
      'uniform float bar2WarningSpeed;',
      'uniform float bar1WarningSpeed;',
      'float barWidth = 0.2;',

      'bool inBar2(float y, float border) {',
      '   return (y > 0.3 - barWidth - border && y < 0.1 + barWidth + border);',
      '}',

      'bool inBar1(float y, float border) {',
      '',
      '   return (y > (0.6 + border) && y < 0.6 + (barWidth - border));',
      '}',

      'void main( void ) {',
      '   vec4 background = vec4(1.0, 1.0, 1.0, 0.0);',
      '   vec3 bar2Color = vec3(0.0, 1.0, 0.0);',
      // + '   float bar2Size = 0.9;',
      '   vec3 bar1Color = vec3(0.0, 0.0, 1.0);',
      // + '   float bar1Size = 0.1;'
      // + '   float bar2WarningSpeed = 10.0;'
      // + '   float bar1WarningSpeed = 10.0;'
      '   float lifeWarning;',
      '   float manaWarning;',
      '   vec2 position = vUv;',

      '   float x = fract(position.x);',
      '   float y = fract(position.y);',

      '   vec4 color;',
      '   float opacity = sin(x);',

      '   if (inBar2(y, 0.02)) {',
      '       color = vec4(0, 0, 1, opacity)  *  x  /  (bar2Size - x);',
      '   }',
      '   else if (inBar2(y, 0.02)) {',
      '       color = vec4(sin(time * bar2WarningSpeed), 0, 0, 1.0 - manaWarning);',
      '   }',
      '   else if (inBar1(y, 0.02)) {',
      '       color = vec4(0, 1, 0, opacity)  *  x  /  (bar1Size - x);',
      '   }',
      '   else if (inBar1(y, 0.02)) {',
      '       color = vec4(sin(time * bar1WarningSpeed), 0, 0, 1.0 - lifeWarning);',
      '   }',
      '   else {',
      '       color = background;',
      '   }',

      '   gl_FragColor = color;',
      '} ' ].join('')
  };

  THREE.ShaderMaterial.apply(this, [ this.shaderOptions ]);
}

inherits(LifebarShaderMaterial, THREE.ShaderMaterial);

LifebarShaderMaterial.prototype.update = function(delta) {

  this.shaderOptions.uniforms.time.value = delta;
};

LifebarShaderMaterial.prototype.setLife = function(value) {

  // this.shaderOptions.uniforms.bar1Size.value = value;
  this.shaderOptions.uniforms.bar1WarningSpeed.value = (this.shaderOptions.uniforms.bar1Size.value < 0.3) ? 20 : 0;

  new TWEEN.Tween(this.shaderOptions.uniforms.bar1Size)
    .to({ value: value }, 100)
    .easing( TWEEN.Easing.Linear.None )
    .start();
};

LifebarShaderMaterial.prototype.setMana = function(value) {

  // this.shaderOptions.uniforms.bar2Size.value = value;
  this.shaderOptions.uniforms.bar2WarningSpeed.value = (this.shaderOptions.uniforms.bar2Size.value < 0.3) ? 20 : 0;

  new TWEEN.Tween(this.shaderOptions.uniforms.bar2Size)
    .to({ value: value }, 100)
    .easing( TWEEN.Easing.Linear.None )
    .start();
};

