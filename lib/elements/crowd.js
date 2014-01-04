'use strict';

var _ = require('lodash');

module.exports = Crowd;

/**
 * @exports threearena/elements/bufficon
 */
function Crowd (game) {

  var self = this;

  this.game = game;
  this.agents = {};

  this.game.on('update', function(game) {
    self.updateTarget(self.game.pcs[0].position);

    self.game.pathfinder.crowdUpdate(game.delta, function(agents){
      _.forEach(agents, function(agent, idx){
        self.agents[idx].position.copy(agent.position);
      });
    });
  });
}

Crowd.prototype.add = function(entity, options) {

  var self = this;

  options = _.merge({
    position: { x:44.438741, y:0, z:-41.74593 },
    radius: 5.0,
    height: 1.0,
    maxAcceleration: 8.0,
    maxSpeed: 3.5,
    separationWeight: 20.0,
    updateFlags: 0
  }, options);

  this.game.pathfinder.addCrowdAgent(options, function(idx){
    self.agents[idx] = entity;
  });
};

Crowd.prototype.updateTarget = function(position) {

  var self = this;

  _.forEach(this.agents, function(agent, idx){
    self.game.pathfinder.crowdRequestMoveTarget(parseInt(idx, 0), position);
  });
};