'use strict'

var settings = require('../settings');

module.exports = function (arena) {
  arena.on('added:entity', function(entity){
    attachName(arena, entity);
  });
};

function attachName (arena, entity) {

  var entityNamesChanged = function () {

    if (entity.nameMesh) {
      arena.scene2.remove(entity.nameMesh);
      entity.nameMesh = null; // should be enough to be GCed
    }

    entity.nameMesh = new THREE.Mesh(
      new THREE.TextGeometry(entity.state.name, {
        size: settings.data.entityNamesSize,
        height: 1,
        curveSegments: 1,
        font: settings.data.entityNamesFont,
        weight: 'normal',
        style: 'normal',
        bevelThickness: 0,
        bevelSize: 0,
        bevelEnabled: false,
        material: 0,
        extrudeMaterial: 0
      }),
      new THREE.MeshBasicMaterial({
        color: settings.data.entityNamesColor
      })
    );

    entity.nameMesh.scale.set(1, 1, 0.01);

    // add its lifebar in the alternative scene ..
    arena.scene2.add(entity.nameMesh);
  };

  // update function
  var updateName = function(game){

    // .. always above its character
    entity.nameMesh.position.set(
      entity.position.x - entity.boundingBox.max.x * 0.5,
      entity.position.y + entity.boundingBox.max.y * 1.5,
      entity.position.z
    );

    // .. always face camera
    entity.nameMesh.rotation.y = arena.camera.rotation.y;
  };

  updateName.listenerTag = 'entity ' + entity.constructor.name + '#' + entity.id + ' name update';

  entityNamesChanged();

  arena.on('update', updateName);

  settings.on('entityNamesChanged', entityNamesChanged);
}
