var settings = require('../settings');

module.exports = function (arena) {

  arena.on('added:entity', function(entity) {
    attachHelpers(arena, entity);
  });


  settings.on('helpersUpdated', function() {

    _.each(arena.entities, function(entity) {

      entity[ arena.settings.visibleCharactersHelpers ? 'add' : 'remove' ](entity.axisHelper);
      // entity[ arena.settings.visibleCharactersHelpers ? 'add' : 'remove' ](entity.bboxHelper);
      entity[ arena.settings.visibleCharactersHelpers ? 'add' : 'remove' ](entity.radiusHelper);
      entity.radiusHelper.scale.set(entity.state.radius, entity.state.height, entity.state.radius);
      entity.bboxHelper.material.visible = arena.settings.visibleCharactersHelpers;
    });

  });
};

function attachHelpers (arena, entity) {

  entity.bboxHelper = new THREE.Mesh(new THREE.CubeGeometry(
    entity.boundingBox.max.x + (/* entity.boundingBox.max.x + */ 0.20), // a bit wider
    entity.boundingBox.max.y + (/* entity.boundingBox.max.y + */ 0.20), // a bit higher
    entity.boundingBox.max.z + (/* entity.boundingBox.max.z + */ 0.20), // a bit deeper
    1, 1, 1
  ), arena.commonMaterials.entityHelpers);
  for (var i = 0; i < entity.bboxHelper.geometry.vertices.length; i++) {
    entity.bboxHelper.geometry.vertices[i].y += entity.bboxHelper.geometry.vertices[i].y / 2;
  }
  entity.bboxHelper.material.visible = arena.settings.visibleCharactersHelpers;
  entity.add(entity.bboxHelper);

  // has an axis helper
  entity.axisHelper = new THREE.AxisHelper(50);
  if (arena.settings.visibleCharactersHelpers) {
    entity.add(entity.axisHelper); // axis
  }

  // has a radius helper
  entity.radiusHelper = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 16, true), arena.commonMaterials.entityHelpers);
  entity.radiusHelper.scale.set(entity.state.radius, entity.state.height, entity.state.radius);
  if (arena.settings.visibleCharactersHelpers) {
    entity.add(entity.radiusHelper); // radius
  }

  // whenever the character dies
  entity.on('death', function() {

    // remove the bbox from intersectables
    arena.intersectObjects.splice(arena.intersectObjects.indexOf(entity.bboxHelper), 1);
  });

  // is intersectable
  arena.intersectObjects.push(entity.bboxHelper);
}
