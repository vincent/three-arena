module.exports = NearestFeature;

function NearestFeature () {
}

NearestFeature.compute = function (arena, entity, itemClass) {

    var nearest = arena.findWithClass(itemClass, entity.position);

    if (nearest) {
        var distance = nearest.position.distanceTo(entity.position);
        return 1 / (arena.ground.boundingBox.diag / distance);
    }

    return 1;
}

