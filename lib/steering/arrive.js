module.exports = function (arena, entity, target, deceleration) {

    var toTarget = taget.position.clone()
                                    .sub(entity.position);

    var distance = toTarget.length();

    if (distance > 0)  {

    	// tweaking
    	var decelerationTweak = 0.3;

    	var speed = Math.min(entity.state.maxSpeed, distance / (deceleration * decelerationTweak));

    	var velocity = toTarget.multiplyScalar(speed / distance);

    	return velocity.sub(entity.state.velocity);
    }

    return new THREE.Vector3();
};