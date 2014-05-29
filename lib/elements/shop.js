'use strict';

var inherits = require('inherits');
var InteractiveObject = require('./interactiveobject');

module.exports = Shop;

/**
 * @exports threearena/elements/shop
 */
function Shop (options) {

  InteractiveObject.apply(this, [ options ]);

  var self = this;

  var loader = new THREE.OBJLoader( );
  loader.load( '/gamedata/models/marketplace/marketplace.obj', function ( object ) {

    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( '/gamedata/models/marketplace/TXT0499.jpg' );
      }
    });

    object.scale.set(8, 8, 8);
    self.add( object );

    if (options.onLoad) { options.onLoad.apply(self); }
  });
}

inherits(Shop, InteractiveObject);