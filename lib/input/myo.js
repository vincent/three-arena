'use strict';

var debug = require('debug')('controls:myo');

var raf = require('raf');

var Myo = require('myo');

var settings = require('../settings');

module.exports = MyoControl;

function MyoControl (arena) {

  // if (settings.data.controls.myoEnabled === null) { return false; }

  this.arena = arena;

  this.enabled = settings.data.controls.myoEnabled;

  this.myo = Myo.create();

  // this.myo.on('gyroscope', this.onGyroscopeData.bind(this));
  this.myo.on('orientation', this.onGyroscopeData.bind(this));
  // this.myo.on('accelerometer', this.onAccelerometerData.bind(this));
  // this.myo.on('imu', this.onIMUData.bind(this));
  // this.myo.on('fingers_spread', this.onFingersSpread.bind(this));



  // myo.on('orientation', function(data){
  //   getFirstOrientation();
  //   var orientationAngles ={
  //     roll : getRoll(myo.lastIMU.orientation),
  //     pitch : getPitch(myo.lastIMU.orientation),
  //     yaw : getYaw(myo.lastIMU.orientation)
  //   };
  //   console.log(firstOrientation);
  // });

  // function getFirstOrientation(){
  //   firstOrientationAngles ={
  //     roll : getRoll(myo.lastIMU.orientation),
  //     pitch : getPitch(myo.lastIMU.orientation),
  //     yaw : getYaw(myo.lastIMU.orientation)
  //   };
  //   for (var i = 0; i < 100; i++) {
  //     firstOrientationAngles.roll  += getRoll(myo.lastIMU.orientation);
  //     firstOrientationAngles.pitch += getPitch(myo.lastIMU.orientation);
  //     firstOrientationAngles.yaw   += getYaw(myo.lastIMU.orientation);
  //   };

  //   firstOrientationAngles.roll /= 100;
  //   firstOrientationAngles.pitch /= 100;
  //   firstOrientationAngles.yaw /= 100;

  //   getFirstOrientation = noop;
  // }

  // function noop(){}

}

// MyoControl.prototype.onFingersSpread = function(edge) {
//   if (!edge) return;

//   // tp selection
//   var spell = null;
//   if (gamepad.inputs.action_1) { spell = this.arena.entity.state.spells[0]; }
//   if (gamepad.inputs.action_2) { spell = this.arena.entity.state.spells[1]; }
//   if (gamepad.inputs.action_3) { spell = this.arena.entity.state.spells[2]; }
//   if (gamepad.inputs.action_4) { spell = this.arena.entity.state.spells[3]; }
//   if (spell) {
//     this.arena.entity.cast(spell, null);
//   }

// };


function getRoll(data){
  var roll = Math.atan2(2.0 * (data.w * data.x + data.y * data.z), 1.0 - 2.0 * (data.x * data.x + data.y * data.y));
  var roll_w = ((roll + Math.PI)/(Math.PI * 2.0) * 18);
  return roll_w;
}

function getPitch(data){
  var pitch = Math.asin(Math.max(-1.0, Math.min(1.0, 2.0 * (data.w * data.y - data.z * data.x))));
  var pitch_w = ((pitch + Math.PI/2.0)/Math.PI * 18);
  return pitch_w;
}

function getYaw(data){
  var yaw = Math.atan2(2.0 * (data.w * data.z + data.x * data.y), 1.0 - 2.0 * (data.y * data.y + data.z * data.z));
  var yaw_w = ((yaw + Math.PI/2.0)/Math.PI * 18);
  return yaw_w;
}


/*
           / z
          / yaw
         /
________/
x roll  \
         \
          \
           \ y pitch
*/



MyoControl.prototype.onIMUData = function(data) {

  // if (! settings.data.controls.myoEnabled) { return false; }

  debug('inputs %o', data);

  if (this.arena.entity && this.arena.entity._crowd_idx !== null) {

    if (! this.arena.paused) {

      this.arena.cameraControls.updateMovementVector();
      this.arena.cameraControls.updateRotationVector();

      this.arena.crowd.requestMoveVelocity(this.arena.entity, {
        x: Math.round(20 * data.orientation.x, 3),
        y: 0.0,
        z: Math.round(20 * data.accelerometer.y, 3)
      });

    }
  }
};

MyoControl.prototype.onGyroscopeData = function(data) {

  // if (! settings.data.controls.myoEnabled) { return false; }

  debug('inputs %o', data);

  if (this.arena.entity && this.arena.entity._crowd_idx !== null) {

    if (! this.arena.paused) {

      this.arena.cameraControls.updateMovementVector();
      this.arena.cameraControls.updateRotationVector();

      this.arena.crowd.requestMoveVelocity(this.arena.entity, {
        x: Math.round(20 * data.x, 3),
        y: 0.0,
        z: Math.round(20 * data.y, 3)
      });

    }
  }
};