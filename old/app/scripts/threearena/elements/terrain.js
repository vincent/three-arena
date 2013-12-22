define('threearena/elements/terrain',
    ['lodash', 'threejs'], function(_, THREE) {

    /**
     * @exports threearena/elements/terrain
     */
    var Terrain = function(file, options) {

    THREE.Object3D.apply(this);

    var self = this;

    self.options = options = options || {};

    var ambient = 0xffffff, diffuse = 0xffffff, specular = 0xffffff, shininess = 20;

    var uniforms;
    var shader = THREE.ShaderLib[ "normalmap" ];
    var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

    if (options.tNormal) {
      uniforms[ "tNormal" ].value = THREE.ImageUtils.loadTexture( options.tNormal );
      uniforms[ "tNormal" ].value.wrapS = uniforms[ "tNormal" ].value.wrapT = THREE.RepeatWrapping;
      uniforms[ "tNormal" ].value.repeat.set( 2, 2);
    }

    uniforms[ "enableDiffuse" ].value = true;
    uniforms[ "enableSpecular" ].value = true;

    if (options.tDiffuse) {
      uniforms[ "tDiffuse" ].value = THREE.ImageUtils.loadTexture( options.tDiffuse );
      uniforms[ "tDiffuse" ].value.wrapS = uniforms[ "tDiffuse" ].value.wrapT = THREE.RepeatWrapping;
      uniforms[ "tDiffuse" ].value.repeat.set( 20000, 20000);
    }

    if (options.tSpecular) {
      uniforms[ "tSpecular" ].value = THREE.ImageUtils.loadTexture( options.tSpecular );
      uniforms[ "tSpecular" ].value.wrapS = uniforms[ "tSpecular" ].value.wrapT = THREE.RepeatWrapping;
      uniforms[ "tSpecular" ].value.repeat.set( 2, 2);
    }

    uniforms[ "enableAO" ].value = false;

    uniforms[ "uDiffuseColor" ].value.setHex( 0xffffff );
    uniforms[ "uSpecularColor" ].value.setHex( 0xffffff );
    uniforms[ "uAmbientColor" ].value.setHex( 0xffffff );


    // uniforms[ "uNormalScale" ].value.set( 2, 2 );

    uniforms[ "uShininess" ].value = shininess;

    //uniforms[ "wrapRGB" ].value.set( 0.575, 0.5, 0.5 );

    // uniforms[ "enableAO" ].value = true;
    // uniforms[ "tAO" ].value = THREE.ImageUtils.loadTexture( '/gamedata/dota_map_full_compress3.jpg' );

    /*
    uniforms[ "enableDiffuse" ].value = false;
    uniforms[ "enableSpecular" ].value = false;
    uniforms[ "enableReflection" ].value = true;

    uniforms[ "tNormal" ].texture = THREE.ImageUtils.loadTexture( "normal.jpg" );
    uniforms[ "tAO" ].texture = THREE.ImageUtils.loadTexture( "ao.jpg" );

    uniforms[ "tDisplacement" ].texture = THREE.ImageUtils.loadTexture( "displacement.jpg" );
    uniforms[ "uDisplacementBias" ].value = - 0.428408 * scale;
    uniforms[ "uDisplacementScale" ].value = 2.436143 * scale;

    uniforms[ "uDiffuseColor" ].value.setHex( diffuse );
    uniforms[ "uSpecularColor" ].value.setHex( specular );
    uniforms[ "uAmbientColor" ].value.setHex( ambient );

    uniforms[ "uShininess" ].value = shininess;

    uniforms[ "tCube" ].texture = reflectionCube;
    uniforms[ "uReflectivity" ].value = 0.1;

    uniforms[ "uDiffuseColor" ].value.convertGammaToLinear();
    uniforms[ "uSpecularColor" ].value.convertGammaToLinear();
    uniforms[ "uAmbientColor" ].value.convertGammaToLinear();
    */

    /* * /
    console.log('shader.fragmentShader');
    console.log(shader.fragmentShader);

    console.log('shader.vertexShader');
    console.log(shader.vertexShader);
    /* */

    var parameters = _.merge({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: uniforms,
      lights: true,
      fog: true
    }, options);

    self.material = new THREE.ShaderMaterial( parameters );
    // var material = new THREE.MeshLambertMaterial({ color: 0x555555 });
    // material.wrapAround = true;

    // Water
    // var water = new Water( 50, 100 );
    // water.position.set( -100, 12, 0 );
    // self.scene.add( water );

    var onLoad = function (object) {
        object.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = self.material;

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