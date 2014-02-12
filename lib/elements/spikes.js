'use strict';

var inherits = require('inherits');

var TWEEN = require('tween');

var Spell = require('../spell');

module.exports = Spikes;

/**
 * @exports threearena/elements/spikes
 * 
 * @constructor
 */
function Spikes (options) {

  var self = this;
  
  THREE.Object3D.apply(this);

  options = options || {};

  this.spell = new Spell({
    name: 'spike',
    source: self,
    meleeLifeDamage: 20,
    magicLifeDamage: 0,
    manaDamage: 0,
  });

  var material = new THREE.MeshBasicMaterial({ color: '#EFEFEF', morphTargets: true });

  var loader = new THREE.JSONLoader();
  loader.load('/gamedata/models/spikes/spikes.js', function ( geometry ) {
    
    self.mesh = new THREE.Mesh( geometry, material );
    self.mesh.morphTargetInfluences[0] = 1.1;
    self.mesh.position.y = -1;

    self.spikeOff().start();

    self.add(self.mesh);

    window._ta_events.on('update', self.update.bind(self));

    if (options.onLoad) { options.onLoad(); }
  });
}

inherits(Spikes, THREE.Object3D);

Spikes.prototype.spikeOn = function() {

  var self = this;
  
  return new TWEEN.Tween({ distance: 1.0 })
    .to({ distance: -1.0 }, 200)
    .onUpdate(function(){
      self.mesh.morphTargetInfluences[0] = this.distance;
    })
    .onComplete(function(){
      setTimeout(function(){
        self.spikeOff().start();
      }, 2000);
    });
};

Spikes.prototype.spikeOff = function() {

  var self = this;

  return new TWEEN.Tween({ distance: -1.0 })
    .to({ distance: 1.0 }, 500)
    .onUpdate(function(){
      self.mesh.morphTargetInfluences[0] = this.distance;
    })
    .onComplete(function(){
      self._firing = false;
    });
};

Spikes.prototype.update = function(arena) {

  if (this._firing) { return; }

  var self = this;

  for (var i = 0; i < arena.entities.length; i++) {
    if (arena.entities[i].isDead()) { continue; }

    if (arena.entities[i].position.distanceTo(self.position) < 6.0) {
      if (! self._firing) {
        self._firing = true;
        self.spikeOn().start();
      }

      arena.entities[i].hit(this.spell);
    }
  }
};
