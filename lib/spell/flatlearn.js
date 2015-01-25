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
    name: 'flatlearn'
  });

  Spell.apply(this, [ options ]);

  var texture = THREE.ImageUtils.loadTexture( '/gamedata/textures/summoning_circles/circle4.bold.png' );
  texture.needsUpdate = true;

  var geometry = new THREE.PlaneGeometry(10, 10, 1, 1);
  var material = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    transparent: true,
    color: 0xF7FA25,
    opacity: 0.9,
    map: texture
  });

  this.aura1 = new THREE.Mesh( geometry, material );
  this.aura2 = new THREE.Mesh( geometry, material );
  this.aura3 = new THREE.Mesh( geometry, material );
  this.aura4 = new THREE.Mesh( geometry, material );

  this.aura1.rotation.x = - Math.PI / 2;
  this.aura2.rotation.x = - Math.PI / 2;
  this.aura3.rotation.x = - Math.PI / 2;
  this.aura4.rotation.x = - Math.PI / 2;
}

inherits(FlatFireAura, Spell);

FlatFireAura.prototype.name = 'fireaura';

FlatFireAura.prototype.start = function (caster, target) {

  var self = this;

  var update = function(game){
    self.aura1.position.y += 0.6 * Math.sin(self.aura2.position.y * 0.3);
    self.aura2.position.y += 0.6 * Math.cos(self.aura1.position.y * 0.3);
    self.aura3.position.y += 0.6 * Math.sin(self.aura4.position.y * 0.3);
    self.aura4.position.y += 0.6 * Math.cos(self.aura3.position.y * 0.3);

    self.aura1.material.opacity -= 0.01;
  };

  caster.game.on('update', update);

  caster.add(self.aura1);
  caster.add(self.aura2);
  caster.add(self.aura3);
  caster.add(self.aura4);

  setTimeout(function(){
    caster.remove(self.aura1);
    caster.remove(self.aura2);
    caster.remove(self.aura3);
    caster.remove(self.aura4);
    caster.game.removeListener('update', update);
  }, 2000);
};
