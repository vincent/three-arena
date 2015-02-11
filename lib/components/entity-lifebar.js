'use strict';

module.exports = function (arena) {
  arena.on('added:entity', function(entity){
    attachLifebar(arena, entity);
  });
};

function attachLifebar (arena, entity) {

  // entities should have a lifebar
  entity.attachLifeBar();

  // add its lifebar in the alternative scene ..
  arena.scene2.add(entity.lifebar);

  var updateLifebar = function() {

    // .. always above its character
    entity.lifebar.position.set(
      entity.position.x,
      entity.position.y + entity.boundingBox.max.y,
      entity.position.z
    );

    // .. always face camera
    entity.lifebar.rotation.y = arena.camera.rotation.y;
  };

  updateLifebar.listenerTag = 'entity ' + entity.constructor.name + '#' + entity.id + ' lifebar update';

  // whenever the character dies
  entity.on('death', function(){

    // remove the lifebar
    if (entity.lifebar.parent) {
      entity.lifebar.parent.remove(entity.lifebar);
    }
  });

  arena.on('update', updateLifebar);
}
