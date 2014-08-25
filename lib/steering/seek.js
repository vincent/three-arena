module.exports = function (arena, entity, target) {

    var desiredVelocity = target.position.clone()
                                    .sub(entity.position)
                                    .normalize()
                                    .multiplyScalar(entity.state.maxSpeed);

    return desiredVelocity;
};