'use strict';

var inherits = require('inherits');

var Entity = require('../entity');

module.exports = Nexus;

/**
 * @exports threearena/elements/nexus
 */
function Nexus (options) {

  var self = this;

  options.radius = 6;
  options.attackRange = 5;

  Entity.apply(this, [ options ]);

  var loader = new THREE.ColladaLoader();
  loader.load( '/gamedata/models/rts_elements.dae', function ( loaded ) {

    // var mesh = new THREE.Mesh( new THREE.BoxGeometry(3, 20, 3, 1, 1, 1) , new THREE.MeshBasicMaterial({ color: options.color }));
    var mesh = loaded.scene.getObjectByName('Obelisk3');

    mesh.castShadow = true;
    mesh.rotation.x = -90 * Math.PI / 180;
    mesh.scale.set(4, 4, 4);
    mesh.position.set(0, 0, 0);
    mesh._shouldGetTerrainMaterial = true;

    self.add(mesh);

    if (options.onLoad) { options.onLoad(self); }
  });
}

inherits(Nexus, Entity);
