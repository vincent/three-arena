'use strict';

var _ = require('lodash');

var FowMap = require('../textures/fog-of-war');

module.exports = function (arena) {

  arena.on('set:terrain', function () {

    var fowMap = new FowMap(
      arena.ground.boundingBoxNormalized.max.x,
      arena.ground.boundingBoxNormalized.max.z
    );



    document.getElementsByTagName('body')[0].appendChild(fowMap.canvas);
    fowMap.canvas.style.position = 'absolute';
    fowMap.canvas.style.right = '0';
    fowMap.canvas.style.top = '100px';


    // texture
    var texture = new THREE.Texture(fowMap.canvas);
    texture.needsUpdate = true; // important

    // uniforms
    var uniforms = {
      texture: { type: "t", value: texture }
    };

    // attributes
    var attributes = {
    };

    // material
    var material = new THREE.ShaderMaterial({
      attributes      : attributes,
      uniforms        : uniforms,
      vertexShader    : [ 'varying vec2 vUv;',
                          'varying vec3 vNormal;',
                          'varying vec3 vViewPosition;',

                          'void main() {',

                          '  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

                          '  vUv = uv;',
                          '  vNormal = normalize( normalMatrix * normal );',
                          '  vViewPosition = -mvPosition.xyz;',

                          '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

                          '}'
                        ].join('\n'),
      fragmentShader  : [ 'uniform sampler2D texture;',

                          'varying vec2 vUv;',
                          'varying vec3 vNormal;',
                          'varying vec3 vViewPosition;',

                          'void main() {',

                          '  vec4 tColor = texture2D( texture, vUv );',

                          // hack in a fake pointlight at camera location, plus ambient'
                          '  vec3 normal = normalize( vNormal );',
                          '  vec3 lightDir = normalize( vViewPosition );',

                          '  float dotProduct = max( dot( normal, lightDir ), 0.0 ) + 0.2;',

                          '  gl_FragColor = vec4( tColor.rgb, 1.0 ) * dotProduct;',
                          '} zefe'
                        ].join('\n'),

      overdraw: true,
      lights: true,
      fog: true
    });

    // arena.ground.children[0].children[0].material = material;
    // arena.ground.children[0].children[0].material.needsUpdate = true;

    arena.ground.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });


    // var shader = [
    //   '',
    //   '  vec4 fowtColor = texture2D( fowTexture, vUv );',
    //   '  float fowdotProduct = max( dot( normal, viewPosition ), 0.0 ) + 0.2;',
    //   '  gl_FragColor = vec4( fowtColor.rgb, 1.0 ) * fowdotProduct;',
    //   ''
    //   // '  gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor ); '
    // ].join('\n');

    // var originalMaterial = arena.ground.children[0].children[0].material;
    // originalMaterial.uniforms.fowTexture = { type: 't', value: texture };
    // originalMaterial.fragmentShader = 'uniform sampler2D fowTexture;' + '\n' + originalMaterial.fragmentShader;
    // originalMaterial.fragmentShader = originalMaterial.fragmentShader.replace(/}\s*$/, shader + '\n}');
    // originalMaterial.needsUpdate = true;
    // originalMaterial._fow = true;

    // arena.ground.children[0].children[0].material = originalMaterial;



    arena.on('update', function () {

      fowMap.render(
        _.map(arena.entities, function (e) {
          return arena.inTerrainDatum(e.position);
        })
      );

      texture.needsUpdate = true;
      material.needsUpdate = true;

    });

  });

};

