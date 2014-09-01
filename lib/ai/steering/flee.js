module.exports = function (arena, entity, target) {

    return entity.position.clone()
                                    .sub(target.position)
                                    .multiplyScalar(entity.state.maxSpeed / 10);
};