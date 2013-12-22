'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Spell = require('../spell');

module.exports = FlatFireAura;

/**
 * @exports threearena/spell/flatfireaura
 */
function FlatFireAura (options) {

  options = _.merge({}, options, {
    name: 'fireaura'
  });

  Spell.apply(this, [ options ]);

  var texture = THREE.ImageUtils.loadTexture( '/gamedata/textures/summoning_circles/circle4.bold.png' );
  texture.needsUpdate = true;

  var geometry = new THREE.PlaneGeometry(30, 30, 1, 1);
  var material = new THREE.MeshBasicMaterial({
    color: 0xdd0202,
    transparent: true,
    map: texture,
    blending: THREE.AdditiveBlending,
  });

  this.aura = new THREE.Mesh( geometry, material );
  this.aura.position.y = 1;
  this.aura.rotation.x = - 90 * Math.PI / 180;
  this.aura.receiveShadow = true;
}

inherits(FlatFireAura, Spell);

FlatFireAura.prototype.name = 'fireaura';

FlatFireAura.prototype.start = function (caster, target) {
  var self = this;

  var update = _.bind(function(game){
    this.aura.rotation.z += game.delta; // * 100 * Math.PI / 180;
  }, self);

  caster.add(this.aura);
  window._ta_events.on('update', update);

  setTimeout(function(){
    caster.remove(self.aura);
    window._ta_events.removeEventListener('update', update);
  }, 5000);
};
