'use strict';

var inherits = require('inherits');

module.exports = GrassShaderMaterial;

/**
 * @exports threearena/shaders/grass
 */
function GrassShaderMaterial () {

  THREE.ShaderMaterial.apply(this, [ {
    shading: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    transparent: true,

    uniforms: {
      FadeOutStart: { type: 'f', value: 1.0 },
      FadeOutDist: { type: 'f', value: 1.0 },
      Time: { type: 'f', value: 1.0 },
      camPos: { type: 'v3', value: new THREE.Vector3() },
    },
    
    vertexShader: [
      
      //********************************************************************************
      // Billboard grass vertex shader from http://hub.jmonkeyengine.org/forum/topic/high-speed-grass-rendering-using-glsl-shader
      //********************************************************************************
      // Texture0 = The texture
      // Texture1.r = Dissolve distance value
      // Texture1.gb = [not used]
      // TexCoord0 = Offset vertices
      // TexCoord1 = Offset texture (inkl type, flip)
      // Color = Color
      // Color.w = distance factor
      //********************************************************************************
      
      'uniform float FadeOutStart;',
      'uniform float FadeOutDist;',
      'uniform float Time;',
      'uniform vec3 camPos;',
      
      'varying vec4 VertexColor;',
      'varying float Fog;',
      
      'void main(void)',
      '{',
          // Billboard calculations
      '   float Dist  = length(camPos - gl_Vertex.xyz);',
      '   vec3 vAt    = normalize(camPos - gl_Vertex.xyz);',
      '   vec3 vUp    = vec3(0.0,1.0,0.0);',
      '   vec3 vRight = normalize(cross( vUp, vAt ));',
      '   ',
          // Fade
      '   VertexColor.w   = max( ( Dist - FadeOutStart ) / (FadeOutDist * gl_Color.w ), 0.0 );',

      '   if( VertexColor.w < 1.0 ) {',
             // Color
      '      VertexColor.xyz = gl_Color.xyz;',
      '      ',
             // Create the vertex move
      '      vec4 vMove = vec4( gl_MultiTexCoord0.s * vRight + gl_MultiTexCoord0.t * vUp, 0.0 );',
      '      ',
             // Calculate wind
      '      float fWind = ( (pow(((sin((-Time * 4.0 + gl_Vertex.x / 20.0 + sin(gl_Vertex.y * 25.4) / 1.0 )) + 1.0) / 3.0), 4.0)) + ',
      '                 (sin( Time * 10.0 + gl_Vertex.y * 25.4 ) * 0.02) ) * gl_MultiTexCoord0.t;',
      '      ',
             // Add wind
      '      vMove.xz += fWind;',
             // Move the vertex in position
      '      vec4 vPos = gl_Vertex + vMove;',
             // Calculate gl_Position
      '      gl_Position = gl_ModelViewProjectionMatrix * vPos;',
             // Grass (and noise) texture coordinates and
             // Cloud shadow coordinates
      '      gl_TexCoord[0].st = gl_MultiTexCoord1.st;',
      '      gl_TexCoord[0].pq = (gl_TextureMatrix[2] * vec4( vPos.xz, 0.0, 1.0 )).st;',
             // Wind Light
      '      vec3 vNormalUp = normalize( vec3( fWind * 0.2, 1.0, 0.0 ) );',
      '      VertexColor.xyz *= dot( vec3( 0.0, 1.0, 0.0 ), vNormalUp );',   // Multiply with VertexColor
             // Fog
      '      Fog = ( gl_Fog.end - gl_Position.z ) * gl_Fog.scale;',      // Calculate fog value
      '      Fog = clamp( Fog, 0.0, 1.0 );',
      '   }',
      '   else {',
      '          gl_Position = vec4(0.0, 0.0, -10.0, 0.0);',
      '   }',
      '}'
    ].join(''),

    fragmentShader: [

      //********************************************************************************
      // Billboard grass fragment shader from http://hub.jmonkeyengine.org/forum/topic/high-speed-grass-rendering-using-glsl-shader
      //********************************************************************************

      'uniform sampler2D Texture;',
      'uniform sampler2D TextureNoise;',
      'uniform sampler2D TextureShadow;',

      'varying vec4 VertexColor;',
      'varying float Fog;',

      'void main(void)',
      '{',
      '    vec4  Color   = texture2D(Texture, gl_TexCoord[0].st);',           // Diffuse texture
      '    float Noise   = texture2D(TextureNoise, gl_TexCoord[0].st).r;',    // Noise for dissolve
      '    vec3  Shadow  = texture2D(TextureShadow, gl_TexCoord[0].pq).rgb;', // Shadow

      '    Color.xyz *= VertexColor.xyz * Shadow;',                // Apply vertex color, light and shadows
      '    Color.w    = Color.w * Noise - VertexColor.w;',         // Dissolve
      '    Color.xyz  = mix( gl_Fog.color.xyz, Color.xyz, Fog );', // Add fog
      '    gl_FragColor = Color;',                                 // Final color
      '}',
    ].join('')

  }]);
}

inherits(GrassShaderMaterial, THREE.ShaderMaterial);








