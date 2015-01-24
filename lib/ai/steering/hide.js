var flee = require('./flee');

module.exports = function (arena, entity, target) {

    // horrible hack !
    entity.coverSystem.arena = arena;

    var hidingSpot = entity.coverSystem.nearestHidingPosition(target);

    if (! hidingSpot) {
        return flee(arena, entity, target);
    } else {
        return hidingSpot;
    }
};