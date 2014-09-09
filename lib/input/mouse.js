'use strict';

var debug = require('debug')('controls:mouse');

var settings = require('../settings');

var Utils = require('../utils');
var Entity = require('../entity');
var Terrain = require('../elements/terrain');
var Collectible = require('../elements/collectible');
var InteractiveObject = require('../elements/interactiveobject');

module.exports = MouseControl;

function MouseControl (arena) {

  this.arena = arena;

  this.enabled = settings.data.controls.mouseEnabled;

  this.arena.settings.container.addEventListener('mouseup', this._onDocumentMouseUp.bind(this), false);
  this.arena.settings.container.addEventListener('mousedown', this._onDocumentMouseDown.bind(this), false);
  this.arena.settings.container.addEventListener('mousemove', this._onDocumentMouseMove.bind(this), false);
  // this.arena.settings.container.addEventListener('mousewheel', this._onMouseScroll.bind(this), false );
  this.arena.settings.container.addEventListener('wheel', this._onMouseScroll.bind(this), false );
  $(this.arena.settings.container).bind('DOMMouseScroll', this._onMouseScroll.bind(this), false ); // firefox
}

/**
 * Mouse scroll listener
 * 
 * @private
 */
MouseControl.prototype._onMouseScroll = function(event) {

  if (! settings.data.controls.mouseEnabled) { return false; }

  this.arena.zoom(event.wheelDeltaY || event.deltaY);
};

/**
 * Mouse click listener
 * 
 * @private
 */
MouseControl.prototype._onDocumentMouseUp = function(event) {

  if (! settings.data.controls.mouseEnabled) { return false; }
  
  // disable gamepad
  settings.data.controls.gamepadEnabled = false;

  var self = this.arena;
  //event.preventDefault();

  var intersects = self.raycast(event, self.intersectObjects);

  if (intersects.length > 0) {

    var ipos = intersects[0].point;

    debug('intersect at %o', ipos);

    var character = self.entity;

    // ends a ground selection
    if (self._inGroundSelection) {

      var selection = {
        begins: self._inGroundSelection.ground,
        ends: intersects[0].point
      };

      self._inGroundSelection = null;
      $('#selection-rectangle').hide();

      self.unselectCharacters();
      self.selectCharactersInZone(selection.begins, selection.ends);

    // Mark some polys as not walkable
    } else if (event.button === 0 && event.shiftKey &&
      intersects[0].object && Utils.childOf(intersects[0].object, Terrain)) {

      self.pathfinder.setPolyUnwalkable(
        ipos.x, ipos.y, ipos.z,
        5, 5, 5,
        0
      );

    } else if (self._testKey(event.button, 'MOVE_BUTTON') &&
      intersects[0].object && Utils.childOf(intersects[0].object, Terrain)) {

      self.endAllInteractions();

      self.destinationMarker.position.copy(ipos);
      self.destinationMarker.animate();

      if (character) {
        debug('update %o target: %o', character, ipos);

        // append: event.shiftKey,
        // yoyo: event.ctrlKey

        character.setTarget({
          position: ipos,
          entity: null,
          event: event,
          options: {}
        });
      }

    } else if (self._waitForEntitySelection) {

      var callback = self._waitForEntitySelection;
      self._waitForEntitySelection = null;
      self.unselectCharacters();

      callback(intersects);

    } else if (self._waitForZoneSelection) {

      var callback = self._waitForZoneSelection;
      self.waitForZoneSelection(null);

      callback(intersects);

    } else {

      var objectTarget, actionTaken = false;

      // user clicked something
      if (intersects[0].object && intersects[0].object) {

        for (var i = 0; i < intersects.length; i++) {

          if (actionTaken) { break; }

          // maybe an entity ?
          objectTarget = Utils.childOf(intersects[i].object, Entity);

          // it's an entity
          if (objectTarget) {
            debug('clicked an entity %o', objectTarget);

            // cast the first possible spell 
            for (var s = 0; s < character.state.spells.length; s++) {
              var spell = character.state.spells[s];
              var potentialDamage = spell.meleeLifeDamage + spell.magicLifeDamage + spell.manaDamage;

              if (potentialDamage > 0 && spell.canHit(character, objectTarget)) {

                // character.lookAt(objectTarget.position);
                character.cast(spell, objectTarget);
                actionTaken = true;

                debug('cast %o on %o', spell, objectTarget);
                break;

              } else {
                debug('cannot cast %o on %o', spell, objectTarget);
              }
            }

            if (! actionTaken && objectTarget.dialog) {
              self.startInteraction(objectTarget);
            }

          }

          if (actionTaken) { break; }

          // maybe an interactive object
          objectTarget = Utils.childOf(intersects[i].object, InteractiveObject);

          if (objectTarget) {
            debug('clicked an interactive %o', objectTarget);

            if (objectTarget.isNearEnough(character)) {
              self.startInteraction(objectTarget);
              actionTaken = true;

            } else {
              debug('C\'est trop loin !');
              character.emit('destination', objectTarget);
            }
          }

          if (actionTaken) { break; }

          // maybe a collectible object
          objectTarget = Utils.childOf(intersects[i].object, Collectible);

          if (objectTarget) {
            debug('clicked a collectible %o', objectTarget);

            if (objectTarget.isNearEnough(character)) {
              objectTarget.collectedBy(character, function (err, eventData) {
                if (err) {
                  debug('%o cannot collect from %o', character, objectTarget);
                } else {
                  actionTaken = true;
                  debug('%o collected %o %o from %o', character, eventData.amount, eventData.kind, objectTarget);
                }
              });

            } else {
              debug('C\'est trop loin !');
              character.emit('destination', objectTarget);
            }
          }


        }
      }
    }

  } else {
    debug('no intersect');
  }
};


/**
 * MouseDown event listener
 * 
 * @private
 * @param  {Event} event
 */
MouseControl.prototype._onDocumentMouseDown = function(event) {

  if (! settings.data.controls.mouseEnabled) { return false; }

  var self = this.arena;
  //event.preventDefault();

  // for now, just discard during a click-selection 
  if (self._waitForEntitySelection) { return; }

  // intersect everything ... only the ground
  var intersects = self.raycast(event, self.intersectObjects);

  // .. but check if the ground if the first intersection
  // TODO: find another way to check ==ground
  if (intersects.length > 0 && self._testKey(event.button, 'BEGIN_SELECTION') &&
      Utils.childOf(intersects[0].object, Terrain)) {
    // begins a selection
    this._inGroundSelection = {
      screen: { x: event.clientX, y: event.clientY },
      ground: intersects[0].point.clone()
    };
  }
};

/**
 * MouseMove event listener
 * 
 * @private
 */
MouseControl.prototype._onDocumentMouseMove = function(event) {

  if (! settings.data.controls.mouseEnabled) { return false; }

  this.arena.updateSelectionCoords(event.clientX, event.clientY);
};