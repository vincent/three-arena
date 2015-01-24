var randomP1 = new THREE.Vector3();
var randomP2 = new THREE.Vector3();

function rand (jitter) {
    return (2 * Math.random() - 1) * jitter;
}

module.exports = function (arena, entity) {

    var radius   = 30.0 * Math.random();
    var distance = 10.0 * Math.random();
    var jitter   = 8.0;

    randomP1.set(rand(jitter), 0.01, rand(jitter));
    randomP2.z = distance;

    var wanderTarget = entity.position.clone()
                                    .add(randomP1)
                                    .normalize()
                                    .multiplyScalar(radius)
                                    .add(randomP2);

    var wanderTargetWorld = entity.localToWorld(wanderTarget);

    return wanderTargetWorld;
};