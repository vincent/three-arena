module.exports = function (arena, entity, target) {

    var desiredVelocity = entity.position.clone()
                                    .sub(target.position)
                                    .multiplyScalar(entity.state.maxSpeed / 10);

    return desiredVelocity;
};