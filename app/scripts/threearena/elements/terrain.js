define('threearena/elements/terrain',
    ['lodash', 'threejs'], function(_, THREE) {

    /**
     * @exports threearena/elements/terrain
     */
    var Terrain = function(file, options) {

      THREE.Object3D.apply(this);

      var self = this;

      self.options = options = options || {};

      var ambient = 0xffffff, diffuse = 0xffffff, specular = 0xdd5500, shininess = 10;

      var uniforms;
      var shader = THREE.ShaderLib[ "normalmap" ];
      var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

      if (options.tNormal) {
        uniforms[ "tNormal" ].value = THREE.ImageUtils.loadTexture( options.tNormal );
        uniforms[ "tNormal" ].value.wrapS = uniforms[ "tNormal" ].value.wrapT = THREE.RepeatWrapping;

      }
      if (options.tDiffuse) {
        uniforms[ "tDiffuse" ].value = THREE.ImageUtils.loadTexture( options.tDiffuse );
        uniforms[ "tDiffuse" ].value.wrapS = uniforms[ "tDiffuse" ].value.wrapT = THREE.RepeatWrapping;
      }
      if (options.tSpecular) uniforms[ "tSpecular" ].value = THREE.ImageUtils.loadTexture( options.tSpecular );

      uniforms[ "enableAO" ].value = false;
      uniforms[ "enableDiffuse" ].value = true;
      uniforms[ "enableSpecular" ].value = false;

      uniforms[ "uDiffuseColor" ].value.setHex( diffuse );
      uniforms[ "uSpecularColor" ].value.setHex( specular );
      uniforms[ "uAmbientColor" ].value.setHex( ambient );

      uniforms[ "uNormalScale" ].value.set( 2, 2 );

      uniforms[ "uShininess" ].value = shininess;

      //uniforms[ "wrapRGB" ].value.set( 0.575, 0.5, 0.5 );

      var parameters = _.merge({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: uniforms,
        lights: true,
        fog: true
      }, options);

      var material = new THREE.ShaderMaterial( parameters );
      // material.wrapAround = true;

      // Water
      // var water = new Water( 50, 100 );
      // water.position.set( -100, 12, 0 );
      // self.scene.add( water );

      var onLoad = function (object) {
          object.traverse( function ( child ) {
              if ( child instanceof THREE.Mesh ) {
                  child.material = material;

                  child.geometry.computeVertexNormals();
                  child.geometry.computeTangents();

                  child.receiveShadow = true;
              }
          } );

          self.add(object);

          options.onLoad && options.onLoad(self);
      };

      if (file instanceof THREE.Mesh) {

        onLoad(file);

      } else {

        var loader = new THREE.OBJLoader( );
        loader.load(file, function ( object ) {
            onLoad(object);
        });
      }
    };

  Terrain.prototype = Object.create(THREE.Object3D.prototype);

  Terrain.prototype.constructor = Terrain;
  return Terrain;
});