'use strict';

var _       = require('lodash');

module.exports = function (arena) {

  arena.on('set:terrain', function () {

    var entities    = new Float32Array(3 * 100);

    var gridDiviser = 5;
    var worldMax    = arena.ground.boundingBoxNormalized.max;
    // var size        = nearestPow2(Math.max(worldMax.x, worldMax.z) / gridDiviser);

    var size        = {
      width:  worldMax.x,
      height: worldMax.z
    };

    var gridSize    = {
      width:  Math.round(size.width  / gridDiviser),
      height: Math.round(size.height / gridDiviser)
    };

    var teamVisited = {
      0: new Uint8Array(gridSize.width * gridSize.height * 4),
      1: new Uint8Array(gridSize.width * gridSize.height * 4)
    };


    // debug
    function glitchTexture () {
      var i = Math.round(Math.random() * teamVisited[0].length - 100);
      teamVisited[0][i]   = 255;
      teamVisited[0][i+1] = 255;
      teamVisited[0][i+2] = 255;
      teamVisited[0][i+3] = 255;
    }

    // glitchTexture();

    /* // material
    var material = new THREE.ShaderMaterial({

      uniforms: THREE.UniformsUtils.merge( [

        THREE.UniformsLib[ 'fog' ],
        THREE.UniformsLib[ 'lights' ],
        THREE.UniformsLib[ 'shadowmap' ],

        {

        'enableDiffuse1'    : { type: 'i', value: 1 },
        'enableDiffuse2'    : { type: 'i', value: 1 },
        'enableSpecular'    : { type: 'i', value: 0 },
        'enableReflection'  : { type: 'i', value: 0 },

        'tDiffuse1'         : { type: 't', value: null },
        'tDiffuse2'         : { type: 't', value: null },
        'tDiffuse3'         : { type: 't', value: null },
        'tDetail'           : { type: 't', value: null },
        'tNormal'           : { type: 't', value: null },
        'tSpecular'         : { type: 't', value: null },
        'tDisplacement'     : { type: 't', value: null },

        'uNormalScale'      : { type: 'f', value: 1.0 },

        'uDisplacementBias' : { type: 'f', value: 0.0 },
        'uDisplacementScale': { type: 'f', value: 0.0 },

        'ambientLightColor' : { type: 'fv', value: [ 200, 200, 200] },
        'diffuse'           : { type: 'c', value: new THREE.Color( 0xffffff ) },
        'specular'          : { type: 'c', value: new THREE.Color( 0xffffff ) },
        'ambient'           : { type: 'c', value: new THREE.Color( 0xffffff ) },
        'shininess'         : { type: 'f', value: 30 },
        'opacity'           : { type: 'f', value: 1 },

        'uRepeatBase'       : { type: 'v2', value: new THREE.Vector2( 1, 1 ) },
        'uRepeatOverlay'    : { type: 'v2', value: new THREE.Vector2( 1, 1 ) },

        'uOffset'           : { type: 'v2', value: new THREE.Vector2( 0, 0 ) }

        }

      ] ),

      fragmentShader: [

        '#define FOG_OF_WAR',

        'uniform vec3 ambient;',
        'uniform vec3 diffuse;',
        'uniform vec3 specular;',
        'uniform float shininess;',
        'uniform float opacity;',

        'uniform bool enableDiffuse1;',
        'uniform bool enableDiffuse2;',
        'uniform bool enableSpecular;',

        'uniform sampler2D tDiffuse1;',
        'uniform sampler2D tDiffuse2;',
        'uniform sampler2D tDiffuse3;',
        'uniform sampler2D tDetail;',
        'uniform sampler2D tNormal;',
        'uniform sampler2D tSpecular;',
        'uniform sampler2D tDisplacement;',

        'uniform float uNormalScale;',

        'uniform vec2 uRepeatOverlay;',
        'uniform vec2 uRepeatBase;',

        'uniform vec2 uOffset;',

        'varying vec3 vTangent;',
        'varying vec3 vBinormal;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',

        'uniform vec3 ambientLightColor;',

        '#if MAX_DIR_LIGHTS > 0',

          'uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];',
          'uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];',

        '#endif',

        '#if MAX_HEMI_LIGHTS > 0',

          'uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];',
          'uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];',
          'uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];',

        '#endif',

        '#if MAX_POINT_LIGHTS > 0',

          'uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];',
          'uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];',
          'uniform float pointLightDistance[ MAX_POINT_LIGHTS ];',

        '#endif',

        'varying vec3 vViewPosition;',

        THREE.ShaderChunk[ 'shadowmap_pars_fragment' ],
        THREE.ShaderChunk[ 'fog_pars_fragment' ],

        'void main() {',

          'gl_FragColor = vec4( vec3( 1.0 ), opacity );',

          'vec3 specularTex = vec3( 1.0 );',

          'vec2 uvOverlay = uRepeatOverlay * vUv + uOffset;',
          'vec2 uvBase = uRepeatBase * vUv;',

          'vec3 normalTex = texture2D( tDetail, uvOverlay ).xyz * 2.0 - 1.0;',
          'normalTex.xy *= uNormalScale;',
          'normalTex = normalize( normalTex );',

          'if( enableDiffuse1 && enableDiffuse2 ) {',

            'vec4 colDiffuse1 = texture2D( tDiffuse1, uvOverlay );',
            'vec4 colDiffuse2 = texture2D( tDiffuse2, uvOverlay );',

            '#ifdef GAMMA_INPUT',

              'colDiffuse1.xyz *= colDiffuse1.xyz;',
              'colDiffuse2.xyz *= colDiffuse2.xyz;',

            '#endif',

            // 'gl_FragColor = gl_FragColor * mix ( colDiffuse1, colDiffuse2, 1.0 - texture2D( tDisplacement, uvBase ) );',
            'gl_FragColor = gl_FragColor * texture2D( tDiffuse1, uvOverlay );',
            'gl_FragColor = gl_FragColor * texture2D( tDiffuse2, uvOverlay );',

          '} else if( enableDiffuse1 ) {',

            'gl_FragColor = gl_FragColor * texture2D( tDiffuse1, uvOverlay );',

          '} else if( enableDiffuse2 ) {',

            'gl_FragColor = gl_FragColor * texture2D( tDiffuse2, uvOverlay );',

          '}',

          'if( enableSpecular )',
            'specularTex = texture2D( tSpecular, uvOverlay ).xyz;',

          'mat3 tsb = mat3( vTangent, vBinormal, vNormal );',
          'vec3 finalNormal = tsb * normalTex;',

          'vec3 normal = normalize( finalNormal );',
          'vec3 viewPosition = normalize( vViewPosition );',

          // point lights

          '#if MAX_POINT_LIGHTS > 0',

            'vec3 pointDiffuse = vec3( 0.0 );',
            'vec3 pointSpecular = vec3( 0.0 );',

            'for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {',

              'vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );',
              'vec3 lVector = lPosition.xyz + vViewPosition.xyz;',

              'float lDistance = 1.0;',
              'if ( pointLightDistance[ i ] > 0.0 )',
                'lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );',

              'lVector = normalize( lVector );',

              'vec3 pointHalfVector = normalize( lVector + viewPosition );',
              'float pointDistance = lDistance;',

              'float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );',
              'float pointDiffuseWeight = max( dot( normal, lVector ), 0.0 );',

              'float pointSpecularWeight = specularTex.r * max( pow( pointDotNormalHalf, shininess ), 0.0 );',

              'pointDiffuse += pointDistance * pointLightColor[ i ] * diffuse * pointDiffuseWeight;',
              'pointSpecular += pointDistance * pointLightColor[ i ] * specular * pointSpecularWeight * pointDiffuseWeight;',

            '}',

          '#endif',

          // directional lights

          '#if MAX_DIR_LIGHTS > 0',

            'vec3 dirDiffuse = vec3( 0.0 );',
            'vec3 dirSpecular = vec3( 0.0 );',

            'for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {',

              'vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );',

              'vec3 dirVector = normalize( lDirection.xyz );',
              'vec3 dirHalfVector = normalize( dirVector + viewPosition );',

              'float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );',
              'float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );',

              'float dirSpecularWeight = specularTex.r * max( pow( dirDotNormalHalf, shininess ), 0.0 );',

              'dirDiffuse += directionalLightColor[ i ] * diffuse * dirDiffuseWeight;',
              'dirSpecular += directionalLightColor[ i ] * specular * dirSpecularWeight * dirDiffuseWeight;',

            '}',

          '#endif',

          // hemisphere lights

          '#if MAX_HEMI_LIGHTS > 0',

            'vec3 hemiDiffuse  = vec3( 0.0 );',
            'vec3 hemiSpecular = vec3( 0.0 );' ,

            'for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {',

              'vec4 lDirection = viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );',
              'vec3 lVector = normalize( lDirection.xyz );',

              // diffuse

              'float dotProduct = dot( normal, lVector );',
              'float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;',

              'hemiDiffuse += diffuse * mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );',

              // specular (sky light)

              'float hemiSpecularWeight = 0.0;',

              'vec3 hemiHalfVectorSky = normalize( lVector + viewPosition );',
              'float hemiDotNormalHalfSky = 0.5 * dot( normal, hemiHalfVectorSky ) + 0.5;',
              'hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfSky, shininess ), 0.0 );',

              // specular (ground light)

              'vec3 lVectorGround = -lVector;',

              'vec3 hemiHalfVectorGround = normalize( lVectorGround + viewPosition );',
              'float hemiDotNormalHalfGround = 0.5 * dot( normal, hemiHalfVectorGround ) + 0.5;',
              'hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfGround, shininess ), 0.0 );',

              'hemiSpecular += specular * mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight ) * hemiSpecularWeight * hemiDiffuseWeight;',

            '}',

          '#endif',

          // all lights contribution summation

          'vec3 totalDiffuse = vec3( 0.0 );',
          'vec3 totalSpecular = vec3( 0.0 );',

          '#if MAX_DIR_LIGHTS > 0',

            'totalDiffuse += dirDiffuse;',
            'totalSpecular += dirSpecular;',

          '#endif',

          '#if MAX_HEMI_LIGHTS > 0',

            'totalDiffuse += hemiDiffuse;',
            'totalSpecular += hemiSpecular;',

          '#endif',

          '#if MAX_POINT_LIGHTS > 0',

            'totalDiffuse += pointDiffuse;',
            'totalSpecular += pointSpecular;',

          '#endif',

          // 'gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient) + totalSpecular;',
          'gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient + totalSpecular );',

          THREE.ShaderChunk[ 'shadowmap_fragment' ],
          THREE.ShaderChunk[ 'linear_to_gamma_fragment' ],
          THREE.ShaderChunk[ 'fog_fragment' ],

        '}'

      ].join('\n'),

      vertexShader: [

        'attribute vec4 tangent;',

        'uniform vec2 uRepeatBase;',

        'uniform sampler2D tNormal;',

        'varying vec3 vTangent;',
        'varying vec3 vBinormal;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',

        'varying vec3 vViewPosition;',

        THREE.ShaderChunk[ 'shadowmap_pars_vertex' ],

        'void main() {',

          'vNormal = normalize( normalMatrix * normal );',

          // tangent and binormal vectors

          'vTangent = normalize( normalMatrix * tangent.xyz );',

          'vBinormal = cross( vNormal, vTangent ) * tangent.w;',
          'vBinormal = normalize( vBinormal );',

          // texture coordinates

          'vUv = uv;',

          'vec2 uvBase = uv * uRepeatBase;',

          'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
          'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

          'gl_Position = projectionMatrix * mvPosition;',

          'vViewPosition = -mvPosition.xyz;',

          'vec3 normalTex = texture2D( tNormal, uvBase ).xyz * 2.0 - 1.0;',
          'vNormal = normalMatrix * normalTex;',

          THREE.ShaderChunk[ 'shadowmap_vertex' ],

        '}'

      ].join('\n'),

      overdraw: true,
      lights: true,
      fog: true
    });
    */
















    var textureVisitedByTeam1 = new THREE.DataTexture(teamVisited[0], gridSize.width, gridSize.height, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter, 1);
    var textureVisitedByTeam2 = new THREE.DataTexture(teamVisited[1], gridSize.width, gridSize.height, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter, 1);

    textureVisitedByTeam1.needsUpdate = true;
    textureVisitedByTeam2.needsUpdate = true;

    // textureVisitedByTeam1.flipY = false;
    // textureVisitedByTeam2.flipY = false;

    // textureVisitedByTeam1.generateMipmaps = false;
    // textureVisitedByTeam2.generateMipmaps = false;

    var uniforms = {
      'seeTeam1Vision'  : { type: 'i',  value: true },
      'seeTeam2Vision'  : { type: 'i',  value: false },

      'map'             : { type: 't',  value: arena.ground.material.map },
      'entities'        : { type: 'fv', value: entities },
      'entitiesCount'   : { type: 'i',  value: arena.entities.length },
      'gridSize'        : { type: 'v2', value: new THREE.Vector2( gridSize.width, gridSize.height ) },
      'gridDiviser'     : { type: 'f',  value: gridDiviser },
      'visitedByTeam1'  : { type: 't',  value: textureVisitedByTeam1 },
      'visitedByTeam2'  : { type: 't',  value: textureVisitedByTeam2 },
      'diffuse'         : { type: 'fv', value: [ 1, 1, 1 ] },
      'opacity'         : { type: 'f',  value: 1 },
    };

    // // material
    var minmaterial = new THREE.ShaderMaterial({

      uniforms: uniforms,

      fragmentShader: [

        '#define GAMMA_INPUT',
        '#define GAMMA_OUTPUT',

        '#define MAX_ENTITIES 10',

        'uniform vec3 entities[ 512 ];',
        'uniform int entitiesCount;',

        'uniform int seeTeam1Vision;',
        'uniform int seeTeam2Vision;',

        'uniform vec2 gridSize;',
        'uniform float gridDiviser;',
        'uniform sampler2D visitedByTeam1;',
        'uniform sampler2D visitedByTeam2;',

        'varying vec4 worldPosition;',

        'varying vec2 vUv;',
        'uniform sampler2D map;',

        'uniform vec3 diffuse;',
        'uniform float opacity;',

        'void main() {',
        '    gl_FragColor = vec4( diffuse, 0.0 );',

        '    vec4 texelColor = texture2D( map, vUv );',

        '    #ifdef GAMMA_INPUT',
        '        texelColor.xyz *= texelColor.xyz;',
        '    #endif',

        '    gl_FragColor.xyz = gl_FragColor.xyz * texelColor.xyz;',

        '    #ifdef GAMMA_OUTPUT',
        '        gl_FragColor.xyz = sqrt( gl_FragColor.xyz );',
        '    #endif',

        '    vec4 minAlpha = vec4( 0.1 );',
        '    vec4 visAlpha = vec4( 0.4 );',
        '    vec4 maxAlpha = vec4( 1.0 );',

        '    vec4 visitedFragColor = gl_FragColor * visAlpha;',
        '    vec4 minFragColor     = gl_FragColor * minAlpha;',

        // by default, set to darkest (unvisited)
        '    gl_FragColor          = minFragColor;',

        // '    vec4 position = worldPosition;',
        // '    position = position * vec4( 1.0 );',

        // color at entities' proximity
        // '    float maxDistance = length(gridSize.xy / gridDiviser);', // 60.0
        '    float maxDistance = gridSize.x / gridDiviser;', // 60.0

        '    for (int i = 0; i <= MAX_ENTITIES; ++i) {',
        '        if (i <= int(entitiesCount)) {',
        '            float dist = smoothstep(1.0, 4.0, maxDistance / distance( worldPosition.xyz, entities[i].xyz ) ) * 10.0;',
        '            gl_FragColor = max( gl_FragColor, max( minFragColor, minFragColor * dist ) );',
        '        }',
        '    }',

        '    vec4 visCell;',

        // color at visited grid cells (team 1)
        '    if (seeTeam1Vision > 0) {',
        '        visCell = texture2D( visitedByTeam1, vUv );',
        '        gl_FragColor = max( gl_FragColor, visCell * visitedFragColor );',
        '    }',

        // color at visited grid cells (team 2)
        '    if (seeTeam2Vision > 0) {',
        '        visCell = texture2D( visitedByTeam2, vUv );',
        '        gl_FragColor = max( gl_FragColor, visCell * visitedFragColor );',
        '    }',

      '}'
      ].join('\n'),

      vertexShader: [

      'varying vec2 vUv;',
      'varying vec4 worldPosition;',
      'uniform vec4 offsetRepeat;',

      'void main() {',

      // '    vUv = uv * offsetRepeat.zw + offsetRepeat.xy;',
      '    vUv = uv;',

      '    worldPosition = modelMatrix * vec4( position, 1.0 );',

      '    vec3 objectNormal = normal;',

      '    vec3 transformedNormal = normalMatrix * objectNormal;',
      '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',

      '    gl_Position = projectionMatrix * mvPosition;',

      '    vec3 worldNormal = mat3( modelMatrix[ 0 ].xyz, modelMatrix[ 1 ].xyz, modelMatrix[ 2 ].xyz ) * objectNormal;',
      '    worldNormal = normalize( worldNormal );',
      '    vec3 cameraToVertex = normalize( worldPosition.xyz - cameraPosition );',

      '}'

      ].join('\n')
    });


    arena.ground.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = minmaterial;
        child.material.needsUpdate = true;
      }
    });


    // gui
    var f = arena.gui.addFolder('Fog of war');
    f.add(uniforms.seeTeam1Vision, 'value').name('Team 1 vision').listen();
    f.add(uniforms.seeTeam2Vision, 'value').name('Team 2 vision').listen();


    arena.on('update', function () {

      _.each(arena.entities, function (e, i) {

        // update each entities current position
        var j = i * 3;
        entities[j  ] = e.position.x;
        entities[j+1] = e.position.y;
        entities[j+2] = e.position.z;

        // update visited cells
        var loc = arena.inTerrainDatum(e.position);
        var x = Math.round(loc.x / gridDiviser);
        var y = Math.round(loc.z / gridDiviser);

        var sightDistance = 3;

        for (var sx = Math.max(0, x-sightDistance); sx < Math.min(gridSize.width, x+sightDistance); sx++) {
          for (var sy = Math.max(0, y-sightDistance); sy < Math.min(gridSize.width, y+sightDistance); sy++) {
            var index = 4 * sx + 4 * sy * gridSize.height;
            // console.log('mark cell', index, ' '+sx+';'+sy, 'as visited');
            teamVisited[e.state.team][index]   = 255;
            teamVisited[e.state.team][index+1] = 255;
            teamVisited[e.state.team][index+2] = 255;
            teamVisited[e.state.team][index+3] = 255;
          }
        }
      });

      // update entities count
      uniforms.entitiesCount.value = arena.entities.length;

      // update shader
      // minmaterial.needsUpdate = true;
      textureVisitedByTeam1.needsUpdate   = true;
      textureVisitedByTeam2.needsUpdate   = true;
      uniforms.entitiesCount.needsUpdate  = true;
      uniforms.entities.needsUpdate       = true;

    });

  });

};


function nearestPow2 (aSize) {
  return Math.pow(2, Math.round(Math.log(aSize) / Math.log(2)));
}
