'use strict';

var TWEEN = require('tween');
var inherits = require('inherits');

module.exports = LifebarShaderMaterial;

/**
 * @exports threearena/shaders/lifebar
 */
function LifebarShaderMaterial () {

  var self = this;

  texLoader.then(function (texture) {
    self.shaderOptions.uniforms.baseImage.value = texture;
  });

  this.shaderOptions = {

    // shading: THREE.AdditiveBlending,
    // side: THREE.DoubleSide,
    transparent: true,
    overdraw: 0.1,

    uniforms: {
      baseImage:     { type: 't', value: null },

      lifeThreshold: { type: 'f', value: 0.5  },
      manaThreshold: { type: 'f', value: 0.5  },

      life:          { type: 'f', value: 1.0  },
      mana:          { type: 'f', value: 1.0  }
    },

    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      '   vUv = uv;',
      '   vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
      '   gl_Position = projectionMatrix * mvPosition;',
      '}'
    ].join('\n'),

    fragmentShader: [
      'varying vec2 vUv;',

      'uniform sampler2D baseImage;',
      'uniform float lifeThreshold;',
      'uniform float manaThreshold;',
      'uniform float life;',
      'uniform float mana;',

      'void main( void ) {',

      '   // use map',
      '   vec4 texelColor = texture2D( baseImage, vUv );',

      '   #ifdef GAMMA_INPUT',
      '     texelColor.xyz *= texelColor.xyz;',
      '   #endif',

      '   gl_FragColor.xyz = gl_FragColor.xyz * texelColor.xyz;',

      '   #ifdef GAMMA_OUTPUT',
      '     gl_FragColor.xyz = sqrt( gl_FragColor.xyz );',
      '   #endif',

      '   // in life bar',
      '   if ( texelColor.g >= lifeThreshold ) {',
      '     texelColor.a = ( life > vUv.x ) ? 1.0 : 0.5;',
      '   }',

      '   // in mana bar',
      '   if ( texelColor.b >= manaThreshold ) {',
      '     texelColor.a = ( mana > vUv.x ) ? 1.0 : 0.5;',
      '   }',

      '   gl_FragColor = texelColor;',
      '} '
    ].join('\n')
  };

  THREE.ShaderMaterial.apply(this, [ this.shaderOptions ]);
}

inherits(LifebarShaderMaterial, THREE.ShaderMaterial);

LifebarShaderMaterial.prototype.update = function(delta) {
  return;

  this.shaderOptions.uniforms.time.value = delta;
};

LifebarShaderMaterial.prototype.setLife = function(value) {

  // // this.shaderOptions.uniforms.bar1Size.value = value;
  // this.shaderOptions.uniforms.bar1WarningSpeed.value = (this.shaderOptions.uniforms.bar1Size.value < 0.3) ? 20 : 0;

  new TWEEN.Tween(this.shaderOptions.uniforms.life)
    .to({ value: value }, 100)
    .easing( TWEEN.Easing.Linear.None )
    .start();
};

LifebarShaderMaterial.prototype.setMana = function(value) {

  // // this.shaderOptions.uniforms.bar2Size.value = value;
  // this.shaderOptions.uniforms.bar2WarningSpeed.value = (this.shaderOptions.uniforms.bar2Size.value < 0.3) ? 20 : 0;

  new TWEEN.Tween(this.shaderOptions.uniforms.mana)
    .to({ value: value }, 100)
    .easing( TWEEN.Easing.Linear.None )
    .start();
};



var Promise   = require('bluebird');
var texLoader = new Promise(function(resolve) {
  var baseImage = THREE.ImageUtils.loadTexture('/gamedata/textures/lifebar.png', THREE.UVMapping, function (texture) {
    texture.needsUpdate = true;
    texture.magFilter   = THREE.LinearFilter;
    texture.minFilter   = THREE.LinearFilter;
    resolve(texture);
  });
});