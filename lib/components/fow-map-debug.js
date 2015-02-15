'use strict';

var _ = require('lodash');

var FowMap = require('../textures/fog-of-war');

function nearestPow2 (aSize) {
  return Math.pow(2, Math.round(Math.log(aSize) / Math.log(2)));
}


module.exports = function (arena) {

  arena.on('set:terrain', function () {

    var box  = arena.ground.boundingBoxNormalized.max;
    var size = nearestPow2(Math.max(box.x, box.y));

    var fowMap = new FowMap(size, size);


    document.getElementsByTagName('body')[0].appendChild(fowMap.canvas);
    fowMap.canvas.style.position = 'absolute';
    fowMap.canvas.style.right = '0';
    fowMap.canvas.style.top = '100px';


    // texture
    var fowtexture = new THREE.Texture(fowMap.canvas);
    // texture.wrapS = fowtexture.wrapT = THREE.RepeatWrapping;
    fowtexture.mapping = THREE.UVMapping;
    // fowtexture.repeat.set(1, 1);
    // fowtexture.wrapS = THREE.ClampToEdgeWrapping;
    // fowtexture.wrapT = THREE.ClampToEdgeWrapping;
    fowtexture.magFilter = THREE.NearestFilter;
    fowtexture.minFilter = THREE.NearestFilter;
    // fowtexture.needsUpdate = true; // important

    var grass = THREE.ImageUtils.loadTexture('/gamedata/textures/grass.jpg');
    grass.mapping = THREE.UVMapping;
    grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
    grass.repeat.set(100, 100);
    grass.needsUpdate = true; // important

    // // material
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

        'tDiffuse1'         : { type: 't', value: grass },
        'tDiffuse2'         : { type: 't', value: grass },
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


          // DEBUUGGGGGG
          // 'gl_FragColor = vec4( vec3( 1.0 ), 1.0 );',
          // 'gl_FragColor = gl_FragColor * texture2D( tDiffuse1, uRepeatBase );',
          // 'gl_FragColor = texture2D( tDiffuse1, vec2( 0.5, 0.5 ));',
          // 'gl_FragColor = texture2D( tDiffuse1, uvOverlay );',
          // 'gl_FragColor = texture2D( tDiffuse1, vec2( 0.5, 0.5 ));',


          'vec4 texelColor = texture2D( tDiffuse1, vUv );',
          '#ifdef GAMMA_INPUT',
          '    texelColor.xyz *= texelColor.xyz;',
          '#endif',
          'gl_FragColor = gl_FragColor * texelColor;',

          /////

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





















    // // material
    var minmaterial = new THREE.ShaderMaterial({

      uniforms: {
        'map'      : { type: 't',  value: arena.ground.material.map },
        'fow'      : { type: 't',  value: fowtexture },
        'diffuse'  : { type: 'fv', value: [ 1, 1, 1 ] },
        'opacity'  : { type: 'f',  value: 1 },
      },

      fragmentShader: [

        '#define GAMMA_INPUT',
        '#define GAMMA_OUTPUT',

        'varying vec2 vUv;',
        'uniform sampler2D map;',
        'uniform sampler2D fow;',
        'uniform vec3 diffuse;',
        'uniform float opacity;',

        'void main() {',
        '    gl_FragColor = vec4( diffuse, 0.0 );',

        '    vec4 texelColor = texture2D( map, vUv );',
        '    vec4 texelAlpha = texture2D( fow, vUv );',

        '    #ifdef GAMMA_INPUT',
        '        texelColor.xyz *= texelColor.xyz;',
        '    #endif',

        '    gl_FragColor.xyz = gl_FragColor.xyz * texelColor.xyz;',

        '    #ifdef GAMMA_OUTPUT',
        '        gl_FragColor.xyz = sqrt( gl_FragColor.xyz );',
        '    #endif',

        '    gl_FragColor = gl_FragColor * texelAlpha;',
        // '    gl_FragColor.a = texelAlpha.a;',
      '}'
      ].join('\n'),

      vertexShader: [

      'varying vec2 vUv;',
      'uniform vec4 offsetRepeat;',

      'void main() {',

      // '    vUv = uv * offsetRepeat.zw + offsetRepeat.xy;',
      '    vUv = uv;',

      '    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',

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























    /* * /
    material = new THREE.MeshBasicMaterial({
      map: fowtexture,
      ambient: 0xaaaaaa,
      specular: 0x000000,
      shininess: 0,
      shading: THREE.FlatShading,
      polygonOffset: true
    });
    /* */











    /* * /
    var terrainShader = THREE.ShaderTerrain['terrain'];

    var uniformsTerrain = THREE.UniformsUtils.clone( terrainShader.uniforms );

    // uniformsTerrain['tNormal'].value = grass;
    // uniformsTerrain['uNormalScale'].value = 3.5;

    // uniformsTerrain['tDisplacement'].value = heightMap;

    uniformsTerrain['tDiffuse1'].value = arena.ground.material.map;
    // uniformsTerrain['tDiffuse2'].value = grass;
    // uniformsTerrain['tSpecular'].value = grass;
    // uniformsTerrain['tDetail'].value = grass;

    uniformsTerrain['enableDiffuse1'].value = true;
    uniformsTerrain['enableDiffuse2'].value = false;
    uniformsTerrain['enableSpecular'].value = false;

    uniformsTerrain['diffuse'].value.setHex( 0x00ff00 );
    uniformsTerrain['specular'].value.setHex( 0x00ff00 );
    uniformsTerrain['ambient'].value.setHex( 0x00ff00 );

    uniformsTerrain['shininess'].value = 30;

    uniformsTerrain['uDisplacementScale'].value = 1;

    uniformsTerrain['uRepeatOverlay'].value.set( 6, 6 );

    material = new THREE.ShaderMaterial({
      uniforms: uniformsTerrain,
      overdraw: true,
      // lights:   true,
      // fog:      true
    });
    /* */












    arena.ground.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = minmaterial;
        child.material.needsUpdate = true;
      }
    });


    arena.on('update', function () {

      fowMap.render(
        _.map(arena.entities, function (e) {
          return arena.inTerrainDatum(e.position);
        })
      );

      fowtexture.needsUpdate = true;

    });

  });

};

