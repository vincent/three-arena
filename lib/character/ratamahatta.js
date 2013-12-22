'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = Ratamahatta;

/**
 * @exports threearena/character/ratamahatta
 * 
 * @constructor
 */
function Ratamahatta ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    name: 'Ratamahatta',
    image: '/gamedata/models/ogro/portrait.gif',

    modelOptions: {
      baseUrl: '/gamedata/models/ratamahatta/',

      body: 'ratamahatta.js',
      skins: [ 'ratamahatta.png', 'ctf_b.png', 'ctf_r.png', 'dead.png', 'gearwhore.png' ],
      weapons:  [
        [ 'weapon.js', 'weapon.png' ],
        [ 'w_bfg.js', 'w_bfg.png' ],
        [ 'w_blaster.js', 'w_blaster.png' ],
        [ 'w_chaingun.js', 'w_chaingun.png' ],
        [ 'w_glauncher.js', 'w_glauncher.png' ],
        [ 'w_hyperblaster.js', 'w_hyperblaster.png' ],
        [ 'w_machinegun.js', 'w_machinegun.png' ],
        [ 'w_railgun.js', 'w_railgun.png' ],
        [ 'w_rlauncher.js', 'w_rlauncher.png' ],
        [ 'w_shotgun.js', 'w_shotgun.png' ],
        [ 'w_sshotgun.js', 'w_sshotgun.png' ]
      ],
    },

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  this.character = new THREE.MD2Character();

  this.character.scale = 0.14;

  this.character.controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false
  };

  Ratamahatta.prototype.onLoadComplete = function() {

    self.add(self.character.root);

    if (options.onLoad) { options.onLoad.apply(self); }
  };

  this.character.loadParts( options.modelOptions );
}

inherits(Ratamahatta, Character);
