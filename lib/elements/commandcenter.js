'use strict';

var inherits = require('inherits');
var Entity = require('../entity');

module.exports = CommandCenter;

/**
 * @exports threearena/elements/commandcenter
 */
function CommandCenter (options) {

  Entity.apply(this, [ options ]);

  var self = this;

  this.collector = {};

  var loader = new THREE.OBJLoader();
  loader.load( '/gamedata/sandbox/sc2/commandcenter.obj', function ( object ) {

    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        // debugger;
        // child.material.map = THREE.ImageUtils.loadTexture( '/gamedata/models/marketplace/TXT0499.jpg' );
      }
    });

    object.scale.set(5, 5, 5);
    self.add( object );

    if (options.onLoad) { options.onLoad.apply(self); }
  });
}

inherits(CommandCenter, Entity);