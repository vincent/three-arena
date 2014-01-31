'use strict';

/**
 * @exports Settings
 * 
 */

var EventEmitter = require('events').EventEmitter;
var settings = new EventEmitter();

module.exports = settings;

settings.CAMERA_MANUAL = 1;
settings.CAMERA_FOLLOW = 2;

settings.QUALITY_LOW  = 1;
settings.QUALITY_HIGH = 2;
settings.QUALITY_BEST = 3;

settings.data = {

  /**
   * Rendering quality
   * @type {Number}
   */
  quality: 2,

  /**
   * Framerate
   * @type {Number}
   */
  framerate: 60,

  /**
   * Desired framerate
   * @type {Float}
   */
  timestep: 1000/60,

  /**
   * Max updates per frame, after which a frame will be considered "slow"
   * @type {Number}
   */
  maxUpdatesPerFrame: 15,

  /**
   * Camera type
   * @type {Number}
   */
  cameraType: settings.CAMERA_FOLLOW,

  /**
   * Aliasing setting
   * @type {Boolean}
   */
  antialias: false,

  /**
   * Camera field of view
   * @type {Number}
   */
  cameraFov: 50,
  cameraOverlay: true,
  cameraGrid: 0,

  /**
   * Default camera height
   * @type {Number}
   */
  cameraHeight: 180,
  godMode: false,

  /**
   * Crowd default settings
   * @type {Float}
   */
  crowdDefaultSeparationWeight: 20.0,
  crowdDefaultMaxAcceleration: 8.0,
  crowdDefaultUpdateFlags: 0,
  crowdDefaultMaxSpeed: 10.0,
  crowdDefaultRadius: 2.0,
  crowdDefaultHeight: 3.0,

  /**
   * Fog color
   * @type {Hex}
   */
  fogColor: 0x000000,
  /**
   * For near setting
   * @type {Float}
   */
  fogNear: 20,
  /**
   * Fog far setting
   * @type {Float}
   */
  fogFar: 1000,

  /**
   * Ambient light color
   * @type {Hex}
   */
  lightAmbientColor: 0xffffff,

  /**
   * Point light color
   * @type {Hex}
   */
  lightPointColor: 0xffffff,
  /**
   * Point light intensity
   * @type {Float}
   */
  lightPointIntensity: 5,
  /**
   * Point light distance
   * @type {Float}
   */
  lightPointDistance: 250,
  /**
   * Point light angle
   * @type {Float}
   */
  lightPointAngle: 0.5,

  /**
   * Directionnal light color
   * @type {Hex}
   */
  lightDirectionalColor: 0xffffff,
  /**
   * Directionnal light intensity
   * @type {Float}
   */
  lightDirectionalIntensity: 2,
  /**
   * Directionnal light distance
   * @type {Float}
   */
  lightDirectionalDistance: 250,
  /**
   * Directionnal light shadows
   * @type {Boolean}
   */
  lightDirectionalShadows: true,

  keys: {
    MOVE_BUTTON: 2,
    BEGIN_SELECTION: 0
  },

  /**
   * HUD border detection percentage. When the mouse is this screen border width percentage, the camera will follow.
   * @type {Float}
   */
  hudMouseBorderDetection: 20,

  /**
   * Visible characters helpers. If true, characters bounding boxes and radius are visible.
   * @type {Boolean}
   */
  visibleCharactersHelpers: false,

  /**
   * Visible characters paths. If true, current routes are visible.
   * @type {Boolean}
   */
  visibleCharactersRoutes: false,

  /**
   * The canvas container
   * @type {String|DOM Node}
   */
  container: null,

  /**
   * Preload resources array
   * @type {Array}
   */
  preload: [],

  positionOrigin: new THREE.Vector3( 0, 0, 0 ),

};


