'use strict';

var _ = require('lodash');

var Entity      = require('../entity');
var Tree        = require('../elements/tree');
var MergedTrees = require('../elements/merged-trees');
var Shop        = require('../elements/shop');

module.exports = function (arena, options) {

  var overloadedMaterials = {};

  arena.on('set:terrain', function () {

    var teamVisions = new Int32Array(32);
    teamVisions[0] = 1;

    var entities = new Float32Array(3 * 128);

    options = _.merge({

      gridDiviser    : 5,
      sightDistance  : 60,
      unvisitedColor : new THREE.Color(0.03, 0.03, 0.03),
      visitedColor   : new THREE.Color(0.3, 0.3, 0.3),
      visitedistance : 4

    }, options);

    var worldMax  = arena.ground.boundingBoxNormalized.max;

    var size      = {
      width:  worldMax.x,
      height: worldMax.z
    };

    var gridSize  = {
      width:  Math.round(size.width  / options.gridDiviser),
      height: Math.round(size.height / options.gridDiviser)
    };

    var teamVisited = {
      0: new Uint8Array(gridSize.width * gridSize.height * 4),
      1: new Uint8Array(gridSize.width * gridSize.height * 4)
    };

    var textureVisitedByTeam1 = new THREE.DataTexture(teamVisited[0], gridSize.width, gridSize.height, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter, 1);
    var textureVisitedByTeam2 = new THREE.DataTexture(teamVisited[1], gridSize.width, gridSize.height, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter, 1);

    textureVisitedByTeam1.needsUpdate = true;
    textureVisitedByTeam2.needsUpdate = true;

    function overloadMaterial (oldMaterial, shaderOptions) {

      shaderOptions = shaderOptions || {
        showProximity: true,
        showVisited:   false
      };

      var uniforms = {};

      var uniformsShaderChunk = [
          'varying vec4 worldPosition;',
      ];
      if (shaderOptions.showProximity || shaderOptions.showVisited) {

        uniforms['teamVisions'] = { type: 'iv1',  value: teamVisions };

        uniformsShaderChunk.push('uniform int teamVisions[32];');
      }

      /* */
      var mapShaderChunk = [];
      if (oldMaterial.map) {

        uniforms['textureRepeat'] = { type: 'v2', value: oldMaterial.map.repeat };

        uniformsShaderChunk.push('uniform vec2 textureRepeat;');

        mapShaderChunk = [
          '   // use map',
          '   vec4 texelColor = texture2D( map, vUv * textureRepeat );',
          '',
          '   #ifdef GAMMA_INPUT',
          '       texelColor.xyz *= texelColor.xyz;',
          '   #endif',
          '',
          '   gl_FragColor.xyz = gl_FragColor.xyz * texelColor.xyz;',
          '',
          '   #ifdef GAMMA_OUTPUT',
          '       gl_FragColor.xyz = sqrt( gl_FragColor.xyz );',
          '   #endif',
          '',
        ];
      }
      /* */

      var proximityShaderChunk = [];
      if (shaderOptions.showProximity) {

        uniforms['entities']       = { type: 'fv',  value: entities };
        uniforms['entitiesCount']  = { type: 'i',   value: arena.entities.length };
        uniforms['sightDistance']  = { type: 'f',   value: options.sightDistance };
        uniforms['unvisitedColor'] = { type: 'c',   value: options.unvisitedColor };

        uniformsShaderChunk.push('#define MAX_ENTITIES 10');
        uniformsShaderChunk.push('uniform vec3 entities[' + (entities.length / 3) + '];');
        uniformsShaderChunk.push('uniform int entitiesCount;');
        uniformsShaderChunk.push('uniform float sightDistance;');
        uniformsShaderChunk.push('uniform vec3 unvisitedColor;');

        proximityShaderChunk = [
            '    vec4 unvisitedFragColor = gl_FragColor * vec4( unvisitedColor, 1.0 );',
            ! shaderOptions.showVisited ? '' : '    vec4 visitedFragColor = gl_FragColor * vec4( visitedColor, 1.0 );',

            '',
            '    // by default, set to darkest (unvisited),',
            '    gl_FragColor = unvisitedFragColor;',
            '',
            '    // color at entities proximity',
            '    for ( int i = 0; i <= MAX_ENTITIES; ++i ) {',
            '        if (i > entitiesCount) break;',
            '',
            '        // check teams',
            '        if ( int(entities[i].y) == 0 && teamVisions[0] == 0 ) continue;',
            '        if ( int(entities[i].y) == 1 && teamVisions[1] == 0 ) continue;',
            '',
            '        // adjust color by distance',
            '        float dist = smoothstep(1.0, 4.0, sightDistance / distance( worldPosition.xz, entities[i].xz ) ) * 10.0;',
            '        gl_FragColor = max( gl_FragColor, max( unvisitedFragColor, unvisitedFragColor * dist ) );',
            '    }',
            '',
        ];
      }

      var visitedShaderChunk = [];
      if (shaderOptions.showVisited) {

        uniforms['visitedByTeam1'] = { type: 't', value: textureVisitedByTeam1 };
        uniforms['visitedByTeam2'] = { type: 't', value: textureVisitedByTeam2 };
        uniforms['visitedColor']   = { type: 'c', value: options.visitedColor  };

        uniformsShaderChunk.push('uniform sampler2D visitedByTeam1;');
        uniformsShaderChunk.push('uniform sampler2D visitedByTeam2;');
        uniformsShaderChunk.push('uniform vec3 visitedColor;');

        visitedShaderChunk = [
            '    vec4 visCell;',
            '',
            shaderOptions.showProximity ? '' : '    vec4 visitedFragColor = gl_FragColor * vec4( visitedColor, 1.0 );',
            '',
            '    // color at visited grid cells (team 1)',
            '    if ( teamVisions[0] > 0 ) {',
            '        visCell = texture2D( visitedByTeam1, vUv );',
            '        gl_FragColor = max( gl_FragColor, visCell * visitedFragColor );',
            '    }',
            '',
            '    // color at visited grid cells (team 2)',
            '    if ( teamVisions[1] > 0 ) {',
            '        visCell = texture2D( visitedByTeam2, vUv );',
            '        gl_FragColor = max( gl_FragColor, visCell * visitedFragColor );',
            '    }',
            '',
        ];
      }

      /*
      var _material = new THREE.ShaderMaterial({

        uniforms: uniforms,

        fragmentShader: [

          'uniform vec3 diffuse;',

          uniformsShaderChunk.join('\n'),

          'void main() {',
          '   gl_FragColor = vec4( diffuse, 0.0 );',

              mapShaderChunk.join('\n'),

              proximityShaderChunk.join('\n'),

              visitedShaderChunk.join('\n'),

        '}'
        ].join('\n'),

        vertexShader: [

          'varying vec2 vUv;',
          'varying vec4 worldPosition;',
          '',
          'void main() {',
          '',
          '    vUv = uv;',
          '',
          '    worldPosition = modelMatrix * vec4( position, 1.0 );',
          '',
          '    vec3 objectNormal = normal;',
          '',
          '    vec3 transformedNormal = normalMatrix * objectNormal;',
          '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
          '',
          '    gl_Position = projectionMatrix * mvPosition;',
          '',
          '    vec3 worldNormal = mat3( modelMatrix[ 0 ].xyz, modelMatrix[ 1 ].xyz, modelMatrix[ 2 ].xyz ) * objectNormal;',
          '    worldNormal = normalize( worldNormal );',
          '    vec3 cameraToVertex = normalize( worldPosition.xyz - cameraPosition );',
          '',
          '}'

        ].join('\n')
      });
      */



      var FogOfWarShader = {

        uniforms: THREE.UniformsUtils.merge( [

          THREE.UniformsLib[ 'common' ],
          THREE.UniformsLib[ 'bump' ],
          THREE.UniformsLib[ 'normalmap' ],
          THREE.UniformsLib[ 'fog' ],
          THREE.UniformsLib[ 'lights' ],
          THREE.UniformsLib[ 'shadowmap' ],

          {
            'ambient'  : { type: 'c',  value: new THREE.Color( 0xffffff ) },
            'emissive' : { type: 'c',  value: new THREE.Color( 0x000000 ) },
            'specular' : { type: 'c',  value: new THREE.Color( 0x000000 ) },
            'shininess': { type: 'f',  value: 30 },
            'wrapRGB'  : { type: 'v3', value: new THREE.Vector3( 1, 1, 1 ) }
          },

          uniforms

        ] ),

        vertexShader: [

          '#define PHONG',

          'varying vec4 worldPosition;',
          'varying vec3 vViewPosition;',
          'varying vec3 vNormal;',

          THREE.ShaderChunk[ 'map_pars_vertex' ],
          THREE.ShaderChunk[ 'lightmap_pars_vertex' ],
          THREE.ShaderChunk[ 'envmap_pars_vertex' ],
          THREE.ShaderChunk[ 'lights_phong_pars_vertex' ],
          THREE.ShaderChunk[ 'color_pars_vertex' ],
          THREE.ShaderChunk[ 'morphtarget_pars_vertex' ],
          THREE.ShaderChunk[ 'skinning_pars_vertex' ],
          THREE.ShaderChunk[ 'shadowmap_pars_vertex' ],
          THREE.ShaderChunk[ 'logdepthbuf_pars_vertex' ],

          'void main() {',

          ' vUv = uv;',
          // ' vUv = uv * offsetRepeat.zw + offsetRepeat.xy;',
          ' worldPosition = modelMatrix * vec4( position, 1.0 );',

            THREE.ShaderChunk[ 'map_vertex' ],
            THREE.ShaderChunk[ 'lightmap_vertex' ],
            THREE.ShaderChunk[ 'color_vertex' ],

            THREE.ShaderChunk[ 'morphnormal_vertex' ],
            THREE.ShaderChunk[ 'skinbase_vertex' ],
            THREE.ShaderChunk[ 'skinnormal_vertex' ],
            THREE.ShaderChunk[ 'defaultnormal_vertex' ],

          ' vNormal = normalize( transformedNormal );',

            THREE.ShaderChunk[ 'morphtarget_vertex' ],
            THREE.ShaderChunk[ 'skinning_vertex' ],
            THREE.ShaderChunk[ 'default_vertex' ],
            THREE.ShaderChunk[ 'logdepthbuf_vertex' ],

          ' vViewPosition = -mvPosition.xyz;',

            THREE.ShaderChunk[ 'worldpos_vertex' ],
            THREE.ShaderChunk[ 'envmap_vertex' ],
            THREE.ShaderChunk[ 'lights_phong_vertex' ],
            THREE.ShaderChunk[ 'shadowmap_vertex' ],

          '}'

        ].join('\n'),

        fragmentShader: [

          '#define PHONG',

          'uniform vec3 diffuse;',
          'uniform float opacity;',

          'uniform vec3 ambient;',
          'uniform vec3 emissive;',
          'uniform vec3 specular;',
          'uniform float shininess;',

          THREE.ShaderChunk[ 'color_pars_fragment' ],
          THREE.ShaderChunk[ 'map_pars_fragment' ],
          THREE.ShaderChunk[ 'alphamap_pars_fragment' ],
          THREE.ShaderChunk[ 'lightmap_pars_fragment' ],
          THREE.ShaderChunk[ 'envmap_pars_fragment' ],
          THREE.ShaderChunk[ 'fog_pars_fragment' ],
          THREE.ShaderChunk[ 'lights_phong_pars_fragment' ],
          THREE.ShaderChunk[ 'shadowmap_pars_fragment' ],
          THREE.ShaderChunk[ 'bumpmap_pars_fragment' ],
          THREE.ShaderChunk[ 'normalmap_pars_fragment' ],
          THREE.ShaderChunk[ 'specularmap_pars_fragment' ],
          THREE.ShaderChunk[ 'logdepthbuf_pars_fragment' ],

          uniformsShaderChunk.join('\n'),

          'void main() {',

          ' gl_FragColor = vec4( vec3( 1.0 ), opacity );',

            THREE.ShaderChunk[ 'logdepthbuf_fragment' ],

            // THREE.ShaderChunk[ 'map_fragment' ],

            mapShaderChunk.join('\n'),
            proximityShaderChunk.join('\n'),
            visitedShaderChunk.join('\n'),

            THREE.ShaderChunk[ 'alphamap_fragment' ],
            THREE.ShaderChunk[ 'alphatest_fragment' ],
            THREE.ShaderChunk[ 'specularmap_fragment' ],
            THREE.ShaderChunk[ 'lights_phong_fragment' ],
            THREE.ShaderChunk[ 'lightmap_fragment' ],
            THREE.ShaderChunk[ 'color_fragment' ],
            THREE.ShaderChunk[ 'envmap_fragment' ],
            THREE.ShaderChunk[ 'shadowmap_fragment' ],
            THREE.ShaderChunk[ 'linear_to_gamma_fragment' ],
            THREE.ShaderChunk[ 'fog_fragment' ],

          '}'

        ].join('\n')

      };

      var _uniforms = THREE.UniformsUtils.clone(FogOfWarShader.uniforms);

      var material = new THREE.ShaderMaterial({
        fragmentShader: FogOfWarShader.fragmentShader,
        vertexShader: FogOfWarShader.vertexShader,
        fog: oldMaterial.fog,
        uniforms: _uniforms,
        lights: true,
      });

      if (oldMaterial.alphaMap) {
        _uniforms.alphaMap.value  = oldMaterial.alphaMap;
      }
      if (oldMaterial.alphaTest) {
        _uniforms.alphaTest.value = oldMaterial.alphaTest;
      }
      if (oldMaterial.ambient) {
        _uniforms.ambient.value   = oldMaterial.ambient;
      }
      if (oldMaterial.specular) {
        // _uniforms.specular.value  = oldMaterial.specular;
      }
      if (oldMaterial.bumpMap) {
        material.bumpMap = true;
        _uniforms.bumpMap.value   = oldMaterial.bumpMap;
      }
      if (oldMaterial.bumpScale) {
        _uniforms.bumpScale.value = oldMaterial.bumpScale;
      }
      if (oldMaterial.normalMap) {
        material.normalMap = true;
        _uniforms.normalMap.value   = oldMaterial.normalMap;
      }
      if (oldMaterial.normalScale) {
        _uniforms.normalScale.value = oldMaterial.normalScale;
      }
      if (oldMaterial.emissive) {
        _uniforms.emissive.value  = oldMaterial.emissive;
      }
      if (oldMaterial.envMap) {
        _uniforms.envMap.value    = oldMaterial.envMap;
      }
      if (oldMaterial.lightMap) {
        _uniforms.lightMap.value  = oldMaterial.lightMap;
      }
      if (oldMaterial.map) {
        material.map = _uniforms.map.value = oldMaterial.map;
      }

      // console.log(material.uniforms);
      // console.log(material.fragmentShader);

      return material;
    }

    function patchObject3D (object, shaderOptions) {
      var material;
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          if (overloadedMaterials[child.material.uuid]) {
            child.material = overloadedMaterials[child.material.uuid];
          } else {
            material = child.material = overloadedMaterials[child.material.uuid] = overloadMaterial(child.material, shaderOptions);
          }
          child.material.needsUpdate = true;
        }
      });
      return material;
    }


    //  'added:entity'

    arena.on('added:static', function (object) {
      if (object instanceof Tree || object instanceof MergedTrees) {
        patchObject3D(object);
      }
    });

    var groundMaterial = patchObject3D(arena.ground, {
      showProximity: true,
      showVisited:   true
    });

    var patchedObjects = [  ]
                          .concat(arena.findAllByClass(Shop))
                          .concat(arena.findAllByClass(Tree))
                          // .concat(arena.findAllByClass(Entity))
                          ;

    _.each(patchedObjects, patchObject3D);







    function updateFOWs_seeTeam1Vision(value) {
      _.each(overloadedMaterials, function (m) {
        m.uniforms.teamVisions.value[0] = value;
      });
    }
    function updateFOWs_seeTeam2Vision(value) {
      _.each(overloadedMaterials, function (m) {
        m.uniforms.teamVisions.value[1] = value;
      });
    }
    function updateFOWs_sightDistance(value) {
      _.each(overloadedMaterials, function (m) {
        m.uniforms.sightDistance.value = value;
      });
    }
    function updateFOWs_unvisitedColor(c) {
      _.each(overloadedMaterials, function (m) {
        if (! m.uniforms.unvisitedColor) { return; }
        m.uniforms.unvisitedColor.value.r = c;
        m.uniforms.unvisitedColor.value.g = c;
        m.uniforms.unvisitedColor.value.b = c;
      });
    }
    function updateFOWs_visitedColor(c) {
      _.each(overloadedMaterials, function (m) {
        if (! m.uniforms.visitedColor) { return; }
        m.uniforms.visitedColor.value.r = c;
        m.uniforms.visitedColor.value.g = c;
        m.uniforms.visitedColor.value.b = c;
      });
    }

    // gui
    if (arena.gui) {

      var f = arena.gui.addFolder('Fog of war');
      f.add({ value: true  }, 'value').name('Team 1 vision').listen().onChange(updateFOWs_seeTeam1Vision);
      f.add({ value: false }, 'value').name('Team 2 vision').listen().onChange(updateFOWs_seeTeam2Vision);
      f.add(groundMaterial.uniforms.sightDistance, 'value', 0, 300).name('Sight distance').listen()
        .onChange(updateFOWs_sightDistance);
      f.add(options, 'visitedistance', Math.round(options.visitedistance / 5), Math.round(options.visitedistance * 10)).name('Visited distance').listen();
      f.add({ value: options.unvisitedColor.r }, 'value', 0, 1).name('Unvisited color').listen()
        .onChange(updateFOWs_unvisitedColor);
      f.add({ value: options.visitedColor.r }, 'value', 0, 1).name('Visited color').listen()
        .onChange(updateFOWs_visitedColor);
    }

    // arena.on('added:static', patchObject3D);


    arena.on('update', function () {

      setTimeout(function () {
        _.each(arena.entities, function (e, i) {

          // update each entities current position
          var j = i * 3;
          entities[j  ] = e.position.x;
          entities[j+1] = e.state.team;
          entities[j+2] = e.position.z;

          // update visited cells
          var loc = arena.inTerrainDatum(e.position);
          var x = Math.round(loc.x / options.gridDiviser);
          var y = Math.round(loc.z / options.gridDiviser);

          for (var sx = Math.max(0, x-options.visitedistance); sx < Math.min(gridSize.width, x+options.visitedistance); sx++) {
            for (var sy = Math.max(0, y-options.visitedistance); sy < Math.min(gridSize.width, y+options.visitedistance); sy++) {
              var index = 4 * sx + 4 * sy * gridSize.height;
              // console.log('mark cell', index, ' '+sx+';'+sy, 'as visited');
              var teamIndex = e.state.team || 0;
              teamVisited[teamIndex][index]   = 255;
              teamVisited[teamIndex][index+1] = 255;
              teamVisited[teamIndex][index+2] = 255;
              teamVisited[teamIndex][index+3] = 255;
            }
          }
        });

        // update entities count
        _.each(overloadedMaterials, function (m) {
          if (m.uniforms.entitiesCount) {
            m.uniforms.entitiesCount.value = arena.entities.length;
          }
          if (m.uniforms.visitedByTeam1) {
            m.uniforms.visitedByTeam1.value.needsUpdate = true;
            m.uniforms.visitedByTeam2.value.needsUpdate = true;
          }
        });

        // update shader
        textureVisitedByTeam1.needsUpdate = true;
        textureVisitedByTeam2.needsUpdate = true;

      });
    }, 5);

  });

};


function nearestPow2 (aSize) {
  return Math.pow(2, Math.round(Math.log(aSize) / Math.log(2)));
}
