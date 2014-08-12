'use strict';

var _ = require('lodash');
var ko = require('knockout');

var Entity = require('../entity');
var Utils = require('../utils');

module.exports = EntityViewModel;

/**
 * @exports threearena/views/entityview
 */
function EntityViewModel (entity, game) {

  var self = this;

  _.each(entity.state, function(v, k) {
    self[k] = ko.observable(v); // .extend({notify: 'always'});

    // FIXME: Does not work because entity.spells[i].ccd is not an observable

  });

  this.xpprogress = ko.computed(function() {
    return 'n/a';
  }, this);

  ////////////////////////////////     
  this.update = function(values) { /// FIXME !!!!
    _.each(entity.state, function(v, k) {
      if (typeof self[k] !== 'undefined') {
        self[k](v);
      }
    });
  };

  // called from hud
  this.cast = function(spell, event) {
    if (spell.needsTarget) {

      game.waitForEntitySelection(function(targets){
        var target = Utils.childOf(targets[0].object, Entity);

        if (target && target instanceof Entity) {

          if (spell.canHit(entity, target)) {
            entity.cast(spell, target);

          } else {
            console.log('C\'est trop loin !');
          }
        }
      });

    } else if (spell.needsTargetZone) {

      spell.prepare();

      var updateZoneSelector = function() {
        spell.updateZoneSelector(entity, game);
      };

      game.waitForZoneSelection(function(targets){

        game._currentZoneSelector.off('update', updateZoneSelector);

        var target = { position: targets[0].point };

        if (target) {

          if (spell.canHit(entity, target)) {
            entity.cast(spell, target);

          } else {
            console.log('C\'est trop loin !');
          }
        }
      });

      game._currentZoneSelector.on('update', updateZoneSelector);

    } else {
      entity.cast(spell, null);
    }
  };

  entity.on('changed', this.update.bind(this));
}