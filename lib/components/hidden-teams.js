'use strict';

var _ = require('lodash');

module.exports = function (arena, options) {

  var teamsVisions = [ 0 ];

  var entities = new Float32Array(0 * 4);
  var kdtree   = new THREE.TypedArrayUtils.Kdtree(entities, distanceFunction, 4); // X, Y, Z, team

  function _removeEntity (e) {
    e = this;
    kdtree.remove(e);
  }

  function _addEntity (e) {
    kdtree.push(e);

    e.on('death', _removeEntity.bind(e));
  }

  arena.on('added:entity', _addEntity);

  function inVisibleTeams (e) {
    return teamsVisions.indexOf(e.state.team) > -1;
  }

  function notInVisibleTeams (e) {
    return teamsVisions.indexOf(e.state.team) === -1;
  }

  function visibility (e) {

    var point     = [ e.position.x, e.position.y, e.position.z, e.state.team ];

    var neighbors = kdtree.nearest(point, 100, 30);

    e.visible = (neighbors && neighbors.length > 0 && _.find(neighbors, notInVisibleTeams));
  }

  arena.on('update', function () {
    _.each( _.filter(arena.entities, notInVisibleTeams), visibility );
  });

};

var distanceFunction = function(a, b) {
  return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
};
