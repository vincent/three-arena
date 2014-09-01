
var utils = require('../utils');
var Entity;

module.exports = CoverSystem;

function CoverSystem (arena, entity) {
    var self = this;

    Entity = require('../entity');

    this.arena = arena;
    this.entity = entity;

    this.twopi = 2 * Math.PI;
    this.upVector = new THREE.Vector3(0, 1, 0);

    this.pathfindExtendVector = new THREE.Vector3(1, 5, 1);
    this.raycastTestingVector = new THREE.Vector3();
    this.raycastDirVector = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
};

CoverSystem.prototype.raycastFront = function(walls, from, direction) {
    this.raycaster.set(from, direction);
    this.raycaster.far = 100;
    return this.raycaster.intersectObjects(walls, true);
};

CoverSystem.prototype.hidingPositions = function(fromTarget) {
    this.raycastDirVector.set(1, 0, 0);
    var positions = [];

    var walls = [];
    for (var i = 0; i < this.arena.intersectObjects.length; i++) {
        if (! utils.childOf(this.arena.intersectObjects[i], Entity)) {
            walls.push(this.arena.intersectObjects[i]);
        }
    };

    for (var i = 0; i < this.twopi; i += 0.5) {
        this.raycastDirVector.applyAxisAngle(this.upVector, i);
        this.raycastTestingVector.copy(this.raycastDirVector).multiplyScalar(20);

        var intersects = this.raycastFront(walls, fromTarget.position, this.raycastDirVector);

        for (var j = 0; j < intersects.length; j++) {
            positions.push(intersects[j].point.add(this.raycastTestingVector));
            /*
            var possibleHidingPosition = intersects[j].point.add(this.raycastTestingVector);
            this.arena.pathfinder.findNearestPoint(
                possibleHidingPosition.x,
                possibleHidingPosition.y,
                possibleHidingPosition.z,
                this.pathfindExtendVector.x,
                this.pathfindExtendVector.y,
                this.pathfindExtendVector.z,
                this.arena.pathfinder.cb(function (x, y, z) {
                    positions.push(new THREE.Vector3(x, y, z));
                })
            );
            */
        }
    }

    return positions;
};

CoverSystem.prototype.nearestHidingPosition = function(fromTarget, maxDistance) {
    var distance = maxDistance || Infinity, tmp, best;

    var possibleHidingPositions = this.hidingPositions(fromTarget, 40);
    for (var i = 0; i < possibleHidingPositions.length; i++) {

        // var axisHelper = new THREE.AxisHelper(50);
        // axisHelper.position.copy(possibleHidingPositions[i]);
        // this.arena.scene.add(axisHelper);

        tmp = this.entity.position.distanceTo(possibleHidingPositions[i]);
        if (tmp < distance) {
            distance = tmp;
            best = possibleHidingPositions[i];
        }
    }

    return best;
};

CoverSystem.prototype.nearestHidingPositionFrom = function(fromTarget, near, maxDistance) {
    var distance = maxDistance || Infinity, tmp, best;

    var possibleHidingPositions = this.hidingPositions(fromTarget, 40);
    for (var i = 0; i < possibleHidingPositions.length; i++) {

        // var axisHelper = new THREE.AxisHelper(50);
        // axisHelper.position.copy(possibleHidingPositions[i]);
        // this.arena.scene.add(axisHelper);

        tmp = near.distanceTo(possibleHidingPositions[i]);
        if (tmp < distance) {
            distance = tmp;
            best = possibleHidingPositions[i];
        }
    }

    return best;
};
