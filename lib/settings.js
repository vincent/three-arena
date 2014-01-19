'use strict';

var EventEmitter = require('events').EventEmitter;
var settings = new EventEmitter();

module.exports = settings;

settings.CAMERA_MANUAL = 1;
settings.CAMERA_FOLLOW = 2;

settings.QUALITY_LOW  = 1;
settings.QUALITY_HIGH = 2;
settings.QUALITY_BEST = 3;

settings.data = {

  quality: 2,

  framerate: 60,
  timestep: 1000/60,
  maxUpdatesPerFrame: 15,

  cameraType: settings.CAMERA_FOLLOW,
  antialias: false,
  cameraFov: 50,
  cameraOverlay: true,
  cameraGrid: 0,
  cameraHeight: 180,
  godMode: false,

  crowdDefaultSeparationWeight: 20.0,
  crowdDefaultMaxAcceleration: 8.0,
  crowdDefaultUpdateFlags: 0,
  crowdDefaultMaxSpeed: 10.0,
  crowdDefaultRadius: 2.0,
  crowdDefaultHeight: 3.0,

  fogColor: 0x000000,
  fogNear: 20,
  fogFar: 1000,

  lightAmbientColor: 0xffffff,

  lightPointColor: 0xffffff,
  lightPointIntensity: 5,
  lightPointDistance: 250,
  lightPointAngle: 0.5,
  
  lightDirectionalColor: 0xffffff,
  lightDirectionalIntensity: 2,
  lightDirectionalDistance: 250,
  lightDirectionalShadows: true,

  keys: {
    MOVE_BUTTON: 2,
    BEGIN_SELECTION: 0
  },

  hudMouseBorderDetection: 20,

  // HELPERS
  visibleCharactersHelpers: true,

  container: null,
  splashContainer: null,

  positionOrigin: new THREE.Vector3( 0, 0, 0 )

};


