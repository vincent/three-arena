'use strict';

var _ = require('lodash');

module.exports = function (arena, options) {

  var teamsVisions = [ 0 ];

  /* * /
  var entities = new Float32Array( 1000 * 4 );
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

  /* */

  function inVisibleTeams (e) {
    return teamsVisions.indexOf(e.state.team) > -1;
  }

  function notInVisibleTeams (e) {
    return teamsVisions.indexOf(e.state.team) === -1;
  }

  function notInCurrentTeam (e) {
    return e.state.team !== arena.entity.state.team;
  }

  function notInCurrentVisibleTeamAndInRangeOf (other) {
    var ennemy = this;
    return other !== ennemy && inVisibleTeams(other) && other.position.distanceTo(ennemy.position) < 50;
  }

  function inRangeOfSomeoneInCurrentTeam (ennemy) {

    // var point      = [ ennemy.position.x, ennemy.position.y, ennemy.position.z, ennemy.state.team ];
    // var neighbors  = kdtree.nearest(point, 100, 30);
    // ennemy.visible = (neighbors && neighbors.length > 0 && _.find(neighbors, notInVisibleTeams));

    return !! _.find(arena.entities, notInCurrentVisibleTeamAndInRangeOf.bind(ennemy));
  }

  function updateVisibility () {
    _.each(arena.entities, function (e) {
      if (inVisibleTeams(e)) {
        e.visible = true;
      }
      else if (notInCurrentTeam(e)) {
        e.visible = inRangeOfSomeoneInCurrentTeam(e);
        if (e.lifebar) {e.lifebar.visible = e.visible;}
        if (e.nameMesh) {e.nameMesh.visible = e.visible;}
      }
      else {
        e.visible = false;
      }

    });
  }

  arena.on('update', _.throttle(updateVisibility, 200, {
    trailing: false
  }));

};

var distanceFunction = function(a, b) {
  return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
};
