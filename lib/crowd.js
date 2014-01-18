'use strict';

var debug = require('debug')('crowd');
var settings = require('./settings');

var _ = require('lodash');

module.exports = Crowd;

/**
 * @exports threearena/elements/crowd
 */
function Crowd (game) {

  this.game = game;

  this.agents = {};

  ///////////////

  // this.MAX_VELOCITY_VECTOR = new THREE.Vector3();

  this.game.on('update', this.update.bind(this));
}

Crowd.prototype.removeAgent = function(entity) {

  this.game.pathfinder.removeCrowdAgent(entity._crowd_idx);
};

Crowd.prototype.addAgent = function(entity, options, destination, follow) {

  var self = this;

  // add the recast navigation
  self.game.pathfinder.addCrowdAgent(crowdOptions(options), function(idx){

    // keep the idx
    idx = parseInt(idx, 0);
    entity._crowd_idx = idx;
    self.agents[''+idx] = entity;

    debug('%o assigned to crowd agent #%d', entity, idx);

    // listen on entity events
    entity.on('death', function() {
      self.removeAgent(entity);
    });
    
    entity.on('destination', function(destination) {
      entity._crowd_following = null;
      entity._crowd_destination = destination;
      self.game.pathfinder.crowdRequestMoveTarget(idx, entity._crowd_destination.position);
      debug('%o walk towards %o', entity, destination);
    });

    entity.on('follow', function(following) {
      entity._crowd_destination = null;
      entity._crowd_following = following;
      self.game.pathfinder.crowdRequestMoveTarget(idx, entity._crowd_following.position);
      debug('%o follows %o', entity, following);
    });

    entity.on('nodestination', function() {
      entity._crowd_destination = null;
      entity._crowd_following = null;
    });

    entity.on('unfollow', function() {
      entity._crowd_destination = null;
      entity._crowd_following = null;
    });

    if (destination) {
      entity.emit('destination', destination);
    }

    if (follow) {
      entity.emit('follow', follow);
    }
  });
};

Crowd.prototype.update = function() {

  var self = this;

  if (_.size(self.agents) > 0) {

    // check all agents state
    _.forEach(self.agents, function(entity, idx){
      idx = parseInt(idx, 0);

      // update dirty params
      if (entity._crowd_params_need_update) {
        debug('update crowd params for %o', entity);
        entity._crowd_params_need_update = false;
        // self.game.pathfinder.updateCrowdAgentParameters(idx, crowdOptions(entity.state));
        var oldFoll = entity._crowd_following;
        var oldDest = entity._crowd_destination;
        self.addAgent(entity, entity.state, oldDest, oldFoll);
      }

      // update dirty follow
      if (entity._crowd_following) { // TODO: also use a _dirtyMove flag ?
        self.game.pathfinder.crowdRequestMoveTarget(idx, entity._crowd_following.position);
      }
    });

    // update the crowd
    self.game.pathfinder.crowdUpdate(this.game.delta * 2 /* FIXME: why ? */, function(agents){
      _.forEach(agents, function(agent){

        if (! agent.active) {
          return;
        }

        var idx = agent.idx;
        var entity = self.agents[idx];
        var velocity = new THREE.Vector3(agent.velocity.x, 0, agent.velocity.z);
        var speed = velocity.length();

        entity.isMoving = speed > 0;

        if (!agent || entity.isDead()) {
          self.removeAgent(entity);
          return;
        }

        var destination = entity._crowd_following || entity._crowd_destination;
        var destinationRadius = (destination && destination.state ? destination.state.radius : null);

        if (destinationRadius !== null && entity.position.distanceTo(destination.position) < agent.radius + destinationRadius) {

          if (entity.character.controls) { entity.character.controls.moveForward = false; }
          entity.character.setAnimation('stand');

        } else {

          // update back entity position & rotation
          entity.position.copy(agent.position);

          if (speed > 1.0) {

            if (entity.character.controls) { entity.character.controls.moveForward = true; }
            entity.character.setAnimation('run');

          } else {

            if (entity.character.controls) { entity.character.controls.moveForward = false; }
            entity.character.setAnimation('stand');
          }
        }

        if (speed > 0.05) {
          var angle = Math.atan2(-velocity.z, velocity.x);
          // _.each(entity.character.meshes, function(m){ m.rotation.y = angle; });

          entity.rotation.y = angle;
        }

      });
    });
  }
};


function crowdOptions(options) {
  return options = _.merge({
    position: { x:0, y:0, z:0 },
    separationWeight: settings.data.crowdDefaultSeparationWeight,
    maxAcceleration: settings.data.crowdDefaultMaxAcceleration,
    updateFlags: settings.data.crowdDefaultUpdateFlags,
    maxSpeed: settings.data.crowdDefaultMaxSpeed,
    radius: settings.data.crowdDefaultRadius,
    height: settings.data.crowdDefaultHeight
  }, {
    position: options.position,
    separationWeight: options.separationWeight,
    maxAcceleration: options.maxAcceleration,
    updateFlags: options.updateFlags,
    maxSpeed: options.maxSpeed,
    radius: options.radius,
    height: options.height
  });
}
