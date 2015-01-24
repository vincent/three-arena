'use strict';

var _ = require('lodash');

module.exports = Selection;


/**
 * @exports threearena/controls/selection
 * 
 * @constructor
 */
function Selection (options) {

  var _selected = [];

  var _selectionTextureOptions = {
    vertexShader:   document.getElementById( 'glow_vertexshader'   ).textContent,
    fragmentShader: document.getElementById( 'glow_fragmentshader' ).textContent,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  };

  var _backup = function (mesh) {
    for (var o in _selectionTextureOptions) {
      mesh._select_backup
    }
  }

  var _select = function (mesh) {
        intersects[0].object.material.ambient = new THREE.Color(1, .2, .2);
        intersects[0].object.material.vertexShader =   document.getElementById( 'glow_vertexshader'   ).textContent,
        intersects[0].object.material.fragmentShader = document.getElementById( 'glow_fragmentshader' ).textContent,
        //intersects[0].object.material.side = THREE.BackSide,
        intersects[0].object.material.blending = THREE.AdditiveBlending,
        intersects[0].object.material.transparent = true
    };

    this.game_materials = {
        hover: new THREE.ShaderMaterial( {
                uniforms: {  },
                vertexShader:   document.getElementById( 'glow_vertexshader'   ).textContent,
                fragmentShader: document.getElementById( 'glow_fragmentshader' ).textContent,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            } )
    };
}