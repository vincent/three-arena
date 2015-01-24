
module.exports = function (arena, entity, target) {



    var hidingSpot = entity.coverSystem.nearestHidingPosition(target);

    if (! hidingSpot) {
        return flee(arena, entity, target);
    } else {
        return hidingSpot;
    }
};
