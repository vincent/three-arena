define('threearena/particles/snow',

['lodash', 'threejs'], function(_, THREE) {

  /**
   * @exports threearena/particles/snow
   */
  var Snow = function(count, tex) {

    THREE.Object3D.apply(this);

    function rand(v) {
      return (v * (Math.random() - 0.5));
    }

    var numParticles = 10000,
      particleSystemHeight = 100.0,
      width = 100,
      height = particleSystemHeight,
      depth = 100,
      texture = THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare1_alpha.png' ),
      parameters = {
        color: 0xFFFFFF,
        height: particleSystemHeight,
        radiusX: 2.5,
        radiusZ: 2.5,
        size: 100,
        scale: 4.0,
        opacity: 0.4,
        speedH: 1.0,
        speedV: 1.0
      },
      systemGeometry = new THREE.Geometry(),
      systemMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color:  { type: 'c', value: new THREE.Color( parameters.color ) },
          height: { type: 'f', value: parameters.height },
          elapsedTime: { type: 'f', value: 0 },
          radiusX: { type: 'f', value: parameters.radiusX },
          radiusZ: { type: 'f', value: parameters.radiusZ },
          size: { type: 'f', value: parameters.size },
          scale: { type: 'f', value: parameters.scale },
          opacity: { type: 'f', value: parameters.opacity },
          texture: { type: 't', value: texture },
          speedH: { type: 'f', value: parameters.speedH },
          speedV: { type: 'f', value: parameters.speedV }
        },
        vertexShader: document.getElementById( 'step07_vs' ).textContent,
        fragmentShader: document.getElementById( 'step09_fs' ).textContent,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false
      });
   
    for (var i = 0; i < numParticles; i++) {
      var vertex = new THREE.Vector3(
        rand( width ),
        Math.random() * height,
        rand( depth )
      );
      systemGeometry.vertices.push( vertex );
    }

    this.particleSystem = new THREE.ParticleSystem( systemGeometry, systemMaterial );
    this.particleSystem.position.y = -height / 2;

    this.add(this.particleSystem);
  };

  Snow.prototype = new THREE.Object3D();

  Snow.prototype.update = function(game) {
    this.particleSystem.material.uniforms.elapsedTime.value = game.delta * 10;
  };

  Snow.prototype.constructor = THREE.Snow;
 
  return Snow;
});


/*
    onParametersUpdate = function( v ) {
      systemMaterial.uniforms.color.value.set( parameters.color );
      systemMaterial.uniforms.height.value = parameters.height;
      systemMaterial.uniforms.radiusX.value = parameters.radiusX;
      systemMaterial.uniforms.radiusZ.value = parameters.radiusZ;
      systemMaterial.uniforms.size.value = parameters.size;
      systemMaterial.uniforms.scale.value = parameters.scale;
      systemMaterial.uniforms.opacity.value = parameters.opacity;
      systemMaterial.uniforms.speedH.value = parameters.speedH;
      systemMaterial.uniforms.speedV.value = parameters.speedV;
    }

    controls = new dat.GUI();
    controls.close();

    controls.addColor( parameters, 'color' ).onChange( onParametersUpdate );
    controls.add( parameters, 'height', 0, particleSystemHeight * 2.0 ).onChange( onParametersUpdate );
    controls.add( parameters, 'radiusX', 0, 10 ).onChange( onParametersUpdate );
    controls.add( parameters, 'radiusZ', 0, 10 ).onChange( onParametersUpdate );
    controls.add( parameters, 'size', 1, 400 ).onChange( onParametersUpdate );
    controls.add( parameters, 'scale', 1, 30 ).onChange( onParametersUpdate );
    controls.add( parameters, 'opacity', 0, 1 ).onChange( onParametersUpdate );
    controls.add( parameters, 'speedH', 0.1, 3 ).onChange( onParametersUpdate );
    controls.add( parameters, 'speedV', 0.1, 3 ).onChange( onParametersUpdate );
*/