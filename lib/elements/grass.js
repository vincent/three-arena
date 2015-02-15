'use strict';

var inherits = require('inherits');

module.exports = Grass;

/**
 * @exports threearena/elements/grass
 *
 * @constructor
 */
function Grass (options) {

  var self = this;

  THREE.Object3D.apply(this);

  // self.position.y = 0;
  // self.scale.set( 0.6, 0.6, 0.6 );
  // this.position.y = -50;

  options = options || {};

  var geometry = new THREE.PlaneBufferGeometry( 30, 30 );

  var bitmap = this.generateTextureBase();

  var mesh;

  this.levels = [];

  for ( var i = 0; i < 25; i ++ ) {

    mesh = this.levels[ i ] = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {
      map: new THREE.Texture( this.generateTextureLevel( bitmap ) ),
      transparent: true,
      depthWrite: false,
      // depthTest: false,
      opacity: 1 - i/10
    } ) );

    mesh.material.map.needsUpdate = true;

    mesh.position.y = 0.5 + i * 0.10;
    mesh.rotation.x = - Math.PI / 2;

    self.add( mesh );

  }

  window._ta_events.on('update', this.update.bind(this));
}

inherits(Grass, THREE.Object3D);

Grass.prototype.generateTextureBase = function () {

  var canvas = document.createElement( 'canvas' );
  canvas.width = 512;
  canvas.height = 512;

  var context = canvas.getContext( '2d' );

  for ( var i = 0; i < 20000; i ++ ) {

    context.fillStyle = 'rgba(0,' + Math.floor( Math.random() * 64 + 32 ) + ',16,1)';
    context.beginPath();
    context.arc( Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1 + 0.5, 0, Math.PI * 2, true );
    context.closePath();
    context.fill();

  }

  context.globalAlpha = 0.075;
  context.globalCompositeOperation = 'lighter';

  return canvas;
};

Grass.prototype.generateTextureLevel = function ( texture ) {

  texture.getContext( '2d' ).drawImage( texture, 0, 0 );

  var canvas = document.createElement( 'canvas' );
  canvas.width = texture.width;
  canvas.height = texture.height;

  canvas.getContext( '2d' ).drawImage( texture, 0, 0 );

  return canvas;
};

Grass.prototype.update = function(arena) {

  var mesh;
  var timestep = arena.time / 1000;

  for ( var i = 0, l = this.levels.length; i < l; i ++ ) {

    mesh = this.levels[ i ];
    mesh.position.x = Math.sin( timestep * 2 ) * i * i * 0.01;
    mesh.position.z = Math.cos( timestep * 3 ) * i * i * 0.01;
    // mesh.material.map.needsUpdate = true;
    //
    // mesh.position.i = i;

    // console.log('%o, %o, %o', mesh.position.x, mesh.position.y, mesh.position.z);
  }
};
