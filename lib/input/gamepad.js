'use strict';

var debug = require('debug')('controls:gamepad');

var raf = require('raf');

var gamepad = require('gp-controls')({

  '<axis-left-x>': 'move_x',
  '<axis-left-y>': 'move_y',

  // '<axis-right-x>': 'move_x',
  // '<axis-right-y>': 'move_y',

  '<action 1>': 'action_1',
  '<action 2>': 'action_2',
  '<action 3>': 'action_3',
  '<action 4>': 'action_4',

  '<shoulder-top-left>': 'camera_zoom_out',
  // '<shoulder-top-right>': '',
  '<shoulder-bottom-left>': 'camera_zoom_in',
  // '<shoulder-bottom-right>': '',

  '<meta 1>': 'meta1',
  '<meta 2>': 'meta2',

  // '<stick-button 1>': '',
  // '<stick-button 2>': '',

  '<up>': 'camera_up',
  '<down>': 'camera_down',
  '<left>': 'camera_left',
  '<right>': 'camera_right',

});

var settings = require('../settings');

module.exports = GamepadControl;

function GamepadControl (arena) {

  if (settings.data.controls.gamepadEnabled === null) { return false; }

  this.arena = arena;

  this.enabled = settings.data.controls.mouseEnabled;

  raf(this.arena.settings.container).on('data', this.poll.bind(this));
}

GamepadControl.prototype.poll = function() {

  if (! settings.data.controls.gamepadEnabled) { return false; }

  gamepad.poll();

  debug('inputs %o', gamepad.inputs);

  if (this.arena.entity && this.arena.entity._crowd_idx !== null && gamepad.enabled) {

    if (gamepad.inputs.meta1) {
      this.arena[ this.arena.paused ? 'resume' : 'pause' ]();
    
    } else if (! this.arena.paused) {

      this.arena.cameraControls.moveState.left = gamepad.inputs.camera_left;
      this.arena.cameraControls.moveState.right = gamepad.inputs.camera_right;
      this.arena.cameraControls.moveState.forward = gamepad.inputs.camera_up;
      this.arena.cameraControls.moveState.back = gamepad.inputs.camera_down;

      this.arena.zoom( 100 * gamepad.inputs.camera_zoom_in - 100 * gamepad.inputs.camera_zoom_out );

      this.arena.cameraControls.updateMovementVector();
      this.arena.cameraControls.updateRotationVector();

      var spell = null;
      if (gamepad.inputs.action_1) { spell = this.arena.entity.state.spells[0]; }
      if (gamepad.inputs.action_2) { spell = this.arena.entity.state.spells[1]; }
      if (gamepad.inputs.action_3) { spell = this.arena.entity.state.spells[2]; }
      if (gamepad.inputs.action_4) { spell = this.arena.entity.state.spells[3]; }
      if (spell) {
        this.arena.entity.cast(spell, null);
      }

      this.arena.crowd.requestMoveVelocity(this.arena.entity, {
        x: Math.round(20 * gamepad.inputs.move_x, 3),
        y: 0.0,
        z: Math.round(20 * gamepad.inputs.move_y, 3)
      });

    }
  }
};