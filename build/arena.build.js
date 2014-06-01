;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('debug').enable(d(''));

module.exports = {
  Arena: require('./lib/index.js')
};


function d(enabled){
  if (enabled || !location) { return enabled; }
  var m = /&?d=([^&]+)/g.exec(location.search);
  if (m) {
    return m[1].replace(/%20|\+/g,' ');
  } else {
    return '';
  }
}

},{"./lib/index.js":46,"debug":73}],2:[function(require,module,exports){
module.exports = {
  Controlled: require('./controlled'),
  Collector: require('./collector'),
  Minion: require('./minion')
};
},{"./collector":3,"./controlled":4,"./minion":5}],3:[function(require,module,exports){
module.exports = {
  identifier: 'idle',
  strategy: 'sequential',
  children: [
    { identifier: 'depositToNearestCollector' },
    { identifier: 'findNearestCollector' },
    { identifier: 'collect' },
    { identifier: 'findNearestCollectible' },
  ]
};

},{}],4:[function(require,module,exports){
module.exports = {
  identifier: 'idle',
  strategy: 'prioritised',
  children: [
    { identifier: 'moveAttackToObjective' },
    { identifier: 'plotCourseToObjective' },
  ]
};

},{}],5:[function(require,module,exports){
module.exports = {
  identifier: 'nothing',
  strategy: 'prioritised',
  children: [
    { identifier: 'beDead' },
    { identifier: 'fightNearbyEnnemy' },
    { identifier: 'fightObjective' },
    { identifier: 'followCourseToObjective' },
    { identifier: 'plotCourseToObjective' }
  ]
};

},{}],6:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var debug = require('debug')('character');

var Entity = require('./entity');
var Utils = require('./utils');

module.exports = Character;

/** 
 * A module representing a character.
 * 
 * @exports Character
 * 
 * @constructor
 */
function Character (options) {

  Entity.apply( this, [ options ]);

  /*

  Strength is a measure of a Hero's toughness and endurance. Strength determines a Hero's maximum health and health regeneration. Heroes with strength as their primary attribute can be hard to kill, so they will often take initiator and tank roles, initiating fights and taking most of the damage from enemy attacks.
  Every point in strength increases maximum health by 19.
  Every point in strength increases health regeneration by 0.03 HP per second.
  If strength is a Hero's primary attribute, every point in strength increases his or her attack damage by 1.

  Agility is a measure of a Hero's swiftness and dexterity. Agility determines a Hero's armor and attack speed. Heroes with agility as their primary attribute tend to be more dependent on their auto-attacks and items, and are usually capable of falling back on their abilities in a pinch. Agility Heroes often take carry and Gank roles.
  Every 7 points in agility increases a Hero's armor by 1.
  Every point in agility increases a Hero's attack speed by 1.
  If agility is a Hero's primary attribute, every point in agility increases his or her attack damage by 1.

  Intelligence
  Intelligence is a measure of a Hero's wit and wisdom. Intelligence determines a Hero's maximum mana and mana regeneration. Heroes with intelligence as their primary attribute tend to rely on their abilities to deal damage or help others. Intelligence Heroes often take support, gank, and pusher roles.
  Every point in intelligence increases a Hero's maximum Mana by 13.
  Every point in intelligence increases a Hero's mana regeneration by 0.04 mana per second.
  If intelligence is a Hero's primary attribute, every point in intelligence increases his or her attack damage by 1.

  */
}

inherits(Character, Entity);

////////////////

Character.prototype.update = function(game) {

  this.character.update(game.delta);
};

/**
 * Make the character move along a path
 * @param  {Array|THREE.Shape} linepoints the shape or the points the character will walk along
 * @param  {Object} options { start onStart onComplete onUpdate}
 * @return {Tween} the Tween.js object
 */
Character.prototype.moveAlong = function(linepoints, options) {

  var self = this;
  
  options = _.merge({
    append: false,
    speed: this.state.speed,
    onStart: function(){
      self.character.controls.moveForward = true;
      self.character.setAnimation('run');
    },
    onComplete: function(){
      self._forwardRoutes = Math.max(self._forwardRoutes - 1, 0);
      if (self._forwardRoutes <= 0) {
        self.character.controls.moveForward = false;
        self.character.setAnimation('stand');
        delete self._currentTweenDestination;
      }
    },
    onUpdate: function(tween, shape) {

      if (self.isDead()) {
        self.character.setAnimation('stand');
        self._currentTween.stop();
        return;
      }

      if (self.character.activeAnimation !== 'run') {
        self.character.setAnimation('run');
      }

      // get the orientation angle quarter way along the path
      var tangent = shape.getTangent(tween.distance);
      var angle = Math.atan2(-tangent.z, tangent.x);

      // set angle of the character at that position
      // self.rotation.y = angle;
      _.each(self.character.meshes, function(m){ m.rotation.y = angle; });
    }
  }, options);

  // stop current move
  if (self._currentTween && options.append) {

    options.start = self._forwardRoutes < 1;
    self._forwardRoutes += 1;

    var tween = Utils.moveAlong(self, linepoints, options);
    self._currentTween.chain(tween);
    self._currentTween = tween;

  } else {

    if (self._currentTween && self._currentTween.stop) {
      self._currentTween.stop();
    }
    self._forwardRoutes = 1;
    self._currentTween = Utils.moveAlong(self, linepoints, options);
  }

  return self._currentTween;
};

////////////////

Character.prototype.constructor = Character;

},{"./entity":41,"./utils":66,"debug":73,"inherits":74,"lodash":85}],7:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = ZeroZeroSeven;

/**
 * @exports threearena/character/007
 * 
 * @constructor
 * 
 * @param {Object} options options
 * @param {object=} options.name Character name
 * @param {object=} options.image Path to character portrait
 * @param {object=} options.life Character Base life
 * @param {object=} options.mana Character Base mana
 * 
 * @extends {module:threearena/entity}
 */
function ZeroZeroSeven ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    maxAcceleration: 15.0,
    maxSpeed: 20.0,
    radius: 2.5,

    name: 'ZeroZeroSeven',
    image: '/gamedata/models/007/portrait.gif',

    modelOptions: {
      baseUrl: '/gamedata/models/007/',
      body: '007.js',
      skins: [
        '007base.png'
      ],
      weapons:  [ [ 'weapon.js', 'weapon.png' ] ],
      animations: {
        move: 'run',
        idle: 'stand',
        jump: 'jump',
        pain: 'pain',
        death: 'death',
        attack: 'attack',
        crouchMove: 'cwalk',
        crouchIdle: 'cstand',
        crouchAttach: 'crattack'
      },
      walkSpeed: 300,
      crouchSpeed: 175
    },

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  this.character = new THREE.MD2CharacterComplex();
  this.character.scale = 0.25;
  this.character.controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false
  };

  var baseCharacter = new THREE.MD2CharacterComplex();
  baseCharacter.scale = 1;

  baseCharacter.onLoadComplete = function () {
    self.character.shareParts( baseCharacter );
    self.character.enableShadows( true );

    // disable speed
    self.character.maxSpeed =
    self.character.maxReverseSpeed =
    self.character.frontAcceleration =
    self.character.backAcceleration =
    self.character.frontDecceleration =
    self.character.angularSpeed = 0;
    self.character.setWeapon( 0 );
    self.character.setSkin( 0 );

    self.character.root.position.set(0, 0, 0);

    self.character.meshBody.position.y = 2;
    self.character.meshWeapon.position.y = 2;

    // _.each(self.character.meshes, function(m){ m.rotation.y = 0; });
    self.character.meshBody.rotation.y = 90 * Math.PI / 2;
    self.character.meshWeapon.rotation.y = 90 * Math.PI / 2;

    //self.character.root.castShadow = true;
    //self.rotation.y = 4.3;

    // self.scale.set(3, 3, 3);

    self.add(self.character.root);

    if (options.onLoad) { options.onLoad.apply(self); }
  };

  baseCharacter.loadParts( options.modelOptions );
}

inherits(ZeroZeroSeven, Character);

},{"../character":6,"inherits":74,"lodash":85}],8:[function(require,module,exports){
module.exports = {
  Dummy: require('./dummy'),
  OO7: require('./007'),
  Human: require('./human'),
  Monsterdog: require('./monsterdog'),
  Ogro: require('./ogro'),
  Ratamahatta: require('./ratamahatta'),
  SCV: require('./scv'),
  Ghost: require('./ghost'),
  Zombie: require('./zombie'),
  Marine: require('./marine')
};
},{"./007":7,"./dummy":9,"./ghost":10,"./human":11,"./marine":12,"./monsterdog":13,"./ogro":14,"./ratamahatta":15,"./scv":16,"./zombie":17}],9:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var Character = require('../character');

module.exports = Dummy;

/**
 * @exports threearena/elements/dummy
 */
function Dummy (options) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 3.0,

    maxSpeed: 20,
    maxAcceleration: 10.0,
    separationWeight: 5.0,

    name: 'Dummy',
    image: '/gamedata/models/monster/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  self.character = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 8),
    new THREE.MeshBasicMaterial({
      color: '#FFEEDD'
    })
  );
  self.character.position.y = 2.5;
  self.character.controls = {};
  self.character.update = self.character.setAnimation = function() { };

  self.add( self.character );

  if (options.onLoad) { options.onLoad.apply(self); }
}

inherits(Dummy, Character);


},{"../character":6,"inherits":74,"lodash":85}],10:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = Ghost;

/**
 * @exports threearena/character/ghost
 * 
 * @constructor
 */
function Ghost ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    name: 'Ghost',
    image: '/gamedata/models/ghost/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  var loader = new THREE.JSONLoader();

  loader.load( '/gamedata/sandbox/ghost.js', function (geometry, materials) {
    // for preparing animation
    for (var i = 0; i < materials.length; i++) {
      materials[i].morphTargets = true;
      materials[i].skinning = true;
    }
    
    var material = new THREE.MeshFaceMaterial( materials );
    self.character = new THREE.SkinnedMesh( geometry, material );
    // self.character.scale.set(10,10,10);

    self.character.controls = {};

    var t = 0;
    self.character.update = function(delta) {
      if ( t > 1 ) { t = 0; }

      // guess this can be done smarter...
      // (Indeed, there are way more frames than needed and interpolation is not used at all
      //  could be something like - one morph per each skinning pose keyframe, or even less,
      //  animation could be resampled, morphing interpolation handles sparse keyframes quite well.
      //  Simple animation cycles like this look ok with 10-15 frames instead of 100 ;)

      // for ( var i = 0; i < self.character.morphTargetInfluences.length; i++ ) {
      //   self.character.morphTargetInfluences[ i ] = 0;
      // }

      self.character.morphTargetInfluences[0] = t;

      t += delta;

      if (this.material.materials[0].uniforms) {
        this.material.materials[0].uniforms.morphTargetInfluences.value = t;
      }
    };

    self.character.setAnimation = function(animation) {
    };

    THREE.AnimationHandler.add(self.character.geometry.animation);
    var animation = new THREE.Animation(self.character, 'ArmatureAction', THREE.AnimationHandler.CATMULLROM);
    animation.play();


    if (options.onLoad) { options.onLoad.apply(self); }
    self.add( self.character );
  });
}

inherits(Ghost, Character);

Ghost.prototype.update = function(arena) {
  this.character.update(arena.delta);
};

},{"../character":6,"inherits":74,"lodash":85}],11:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = Human;

/**
 * @exports threearena/character/human
 * 
 * @constructor
 */
function Human ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    name: 'Human',
    image: '/gamedata/models/human/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  var loader = new THREE.JSONLoader();

  loader.load( '/gamedata/models/human/human.js', function (geometry, materials) {
    // for preparing animation
    for (var i = 0; i < materials.length; i++) {
      materials[i].morphTargets = true;
    }
        
    var material = new THREE.MeshFaceMaterial( materials );
    self.character = new THREE.Mesh( geometry, material );
    self.character.scale.set(10,10,10);

    self.add( self.character );
  });
}

inherits(Human, Character);

},{"../character":6,"inherits":74,"lodash":85}],12:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var Character = require('../character');

module.exports = Marine;

/**
 * @exports threearena/elements/dummy
 */
function Marine (options) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 3.0,

    maxSpeed: 10,
    maxAcceleration: 5.0,
    separationWeight: 5.0,

    name: 'Marine',
    image: '/gamedata/models/monster/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  self.blendMesh = new THREE.BlendCharacter();
  
  self.blendMesh.load('/gamedata/sandbox/marine.js', function(){
    self.blendMesh.rotation.y = Math.PI * -135 / 180;
    self.blendMesh.scale.set(0.09, 0.09, 0.09);
    self.add(self.blendMesh);

    if (options.onLoad) { options.onLoad.apply(self); }
  });

  self.character = {};
  self.character.controls = {};

  self.character.update = function(delta) {
    self.blendMesh.update(delta);
    THREE.AnimationHandler.update(delta);
  };
  
  self.character.setAnimation = function(anim) {

    if (self.currentAnimation !== anim) {

      self.currentAnimation = anim;

      anim = {
        stand: [ 'walk', 'idle' ],
        run:   [ 'walk', 'run'  ],
      }[anim];

      self.blendMesh.stopAll();
      self.blendMesh.crossfade(anim[0], anim[1], 1000);
      // self.blendMesh.warp('walk', 'run', 1000);
    }
  };
}

inherits(Marine, Character);


},{"../character":6,"inherits":74,"lodash":85}],13:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = Monsterdog;

/**
 * @exports threearena/character/monsterdog
 * 
 * @constructor
 */
function Monsterdog ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 4.0,

    speed: 100,

    name: 'Monsterdog',
    image: '/gamedata/models/monster/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  var loader = new THREE.ColladaLoader();
  loader.options.convertUpAxis = true;
  loader.load( '/gamedata/models/monster/monster.dae', function ( collada ) {

    self.character = collada.scene;
    self.skin = collada.skins[ 0 ];

    self.skin.geometry.computeFaceNormals();

    self.character.children[0].rotation.y = 180 * Math.PI / 2;
    self.character.children[1].rotation.y = 180 * Math.PI / 2;

    self.character.scale.x = self.character.scale.y = self.character.scale.z = 0.005;
    self.character.updateMatrix();

    self.character.controls = {};
    self.character.setAnimation = function () { };

    var t = 0;
    self.character.update = function(delta) {
      if ( t > 1 ) { t = 0; }

      // guess this can be done smarter...
      // (Indeed, there are way more frames than needed and interpolation is not used at all
      //  could be something like - one morph per each skinning pose keyframe, or even less,
      //  animation could be resampled, morphing interpolation handles sparse keyframes quite well.
      //  Simple animation cycles like this look ok with 10-15 frames instead of 100 ;)

      for ( var i = 0; i < self.skin.morphTargetInfluences.length; i++ ) {
        self.skin.morphTargetInfluences[ i ] = 0;
      }

      self.skin.morphTargetInfluences[ Math.floor( t * 30 ) ] = 1;

      t += delta;
    };

    self.add(self.character);
    if (options.onLoad) { options.onLoad.apply(self); }
  });
}

inherits(Monsterdog, Character);

},{"../character":6,"inherits":74,"lodash":85}],14:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = Ogro;

/**
 * @exports threearena/character/ogro
 * 
 * @constructor
 * 
 * @param {Object} options options
 * @param {object=} options.name Character name
 * @param {object=} options.image Path to character portrait
 * @param {object=} options.life Character Base life
 * @param {object=} options.mana Character Base mana
 * 
 * @extends {module:threearena/entity}
 */
function Ogro ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 3.0,

    name: 'Ogro',
    image: '/gamedata/models/ogro/portrait.gif',

    modelOptions: {
      baseUrl: '/gamedata/models/ogro/',
      body: 'ogro-light.js',
      skins: [
        'grok.jpg',
        'ogrobase.png',
        'arboshak.png',
        'ctf_r.png',
        'ctf_b.png',
        'darkam.png',
        'freedom.png',
        'gib.png',
        'gordogh.png',
        'igdosh.png',
        'khorne.png',
        'nabogro.png',
        'sharokh.png'
      ],
      weapons:  [ [ 'weapon-light.js', 'weapon.jpg' ] ],
      animations: {
        move: 'run',
        idle: 'stand',
        jump: 'jump',
        attack: 'attack',
        crouchMove: 'cwalk',
        crouchIdle: 'cstand',
        crouchAttach: 'crattack'
      },
      walkSpeed: 300,
      crouchSpeed: 175
    },

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  this.character = new THREE.MD2CharacterComplex();
  this.character.scale = 0.25;
  this.character.controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false
  };

  var baseCharacter = new THREE.MD2CharacterComplex();
  baseCharacter.scale = 1;

  baseCharacter.onLoadComplete = function () {
    self.character.shareParts( baseCharacter );
    self.character.enableShadows( true );

    // disable speed
    self.character.maxSpeed =
    self.character.maxReverseSpeed =
    self.character.frontAcceleration =
    self.character.backAcceleration =
    self.character.frontDecceleration =
    self.character.angularSpeed = 0;
    self.character.setWeapon( 0 );
    self.character.setSkin( 0 );

    self.character.root.position.set(0, 0, 0);

    self.character.meshBody.position.y = 2;
    self.character.meshWeapon.position.y = 2;

    self.character.meshBody.rotation.y = 180 * Math.PI / 2;
    self.character.meshWeapon.rotation.y = 180 * Math.PI / 2;

    self.add(self.character.root);

    if (options.onLoad) { options.onLoad.apply(self); }
  };

  baseCharacter.loadParts( options.modelOptions );
}

inherits(Ogro, Character);


},{"../character":6,"inherits":74,"lodash":85}],15:[function(require,module,exports){
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

},{"../character":6,"inherits":74,"lodash":85}],16:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var Character = require('../character');

module.exports = SCV;

/**
 * @exports threearena/elements/SCV
 */
function SCV (options) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 4.0,

    speed: 100,

    name: 'SCV',
    image: '/gamedata/models/monster/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  var loader = new THREE.OBJLoader();
  loader.load( '/gamedata/sandbox/sc2/worker.obj', function ( object ) {

    self.character = object;
    self.character.rotation.y = 1.5;
    self.character.controls = {};
    self.character.update = self.character.setAnimation = function() { };

    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( '/gamedata/sandbox/sc2/scv_diffuse.png' );
      }
    });

    object.scale.set(5, 5, 5);
    self.add( object );

    if (options.onLoad) { options.onLoad.apply(self); }
  });
}

inherits(SCV, Character);


},{"../character":6,"inherits":74,"lodash":85}],17:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Character = require('../character');

module.exports = Zombie;

/**
 * @exports threearena/character/zombie
 * 
 * @constructor
 */
function Zombie ( options ) {

  var self = this;

  options = _.merge({

    life: 100,
    mana: false,

    radius: 4.0,

    speed: 100,

    name: 'Zombie',
    image: '/gamedata/models/monster/portrait.gif',

    onLoad: null,

  }, options);

  Character.apply( this, [ options ]);

  var loader = new THREE.ColladaLoader();
  loader.options.convertUpAxis = true;
  loader.load( '/gamedata/nonfree/zombie_injured_walk/FREE__injured_walk.dae', function ( collada ) {

    self.character = collada.scene;
    self.skin = collada.skins[ 0 ];

    self.character.meshBody = self.character.children[1];

    self.skin.geometry.computeFaceNormals();

    // self.character.children[0].rotation.y = 180 * Math.PI / 2;
    self.character.children[1].rotation.y = 45 * Math.PI / 2;

    self.character.scale.x = self.character.scale.y = self.character.scale.z = 0.08;
    self.character.updateMatrix();

    self.character.children[1].material.map = THREE.ImageUtils.loadTexture( '/gamedata/nonfree/zombie_injured_walk/textures/ZombieLowRes_diffuse.png' );
    self.character.children[1].material.specularMap = THREE.ImageUtils.loadTexture( '/gamedata/nonfree/zombie_injured_walk/textures/Zombie_specular.png' );

    self.character.controls = {};
    self.character.setAnimation = function () { };

    var t = 0;
    self.character.update = function(delta) {
      if ( t > 1 ) { t = 0; }

      // guess this can be done smarter...
      // (Indeed, there are way more frames than needed and interpolation is not used at all
      //  could be something like - one morph per each skinning pose keyframe, or even less,
      //  animation could be resampled, morphing interpolation handles sparse keyframes quite well.
      //  Simple animation cycles like this look ok with 10-15 frames instead of 100 ;)

      for ( var i = 0; i < self.skin.morphTargetInfluences.length; i++ ) {
        self.skin.morphTargetInfluences[ i ] = 0;
      }

      self.skin.morphTargetInfluences[ Math.floor( t * 30 ) ] = 1;

      t += delta;
    };

    self.add(self.character);
    if (options.onLoad) { options.onLoad.apply(self); }
  });
}

inherits(Zombie, Character);

},{"../character":6,"inherits":74,"lodash":85}],18:[function(require,module,exports){
'use strict';

var inherits = require('inherits');

module.exports = AttackCircle;

/**
 * @exports threearena/controls/attackcircle
 * 
 * @constructor
 */
function AttackCircle ( radius ) {

  THREE.Object3D.apply(this);

  var start   = new THREE.Vector3( -radius, 0, 0 ),
    middle  = new THREE.Vector3( 0, 0, -radius ),
    end   = new THREE.Vector3(  radius, 0, 0 );

  this.shape = new THREE.QuadraticBezierCurve3(start, middle, end);

  this.points = this.shape.getSpacedPoints( 10 );
  this.slots = [];
}

inherits(AttackCircle, THREE.Object3D);

AttackCircle.prototype.has = function ( object ) {

  return this.slots.indexOf( object ) > -1;
};

AttackCircle.prototype.place = function ( object ) {

  var point = Math.ceil(this.points.length / 2 + this.slots.length);

  var position = this.localToWorld( this.points[ point ].clone() );

  this.slots.push( object );
  object.position.set( position.x, position.y, position.y );

  return position;
};

},{"inherits":74}],19:[function(require,module,exports){
'use strict';

var inherits = require('inherits');

var DestinationMarkerMaterial = require('../shaders/lightbolt');

module.exports = DestinationMarker;

/**
 * @exports threearena/spell/destinationmarker
 * 
 * @constructor
 */
function DestinationMarker(options) {

  THREE.Object3D.apply(this);

  this.listenerTag = 'destination marker animation';

  this.material = options.material || new DestinationMarkerMaterial();

  this.plane = new THREE.Mesh( new THREE.PlaneGeometry( 6, 6 ), this.material );
  this.plane.rotation.z = 90 * Math.PI / 180;
  // this.plane.position.y *= - .5;
  // this.plane.position.x *= - .5;
  this.plane.position.y = 6;

  this.plane.visible = false;

  this.add(this.plane);
}

inherits(DestinationMarker, THREE.Object3D);

DestinationMarker.prototype.animate = function () {
  var self = this;

  self.plane.visible = true;

  var update = function(game){
    self.material.uniforms.time.value += game.delta; // * 100 * Math.PI / 180;
  };
  update.listenerTag = this.listenerTag;

  window._ta_events.on('update', update);
  setTimeout(function(){
    window._ta_events.removeListener('update', update);
    self.plane.visible = false;
  }, 300);

};


},{"../shaders/lightbolt":56,"inherits":74}],20:[function(require,module,exports){
'use strict';

var _ = require('lodash');

module.exports = DotaControls;

/**
 * @exports threearena/controls/dota
 * 
 * @constructor
 */
function DotaControls ( object, domElement, options ) {

  this.object = object;

  var bind = function ( scope, fn ) {
    return function () {
      fn.apply( scope, arguments );
    };
  };

  this.options = _.merge({

    activeBorderZoneFactor: 0, // % of screen size
    activeBorderZoneTime: 300, // ms in the active border zone

  }, options);

  this.domElement = ( domElement !== undefined ) ? domElement : document;
  if ( domElement ) { this.domElement.setAttribute( 'tabindex', -1 ); }

  // API
  this.enabled = true;
  this.mouseEnabled = true;
  this.noZoom = false;

  this.movementSpeed = 100.0;
  this.rollSpeed = 0.005;

  this.dragToLook = false;
  this.autoForward = false;

  this.clamp = {
    xmin: -1000,
    xmax:  1000,
    zmin: -1000,
    zmax:  1000,
  };

  // disable default target object behavior

  // internals

  this._inActiveZone = { right:0, left:0, forward:0, backward:0 };
  this._keyboardHasFocus = false;

  this.tmpQuaternion = new THREE.Quaternion();

  this.mouseStatus = 0;


  this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
  this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
  this.moveVector = new THREE.Vector3( 0, 0, 0 );
  this.rotationVector = new THREE.Vector3( 0, 0, 0 );

  ////////////////

  this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

  this.domElement.addEventListener( 'mousemove', bind( this, this.mousemove ), false );
  // this.domElement.addEventListener( 'mousewheel', bind( this, this.mousewheel ), false );
  // this.domElement.addEventListener( 'DOMMouseScroll', bind( this, this.mousewheel ), false ); // firefox

  this.domElement.addEventListener( 'keydown', bind( this, this.keydown ), false );
  this.domElement.addEventListener( 'keyup',   bind( this, this.keyup ), false );

  this.updateMovementVector();
  this.updateRotationVector();

  this.tmpQuaternion.set( -0.4, 0, 0, 1 ).normalize();
  this.object.quaternion.multiply( this.tmpQuaternion );
}

DotaControls.prototype.keydown = function( event ) {

  this._keyboardHasFocus = true;

  switch ( event.keyCode ) {

    case 16: /* shift */
      this.movementSpeedMultiplier = 0.1;
      break;

    case 37:
      this.moveState.left = 1;
      break;

    case 39:
      this.moveState.right = 1;
      break;

    case 38:
      this.moveState.forward = 1;
      break;

    case 40:
      this.moveState.back = 1;
      break;
  }

  this.updateMovementVector();
  this.updateRotationVector();

};

DotaControls.prototype.keyup = function( event ) {

  this._keyboardHasFocus = false;

  switch( event.keyCode ) {

    case 16: /* shift */
      this.movementSpeedMultiplier = 1;
      break;

    case 37:
      this.moveState.left = 0;
      break;

    case 39:
      this.moveState.right = 0;
      break;

    case 38:
      this.moveState.forward = 0;
      break;

    case 40:
      this.moveState.back = 0;
      break;
  }

  this.updateMovementVector();
  this.updateRotationVector();

};

DotaControls.prototype.mousedown = function( event ) {

  if ( this.domElement !== document ) {

    this.domElement.focus();

  }

  event.preventDefault();
  event.stopPropagation();

  if ( this.dragToLook ) {

    this.mouseStatus ++;

  } else {

    switch ( event.button ) {

      case 0:
        this.moveState.forward = 1;
        break;

      case 2:
        this.moveState.back = 1;
        break;
    }

    this.updateMovementVector();

  }

};

DotaControls.prototype.mousewheel = function( ) {
  this.moveVector.y += 0.01;
};

DotaControls.prototype.mousemove = function( event ) {

  var container = this.getContainerDimensions();

  // if (this._keyboardHasFocus) return;

  /*
  if (event.pageX < container.size[ 0 ] / 100 * this.hudZoneFactor) {

    this.hud.open();
    this.enabled = false;
    return;

  } else if ( this.hud.isOpen() ) {

    this.hud.close();
    this.enabled = true;
  }
  */

  if ( this.enabled && this.mouseEnabled && this.options.activeBorderZoneFactor) {

    var now = (new Date()).getTime();

    var activeZoneWidth  = container.size[ 0 ] / 100 * this.options.activeBorderZoneFactor;
    var activeZoneHeight = container.size[ 1 ] / 100 * this.options.activeBorderZoneFactor;

    if (event.pageX > container.size[ 0 ] - activeZoneWidth) {

      this._inActiveZone.right = this._inActiveZone.right || now;
      if (now - this._inActiveZone.right > this.options.activeBorderZoneTime) {
        this.moveState.right = 1;
      }

    } else {
      this._inActiveZone.right= 0;
      this.moveState.right = 0;
    }

    if (event.pageX < activeZoneWidth) {

      this._inActiveZone.left = this._inActiveZone.left || now;
      if (now - this._inActiveZone.left > this.options.activeBorderZoneTime) {
        this.moveState.left = 1;
      }

    } else {
      this._inActiveZone.left = 0;
      this.moveState.left = 0;
    }

    if (event.pageY < activeZoneHeight) {

      this._inActiveZone.forward = this._inActiveZone.forward || now;
      if (now - this._inActiveZone.forward > this.options.activeBorderZoneTime) {
        this.moveState.forward = 1;
      }

    } else {
      this._inActiveZone.forward = 0;
      this.moveState.forward = 0;
    }

    if (event.pageY > container.size[ 1 ] - activeZoneHeight - 200 /* FIXME crappy hack */) {

      this._inActiveZone.backward = this._inActiveZone.backward || now;
      if (now - this._inActiveZone.backward > this.options.activeBorderZoneTime) {
        this.moveState.back = 1;
      }

    } else {
      this._inActiveZone.backward = 0;
      this.moveState.back = 0;
    }

    this.updateMovementVector();
  }
};

DotaControls.prototype.mouseup = function( event ) {

  event.preventDefault();
  event.stopPropagation();

  if ( this.dragToLook ) {

    this.mouseStatus--;

    this.moveState.yawLeft = this.moveState.pitchDown = 0;

  } else {

  }
};

DotaControls.prototype.update = function( delta ) {

  if ( this.enabled ) {
    var moveMult = delta * this.movementSpeed;
    var rotMult = delta * this.rollSpeed;

    this.object.translateX( this.moveVector.x * moveMult );
    this.object.translateY( this.moveVector.y * moveMult );
    this.object.translateZ( this.moveVector.z * moveMult );

    if (this.object.position.x < this.clamp.xmin) { this.object.position.x = this.clamp.xmin; }
    if (this.object.position.x > this.clamp.xmax) { this.object.position.x = this.clamp.xmax; }
    if (this.object.position.z < this.clamp.zmin) { this.object.position.z = this.clamp.zmin; }
    if (this.object.position.z > this.clamp.zmax) { this.object.position.z = this.clamp.zmax; }

    this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
    this.object.quaternion.multiply( this.tmpQuaternion );

    // expose the rotation vector for convenience
    this.object.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );
  }
};

DotaControls.prototype.updateMovementVector = function() {

  var forward = ( this.moveState.forward || ( this.autoForward && !this.moveState.back ) ) ? 1 : 0;

  this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
  this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
  this.moveVector.z = ( -forward + this.moveState.back );

  // console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

};

DotaControls.prototype.updateRotationVector = function() {

  this.rotationVector.x = ( -this.moveState.pitchDown + this.moveState.pitchUp );
  this.rotationVector.y = ( -this.moveState.yawRight  + this.moveState.yawLeft );
  this.rotationVector.z = ( -this.moveState.rollRight + this.moveState.rollLeft );

  // console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );

};

DotaControls.prototype.getContainerDimensions = function() {

  if ( this.domElement !== document ) {

    return {
      size  : [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
      offset  : [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
    };

  } else {

    return {
      size  : [ window.innerWidth, window.innerHeight ],
      offset  : [ 0, 0 ]
    };

  }

};



},{"lodash":85}],21:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = ZoneSelector;

/**
 * @exports threearena/controls/zoneselector
 * 
 * @constructor
 */
function ZoneSelector(arena, options) {

  var self = this;

  THREE.Object3D.apply(this);

  this.options = _.merge({

    size: 15,

  }, options);

  this.material = this.options.material || new THREE.MeshBasicMaterial({
    color: 0x02dd02,
    transparent: true,
    opacity: 0.9,
    map: THREE.ImageUtils.loadTexture('/gamedata/textures/summoning_circles/circle4.bold.png'),
    blending: THREE.AdditiveBlending,
  });
  this.material.map.needsUpdate = true;

  this.plane = new THREE.Mesh( new THREE.PlaneGeometry( this.options.size, this.options.size ), this.material );
  this.plane.rotation.x = - 90 * Math.PI / 180;
  this.plane.position.y = 6;

  this.on('enabled', function(){
    self.material.color.setHex(0x02dd02);
    self.material.needsUpdate = true;
  });

  this.on('disabled', function(){
    self.material.color.setHex(0xdd0202);
    self.material.needsUpdate = true;
  });

  this.add(this.plane);
}

inherits(ZoneSelector, THREE.Object3D);

//////////////////
// Mock EventEmitter using ThreeJS builtin methods

ZoneSelector.prototype.on = ZoneSelector.prototype.addEventListener;
ZoneSelector.prototype.off = ZoneSelector.prototype.removeEventListener;
ZoneSelector.prototype.removeListener = ZoneSelector.prototype.removeEventListener;
ZoneSelector.prototype.emit = function (event, data) {
  data = data || {};
  data.type = event;
  this.dispatchEvent(data);
};


},{"inherits":74,"lodash":85}],22:[function(require,module,exports){
'use strict';

var debug = require('debug')('crowd');
var settings = require('./settings');

var _ = require('lodash');
var now = require('now');
var async = require('async');

var MIN_DESTINATION_CHANGE = 0.5;
var MIN_SPEED_ANIMATION = 0.5;
var MIN_SPEED_ROTATION = 1.5;

module.exports = Crowd;

/**
 * @exports Crowd
 * 
 * @constructor
 */
function Crowd (game) {

  var self = this;

  this.game = game;

  this.agents = {};
  this.agentsCount = 0;
  this.updateDurationMax = 0;

  ///////////////

  // this.MAX_VELOCITY_VECTOR = new THREE.Vector3();

  this._tmp_velocity = new THREE.Vector3(0, 0, 0);

  this._originVector = new THREE.Vector3(0, 0, 0);

  this._boundCheckAgents = this._checkAgents.bind(this);
  this._boundCrowdUpdate = this._updateAgents.bind(this);

  this._route_material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0.5,
    wireframe: true,
    transparent: true
  });

  var update = this.update.bind(this);
  update.listenerTag = 'crowd system';

  // this.game.on('update', update);

  this.game.pathfinder.on('activeAgents', this._boundCrowdUpdate);

  settings.on('allCrowdAgentsUpdated', function (allCrowd) {
    for (var i = 0; i < self.agentsCount; i++) {
      self.agents[i].state.separationWeight = allCrowd.crowdSeparationWeight;
      self.agents[i].state.maxAcceleration = allCrowd.crowdMaxAcceleration;
      self.agents[i].state.updateFlags = allCrowd.crowdUpdateFlags;
      self.agents[i].state.maxSpeed = allCrowd.crowdMaxSpeed;
      self.agents[i].state.radius = allCrowd.crowdRadius;
      self.agents[i]._crowd_params_need_update = true;
      self.agents[i]._disabled_behaviours = true;
    }
    debug('all entities have been marked as dirty, naughty agents');
  });
}

Crowd.prototype.attachRouteDebug = function(entity) {
  
  if (!  entity._crowd_current_route_geometry) {
    entity._crowd_current_route_geometry = new THREE.Geometry();
    entity._crowd_current_route_geometry.vertices.push(this._originVector);
    entity._crowd_current_route_geometry.vertices.push(this._originVector.clone()); // need a new one

    // WHY a new one ?? 
    var _route_material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.001,
      linewidth: 3,
      vertexColors: THREE.VertexColors
    });

    entity._crowd_current_route_mesh = new THREE.Line(entity._crowd_current_route_geometry, _route_material);
  }

  entity._crowd_current_route_mesh.material.opacity = 0.0001;
  this.game.scene2.add(entity._crowd_current_route_mesh);
};

Crowd.prototype.addAgent = function(entity, options, destination, follow, callback) {

  var self = this;

  entity._crowd_options = crowdOptions(options);

  // add the recast navigation
  self.game.pathfinder.addCrowdAgent(entity._crowd_options, function(idx){

    self.agentsCount++;

    // keep the idx
    idx = parseInt(idx, 0);
    entity._crowd_idx = idx;
    self.agents[''+idx] = entity;

    self.attachRouteDebug(entity);

    debug('%o assigned to crowd agent #%d', entity, idx);

    function onEntityDestination(destination) {
      entity._crowd_following = null;
      // dont call the worker for a minor change 
      if (! entity._crowd_destination ||
        destination.position.distanceTo(entity._crowd_destination.position) > MIN_DESTINATION_CHANGE)
      {
        self.game.pathfinder.crowdRequestMoveTarget(idx, destination.position);
        debug('%o walk towards %o', entity, destination);
      }

      entity._crowd_destination = destination;
    }

    function onEntityFollow(following) {
      entity._crowd_destination = null;
      // dont call the worker for a minor change 
      if (!entity._crowd_following || entity._crowd_following !== following ||
        following.position.distanceTo(entity._crowd_following.position) > MIN_DESTINATION_CHANGE)
      {
        entity._crowd_following_last_position = following.position.clone();
        self.game.pathfinder.crowdRequestMoveTarget(idx, following.position);
        debug('%o follows %o', entity, following);
      }

      entity._crowd_following = following;
    }

    function onEntityUnfollow() {
      entity._crowd_destination = null;
      entity._crowd_following = null;
    }

    function onEntityDeath() {
      self.removeAgent(entity);
      entity._crowd_idx = null;

      entity.removeListener('death', onEntityDeath);
      entity.removeListener('follow', onEntityFollow);
      entity.removeListener('destination', onEntityDestination);
      entity.removeListener('nodestination', onEntityUnfollow);
      entity.removeListener('unfollow', onEntityUnfollow);
    }

    entity._crowd_removeAllListeners = function() {
      entity.removeListener('death', onEntityDeath);
      entity.removeListener('follow', onEntityFollow);
      entity.removeListener('destination', onEntityDestination);
      entity.removeListener('nodestination', onEntityUnfollow);
      entity.removeListener('unfollow', onEntityUnfollow);
    };

    // listen on entity events
    entity.on('death', onEntityDeath);
    entity.on('follow', onEntityFollow);
    entity.on('destination', onEntityDestination);
    entity.on('nodestination', onEntityUnfollow);
    entity.on('unfollow', onEntityUnfollow);

    entity._crowd_dirty = false;

    if (typeof callback === 'function') {
      callback(entity);
    }

    entity.emit( destination ? 'destination' : 'nodestination', destination);
    entity.emit( follow ? 'follow' : 'nofollow', follow);
  });
};

Crowd.prototype.removeAgent = function(entity) {

  if (entity._crowd_current_route_mesh) {
    this.game.scene2.remove(entity._crowd_current_route_mesh);
  }

  if (typeof entity._crowd_idx === 'undefined') {
    throw 'This entity is not in the crowd';
  }

  this.game.pathfinder.removeCrowdAgent(entity._crowd_idx);
  this.agentsCount--;
};

Crowd.prototype.requestMoveVelocity = function(entity, velocity) {

  if (typeof entity._crowd_idx === 'undefined') {
    throw 'This entity is not in the crowd';
  }

  this.game.pathfinder.requestMoveVelocity(entity._crowd_idx, velocity);
};

/**
 * Instantly teleport an entity to a new position
 * @param  {Entity}   entity      Entity to teleport
 * @param  {Vector3}  newPosition The desired new position
 * @param  {Function=} callback   Optional callback(error, newPosition)
 * @return {Entity}               The entity to be teleported
 */
Crowd.prototype.teleport = function(entity, newPosition, callback) {

  var self = this;

  if (typeof entity._crowd_idx === 'undefined') {
    throw 'This entity is not in the crowd';
  }

  entity._crowd_dirty = true;

  entity.game.pathfinder.findNearest(newPosition, function(nearestPosition){

    entity._crowd_removeAllListeners();

    var options = entity._crowd_options;
    // need to copy because nearestPosition is pooled
    options.position.copy(nearestPosition);

    var following = null; // entity._crowd_following;
    var destination = null; // entity._crowd_destination;

    self.removeAgent(entity);
    self.addAgent(entity, options, destination, following, callback);

    entity._crowd_dirty = false;
  });
};

Crowd.prototype.update = function() {

  var self = this;

  if (self.agentsCount > 0) {

    // update routes visibility
    this._route_material.visible = settings.data.visibleCharactersRoutes;

    // check all agents state
    _.forEach(self.agents, this._boundCheckAgents);

    this.updateTime = now();
    this.updateDuration = null;

    // update the crowd
    self.game.pathfinder.crowdUpdate(this.game.delta * 2 /* FIXME: why ? */); // , this._boundCrowdUpdate);
  }
};

Crowd.prototype._checkAgents = function(entity, idx) {

  idx = parseInt(idx, 0);

  // update dirty params
  if (entity._crowd_params_need_update) {
    debug('update crowd params for %o', entity);
    entity._crowd_params_need_update = false;
    entity._crowd_dirty = false;
    entity._disabled_behaviours = false;
    
    // this.game.pathfinder.updateCrowdAgentParameters(idx, crowdOptions(entity.state));
    var oldFoll = null; // entity._crowd_following;
    var oldDest = null; // entity._crowd_destination;

    this.removeAgent(entity);
    this.addAgent(entity, entity.state, oldDest, oldFoll);
    return;
  }

  // update dirty follow
  // TODO: also use a _dirtyMove flag ?
  if (entity._crowd_following) {
    // dont call the worker for a minor change 
    if (entity._crowd_following_last_position.distanceTo(entity._crowd_following.position) > 2.0 * MIN_DESTINATION_CHANGE)
    {
      this.game.pathfinder.crowdRequestMoveTarget(idx, entity._crowd_following.position);
      entity._crowd_following_last_position.copy(entity._crowd_following.position);
    }
  }
};

Crowd.prototype._updateAgent = function(agent){

  // var agent = agents[i];
  var idx = agent.idx;
  var entity = this.agents[idx];

  if (entity._crowd_idx && (entity._crowd_dirty || ! agent.active || entity.isDead())) {
    this.removeAgent(entity);
    // continue;
    return;
  }

  if (entity.state.isStatic) {
    // continue;
    return;
  }

  var destination = entity._crowd_destination || entity._crowd_following;
  var destinationDistance = Number.Infinity;

  if (destination) {

    destinationDistance = destination.position.distanceTo(entity.position) -
      (destination.state && destination.state.radius ? destination.state.radius : 0) -
      (entity.state && entity.state.radius ? entity.state.radius : 0);

    // check if agent is arrived
    // could be done in recastnavigation, but not all entities are agents :/
    if (destinationDistance <= 0) {
      agent.velocity.x = agent.velocity.y = agent.velocity.z = 0.0;
      agent.position = entity.position;
    
    } else {

      var mul = 1;

      // console.log('velocity change : %o', destinationDistance / mul);

      agent.velocity.x *= destinationDistance / mul;
      agent.velocity.y *= destinationDistance / mul;
      agent.velocity.z *= destinationDistance / mul;
    }

  }

  // update routes
  if (entity._crowd_current_route_geometry) {
    // defaults
    entity._crowd_current_route_mesh.material.opacity = 0.0001;

    if (settings.data.visibleCharactersRoutes) {
      entity._crowd_current_route_geometry.vertices[1].copy(entity.position);
      entity._crowd_current_route_geometry.vertices[0].copy(entity.position);
      entity._crowd_current_route_geometry.verticesNeedUpdate = true;

      if (destination && ! entity._crowd_dirty) {
        entity._crowd_current_route_mesh.material.opacity = (destinationDistance > 10 ? 0.5 : 0.001);
        entity._crowd_current_route_geometry.vertices[1].copy(destination.position);
      }
    }
  }

  this._tmp_velocity.set(agent.velocity.x, 0, agent.velocity.z);

  var speed = this._tmp_velocity.length();

  entity.isMoving = speed > 0;

  // update back entity position & rotation
  entity.position.copy(agent.position);

  if (speed > MIN_SPEED_ANIMATION) {

    if (entity.character) {
      entity.character.controls.moveForward = true;
      entity.character.setAnimation('run');
    }

  } else {

    if (entity.character) {
      entity.character.controls.moveForward = false;
      entity.character.setAnimation('stand');
    }
  }

  if (speed > MIN_SPEED_ROTATION) {
    var angle = Math.atan2(- this._tmp_velocity.z, this._tmp_velocity.x);
    entity.rotation.y = angle;
  }
};

Crowd.prototype._updateAgents = function(agents){

  this.updateDuration = now() - this.updateTime;

  if (this.updateDuration > 30) {
    return;
  }

  async.each(agents, this._updateAgent.bind(this));

  if (this.updateDurationMax < this.updateDuration) {
    this.updateDurationMax = this.updateDuration;
    debug('pathfinder update took %oms', this.updateDuration);
  }
};

function crowdOptions(options) {
  return options = _.merge({
    position: { x:0, y:0, z:0 },
    separationWeight: settings.data.crowdDefaultSeparationWeight,
    maxAcceleration: settings.data.crowdDefaultMaxAcceleration,
    updateFlags: settings.data.crowdDefaultUpdateFlags,
    maxSpeed: settings.data.crowdDefaultMaxSpeed,
    radius: settings.data.crowdDefaultRadius,
    height: settings.data.crowdDefaultHeight
  }, {
    position: options.position,
    separationWeight: options.separationWeight,
    maxAcceleration: options.maxAcceleration,
    updateFlags: options.updateFlags,
    maxSpeed: options.maxSpeed,
    radius: options.radius,
    height: options.height
  });
}

},{"./settings":54,"async":72,"debug":73,"lodash":85,"now":87}],23:[function(require,module,exports){
module.exports = {
  SpawningPool: require('./autospawn'),
  DefenseTower: require('./tower'),
  Nexus: require('./nexus'),
  Shop: require('./shop'),
  Flies: require('./flies'),
  Collectible: require('./collectible'),
  Mineral: require('./mineral'),
  Chest: require('./chest'),
  CommandCenter: require('./commandcenter'),
  Spikes: require('./spikes'),
  Grass: require('./grass'),
  Checkpoint: require('./checkpoint')
};

},{"./autospawn":24,"./checkpoint":25,"./chest":26,"./collectible":27,"./commandcenter":28,"./flies":29,"./grass":30,"./mineral":32,"./nexus":33,"./shop":34,"./spikes":37,"./tower":39}],24:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = AutoSpawn;

/**
 * @exports threearena/elements/autospawn
 * 
 * @constructor
 */
function AutoSpawn (options) {

  this.options = _.merge({

    entity: null,
    entityOptions: {},

    delay: 1000,

    limit: Infinity,

    path: null,
    towards: null,

    tweenOptions: {
      speed: 6
    },

    groupOf: 1,

    eachInterval: 800,
    eachGroupInterval: 30 * 1000,

  }, options);

  this.spawnCount = 0;

  THREE.Object3D.apply(this);
}

inherits(AutoSpawn, THREE.Object3D);

//////////////////

AutoSpawn.prototype.on = AutoSpawn.prototype.addEventListener;

AutoSpawn.prototype.emit = function (event, data) {
  data.type = event;
  this.dispatchEvent(data);
};

//////////////////

AutoSpawn.prototype.setPath = function(path) {
  this.options.path = path;
};

AutoSpawn.prototype.start = function() {
  setTimeout(function(){
    this.spanwGroup();
  }.bind(this), this.options.delay);
};

AutoSpawn.prototype.spanwGroup = function() {

  if (! this.arena.paused) {

    var spawn = _.bind(function(){
      this.spanwOne();
    }, this);

    for (var i = 0; i < this.options.groupOf; i++) {
      setTimeout(spawn, this.options.eachInterval * i);
    }

  }

  // register next group
  if (this.options.limit > this.spawnCount) {
    setTimeout(function(){
      this.spanwGroup();
    }.bind(this), this.options.eachGroupInterval);
  }
};

AutoSpawn.prototype.spanwOne = function() {

  var self = this;

  if (this.arena.paused) {
    return;
  }

  this.spawnCount++;

  new this.options.entity({
    onLoad: function(){
      // character.position.copy(self.position);
      self.emit('before:spawnedone', this);
      self.emit('spawnedone', this);
    }
  });
};


},{"inherits":74,"lodash":85}],25:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Material = require('../shaders/lightbolt');

module.exports = Checkpoint;

/**
 * @exports threearena/elements/checkpoint
 */
function Checkpoint (options) {

  var self = this;

  THREE.Object3D.apply(this);

  this.options = _.merge({

    height: 200,
    radius: 4,

    triggerRange: 5,

    trigger: function(entity) {
      console.log('%o triggers checkpoint !', entity);
    }

  }, options);

  this.material = new Material();

  this.geom = new THREE.CylinderGeometry(this.options.radius, this.options.radius, this.options.height, 16, 2 * this.options.height, true);

  this.mesh = new THREE.Mesh(this.geom, this.material);

  self.add(this.mesh);

  window._ta_events.on('update', this.update.bind(this));

  if (options.onLoad) { options.onLoad(self); }
}

inherits(Checkpoint, THREE.Object3D);

Checkpoint.prototype.update = function(arena) {

  var self = this;

  self.material.uniforms.time.value += arena.delta * 0.5;

  for (var i = 0; i < arena.entities.length; i++) {
    if (arena.entities[i].isDead()) { continue; }

    if (arena.entities[i].position.distanceTo(self.position) < self.options.triggerRange) {
      self.options.trigger(arena.entities[i]);
    }
  }
};
},{"../shaders/lightbolt":56,"inherits":74,"lodash":85}],26:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = Collectible;

/**
 * @exports threearena/elements/collectible
 */
function Collectible (options) {

  var self = this;

  THREE.Object3D.apply(this);

  this.collectible = _.merge({

    kind: 'gold',

    amount: 1000

  }, options);

  var loader = new THREE.OBJMTLLoader();
  loader.addEventListener( 'load', function ( event ) {

    var object = event.content;

    object.scale.set(8, 8, 8);

    self.add(object);

    if (options.onLoad) { options.onLoad(); }
  });

  loader.load('/gamedata/models/chest/chest.obj', '/gamedata/models/chest/chest.mtl');
}

inherits(Collectible, THREE.Object3D);

/**
 * Proximity test
 * @param  {object}  object Object to test
 * @return {Boolean}  True is object is near enough to collect
 */
Collectible.prototype.isNearEnough = function(object) {

  return this.position.distanceTo(object.position) <= 20;
};

/**
 * Collect function
 * @param  {Entity}   entity   Entity who collect things
 * @param  {Function} callback Callback, called with two arguments : error, and eventData 
 */
Collectible.prototype.collectedBy = function(entity, callback) {

  if (entity) {
    var eventData = { kind: this.collectible.kind, amount: 0 };

    if (this.collectible.amount > 0) {

      eventData.amount = Math.min(this.collectible.amount, 10);

      // play sound

      entity.state.inventory.push(eventData);

      return callback(null, eventData);
    }
  }

  callback(true);
};


},{"inherits":74,"lodash":85}],27:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = Collectible;

/**
 * @exports threearena/elements/collectible
 */
function Collectible (options) {

  THREE.Object3D.apply(this);

  options = options || {};

  this.collectible = _.merge({

    kind: 'dummy',

    amount: 1000,

    workers: {},
    workersCount: 0,

  }, options);

  if (options.onLoad) { options.onLoad(); }
}

inherits(Collectible, THREE.Object3D);

/**
 * Proximity test
 * @param  {object}  object Object to test
 * @return {Boolean}  True is object is near enough to collect
 */
Collectible.prototype.isNearEnough = function(object) {

  return this.position.distanceTo(object.position) <= 20;
};

Collectible.prototype.addWorker = function (entity) {
  if (! this.collectible.workers[entity.uuid]) {
    this.collectible.workers[entity.uuid] = entity;
    this.collectible.workersCount++;
  }
};

Collectible.prototype.removeWorker = function (entity) {
  if (this.collectible.workers[entity.uuid]) {
    this.collectible.workers[entity.uuid] = null;
    this.collectible.workersCount--;
  }
};

/**
 * Collect function
 * @param  {Entity}   entity   Entity who collect things
 * @param  {Function} callback Callback, called with two arguments : error, and eventData 
 */
Collectible.prototype.collectedBy = function(entity, callback) {

  if (entity) {
    var eventData = { kind: this.collectible.kind, amount: 0 };

    if (this.collectible.amount > 0) {

      eventData.amount = Math.min(this.collectible.amount, 10);

      this.collectible.amount -= eventData.amount;

      if (this.collectible.amount <= 0) {
        this.parent.remove(this);
      }

      // play sound

      entity.state.inventory.push(eventData);

      return callback(null, eventData);
    }
  }

  callback(true);
};


},{"inherits":74,"lodash":85}],28:[function(require,module,exports){
'use strict';

var inherits = require('inherits');
var Entity = require('../entity');

module.exports = CommandCenter;

/**
 * @exports threearena/elements/commandcenter
 */
function CommandCenter (options) {

  Entity.apply(this, [ options ]);

  var self = this;

  this.collector = {};

  var loader = new THREE.OBJLoader();
  loader.load( '/gamedata/sandbox/sc2/commandcenter.obj', function ( object ) {

    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( '/gamedata/sandbox/sc2/commandcenter_diffuse.png' );
      }
    });

    object.scale.set(5, 5, 5);
    self.add( object );

    if (options.onLoad) { options.onLoad.apply(self); }
  });
}

inherits(CommandCenter, Entity);
},{"../entity":41,"inherits":74}],29:[function(require,module,exports){
'use strict';

var inherits = require('inherits');

module.exports = Flies;

/**
 * @exports threearena/particles/flies
 */
function Flies (count, tex) {

  THREE.Object3D.apply(this);

  this.deltas = new Array(count);
  for (var i = 0; i < count; i++) { this.deltas[i] = Math.random(); }

  this.path = this.computePath(5, 3);

  this.map1 = THREE.ImageUtils.loadTexture('/gamedata/textures/flies/' + (tex || 'butterfly.' + 1 + '.png'));
  this.map1.needsUpdate = true;

  this.map2 = THREE.ImageUtils.loadTexture('/gamedata/textures/flies/' + (tex || 'butterfly.' + 2 + '.png'));
  this.map2.needsUpdate = true;

  this.material = new THREE.ParticleBasicMaterial({
    size: count,
    map: this.map1,
    transparent: true
  });

  this.points = new THREE.Geometry();

  this.points.vertices.push(new THREE.Vector3(0, 0, 0));
  this.points.vertices.push(new THREE.Vector3(0, 0, 0));
  this.points.vertices.push(new THREE.Vector3(0, 0, 0));

  this.flies = new THREE.ParticleSystem(this.points, this.material);
  this.flies.sortParticles = true;

  this.flies.scale.set(1, 1, 1);

  this.add(this.flies);
}

inherits(Flies, THREE.Object3D);

Flies.prototype.computePath = function(radius, height) {

  return new THREE.ClosedSplineCurve3([

    new THREE.Vector3(0, 0, radius*2),
    new THREE.Vector3(radius, height, radius),

    new THREE.Vector3(-radius*2, height, -radius*2),
    new THREE.Vector3(0.5, height, radius*2),

    new THREE.Vector3(-radius*3, 0, -radius),
    new THREE.Vector3(0.8, height, -radius*2),

    new THREE.Vector3(radius-1, height, -radius),
    new THREE.Vector3(-radius, height / 2, radius)
  ]);
};

Flies.prototype.update = function(game) {

  this.material.map = Math.random() > 0.7 ? this.map2 : this.map1;

  var point;
  for (var i = 0; i < this.points.vertices.length; i++) {

    this.deltas[i] += game.delta * 0.2;
    if (this.deltas[i] > 1) {
      this.deltas[i] = 1 - this.deltas[i];
    }

    point = this.path.getPoint( (i % 2 ? -1 : 1) * this.deltas[i]);

    this.points.vertices[i].set(point.x, point.y, point.z);
  }
};
},{"inherits":74}],30:[function(require,module,exports){
'use strict';

var inherits = require('inherits');

module.exports = Grass;

/**
 * @exports threearena/elements/grass
 * 
 * @constructor
 */
function Grass (options) {

  var self = this;
  
  THREE.Object3D.apply(this);

  // self.position.y = 0;
  // self.scale.set( 0.6, 0.6, 0.6 );
  // this.position.y = -50;

  options = options || {};

  var geometry = new THREE.PlaneGeometry( 30, 30 );

  var bitmap = this.generateTextureBase();

  var mesh;

  this.levels = [];

  for ( var i = 0; i < 25; i ++ ) {

    mesh = this.levels[ i ] = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {
      map: new THREE.Texture( this.generateTextureLevel( bitmap ) ),
      transparent: true,
      depthWrite: false,
      // depthTest: false,
      opacity: 1 - i/10
    } ) );

    mesh.material.map.needsUpdate = true;

    mesh.position.y = 0.5 + i * 0.10;
    mesh.rotation.x = - Math.PI / 2;

    self.add( mesh );

  }

  window._ta_events.on('update', this.update.bind(this));
}

inherits(Grass, THREE.Object3D);

Grass.prototype.generateTextureBase = function () {

  var canvas = document.createElement( 'canvas' );
  canvas.width = 512;
  canvas.height = 512;

  var context = canvas.getContext( '2d' );

  for ( var i = 0; i < 20000; i ++ ) {

    context.fillStyle = 'rgba(0,' + Math.floor( Math.random() * 64 + 32 ) + ',16,1)';
    context.beginPath();
    context.arc( Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1 + 0.5, 0, Math.PI * 2, true );
    context.closePath();
    context.fill();

  }
  
  context.globalAlpha = 0.075;
  context.globalCompositeOperation = 'lighter';
  
  return canvas;
};

Grass.prototype.generateTextureLevel = function ( texture ) {

  texture.getContext( '2d' ).drawImage( texture, 0, 0 );

  var canvas = document.createElement( 'canvas' );
  canvas.width = texture.width;
  canvas.height = texture.height;

  canvas.getContext( '2d' ).drawImage( texture, 0, 0 );

  return canvas;
};

Grass.prototype.update = function(arena) {

  var mesh;
  var timestep = arena.time / 1000;

  for ( var i = 0, l = this.levels.length; i < l; i ++ ) {

    mesh = this.levels[ i ];
    mesh.position.x = Math.sin( timestep * 2 ) * i * i * 0.01;
    mesh.position.z = Math.cos( timestep * 3 ) * i * i * 0.01;
    // mesh.material.map.needsUpdate = true;
    // 
    // mesh.position.i = i;
    
    // console.log('%o, %o, %o', mesh.position.x, mesh.position.y, mesh.position.z);
  }
};

},{"inherits":74}],31:[function(require,module,exports){
'use strict';

var inherits = require('inherits');

var Utils = require('../utils');

module.exports = InteractiveObject;

/**
 * @exports threearena/elements/interactiveobject
 * 
 * @constructor
 */
function InteractiveObject (options) {

  options = options || {};

  this.menu = options.menu || {};

  THREE.Object3D.apply(this);
}

inherits(InteractiveObject, THREE.Object3D);

//////////////////

InteractiveObject.prototype.on = InteractiveObject.prototype.addEventListener;

InteractiveObject.prototype.emit = function (event, data) {
  data = data || {};
  data.type = event;
  this.dispatchEvent(data);
};

//////////////////

InteractiveObject.prototype.select = function() {
  this.emit('selected');
  this.traverse(function (child) {
    if (child instanceof THREE.Mesh) {
      Utils.glow(child);
    }
  });
};

InteractiveObject.prototype.deselect = function() {
  this.emit('deselected');
  this.traverse(function (child) {
    if (child instanceof THREE.Mesh) {
      Utils.unglow(child);
    }
  });
};

InteractiveObject.prototype.isNearEnough = function(object) {
  return this.position.distanceTo(object.position) <= 20;
};

},{"../utils":66,"inherits":74}],32:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Collectible = require('./collectible');

module.exports = Mineral;

/**
 * @exports threearena/elements/mineral
 */
function Mineral (options) {

  var self = this;

  options = _.merge({

    kind: 'mineral',

    amount: 1000

  }, options);

  Collectible.apply(this, options);

  var loader = new THREE.OBJMTLLoader();
  loader.addEventListener( 'load', function ( event ) {

    var object = event.content;

    object.scale.set(8, 8, 8);

    self.add(object);

    if (options.onLoad) { options.onLoad(); }
  });

  loader.load('/gamedata/models/mineral/mineral.obj', '/gamedata/models/mineral/mineral.mtl');
}

inherits(Mineral, Collectible);

},{"./collectible":27,"inherits":74,"lodash":85}],33:[function(require,module,exports){
'use strict';

var inherits = require('inherits');

var Entity = require('../entity');

module.exports = Nexus;

/**
 * @exports threearena/elements/nexus
 */
function Nexus (options) {

  var self = this;

  options.radius = 6;
  options.attackRange = 5;

  Entity.apply(this, [ options ]);

  var loader = new THREE.ColladaLoader();
  loader.load( '/gamedata/models/rts_elements.dae', function ( loaded ) {

    // var mesh = new THREE.Mesh( new THREE.CubeGeometry(3, 20, 3, 1, 1, 1) , new THREE.MeshBasicMaterial({ color: options.color }));
    var mesh = loaded.scene.getObjectByName('Obelisk3');

    mesh.castShadow = true;
    mesh.rotation.x = -90 * Math.PI / 180;
    mesh.scale.set(4, 4, 4);
    mesh.position.set(0, 0, 0);
    mesh._shouldGetTerrainMaterial = true;

    self.add(mesh);

    if (options.onLoad) { options.onLoad(self); }
  });
}

inherits(Nexus, Entity);

},{"../entity":41,"inherits":74}],34:[function(require,module,exports){
'use strict';

var inherits = require('inherits');
var InteractiveObject = require('./interactiveobject');

module.exports = Shop;

/**
 * @exports threearena/elements/shop
 */
function Shop (options) {

  InteractiveObject.apply(this, [ options ]);

  var self = this;

  var loader = new THREE.OBJLoader( );
  loader.load( '/gamedata/models/marketplace/marketplace.obj', function ( object ) {

    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material.map = THREE.ImageUtils.loadTexture( '/gamedata/models/marketplace/TXT0499.jpg' );
      }
    });

    object.scale.set(8, 8, 8);
    self.add( object );

    if (options.onLoad) { options.onLoad.apply(self); }
  });
}

inherits(Shop, InteractiveObject);
},{"./interactiveobject":31,"inherits":74}],35:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var LifeBarShader = require('../shaders/lifebar');

module.exports = LifeBar;

/**
 * @exports threearena/elements/lifebar
 */
function LifeBar (options) {

  options = _.merge({

  }, options);

  THREE.Object3D.apply(this);

  // life bar
  this.lifebarMaterial = new LifeBarShader();

  this.lifebar = new THREE.Mesh(new THREE.PlaneGeometry(10, 1, 50, 1), this.lifebarMaterial);
  this.lifebar.position.setY(10);
  this.lifebar.scale.set(1, 5, 1);

  this.add(this.lifebar);

  this.position.set(1, 0, 5);
}

inherits(LifeBar, THREE.Object3D);

LifeBar.prototype.set = function(data) {
  this.setLife(data.life);
  this.setMana(data.mana);
};

LifeBar.prototype.setLife = function(life) {
  this.lifebarMaterial.setLife(life);
};

LifeBar.prototype.setMana = function(mana) {
  this.lifebarMaterial.setMana(mana);
};

LifeBar.prototype.update = function(delta) {
  this.lifebarMaterial.update(delta);
};


},{"../shaders/lifebar":55,"inherits":74,"lodash":85}],36:[function(require,module,exports){
'use strict';

module.exports = Sound;

/**
 * @exports threearena/elements/sound
 */
function Sound ( sources, radius, volume ) {

  var audio = document.createElement( 'audio' );

  for ( var i = 0; i < sources.length; i ++ ) {

    var source = document.createElement( 'source' );
    source.src = sources[ i ];

    audio.appendChild( source );
  }

  this.position = new THREE.Vector3();

  this.play = function () {

    audio.play();

  };

  this.update = function ( camera ) {

    var distance = this.position.distanceTo( camera.position );

    if ( distance <= radius ) {

      audio.volume = volume * ( 1 - distance / radius );

    } else {

      audio.volume = 0;

    }

  };

}
},{}],37:[function(require,module,exports){
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

  var material = new THREE.MeshBasicMaterial({
    color: '#EFEFEF',
    morphTargets: true,
    map: THREE.ImageUtils.loadTexture('/gamedata/textures/bark-oldbrown-c.png')
  });

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
    .to({ distance: -1.0 }, 100)
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

},{"../spell":57,"inherits":74,"tween":89}],38:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Water = require('./water');

module.exports = Terrain;

/**
 * @exports threearena/elements/terrain
 */
function Terrain (file, options) {

  THREE.Object3D.apply(this);

  var self = this;

  self.options = options = options || {};

  var ambient = 0xffffff,
    diffuse = 0xffffff,
    specular = 0xffffff,
    shininess = 20;

  var shader = THREE.ShaderLib[ 'phong' ];
  var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

  // debugger;

  if (uniforms.map) {
    uniforms.map.value = options.map;
    // uniforms.map.value.wrapS = uniforms.map.value.wrapT = THREE.RepeatWrapping;
    // uniforms.map.value.repeat.set( 20000, 20000);
  }


  /*
  if (options.tNormal) {
    uniforms[ 'tNormal' ].value = THREE.ImageUtils.loadTexture( options.tNormal );
    uniforms[ 'tNormal' ].value.wrapS = uniforms[ 'tNormal' ].value.wrapT = THREE.RepeatWrapping;
    uniforms[ 'tNormal' ].value.repeat.set( 2, 2);
    uniforms[ 'uNormalScale' ].value.set( 2, 2 );
  }

  /*
  uniforms[ 'enableDiffuse' ].value = true;
  uniforms[ 'enableSpecular' ].value = true;
  */

  /* */
  if (options.tDiffuse) {
    uniforms.tDiffuse.value = THREE.ImageUtils.loadTexture( options.map );
    uniforms.tDiffuse.value.wrapS = uniforms[ 'tDiffuse' ].value.wrapT = THREE.RepeatWrapping;
    uniforms.tDiffuse.value.repeat.set( 20000, 20000);
    // uniforms.diffuse.value.setHex( 0xffffff );
  }
  /* */

  /* * /
  if (options.tSpecular) {
    uniforms[ 'tSpecular' ].value = THREE.ImageUtils.loadTexture( options.tSpecular );
    uniforms[ 'tSpecular' ].value.wrapS = uniforms[ 'tSpecular' ].value.wrapT = THREE.RepeatWrapping;
    uniforms[ 'tSpecular' ].value.repeat.set( 2, 2);
    uniforms[ 'uSpecularColor' ].value.setHex( 0xffffff );
  }

  if (options.tDisplacement) {
    uniforms[ 'tDisplacement' ].texture = THREE.ImageUtils.loadTexture( 'displacement.jpg' );
    uniforms[ 'uDisplacementBias' ].value = - 0.428408;
    uniforms[ 'uDisplacementScale' ].value = 2.436143;
  }

  /*
  uniforms[ 'enableAO' ].value = false;
  uniforms[ 'uAmbientColor' ].value.setHex( 0xffffff );
  uniforms[ 'uShininess' ].value = shininess;

  //uniforms[ 'wrapRGB' ].value.set( 0.575, 0.5, 0.5 );

  // uniforms[ 'enableAO' ].value = true;
  // uniforms[ 'tAO' ].value = THREE.ImageUtils.loadTexture( '/gamedata/dota_map_full_compress3.jpg' );

  /*
  uniforms[ 'enableDiffuse' ].value = false;
  uniforms[ 'enableSpecular' ].value = false;
  uniforms[ 'enableReflection' ].value = true;

  uniforms[ 'tNormal' ].texture = THREE.ImageUtils.loadTexture( 'normal.jpg' );
  uniforms[ 'tAO' ].texture = THREE.ImageUtils.loadTexture( 'ao.jpg' );

  uniforms[ 'tDisplacement' ].texture = THREE.ImageUtils.loadTexture( 'displacement.jpg' );
  uniforms[ 'uDisplacementBias' ].value = - 0.428408 * scale;
  uniforms[ 'uDisplacementScale' ].value = 2.436143 * scale;

  uniforms[ 'uShininess' ].value = shininess;

  uniforms[ 'tCube' ].texture = reflectionCube;
  uniforms[ 'uReflectivity' ].value = 0.1;

  uniforms[ 'uDiffuseColor' ].value.convertGammaToLinear();
  uniforms[ 'uSpecularColor' ].value.convertGammaToLinear();
  uniforms[ 'uAmbientColor' ].value.convertGammaToLinear();
  */

  /* * /
  console.log('shader.fragmentShader');
  console.log(shader.fragmentShader);

  console.log('shader.vertexShader');
  console.log(shader.vertexShader);
  /* */

  var parameters = _.merge({
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
    uniforms: uniforms,
    lights: true,
    fog: true,
    overdraw: true
  }, options);

  // self.material = new THREE.ShaderMaterial( parameters );
  // self.material = new THREE.MeshBasicMaterial( parameters );
  // self.material = new THREE.MeshLambertMaterial(parameters);
  self.material = new THREE.MeshPhongMaterial(parameters);
  // self.material.wrapAround = true;

  // self.material.shading = THREE.FlatShading;

  // debugger;

  // self.material.map.wrapS = THREE.RepeatWrapping;
  // self.material.map.wrapT = THREE.RepeatWrapping;

  // debugger;

  // Water
  // var water = new Water( 50, 100 );
  // water.position.set( -100, 12, 0 );
  // self.scene.add( water );

  var onLoad = function (object) {
    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = self.material;

        child.geometry.computeVertexNormals();
        // child.geometry.computeTangents();

        child.receiveShadow = true;
      }
    });

    self.add(object);

    if (options.onLoad) { options.onLoad(self); }
  };

  if (file instanceof THREE.Mesh) {

    onLoad(file);

  } else {

    var loader = new THREE.OBJLoader( );
    loader.load(file, function ( object ) {
      onLoad(object);
    });
  }
}

inherits(Terrain, THREE.Object3D);



},{"./water":40,"inherits":74,"lodash":85}],39:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var TWEEN = require('tween');

var Spell = require('../spell');
var Entity = require('../entity');
var Particles = require('../particles/cloud');

module.exports = DefenseTower;

/**
 * @constructor
 * @exports threearena/elements/tower
 */
function DefenseTower ( x, y, z, options ) {

  THREE.Object3D.apply( this );

  var self = this;
  x = x ||  0;
  y = y || 28;
  z = z ||  1;
  options = options || {};

  this.bulletSpeed = options.bulletSpeed || 10;
  this.fireSpeed = options.fireSpeed || 1;

  this.magicLifeDamage = options.magicLifeDamage || 1;
  this.manaDamage = options.magicManaDamage || 1;

  /////

  this._firing = false;
  this._currentTweens = [];

  this.options = _.merge({
    start: true,
    minRange: 0,
    maxRange: 70,
    fireIntensity: 20000,
    orbTexture: options.texture || THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare1_alpha.png' ),
    fireTexture: options.texture || THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare0_alpha.png' ),
  } , options );

  // self.fireCloud = new ParticleCloud( 10000, self.options.fireTexture );

  var loader = new THREE.ColladaLoader();
  loader.load( '/gamedata/models/lantern/lantern.dae', function ( loaded ) {

    self.aura = Particles.Aura( 'point', self.options.fireIntensity, self.options.orbTexture, null );
    self.aura.particleCloud.position.set( x, y+28, z );
    self.add( self.aura.particleCloud );
    
    var lantern = loaded.scene.children[ 0 ];
    lantern.castShadow = true;
    lantern.rotation.x = -90 * Math.PI / 180;
    lantern.scale.set(7, 7, 7);
    lantern.position.set(x, y, z);

    self.add(lantern);

    var selfUpdate = self.update.bind(self);

    if (self.options.start) {
      self.aura.start();
      
      window._ta_events.on('update', selfUpdate);
    }
  });
}

inherits(DefenseTower, THREE.Object3D);

DefenseTower.prototype.update = function(game) {

  var self = this;

  if (this.aura) {
    this.aura.update(game.delta);
  }

  if (this._firing) { return; }

  var i = -1, charDistance, minDistance = Number.MAX_VALUE, nearest = false;
  while (i++ < game.entities.length - 1 && !this._firing) {
    if (game.entities[i].isDead()) { continue; }

    charDistance = game.entities[i].position.distanceTo(self.position);
    if (charDistance >= self.options.minRange && charDistance < self.options.maxRange && charDistance < minDistance) {
      nearest = i;
      minDistance = charDistance;
    }
  }
  if (nearest !== false && ! this._firing) {
    self.fireTo( game.entities[ nearest ] );
  }
};

DefenseTower.prototype.stopFiring = function() {
  this._firing = false;
};

DefenseTower.prototype.fireTo = function(target) {

  if (this._firing || ! target instanceof Entity) { return; }

  this._firing = true;
  
  var startPosition = this.position.clone().setY(35);
  var vectorPosition = target.position.clone().add(startPosition).divideScalar(2).setY(28 + 0);

  var self = this;

  var line = new THREE.SplineCurve3([ startPosition, vectorPosition, target.position ]);
  var cloud = new Particles.ParticleCloud( 10000, self.options.fireTexture, null, {
    // colorHSL: .5
  });
  var cloudUpdate = function(game){
    cloud.update(game.delta);
  }.bind(cloud);

  var tween = new TWEEN.Tween({ distance: 0 })

    .to({ distance: 1 }, line.getLength() * self.bulletSpeed)

    .easing(TWEEN.Easing.Quadratic.InOut)

    .onStart(function(){
      window._ta_events.on('update', cloudUpdate);

      self.add(cloud.particleCloud);
      cloud.start();

      setTimeout(function(){
        self._firing = false;

      }, 4000 / self.fireSpeed);

      setTimeout(function(){
        if (tween) { tween.stop(); }
        window._ta_events.removeListener('update', cloudUpdate);

        self.remove(cloud.particleCloud);
      }, 1000 );
    })
    
    .onComplete(function(){
      window._ta_events.removeListener('update', cloudUpdate);

      self.remove(cloud.particleCloud);
      cloud.stop();

      var spell = new Spell({
        name: 'firebullet',
        source: self,
        magicLifeDamage: self.magicLifeDamage,
        manaDamage: self.manaDamage,
      });
      target.hit(spell);
    })
    
    .onUpdate(function(){
      // get the position data half way along the path
      var pathPosition = line.getPoint(this.distance);

      // move to that position
      cloud.particleCloud.position.set(pathPosition.x * 0.9, pathPosition.y * 0.9, pathPosition.z * 0.9);
      // cloud.emitterpos.set(pathPosition.x * 0.01, pathPosition.y * 0.01, pathPosition.z * 0.01);

      // cloud.emitterpos.set(pathPosition.x, pathPosition.y, pathPosition.z);

      cloud.particleCloud.updateMatrix();
    })
    .start();
};

},{"../entity":41,"../particles/cloud":50,"../spell":57,"inherits":74,"lodash":85,"tween":89}],40:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

module.exports = Water;

/**
 * @exports threearena/elements/water
 */
function Water (width, height) {

  THREE.Object3D.apply(this);

  var noiseTexture = new THREE.ImageUtils.loadTexture( '/gamedata/textures/cloud.png' );
  noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;

  var waterTexture = new THREE.ImageUtils.loadTexture( '/gamedata/textures/water.jpg' );
  waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;

  // use "this." to create global object
  this.customUniforms2 = {
    baseTexture:    { type: 't', value: waterTexture },
    baseSpeed:      { type: 'f', value: 1.15 },
    noiseTexture:   { type: 't', value: noiseTexture },
    noiseScale:     { type: 'f', value: 0.2 },
    alpha:          { type: 'f', value: 0.8 },
    time:           { type: 'f', value: 1.0 }
  };

  // create custom material from the shader code above
  //   that is within specially labeled script tags
  var customMaterial2 = new THREE.ShaderMaterial({
    uniforms: this.customUniforms2,
    vertexShader:   document.getElementById( 'waterVertexShader'   ).textContent,
    fragmentShader: document.getElementById( 'waterFragmentShader' ).textContent
  });

  // other material properties
  customMaterial2.side = THREE.DoubleSide;
  customMaterial2.transparent = true;

  // apply the material to a surface
  var flatGeometry = new THREE.PlaneGeometry( width, height );
  var surface = new THREE.Mesh( flatGeometry, customMaterial2 );
  surface.rotation.x = - 90 * Math.PI / 180;
  this.add( surface );

  window._ta_events.on('update', this.update.bind(this));
}

inherits(Water, THREE.Object3D);

Water.prototype.update = function(game) {
  this.customUniforms2.time.value += game.delta;
};


},{"inherits":74,"lodash":85}],41:[function(require,module,exports){
'use strict';

var now = require('now');
var _ = require('lodash');
var debug = require('debug')('entity');
var inherits = require('inherits');
//var EventEmitter = require('events').EventEmitter;

var log = require('./log');
var settings = require('./settings');
var LifeBar = require('./elements/slifebar');
var AttackCircle = require('./controls/attackcircle');
var Inventory = require('./inventory');

module.exports = Entity;


/**
 * A living entity
 *
 * @summary azd azdzad azd zadazd azdzadzadazdazdzd
 * 
 * @exports Entity
 * 
 * @constructor
 * 
 * @triggers 'changed' when state (attributes, spells, etc) change
 * @triggers 'hit' when being hit
 * @triggers 'death' when being killed
 *
 * @param {Object} options
 *          name, image, life, mana, strength, agility, intelligence,
 *          spells, level, meleeDef, meleeDamage, spellDefense, spellDamage
 */
function Entity (options) {

  var self = this;

  this.game = null;

  THREE.Object3D.apply(this);

  this.state = _.merge({

    name: Math.random(),
    image: '/gamedata/unknown.png',

    tomb: '/gamedata/models/rts_elements.dae',

    life: 100,
    mana: 0,

    separationWeight: settings.data.crowdDefaultSeparationWeight,
    maxAcceleration: settings.data.crowdDefaultMaxAcceleration,
    updateFlags: settings.data.crowdDefaultUpdateFlags,
    maxSpeed: settings.data.crowdDefaultMaxSpeed,
    radius: settings.data.crowdDefaultRadius,
    height: settings.data.crowdDefaultHeight,

    strength: 1,
    agility: 1,
    intelligence: 1,

    spells: [],

    inventory: new Inventory(self),

    level: 1,

    meleeDefense: 1,
    meleeDamage: 1,

    spellDefense: 1,
    spellDamage: 1,

    attackRange: 0

  }, options);

  this._baseLife = this.state.life;
  this._baseMana = this.state.mana;
  this.state.position = this.position;

  // this.attachLifeBar(); // now done in game.add()
  this.attachTombstone();

  this.on('death', function(){
    if (this.behaviour) {
      this.behaviour.identifier = 'beDead';
    }
  });

  // this._meleeCircle = new AttackCircle(5);
  // this.add(this._meleeCircle);
  // this._spellCircle = new AttackCircle(20);
  // this.add(this._spellCircle);

  this.states = {

    idle: function() { },

    canBeDead: function() { return self.isDead(); },
    beDead: function() { },

    canFightObjective: function () {
      return ! self.isDead() && self.objective && (! self.objective.isDead || ! self.objective.isDead()) && self.state.spells[0].canHit(self, self.objective, 2);
    },
    fightObjective: function () {
      self.isFighting = true;
      self.cast(self.state.spells[0], self.objective);
    },

    canFightNearbyEnnemy: function () {
      if (self.isDead()) { return false; }

      var i = -1,
          spell = null,
          ennemy = null,
          nearestEnnemy = null,
          minDistance = Number.MAX_VALUE,
          charDistance = Number.MAX_VALUE;

      if (self.state.autoAttackSpell !== null && self.state.autoAttacks && self.state.spells[ self.state.autoAttackSpell ]) {

        spell = self.state.spells[ self.state.autoAttackSpell ];

        while (i++ < self.game.entities.length - 1) {
          ennemy = self.game.entities[i];

          if (ennemy === self || ennemy.isDead()) { continue; }

          charDistance = ennemy.position.distanceTo(self.position);
          // debug('evaluating if', self, 'has a neighbor: charDistance='+charDistance + '  team='+ennemy.state.team + '  canHit='+spell.canHit(self, ennemy, 3));
          if (charDistance < minDistance && self.state.team !== ennemy.state.team && spell.canHit(self, ennemy, 5)) {
            minDistance = charDistance;
            nearestEnnemy = ennemy;
          }
        }
      }

      if (! nearestEnnemy) {

        // had an ennemy
        if (self._nearestEnnemy) {
          debug('entity %o gives up on %o' + (self._nearestEnnemy.isDead() ? '(dead)' : ''), this, self._nearestEnnemy);
          self._nearestEnnemy = null;

          if (! self._crowd_destination) {
            debug('%o was fighting, must replan to %o', self, self.objective);
            self.emit('destination', self.objective);
          }
        }

        self.isFighting = false;

      } else {
        
        if (self._nearestEnnemy === nearestEnnemy) {
          // debug(self, 'is on the same near ennemy:', self._nearestEnnemy);

        } else {
          self._nearestEnnemy = nearestEnnemy;
          debug('%o found a new near ennemy: %o', self, self._nearestEnnemy);
          self.emit('follow', self._nearestEnnemy);
        }

      }

      return self._nearestEnnemy;
    },
    fightNearbyEnnemy: function () {
      self.isFighting = true;
      self.cast(self.state.spells[0], self._nearestEnnemy);
    },

    plotCourseToObjective: function () {
      if (! self._crowd_destination) {
        self.emit('destination', self.objective);
      }
    },
    canPlotCourseToObjective: function () {
      return ! self.isDead() && // not dead
        (self.objective  && // has an objective
          ! self._crowd_destination && // objective targetted
          ! self.objective.isDead() && // objective is not dead
          ! self.states.canFightNearbyEnnemy()
        );
    },

    followCourseToObjective: function () {
    },

    canFollowCourseToObjective: function () {
      return ! self.isDead() && // not dead
        (self.objective  && // has an objective
          self.objective === self._crowd_destination && // objective targetted
          ! self.objective.isDead() && // objective is not dead
          ! self.states.canFightNearbyEnnemy() &&
          self.objective.position.distanceTo(self.position) > (self.objective.state ? self.objective.state.radius : 2) // not arrived yet
        );
    },

    canFindNearestCollectible: function () {
      return (!self._crowd_destination || !self._crowd_destination.collectible || self._crowd_destination.collectible.workersCount > 3) && self.state.inventory.contents.length === 0;
    },
    findNearestCollectible: function () {
      var mineral = self.game.findWithClass('Mineral', self.position, function(obj){
        return obj.collectible.amount > 0 && obj.collectible.workersCount < 3;
      });
      if (mineral) {
        debug('found a near collectible: %o', mineral);
        mineral.addWorker(self);
        self.emit('destination', mineral);
      }
    },

    canCollect: function () {
      if (self.state.inventory.contents.length >= 10 &&
          self._crowd_destination &&
          self._crowd_destination.collectible)
      {
        self._crowd_destination.removeWorker(self);
        self.emit('nodestination');
      }
      return  self.state.inventory.contents.length < 10 &&
              self._crowd_destination &&
              self._crowd_destination.collectible &&
              self._crowd_destination.collectible.amount > 0 &&
              self._crowd_destination.collectible.workersCount < 5 &&
              self._crowd_destination.position.distanceTo(self.position) - self.state.radius < 1.0;
    },
    collect: function () {
      var time = now();
      if (! self.state._last_collect || self.state._last_collect < time - 600) {
        self._crowd_destination.collectedBy(self, function(){
          self.state._last_collect = time;
          debug('collected from %o', self._crowd_destination);

          // create a little clone of the collectible
          // in the "hands" of the entity
          if (! self._carried_collectible) {
            var clone = self._crowd_destination.clone(); // FIXME: Get a pre-instentiated object 
            // clone.parent.remove(clone);
            clone.scale.set(0.5, 0.5, 0.5);
            clone.position.set(2.0, 2.0, 0);
            self._carried_collectible = clone;
            self.add(clone);
            debug('show a collectible clone %o', clone);
          }

        });
      }
    },

    canFindNearestCollector: function () {
      return  self.state.inventory.contents.length > 9 ||
              (self._crowd_destination &&
               self._crowd_destination.collectible &&
               self._crowd_destination.collectible.amount <= 0);
    },
    findNearestCollector: function () {
      // was working on a mineral, abandon
      if (self._crowd_destination && self._crowd_destination.collectible) {
        self._crowd_destination.removeWorker(self);
      }
      var cc = self.game.findWithClass('CommandCenter', self.position);
      if (cc) {
        debug('found a near collector: %o', cc);
        self.emit('destination', cc);
      }
    },

    canDepositToNearestCollector: function () {
      return  self.state.inventory.contents.length > 0 &&
              self._crowd_destination &&
              self._crowd_destination.collector &&
              (self._crowd_destination.position.distanceTo(self.position) -
                self.state.radius -
                (self._crowd_destination.state && self._crowd_destination.state.radius > 0 ? self._crowd_destination.state.radius : 0) < 1.0);
    },
    depositToNearestCollector: function () {
      self.emit('nodestination');
      self.state.inventory.contents = [];

      debug('deposit in collector');

      if (self._carried_collectible) {
        self.remove(self._carried_collectible);
        self._carried_collectible = null;
      }
    },

  };

  this.emit('changed', this.state);
}

inherits(Entity, THREE.Object3D);

//////////////////
// Mock EventEmitter using ThreeJS builtin methods

Entity.prototype.on = Entity.prototype.addEventListener;
Entity.prototype.removeListener = Entity.prototype.removeEventListener;
Entity.prototype.emit = function (event, data) {
  data = data || {};
  data.type = event;
  this.dispatchEvent(data);
};

/**
 * String representation of the entity
 */
Entity.prototype.toString = function() {

  return this.constructor.name + '#' + this.id;
};

/**
 * Attach a life/mana bar above the entity
 */
Entity.prototype.attachLifeBar = function() {

  this.lifebar = new LifeBar();
};

/**
 * Update the character lifebar
 */
Entity.prototype.updateLifeBar = function() {

  var eventData = {
    life: this._baseLife === false ? false : this._baseLife > 0 ? 1 / this._baseLife * this.state.life : 0,
    mana: this._baseMana === false ? false : this._baseMana > 0 ? 1 / this._baseMana * this.state.mana : 0
  };

  // this.lifebar.position.copy(this.position.x).setY(20);
  this.lifebar.set(eventData);

  this.emit('changed', eventData);
};

/**
 * Attach a tomb, to replace the dead entity
 */
Entity.prototype.attachTombstone = function() {

  var self = this;
  var loader = new THREE.ColladaLoader();
  loader.load( self.state.tomb, function ( loaded ) {

    self.tomb = loaded.scene.getObjectByName('Cross2');

    self.tomb.castShadow = true;
    self.tomb.rotation.x = -90 * Math.PI / 180;
    self.tomb.scale.set(2, 2, 2);
    self.tomb.position.set(0, 0, 0);

    // when character die, show just a tomb
    self.on('death', function() {
      self.update = function(){};

      var children = _.clone(self.children);
      _.each(children, function(child){ self.remove(child); });

      children = _.clone(self.character.children);
      _.each(children, function(child){ self.character.remove(child); });

      self.add(self.tomb);
    });
  });
};


/**
 * Add a life amount
 * @param  {Number} increment
 * @return {Number} new life amount
 */
Entity.prototype.incrementLife = function(inc) {

  this.state.life = Math.min( this.state._baseLife || 100, Math.max( 0, this.state.life + inc ) );
  return this.state.life;
};

/**
 * Add a mana amount
 * @param  {Number} inc
 * @return {Number} new mana amount
 */
Entity.prototype.incrementMana = function(inc) {

  this.state.mana = Math.min( this.state._baseMana || 100, Math.max( 0, this.state.mana + inc ) );
  return this.state.mana;
};

/**
 * Returns true if entity is dead
 * @return {Boolean}
 */
Entity.prototype.isDead = function() {

  return this.state.life <= 0;
};

/**
 * Returns true if entity is alive
 * @return {Boolean}
 */
Entity.prototype.isAlive = function() {

  return ! this.isDead();
};

/**
 * Returns true if entity is out of mana
 * @return {Boolean}
 */
Entity.prototype.isOutOfMana = function() {

  return this.state.mana <= 0;
};

/**
 * Make the entity move along a path
 * @param  {Array|THREE.Shape} the shape, or the points the entity will walk along
 * @param  {Object} options, such as
 *              start
 *              onStart
 *              onComplete
 *              onUpdate
 * @return {Tween} the Tween.js object
 */
Entity.prototype.moveAlong = function() {

  throw 'Parent class Entity cannot move';
};

/**
 * Learn a spell
 * @param  {Spell} spell class
 * @trigger 'changed'
 */
Entity.prototype.learnSpell = function(SpellClass) {

  this.state.spells.push(new SpellClass({ source: this }));

  this.emit('changed', this);
};

/**
 * Cast a spell
 * @param  {Spell} spell
 * @return {Boolean} True if spell has been casted
 */
Entity.prototype.cast = function(spell, target) {

  if (this.isDead()) {
    debug('%o cannot cast this spell because it is dead !', this);
    return;
  }

  // handle cooldown
  if (spell.ccd > 0) {

    // debug('this spell is not ready yet (%dms)', spell.ccd);
    return;

  } else {
    spell.startCooldown(this);
  }

  debug('%o begins to cast %o', this, spell);

  // place myself on a correct attacking range arc
  // if (spell.isMelee && ! this._fightingArc) {

  //   var radius  = spell.maxRange + target.state.attackRange,
  //       start   = (new THREE.Vector3( -radius, 0, 0 )).add(target.position),
  //       middle  = (new THREE.Vector3( 0, 0, -radius )).add(target.position),
  //       end     = (new THREE.Vector3(  radius, 0, 0 )).add(target.position);

  //   this._fightingArc = new THREE.QuadraticBezierCurve3(start, middle, end);
  //   var p = this._fightingArc.getPointAt(Math.random());

  //   this.position.set( p.x, p.y, p.z );
  // }

  spell.start(this, target);

  return true;
};

/**
 * Hit this entity with a spell
 * 
 * @param  {Spell} spell
 * @triggers 'hit', 'changed', 'death'
 */
Entity.prototype.hit = function(spell) {

  if (this.isDead()) {
    debug('%o is already dead !', this);
    return;
  }

  spell.target = this;

  var eventData = {
    dodged: 0,
    meleeLifeDamageReceived: 0,
    magicLifeDamageReceived: 0,
    manaDamageReceived: 0,
    spell: spell
  };

  eventData.meleeLifeDamageReceived = spell.meleeLifeDamage;
  eventData.magicLifeDamageReceived = spell.magicLifeDamage;
  eventData.manaDamageReceived = spell.manaDamage;

  eventData.totalLifeDamage = eventData.meleeLifeDamageReceived + eventData.magicLifeDamageReceived;

  // apply hits
  this.incrementLife(-eventData.totalLifeDamage);
  this.incrementMana(-eventData.manaDamageReceived);

  this.updateLifeBar();

  this.emit('hit', eventData);

  debug('%o hit %o with %o : %d + %d + %d (%s) - %s' ,
    spell.source, this,
    spell.name, eventData.magicLifeDamageReceived, eventData.meleeLifeDamageReceived, eventData.manaDamageReceived,
    (spell.isCritical ? 'critical' : 'normal'), eventData.damageAbsorbed
  );

  // send events & animations
  if (this.isDead()) {

    this.emit('death', eventData);
    if (this.character) { this.character.setAnimation('death'); }

  } else {

    if (this.character) { this.character.setAnimation('pain'); }
  }
};

},{"./controls/attackcircle":18,"./elements/slifebar":35,"./inventory":48,"./log":49,"./settings":54,"debug":73,"inherits":74,"lodash":85,"now":87}],42:[function(require,module,exports){
module.exports = {
  GameHud: require('./ingame'),
  Sidemenu: require('./sidemenu')
};
},{"./ingame":43,"./sidemenu":44}],43:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var ko = require('knockout');

var InteractiveObject = require('../elements/interactiveobject');
// var DialogObject = require('../elements/dialogobject');

var InteractiveView = require('../views/interactiveview');
var DialogView = require('../views/dialogview');

var EntityView = require('../views/entityview');
var GameView = require('../views/gameview');
var Entity = require('../entity');

module.exports = GameHud;

function GameHud (element) {
  
  this.root = element instanceof Node ? element : document.getElementById(element);

  this.root.classList.add('animated');

  ///////////////////////

  this._attachedEntity = null;
  this._attachedEntityListeners = [];

  this.root.addEventListener('click', function(event){
    event.preventDefault();
    event.stopPropagation();
    return false;
  }, false);
}

GameHud.prototype.open = function () {

  this.root.classList.remove( 'fadeOutDownBig' );
  this.root.classList.add( 'fadeInUpBig' );
  this.root.style.display = 'block';
  this.root.style.height = '200px';
};

GameHud.prototype.close = function () {

  this.root.classList.remove( 'fadeInUpBig' );
  this.root.classList.add( 'fadeOutDownBig' );
  this.root.style.height = 0;
};

GameHud.prototype.isOpen = function () {

  return this.root.classList.contains( 'fadeInUpBig' );
};

//////////////////////////////

GameHud.prototype.attachEntity = function (entity) {

  if (entity instanceof Entity) {
    this.currentEntity = entity;

    this.entityview = new EntityView(entity, this.currentGame);
    ko.applyBindings(this.entityview, document.getElementById('view-character'));

  } else {
    throw entity + ' is not an Entity instance';
  }
};

GameHud.prototype.attachGame = function (game) {

  this.gameview = new GameView(game);
  this.currentGame = game;
  ko.applyBindings(this.gameview, document.getElementById('view-map'));

  this.currentGame.settings.container.addEventListener('keyup', this.keyup.bind(this), false);
};

GameHud.prototype.keyup = function(event) {

  var spell;

  switch( event.keyCode ) {

    case 49: // 1
      spell = this.currentEntity.state.spells[0];
      break;
    case 50:
      spell = this.currentEntity.state.spells[1];
      break;
    case 51:
      spell = this.currentEntity.state.spells[2];
      break;
    case 52:
      spell = this.currentEntity.state.spells[3];
      break;
  }

  if (spell) {
    this.entityview.cast(spell, null);
  }
};

GameHud.prototype.startInteraction = function(object) {

  var viewModel;
  var domElement;

  if (object instanceof InteractiveObject) {

    viewModel = new InteractiveView(object);
    domElement = document.getElementById('view-contextmenu');

  } else if (object.dialog) {

    viewModel = new DialogView(object.dialog);
    domElement = document.getElementById('view-dialogmenu');

  }

  if (! viewModel) {
    throw object + ' is not an Entity instance';
  }

  if (! domElement._ta_open) {
    domElement._ta_open = true;
    domElement.style.display = 'block';
    ko.applyBindings(viewModel, domElement);
  }
  object.on('deselected', function(){
    domElement._ta_open = false;
    domElement.style.display = 'none';
    ko.cleanNode(domElement);
  });

};


},{"../elements/interactiveobject":31,"../entity":41,"../views/dialogview":67,"../views/entityview":68,"../views/gameview":69,"../views/interactiveview":70,"knockout":84,"lodash":85}],44:[function(require,module,exports){
'use strict';

module.exports = Sidemenu;

function Sidemenu () {
  
  this.root = document.getElementById('hud-container');

  this.root.classList.add( 'animated' );
}

Sidemenu.prototype.css = '<style type="text/css"> #hud { position: absolute; top: 0; left: 0; bottom: 0; width: 20%; background: #222; opacity: .8; z-index: -10; } </style>';

Sidemenu.prototype.open = function () {

  this.root.classList.remove( 'fadeOutLeft' );
  //this.root.classList.add( 'fadeInLeft' );
  this.root.style.zIndex = 10000;
};

Sidemenu.prototype.close = function () {

  this.root.classList.remove( 'fadeInLeft' );
  //this.root.classList.add( 'fadeOutLeft' );
  this.root.style.zIndex = -2;
};

Sidemenu.prototype.isOpen = function () {

  return this.root.style.zIndex > 0;
  // return this.root.classList.contains( 'fadeInLeft' );
};
},{}],45:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var TWEEN = require('tween');

module.exports = SpellTexts;

function SpellTexts (game, options) {

  var self = this;

  this.options = _.merge({
    font: 'helvetiker',
    weight: 'normal',
    style: 'normal',
  }, options);

  self.root = game.settings.container;

  self._bindEntity = function (entity) {
    entity.on('hit', self._showHit);
  };

  game.on('added:entity', self._bindEntity);

  self._showHit = function (eventData) {

    var textGeom = new THREE.TextGeometry( ''+eventData.totalLifeDamage, {
      size: Math.sqrt(eventData.totalLifeDamage),
      height: 1,
      curveSegments: 3,
      font: self.options.font,
      weight: self.options.weight,
      style: self.options.style,
      bevelThickness: 0,
      bevelSize: 0,
      bevelEnabled: false,
      material: 0,
      extrudeMaterial: 1
    });

    var hitMaterial = new THREE.MeshBasicMaterial({
      shading: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      color: 0xff0000,
      opacity: 1
    });
    var textMesh = new THREE.Mesh(textGeom, hitMaterial);

    self._tween(textMesh, eventData);
  };

  self._showHeal = function (eventData) {

    var textGeom = new THREE.TextGeometry(eventData.totalLifeDamage, {
      size: Math.max(Math.sqrt(eventData.totalLifeDamage), 1),
      height: 1,
      curveSegments: 1,
      font: self.options.font,
      weight: self.options.weight,
      style: self.options.style,
      bevelThickness: 0,
      bevelSize: 0,
      bevelEnabled: false,
      material: 0,
      extrudeMaterial: 0
    });

    var healMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      color: 0x00ff00,
      opacity: 1
    });

    var textMesh = new THREE.Mesh(textGeom, healMaterial);

    self._tween(textMesh, eventData);
  };

  self._tween = function (mesh, eventData) {

    eventData.spell.target.add(mesh);

    mesh.position.z = -2;
    mesh.position.y = 10;

    return new TWEEN.Tween({ y: 10, opacity: 1, scale: 0.2 })
      .to({ y: 20, opacity: 0, scale: 2 }, 1000)
      .easing( TWEEN.Easing.Quadratic.InOut)
      .onComplete(function(){
        eventData.spell.target.remove(mesh);
      })
      .onUpdate(function(){
        // console.log(this);
        // adjust position, opacity & size
        mesh.position.y = this.y;
        mesh.material.opacity = this.opacity;
        mesh.scale.set(this.scale, this.scale, this.scale);

        // always face camera
        mesh.rotation.y = eventData.spell.target.game.camera.rotation.y - eventData.spell.target.rotation.y;
      })
      .start();
  };
}

},{"lodash":85,"tween":89}],46:[function(require,module,exports){
var process=require("__browserify_process");'use strict';

var debug = require('debug')('arena');

var settings = require('./settings');
var settingsGUI = require('./settings-gui');

var now = require('now');
var _ = require('lodash');
var tic = require('tic')();
var async = require('async');
var TWEEN = require('tween');
var Stats = require('../vendor/stats');
var detector = require('../vendor/detector');
var inherits = require('inherits');
var EventEmitter = require('EventEmitter');
var interact = process.browser ? require('interact') : null;
// var requestAnimationFrame = require('request-animation-frame').requestAnimationFrame;

var Machine = require('machinejs');


var HUD = require('./hud');
var Crowd = require('./crowd');
var Utils = require('./utils');
var Entity = require('./entity');
var LifeBar = require('./elements/slifebar');
var DestinationMarker = require('./controls/destinationmarker');
var Terrain = require('./elements/terrain');
var InteractiveObject = require('./elements/interactiveobject');
var PathFinding = require('./pathfinding');
var CameraControls = require('./controls/dota');
var SpellTexts = require('./hud/spelltexts');
var Collectible = require('./elements/collectible');
var MouseControls = require('./input/mouse');
// var GamepadControls = require('./input/gamepad');
var ZoneSelector = require('./controls/zoneselector');

module.exports = Arena;

/**
 * The main game class
 * 
 * @exports Arena
 * 
 * @constructor
 * 
 * @param {object} settings
 * @param {string} settings.container Game container #id
 * @param {string} settings.splashContainer Game splashscreen, to be hidden when the game will start
 * 
 * @param {number=} settings.speed Game speed. Accelerated > 1 > Deccelerated
 * 
 * @param {object=} settings.fog Fog settings
 * @param {colorstring=} settings.fog.color Fog color
 * @param {number=} settings.fog.near Fog near
 * @param {number=} settings.fog.far Fog far
 * 
 * @param {object=} settings.hud HUD settings
 * @param {number=} settings.hud.mouseBorderDetection Border percentage after which the camera moves, set to false to disable
 *
 * @param {object=} settings.debug Debugging settings
 * @param {boolean=} settings.debug.showRoutes Show character routes as they are created
 * @param {boolean=} settings.debug.visibleCharactersHelpers Show characters bounding boxes
 * 
 */
var Arena = function (overrideSettings) {

  if (process.browser && this.notCapable()) {
    return;
  }

  // FIXME
  window._ta_events = new EventEmitter();

  var self = this;

  if (this.setMaxListeners) {
    this.setMaxListeners(1000);
  }

  /**
   * The game params
   * @type {Object}
   */
  this.settings = settings.data;

  for (var s in overrideSettings) {
    this.settings[s] = overrideSettings[s];
  }

  //////////

  /**
   * True if the game has started 
   * @type {Boolean}
   */
  this.started = false;

  /**
   * True if the game is currently running
   * @type {Boolean}
   */
  this.running = false;

  /**
   * The unique detination marker, repositioned on every moves
   * @type {DestinationMarker}
   */
  this.destinationMarker = new DestinationMarker(this);

  this._defaultZoneSelector = new ZoneSelector(this);

  this.selectionElement = $('#selection-rectangle');

  /**
   * The game clock
   * @type {THREE.Clock}
   */
  this.clock = new THREE.Clock();

  this.pathfinder = new PathFinding(this);

  /**
   * Each team objectives
   * @type {Object}
   */
  this.objectives = {
    0: null,  // team 2 objective
    1: null,  // team 1 objective
  };

  /**
   * The terrain
   * @type {Terrain}
   */
  this.ground = null;

  /**
   * The crowd system
   * @type {Crowd}
   */
  this.crowd = null;

  /**
   * Current selection callback, or null if no selection is waited
   * @type {Function}
   */
  this._waitForEntitySelection = null;

  /**
   * All entities
   * @type {Array}
   */
  this.entities = [];

  /**
   * Currently selected entity
   * @type {Array}
   */
  this.entity = null;

  /**
   * All intersectable objects
   * @type {Array}
   */
  this.intersectObjects = [];

  /**
   * The state machine enine
   * @type {Machine}
   */
  this.machine = new Machine();

  /**
   * Parent of all helpers
   * @type {THREE.Object3D}
   */
  this.helpers = new THREE.Object3D();

  /**
   * The game HUD
   * @type {HUD}
   */
  this.hud = new HUD.GameHud('hud-container');
  this.hud.attachGame(this);

  this.spelltexts = new SpellTexts(this);

  //////////

  this.commonMaterials = {

    'entityHelpers': new THREE.MeshBasicMaterial({
      wireframe: true,
      wireframeLinewidth: 1,
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    })

  };

  //////////

  settings.on('helpersUpdated', function(){

    _.each(self.entities, function(entity){
      entity[ self.settings.visibleCharactersHelpers ? 'add' : 'remove' ](entity.axisHelper);
      // entity[ self.settings.visibleCharactersHelpers ? 'add' : 'remove' ](entity.bboxHelper);
      entity[ self.settings.visibleCharactersHelpers ? 'add' : 'remove' ](entity.radiusHelper);
      entity.radiusHelper.scale.set(entity.state.radius, entity.state.height, entity.state.radius);
      entity.bboxHelper.material.visible = self.settings.visibleCharactersHelpers;
    });

  });

  settings.on('cameraUpdated', function(){

    self.zoom(self.settings.cameraFov);
  });

  //////////

  if (settings.enableGLStats) {
    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = '0px';
    this.settings.container.appendChild( this.stats.domElement );
  }

  /**
   * The dat.GUI instance 
   * @type {dat.GUI}
   */
  this.gui = settingsGUI.create({ });

  //////////

  this._initScene(function () { });
  
  //////////

  this.on('set:terrain', function(){

    _.each(self.entities, function(obj){
      self.groundObject(obj);
    });

    // this.on('set:renderer', function(){
    //   // depends on terrain size
    //   self._clampCameraToGround();
    // });

  });
};

inherits(Arena, EventEmitter);


Arena.prototype.use = function(Component) {
  new Component(this);
};

/**
 * Test the WebGL environement
 * 
 * @return True if the current environement is not WebGL capable
 */
Arena.prototype.notCapable = function() {

  if (! detector().webgl) {
    this.settings.container.append(this.notCapableMessage());
    return true;
  }
  return false;
};

/**
 * A WebGL incentive message, for diasbled browsers
 * 
 * @return A DOM node element
 */
Arena.prototype.notCapableMessage = function() {
  var wrapper = document.createElement('div');
  wrapper.className = 'errorMessage';
  var a = document.createElement('a');
  a.title = 'You need WebGL and Pointer Lock (Chrome 23/Firefox 14) to play this game. Click here for more information.';
  a.innerHTML = a.title;
  a.href = 'http://get.webgl.org';
  wrapper.appendChild(a);
  return wrapper;
};

/**
 * Init the pathfinding subsystem, and load its settings.preload urls
 * 
 * @param  {Function} callback called when finished
 */
Arena.prototype.preload = function(done, progressCallback) {

  var self = this;

  if (this.settings.preload.length > 0) {

    var tasks;

    if (progressCallback) {

      var total = this.settings.preload.length;
      tasks = [];

      for (var i = 0; i < this.settings.preload.length; i++) {
        tasks.push(function(pdone){
          var selfFunc = this;
          self.settings.preload[selfFunc.preloadIndex](function(){
            progressCallback(selfFunc.step, selfFunc.total);
            pdone();
          });
        }.bind({ preloadIndex:i, step:i+1, total:total }));
      }

    } else {
      tasks = this.settings.preload;
    }

    async.parallel(tasks, function() {
      self.settings.preload.length = 0;
      done();
    });

  } else {

    if (progressCallback) {
      progressCallback(1, 1);
    }

    done();
  }
};

/**
 * Init the game, reset characters and map elements
 * 
 * @param  {Function} callback called when ready to run
 * 
 * @fires module:threearena/game#ready
 */
Arena.prototype.init = function(ready) {

  var self = this;

  async.series([

    function(done){
      async.parallel([

        function(pdone){ self._initCrowd(pdone); },   // crowd

        function(pdone){ self._initCamera(pdone); },  // camera

        function(pdone){ self._initLights(pdone); },  // lights

        function(pdone){ self._initRenderer(pdone); },// lights

      ], done);
    },

    // function(done){ self._initSky(done); },   // sky needs terrain

    function(done){ self.emit('ready', self); done(); },

  ], function(){ ready(self); });
};

/**
 * Init the game camera
 * 
 * @private
 */
Arena.prototype._initCamera = function(done) {

  var dims = this.getContainerDimensions();

  this.camera = new THREE.PerspectiveCamera( settings.data.cameraFov, dims.width / dims.height, 1, 1000 );

  this.emit('set:camera');

  done();
};

/**
 * Init scene
 * 
 * @private
 */
Arena.prototype._initScene = function(done) {

  var self = this;

  this.scene = new THREE.Scene();
  // this.scene.autoUpdate = false;
  this.scene.fog = new THREE.Fog( self.settings.fogColor, self.settings.fogNear, self.settings.fogFar );

  this.scene.add(this.destinationMarker);
  this.scene.add(this.helpers);

  this.scene2 = new THREE.Scene();
  this.scene2.fog = new THREE.Fog( self.settings.fogColor, self.settings.fogNear, self.settings.fogFar );

  this.emit('set:scene');

  settings.on('fogUpdated', function(){
    //this.scene.fog.color.set(self.settings.fogColor);
    self.scene.fog.near = self.settings.fogNear;
    self.scene.fog.far = self.settings.fogFar;

    //self.scene2.fog.color.set(self.settings.fogColor);
    self.scene2.fog.near = self.settings.fogNear;
    self.scene2.fog.far = self.settings.fogFar;
  });

  done();
};

/**
 * Init scene
 * 
 * @private
 */
Arena.prototype._initCrowd = function(done) {

  this.crowd = new Crowd(this);

  this.emit('set:crowd');

  done();
};


/**
 * Init global game lights
 * 
 * @private
 */
Arena.prototype._initLights = function(done) {

  var self = this;

  this.frontAmbientLight = new THREE.AmbientLight( 0xffffff );
  this.scene2.add( this.frontAmbientLight );

  this.ambientLight = new THREE.AmbientLight( settings.data.lightAmbientColor );
  this.scene.add( this.ambientLight );

  // SpotLight( hex, intensity, distance, angle, exponent )
  // PointLight( hex, intensity, distance )

  /*
  this.pointLight = new THREE.PointLight( 0xffffff, 1, 100 ); //, Math.PI );
  this.pointLight.shadowCameraVisible = true;
  this.pointLight.position.set( -20, 0, 20 );
  */

  this.pointLight = new THREE.SpotLight( settings.data.lightPointColor, 1, 100, Math.PI );
  this.pointLight.shadowCameraVisible = true;
  this.pointLight.shadowCameraNear = 10;
  this.pointLight.shadowCameraFar = 100;
  this.pointLight.position.set( 0, 180, 0 );
  this.pointLight.intensity = 5;
  this.pointLight.distance = 250;
  this.pointLight.angle = 0.5;
  this.pointLight.exponent = 40;
  this.pointLight.ambient = 0xffffff;
  this.pointLight.diffuse = 0xffffff;
  this.pointLight.specular = 0xffffff; // new THREE.Color('#050101'); // 0xaaaa22;
  this.scene.add(this.pointLight);


  
  this.directionalLight = new THREE.SpotLight( settings.data.lightDirectionalColor, 1, 800 );
  this.directionalLight.ambient = 0xffffff;
  this.directionalLight.diffuse = 0xffffff;
  this.directionalLight.specular = 0xffffff; // new THREE.Color('#050101'); // 0xaaaa22;

  this.directionalLight.position.set( -200, 400, -200 );
  this.directionalLight.intensity = 2;
  this.directionalLight.castShadow = self.settings.lightDirectionalShadows;
  this.directionalLight.shadowMapWidth = 1024;
  this.directionalLight.shadowMapHeight = 1024;
  this.directionalLight.shadowMapDarkness = 0.95;
  this.directionalLight.shadowCameraVisible = true;
  this.scene.add( this.directionalLight );

  this.emit('set:lights');

  settings.on('lightsUpdated', function(){

    self.ambientLight.color.set(self.settings.lightAmbientColor);

    self.pointLight.color.set(self.settings.lightPointColor);
    self.pointLight.intensity = self.settings.lightPointIntensity;
    self.pointLight.distance = self.settings.lightPointDistance;
    self.pointLight.angle = self.settings.lightPointAngle;
    
    self.directionalLight.color.set(self.settings.lightDirectionalColor);
    self.directionalLight.intensity = self.settings.lightDirectionalIntensity;
    self.directionalLight.distance = self.settings.lightDirectionalDistance;
    self.directionalLight.castShadow = self.settings.lightDirectionalShadows;

  });

  done();
};

/**
 * Init the renderer
 * 
 * @private
 */
Arena.prototype._initRenderer = function(done) {

  var dims = this.getContainerDimensions();

  this.renderer = new THREE.WebGLRenderer({
    antialias: (settings.data.quality >= settings.QUALITY_BEST)
  });
  this.renderer.shadowMapEnabled = false;
  this.renderer.shadowMapSoft = false;
  // this.renderer.shadowMapType = THREE.PCFSoftShadowMap;

  this.renderer.sortObjects = false;

  this.renderer.shadowCameraNear = 3;
  this.renderer.shadowCameraFar = this.camera.far;
  this.renderer.shadowCameraFov = 50;

  this.renderer.autoClear = false;
  this.renderer.gammaInput = true;
  this.renderer.gammaOutput = true;
  this.renderer.physicallyBasedShading = true;

  // this.renderer.shadowMapBias = 0.0039;
  // this.renderer.shadowMapDarkness = 0.5;
  // this.renderer.shadowMapWidth = dims.width;
  // this.renderer.shadowMapHeight = dims.height;

  this.renderer.setClearColor( this.scene.fog.color, 1 );

  this.renderer.setSize( dims.width, dims.height);

  this._effectsPass = {
    renderModel  : new THREE.RenderPass( this.scene, this.camera ),
    effectBleach : new THREE.ShaderPass( THREE.BleachBypassShader ),
    effectColor  : new THREE.ShaderPass( THREE.ColorCorrectionShader ),
    effectFXAA   : new THREE.ShaderPass( THREE.FXAAShader )
  };

  this._effectsPass.effectFXAA.uniforms.resolution.value.set( 1 / dims.width, 1 / dims.height );
  this._effectsPass.effectBleach.uniforms.opacity.value = 0.2;
  this._effectsPass.effectColor.uniforms.powRGB.value.set( 1.4, 1.45, 1.45 );
  this._effectsPass.effectColor.uniforms.mulRGB.value.set( 1.1, 1.1, 1.1 );
  this._effectsPass.effectFXAA.renderToScreen = true;

  this.composer = new THREE.EffectComposer( this.renderer );
  this.composer.addPass( this._effectsPass.renderModel );

  if (settings.data.quality >= settings.QUALITY_HIGH) {
    this.composer.addPass( this._effectsPass.effectColor );
  }

  if (settings.data.quality >= settings.QUALITY_BEST) {
    this.composer.addPass( this._effectsPass.effectBleach );
  }

  this.composer.addPass( this._effectsPass.effectFXAA );

  this.settings.container.appendChild( this.renderer.domElement );

  // CONTROLS

  //this.cameraControls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
  this.cameraControls = new CameraControls( this.camera, this.renderer.domElement, this.settings.hud );
  this.cameraControls.domElement = this.renderer.domElement;

  this.emit('set:renderer');

  if (this.gui) {
    var folder = this.gui.addFolder('Renderer');
    _.each(this._effectsPass, function(effect, name){
      folder.add(effect, 'enabled').name(name);
    });
  }

  done();
};

/**
 * Clamp the camera movement to the ground boundings
 * 
 * @private
 */
Arena.prototype._clampCameraToGround = function() {

  if (this.cameraControls) {
    this.cameraControls.clamp = {
      xmin: this.ground.boundingBox.min.x * 0.9,
      xmax: this.ground.boundingBox.max.x * 0.9,
      zmin: this.ground.boundingBox.min.z * 0.9 + 30,
      zmax: this.ground.boundingBox.max.z * 0.9 + 50
    };
  }
};

/**
 * Init the skybox
 * 
 * @private
 * @param  {Function} done called when finished
 */
Arena.prototype._initSky = function(done) {
  var urlPrefix = '/gamedata/skybox/darkred_';
  var urls = [
    urlPrefix + 'posx.jpg', urlPrefix + 'negx.jpg',
    urlPrefix + 'posy.jpg', urlPrefix + 'negy.jpg',
    urlPrefix + 'posz.jpg', urlPrefix + 'negz.jpg'
  ];
  var textureCube = THREE.ImageUtils.loadTextureCube( urls );

  var shader = THREE.ShaderLib['cube'];
  var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
  uniforms['tCube'].value = textureCube;
  var material = new THREE.ShaderMaterial({
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
    uniforms: uniforms,
    depthWrite: false
  });

  this.on('set:terrain', function(terrain){

    // build the skybox Mesh 
    var skyboxMesh = new THREE.Mesh( new THREE.CubeGeometry( 1000, 1000, 1000 ), material );
    skyboxMesh.flipSided = true;
    // tskyboxMesh.renderDepth = 1e20;
    this.scene.add( skyboxMesh );
  });

  done();
};


// # Debugging methods

Arena.prototype.addMarker = function(position) {
  var geometry = new THREE.SphereGeometry( 0.1, 10, 10 );
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff, shading: THREE.FlatShading } );
  var mesh = new THREE.Mesh( geometry, material );
  mesh.position.copy(position);
  this.scene.add(mesh);
};

// # Misc internal methods

Arena.prototype.setInterval = tic.interval.bind(tic);
Arena.prototype.setTimeout = tic.timeout.bind(tic);

// teardown methods
Arena.prototype.destroy = function() {
  clearInterval(this.timer);
};

/**
 * Attach a listener for the next entity selection. There can be only one listener.
 * 
 * @param  {Function} onSelection
 */
Arena.prototype.waitForEntitySelection = function(onSelection) {

  if (typeof onSelection === 'function') {
    $(this.settings.container).addClass('waitForEntitySelection');
  } else {
    $(this.settings.container).removeClass('waitForEntitySelection');
    onSelection = null;
  }

  this._waitForEntitySelection = onSelection;
};

/**
 * Attach a listener for the next zone selection. There can be only one listener.
 * 
 * @param  {Function} onSelection
 */
Arena.prototype.waitForZoneSelection = function(onSelection, zoneSelector) {

  // create a bound if not already present
  this.__tmp_zoneSelectorListener = this.__tmp_zoneSelectorListener || this.updateZoneSelector.bind(this);

  if (typeof onSelection === 'function') {
    $(this.settings.container).addClass('waitForZoneSelection');
    this._currentZoneSelector = zoneSelector || this._defaultZoneSelector;
    this.scene.add(this._currentZoneSelector);
    this.on('cursor:move', this.__tmp_zoneSelectorListener);

  } else {

    this.off('cursor:move', this.__tmp_zoneSelectorListener);
    $(this.settings.container).removeClass('waitForZoneSelection');
    this.scene.remove(this._currentZoneSelector);
    onSelection = null;
  }

  this._waitForZoneSelection = onSelection;
};

/**
 * Cast a Raycaster in camera space
 * 
 * @param  {Array} objects specify which objects to raycast against, all intersectables object by default
 * @return {object} An intersections object
 *
 * @example
 * window.onClick = function ( event ) {
 *   var inter = game.raycast( event, candidates );
 *   console.log( "ray intersects %d objects, first one in sight is %o (face %o) at %o",
 *       inter.length, inter[0].object, inter[0].face, inter[0].point );
 * }
 */
Arena.prototype.raycast = function( event, objects ) {

  objects = objects || this.intersectObjects;

  if (! this._raycasterVector) {
    this._raycasterVector = new THREE.Vector3();
  }

  var dims = this.getContainerDimensions();

  this._raycasterVector.set(
     (event.layerX / dims.width) * 2 - 1,
    -(event.layerY / dims.height) * 2 + 1,
    this.camera.near
  );

  if (! this._projector) {
    this._projector = new THREE.Projector();
  }

  this._projector.unprojectVector(this._raycasterVector, this.camera);

  this._raycaster = new THREE.Raycaster(this.camera.position,
  this._raycasterVector.sub(this.camera.position).normalize());

  var intersects = this._raycaster.intersectObjects(objects, true); // recursive

  return intersects;
};

////////////////////////////////

/**
 * Get the game container dimensions
 * 
 * @return {object} { width:W, height:H }
 */
Arena.prototype.getContainerDimensions = function() {

  var $container = this.started ? $(this.settings.container) : $(window);

  return {
    width: $container.outerWidth(),
    height: $container.outerHeight()
  };
};

/**
 * Set listeners to play the game in the browser
 * 
 * @private
 */
Arena.prototype._initControls = function() {

  this.mouseControls = new MouseControls(this);
  // this.gamepadControls = new GamepadControls(this);

  this.settings.container.addEventListener('mousemove', this._onCursorMove.bind(this), false );
  this.settings.container.addEventListener('keyup', this._onKeyUp.bind(this), false );

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', this._onWindowResize.bind(this), false);
  }
};

/**
 * Test a key against the specified binding
 * @param  {literal} value  Value to be tested
 * @param  {string} key Binding name: 
 * @return {boolean} True if the value match the specified binding name config 
 */
Arena.prototype._testKey = function(value, key) {

  var test = this.settings.keys[key];

  if (_.isArray(test)) {
    return this.settings.keys[key].indexOf(value);

  } else if (_.isFunction(test)) {
    return this.settings.keys[key](value);

  } else {
    return this.settings.keys[key] === value;
  }
};

/**
 * Resize listener
 * 
 * @private
 */
Arena.prototype._onWindowResize = function() {

  var dims = this.getContainerDimensions();

  var windowHalfX = dims.width / 2;
  var windowHalfY = dims.height / 2;
  this.camera.aspect = windowHalfX / windowHalfY;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize( dims.width, dims.height );
  this._effectsPass.effectFXAA.uniforms.resolution.value.set( 1 / dims.width, 1 / dims.height );
};

/**
 * Keyboard listener
 * 
 * @private
 */
Arena.prototype._onKeyUp = function(event) {

  if (event.which === 27 && event.ctrlKey) {
    this.hud[ this.hud.isOpen() ? 'close' : 'open']();
  }

  if (event.which === 27 && !event.ctrlKey) {
    this[this.paused ? 'resume' : 'pause']();
  }

};

/**
 * Cursor move listener
 */
Arena.prototype._onCursorMove = function(event) {
  this.emit('cursor:move', event);
};

/**
 * Camera zoom
 * 
 * @private
 */
Arena.prototype.zoom = function(delta) {

  // settings.data.cameraHeight = Math.max(50, settings.data.cameraHeight - event.wheelDeltaY * 0.01);

  this.camera.fov += delta * 0.01;
  this.camera.fov = Math.min(this.camera.fov, 85);
  this.camera.fov = Math.max(this.camera.fov, 10);

  this.camera.updateProjectionMatrix();
};

Arena.prototype.zoomingTween = null;

/**
 * Camera zoom to a specific object
 * @param  {Object}   object   Object to zoom at
 * @param  {Function} callback Called when zoom is finished
 */
Arena.prototype.zoomAt = function(object, duration, callback) {

  duration = duration || 200;

  var self = this;
  var oldCameraType = settings.data.cameraType;
  var oldCameraPosition = this.camera.position.clone();

  settings.data.cameraType = settings.CAMERA_MANUAL;

  if (this.zoomingTween) {
    this.zoomingTween.stop();
  }

  this.zoomingTween = new TWEEN.Tween({
    fov: this.camera.fov,
    posX: this.camera.position.x,
    posY: this.camera.position.y,
    posZ: this.camera.position.z
  })
  .to({
    fov: 10,
    posX: object.position.x + 7,
    posY: object.position.y + 60,
    posZ: object.position.z + 60
  }, duration)
  .onUpdate(function(){
    self.camera.fov = this.fov;
    self.camera.position.x = this.posX;
    self.camera.position.y = this.posY;
    self.camera.position.z = this.posZ;
    self.camera.updateProjectionMatrix();
  })
  .onComplete(function(){
    if (typeof callback === 'function') {
      callback(oldCameraType, oldCameraPosition);
    } else {
      // self.camera.position.copy(oldCameraPosition);
      // settings.data.cameraType = oldCameraType;
    }
  })
  .start();
};

/**
 * Reet camera zoom
 * 
 * @private
 */
Arena.prototype.zoomReset = function() {

  var self = this;

  if (this.zoomingTween) {
    this.zoomingTween.stop();
  }

  this.zoomingTween = new TWEEN.Tween({
    fov: this.camera.fov,
    posX: this.camera.position.x,
    posY: this.camera.position.y,
    posZ: this.camera.position.z
  })
  .to({
    fov: settings.data.cameraFov,
    posX: this.entity.position.x,
    posY: this.entity.position.y + settings.data.cameraHeight,
    posZ: this.entity.position.z + 200
  }, 200)
  .onUpdate(function(){
    self.camera.fov = this.fov;
    self.camera.position.x = this.posX;
    self.camera.position.y = this.posY;
    self.camera.position.z = this.posZ;
    self.camera.updateProjectionMatrix();
  })
  .start();
};

/**
 * Update selction with screen coordinates
 * 
 * @private
 */
Arena.prototype.updateSelectionCoords = function(selX, selY) {

  if (this._inGroundSelection) {
    // in a selection
    var p1 = this._inGroundSelection.screen,
        p2 = { x: selX, y: selY },
        posleft = p1.x > p2.x ? p2.x : p1.x,
        postop = p1.y > p2.y ? p2.y : p1.y,
        selwidth = Math.abs(p1.x - p2.x),
        selheight = Math.abs(p1.y - p2.y);

    if (selheight > 2 && selwidth > 2) {
      this.selectionElement.css({
        height: selheight,
        width: selwidth,
        left: posleft,
        top: postop
      }).show();
    }
  }

};

/**
 * Update zone selection with screen coordinates
 * 
 * @private
 */
Arena.prototype.updateZoneSelector = function(event) {

  if (this._waitForZoneSelection) {
    var intersects = this.raycast(event, this.ground.children);
    if (intersects.length > 0) {
      this._currentZoneSelector.position.copy(intersects[0].point);
      this.groundObject(this._currentZoneSelector);
      this._currentZoneSelector.position.y += 0.1;
      this._currentZoneSelector.children[0].material.opacity = 0.9;
      this._currentZoneSelector.children[0].visible = true;

      this._currentZoneSelector.emit('update');
      return;
    }
  }
  this._currentZoneSelector.children[0].visible = false;
  this._currentZoneSelector.children[0].material.opacity = 0.001;
};

/////////////////////////////////////////
// TERRAIN

/**
 * Set the walkable terrain
 * 
 * @param {string} file Path to the .OBJ file
 * @param {object=} options Common three.js material options, plus options below (see RecastNavigation options)
 * @param {float=} options.cellSize Navmesh cell size (.8 > 2)
 * @param {float=} options.cellHeight Navmesh cell height (.5 > 1)
 * @param {float=} options.agentHeight Characters height (1.2 => 2)
 * @param {float=} options.agentRadius Characters radius (.5 > 2)
 * @param {float=} options.agentMaxClimb Max units characters can jump (1 > 5)
 * @param {float=} options.agentMaxSlope Max degre characters can climb (20 > 40)
 */
Arena.prototype.setTerrain = function(file, options) {

  var self = this;

  options = _.merge({

    cellSize: 2,            // nav mesh cell size (.8 > 2)
    cellHeight: 1.5,        // nav mesh cell height (.5 > 1)
    agentHeight: 2.0,       // character height (1.2 => 2)
    agentRadius: 0.2,       // character radius (.5 > 2)
    agentMaxClimb: 4.0,     // max units character can jump (1 > 5)
    agentMaxSlope: 30.0,    // max degre character can climb (20 > 40)

    wireframe: false,

    onLoad: null

  }, options, {
    onLoad: function(terrain) {
      self.ground = terrain;
      self.intersectObjects = self.intersectObjects.concat(self.ground.children[0].children);
      self.scene.add(self.ground);

      // ground bounding box
      self.ground.boundingBox = new THREE.Box3().setFromObject(self.ground);

      // normalized
      self.ground.boundingBoxNormalized = new THREE.Box3().copy(self.ground.boundingBox);
      self.ground.boundingBoxNormalized.translate(new THREE.Vector3(
        - self.ground.boundingBox.min.x,
        - self.ground.boundingBox.min.y,
        - self.ground.boundingBox.min.z
      ));

      /*
      self.ground.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.receiveShadow = true;

          // use provided boundinf box if present
          if (options.boundingBox) {
            child.geometry.boundingBox = options.boundingBox;
          // or compute it
          } else if (! child.geometry.boundingBox) {
            child.geometry.computeBoundingBox();
            // child.geometry.boundingBox = new THREE.Box3().setFromObject(child);
          }
          // fast access to ground bbox
          self.ground.boundingBox = child.geometry.boundingBox;

          // normalized
          self.ground.boundingBoxNormalized = new Box3().copy(child.geometry.boundingBox);
          self.ground.boundingBoxNormalized.translate(
            new THREE.Vector3( - box.min.x, - box.min.y, - box.min.z )
          );
        }
      });
      */

      // configure, and load the navigation mesh
      self.pathfinder.on('configured', function(){
        self.pathfinder.initWithFile(file);
      });

      self.pathfinder.on('built', function(){
          debug('terrain ready');
          self.emit('set:terrain', self.ground);
      });

      self.pathfinder.config({
        cellSize: options.cellSize,
        cellHeight: options.cellHeight,
        agentHeight: options.agentHeight,
        agentRadius: options.agentRadius,
        agentMaxClimb: options.agentMaxClimb,
        agentMaxSlope: options.agentMaxSlope
      });
    }
  });

  new Terrain(file, options);

  return this;
};

/**
 * Get the navigation mesh as a three.js mesh object
 *
 * Warning: you don't need this to have a walkable terrain.
 * This method is available for debugging purposes.
 * 
 * @param {function} callback Callback to be called with the produced THREE.Mesh
 */
Arena.prototype.computeNavigationMesh = function(callback) {

  var self = this;

  if (! self.navigationMesh) {
    // get the navmesh vertices
    self.pathfinder.getNavMeshVertices(
      Utils.gcb(function(vertices) {
        // build the mesh
        self.navigationMesh = Utils.meshFromVertices(vertices, {
          color: 0xffffff,
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });
        self.scene.add(self.navigationMesh);
        if (callback) { callback(null, self.navigationMesh); }
      })
    );
  } else {
    if (callback) { callback(null, self.navigationMesh); }
  }
};

/**
 * Force an object to be grounded on the terrain surface
 *
 * @param {object} object THREE.Mesh, or any object with a position attribute.
 */
Arena.prototype.groundObject = function(object) {

  var self = this;

  if (self.ground) {
    // double-check the elevation, objects cannot be under ground
    var inifiniteElevation = new THREE.Vector3( object.position.x, 10000000, object.position.z );
    var raycaster = new THREE.Raycaster(inifiniteElevation, new THREE.Vector3(0, -1, 0));
    var intersects = raycaster.intersectObject(self.ground, true);

    if (intersects.length) {
      debug('grounded %o to y=%o', object, intersects[intersects.length - 1].point.y);
      object.position.y = intersects[intersects.length - 1].point.y;
    } else {
      throw 'object cannot be placed here';
    }
  } else {
    throw 'ground has not been set yet';
  }
};

/**
 * Get a random postion on the terrain surface.
 * 
 * @param  {Function} callback Callback to be called with the generated position
 */
Arena.prototype.randomPositionOnterrain = function(callback) {

  this.pathfinder.getRandomPoint(callback);
};

/**
 * Add an obstacle on the terrain surface, that will block future characters moves.
 * @param {object} position The obstacle position
 * @param {float} radius    Radius of the obstacle
 * @param {integer} flag    Walkable flags (0 will completely block moves)
 */
Arena.prototype.addObstacle = function(position, radius, flag) {
  
  radius = { x:radius, y:radius, z:radius };
  flag = flag || 0;

  if (this.settings.showObstacles) {
    var obsctacle = new THREE.Mesh(
      new THREE.PlaneGeometry(radius.x, radius.y, radius.z, 1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    obsctacle.position.copy(position);
    obsctacle.position.y += 0.2;
    //obsctacle.rotation.x = 90 * Math.PI / 180;
    this.scene.add(obsctacle);
  }

  this.pathfinder.setPolyUnwalkable(position, radius, flag);
};


/**
 * Setup an entity before it get added in the scene
 * 
 * @param  {Entity} entity The entity to be setup
 */
Arena.prototype._prepareEntity = function(entity) {

  var self = this;

  // give entities a reference to this
  entity.game = this;

  // entities in the crowd
  if (entity.character) {
    this.crowd.addAgent(entity, entity.state);

    self.entities.push(entity);
  }

  settingsGUI.addEntityControls(entity);

  entity.on('death', function(){
    settingsGUI.removeEntityControls(entity);
  });

  // entities should have a lifebar
  entity.attachLifeBar();

  // casts shadows
  entity.traverse(function (child) {
    if (child instanceof THREE.Mesh && child.parent && ! child.parent instanceof LifeBar) {
      child.castShadow = true;
    }
  });

  // setup its behaviour
  if (entity.behaviour) {
    entity.behaviour = self.machine.generateTree(entity.behaviour, entity, entity.states);
    // update event
    self.on('update:behaviours', function() {
      // debug('tick update behaviours');
      if (! entity._disabled_behaviours) {
        entity.behaviour = entity.behaviour.tick();
      }
    });
  }

  // has a collision box
  var box = entity.boundingBox = new THREE.Box3();
  box.setFromObject(entity);

  // normalize it
  box.translate(new THREE.Vector3( - box.min.x, - box.min.y, - box.min.z ));

  entity.bboxHelper = new THREE.Mesh(new THREE.CubeGeometry(
    box.max.x + (/* box.max.x + */ 0.20), // a bit wider
    box.max.y + (/* box.max.y + */ 0.20), // a bit higher
    box.max.z + (/* box.max.z + */ 0.20), // a bit deeper
    1, 1, 1
  ), self.commonMaterials.entityHelpers);
  for (var i = 0; i < entity.bboxHelper.geometry.vertices.length; i++) {
    entity.bboxHelper.geometry.vertices[i].y += entity.bboxHelper.geometry.vertices[i].y / 2;
  }
  entity.bboxHelper.material.visible = self.settings.visibleCharactersHelpers;
  entity.add(entity.bboxHelper);

  // has an axis helper
  entity.axisHelper = new THREE.AxisHelper(50);
  if (self.settings.visibleCharactersHelpers) {
    entity.add(entity.axisHelper); // axis
  }

  // has a radius helper
  entity.radiusHelper = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 16, true), self.commonMaterials.entityHelpers);
  entity.radiusHelper.scale.set(entity.state.radius, entity.state.height, entity.state.radius);
  if (self.settings.visibleCharactersHelpers) {
    entity.add(entity.radiusHelper); // radius
  }

  // is intersectable
  self.intersectObjects.push(entity.bboxHelper);

  // add its lifebar in the alternative scene ..
  self.scene2.add(entity.lifebar);

  var update = function(game){
    // entity.lifebar.update(game.delta);

    // .. always above its character
    entity.lifebar.position.set(
      entity.position.x,
      entity.position.y + box.max.y,
      entity.position.z
    );

    // .. always face camera
    entity.lifebar.rotation.y = self.camera.rotation.y;
  };
  update.listenerTag = 'entity ' + entity.constructor.name + '#' + entity.id + ' lifebar update';
  self.on('update', update);

  // whenever the character dies
  entity.on('death', function(){

    // remove the bbox from intersectables
    self.intersectObjects.splice(self.intersectObjects.indexOf(entity.bboxHelper), 1);

    // remove the lifebar
    if (entity.lifebar.parent) {
      entity.lifebar.parent.remove(entity.lifebar);
    }
  });

  self.emit('added:entity', entity);
};

/**
 * Add a static object
 * 
 * @param {Function(object)} builder Function to be called with the fully initialized object.
 * 
 * @fires module:threearena/game#added:static
 * 
 * @return {this} The game object
 * 
 * @example
 * game.addStatic(function (done) {
 *   var petShop = new Shop({
 *     onload: function () { done(this); }
 *   });
 * })
 */
Arena.prototype.addStatic = function(builder) {

  var self = this;

  var add = function(object) {

    // give object a reference to myself
    object.arena = self;

    if (self.ground) {
      self.groundObject(object);
    }

    if (object instanceof Entity) {
      self._prepareEntity(object);
    }

    if (object.isBlocking) {
      self.addObstacle(object.position, object.isBlocking);
    }

    if (object instanceof Collectible) {
      self.intersectObjects.push(object);
    }

    // On scene !
    self.scene.add(object);

    self.emit('added:static', object);
  };

  // argument is already an object, add it now
  if (! _.isFunction(builder)) {
    add(builder);

  // argument is a builder function, but game has already been started, build it now
  } else if (self.started) {
    builder(add, self);

  // argument is a builder function, and game has not been started, build it later
  } else {
    self.settings.preload.push(function(done){
      builder(function(object){
        add(object);
        done();
      }, self);
    });
  }

  return this;
};


/////////////////////////////////////////
// INTERACTIVES

/**
 * Add an interactive object
 * 
 * @param {InteractiveObject} builder Interactive Object
 * @param {object} options Options
 * 
 * @fires module:threearena/game#added:interactive
 * 
 * @return {this} The game object
 */
Arena.prototype.addInteractive = function(builder) {

  var self = this;

  var add = function(object) {
    self.intersectObjects.push(object);

    if (self.ground) {
      self.groundObject(object);
    }

    // On scene !
    self.scene.add(object);
  };

  // argument is already an object, add it now
  if (! _.isFunction(builder)) {
    add(builder);

  // argument is a builder function, but game has already been started, build it now
  } else if (self.started) {
    builder(add, self);

  // argument is a builder function, and game has not been started, build it later
  } else {
    self.settings.preload.push(function(done){
      builder(function(object){
        add(object);
        done();
      }, self);
    });
  }

  return this;
};

/**
 * End all not-near-enough interaction
 * 
 * @return {this} The game object
 */
Arena.prototype.endAllInteractions = function () {

  var character = this.entity;
  
  _.each(this._selected_objects, function (object) {
    if (object.isNearEnough && ! object.isNearEnough(character)) {
      object.deselect();
    }
  });

  return this;
};

/**
 * Begin a new interaction with an interactive object
 *
 * @param  {InteractiveObject} interactiveObject
 * 
 * @return {this} The game object
 */
Arena.prototype.startInteraction = function (interactiveObject) {

  this.endAllInteractions();
  this._selected_objects.push(interactiveObject);
  interactiveObject.select();
  this.hud.startInteraction(interactiveObject);

  return this;
};


/////////////////////////////////////////
// CHARACTERS

/**
 * Load a character.
 * 
 * @example
 * game.addCharacter(function (done) {
 *   var character = new Ogro({
 *     onload: function () { done(this); }
 *   });
 * })
 * 
 * @fires module:threearena/game#added:entity
 */
Arena.prototype.loadCharacter = function(Builder, callback) {
  this.addCharacter(function(done){
    new Builder({
      onLoad: function(){
        callback.apply(this, [ done ]);
      }
    });
  });
};


/**
 * Add a character
 * 
 * @param {Function(object)} builder Function to be called with the fully initialized object.
 *
 * @return {this} The game object
 * 
 * @example
 * game.addCharacter(function (done) {
 *   var character = new Ogro({
 *     onload: function () { done(this); }
 *   });
 * })
 * 
 * @fires module:threearena/game#added:entity
 */
Arena.prototype.addCharacter = function(builder) {

  var self = this;

  var add = function(object) {

    // characters are always grounded
    if (self.ground) {
      self.groundObject(object);
    }

    // Attach a life/mana bar above the entity
    self._prepareEntity(object);

    // On scene !
    self.scene.add(object);

    debug('add character %o', object);

    self.emit('added:character', object);
  };

  // argument is already an object, add it now
  if (! _.isFunction(builder)) {
    add(builder);

  // argument is a builder function, but game has already been started, build it now
  } else if (self.started) {
    builder(add, self);

  // argument is a builder function, and game has not been started, build it later
  } else {
    self.settings.preload.push(function(done){
      builder(function(object){
        add(object);
        done();
      }, self);
    });
  }

  return this;
};

/**
 * Remove a character from the scene
 * 
 * @param  {Entity} character
 * 
 * @return {this} The game object
 * 
 * @fires module:threearena/game#removed:entity
 */
Arena.prototype.removeCharacter = function(character) {

  this.entities = _.without(this.entities, character);
  this.scene.remove(character);

  return this;
};

Arena.prototype.asPlayer = function(entity) {

  this.entity = entity;
  this.hud.attachEntity(entity);
  this.camera.position.set( entity.position.x + 30, 50, entity.position.z + 40 );
};

/**
 * Current selected objects
 *
 * @private
 * @type {Array}
 */
Arena.prototype._selected_objects = [ ];

/**
 * Deselect all selected characters
 * 
 * @param  {Array} butCharacters These characters should not be deselected
 * 
 * @return {this} The game object
 *
 * @fires module:threearena/game#unselect:all
 */
Arena.prototype.unselectCharacters = function () {

  var self = this;
  var unselected = [];

  for (var i = 0; i < this._selected_objects.length; i++) {
    if (this._selected_objects[i]._marker) {
      this._selected_objects[i].remove(this._selected_objects[i]._marker);
    }
  }
  
  this._selected_objects.length = 0;
  self.waitForEntitySelection(null);
  this._inGroundSelection = null;
  $('#selection-rectangle').hide();

  self.emit('unselect:all', unselected);

  return this;
};

/**
 * Select all characters in a zone and return them. This method ignores Y component.
 * 
 * @param  {Vector3} start Top left point of the select area
 * @param  {Vector3} end Bottom right point of the select area
 * 
 * @return {Array} Array of selected characters
 * 
 * @fires module:threearena/game#select:entities
 */
Arena.prototype.selectCharactersInZone = function (start, end) {

  var self = this;

  var selected = _.filter(this.entities, function(character) {
    var itsin = ! character.isDead() &&
        character.position.x > start.x && character.position.z > start.z &&
        character.position.x < end.x && character.position.z < end.z;

    if (itsin) {
      self._selected_objects.push(character);
      var marker = new SelectMarker({
        onLoad: function(){
          character._marker = marker;
          character.add(marker);
        }
      });
    }

    return itsin;
  });

  debug('Need to find characters in %o > %o : %o', start, end, selected);

  self.emit('select:entities', selected);

  return selected;
};


/////////////////////////////////////////
// GAME FLOW

Arena.prototype.pause = function(){
  debug('pause');
  this.paused = true;
};

Arena.prototype.resume = function(){
  debug('resume');
  this.paused = false;
};

Arena.prototype.run = function() {
  debug('run');

  if (this.running) {
    throw new Error('already running');
  } else if (! this.started) {
    this.start();
  }

  var EXCEEDING_MAX_FRAME_TIME = 'exceeding max frameTime (%o): %o';
  var SLOW_UPDATE = 'slow update: %o ms';
  var SLOW_RENDER = 'slow render: %o ms';
  var SLOW_FRAME  = 'slow frame:  %o ms';

  var currentTime = now();
  var world = this.world;
  var accumulator = 0.0;
  var self = this;

  var timestep;
  var frameStart;

  var alpha;
  var newTime;
  var frameTime;
  var maxframeTime;

  self._timings = {};

  function changevisibility() {
    if (document.hidden === false || document.webkitHidden === false) {
      currentTime = now();
      self.delta = self.clock.getDelta() * self.settings.speed;
    }
  }
  document.addEventListener('visibilitychange', changevisibility, false);
  document.addEventListener('webkitvisibilitychange', changevisibility, false);

  function loop() {

    if (self.running) {
      requestAnimationFrame(loop);
    }

    timestep = settings.data.timestep;
    frameStart = now();
    //self.emit('enter frame', world);

    if (! self.paused) {

      newTime = self.time = now();
      frameTime = newTime - currentTime;
      maxframeTime = timestep * settings.data.maxUpdatesPerFrame;
      currentTime = newTime;

      // note: max frame time to avoid spiral of death
      if (frameTime > maxframeTime){
        debug(EXCEEDING_MAX_FRAME_TIME, maxframeTime, frameTime);
        frameTime = maxframeTime;
      }

      // keep the delta
      // self.delta = timestep;

      // update
      var updatesStart = now(), updated = 0;
      accumulator += frameTime;
      while (accumulator >= timestep && updated < settings.data.maxUpdatesPerFrame) {
        //self.emit('pre update', timestep);
        self.timestep = timestep / 1000;
        self.update();
        //self.emit('post update', timestep);
        accumulator -= timestep;
        updated += 1;
        if (! self.running) {
          break;
        }
        // console.log('updated %o times', updated);
      }

      // interpolate between the previous and current physics state
      // based on how much time is left in the accumulator
      alpha = accumulator / timestep;
      self.timestep = alpha / 1000; // updating the time is mandatory !
      if (alpha / 1000 > 0.001) {
        debug('update from accumulator');
        self.update();
      }

      // render
      var renderStart = now();
      self.render();
      var renderEnd = now();
      if (renderEnd - renderStart > timestep) {
        debug(SLOW_RENDER, (renderEnd - renderStart).toFixed(2));
      }

      var updatesEnd = now();
      if (updatesEnd - updatesStart > timestep) {
        debug(SLOW_UPDATE, (updatesEnd - updatesStart).toFixed(2));
      }
    }

    //self.emit('leave frame', world);

    var frameEnd = now();
    if (frameEnd - frameStart > timestep) {
      debug(SLOW_FRAME, (frameEnd-frameStart).toFixed(2));
    }
  }
  this.running = true;
  loop();
  return this;
};


/**
 * Start a new game
 *
 * @return {this} The game object
 * 
 * @fires module:threearena/game#start
 */
Arena.prototype.start = function() {

  var self = this;

  self._lastBehaviours = 0;
  self._lastCrowdUpdate = 0;

  self.preload(function(){

    self._initControls();

    self.hud.open();

    self.emit('start');

    if (self.settings.splashContainer) {
      self.settings.splashContainer.className += ' animated fadeOutUpBig';
    }
    self.settings.container.style.className += ' animated fadeInUpBig';
    self.settings.container.style.display = 'block';

    self.started = true;

    // timers
    self._behaviours_delta = self.clock.getDelta();

  }, function(){
    debug('preload now... consider using preload() before the game starts');
  });

  return this;
};

/**
 * Where things are updated, inside the loop
 * 
 * @fires module:threearena/game#update
 * @fires module:threearena/game#update:behaviours
 */
Arena.prototype.update = function() {

  var self = this, start = null, end = null;

  this.delta = this.timestep;
  this.frameTime = now();

  // Crowd update
  /* */
  if (self.frameTime - self._lastCrowdUpdate > 0) {
    self._lastCrowdUpdate = self.frameTime;
    self.crowd.update(self);
  }
  /* */

  self._timings.lastDuration_taevents = window._ta_events.emit('update', this);

  // update event
  self._timings.lastDuration_updateevent = this.emit('update', this);

  // tick
  start = now();
  // tic.tick(this.delta);
  end = now();
  self._timings.lastDuration_tick = end - start;

  // camera controls
  start = now();
  this.cameraControls.update(this.delta);
  end = now();
  self._timings.lastDuration_cameracontrols = end - start;

  // entities behaviours
  /* */
  if (this.frameTime - self._lastBehaviours > 100) {
    self._lastBehaviours = this.frameTime;
    self.emit('update:behaviours', self);
  }
  /* */

  // current entity 
  start = now();

  if (this.entity) {

    // place a light near the main player
    this.pointLight.position.set(
      this.entity.position.x - 50,
      180,
      this.entity.position.z + 100
    );
    this.pointLight.target = this.entity;

    // camera position
    var cameraType = parseInt(settings.data.cameraType, 0);
    //this.camera.lookAt(this.entity.position);

    if (cameraType === settings.CAMERA_MANUAL) {
    
    } else if (cameraType === settings.CAMERA_FOLLOW) {
      this.camera.position.x = this.entity.position.x;
      this.camera.position.z = this.entity.position.z + 200;
      // camera height ~ crraaaapp
      this.camera.position.y = this.entity.position.y + settings.data.cameraHeight;
    }    
  }

  end = now();
  self._timings.lastDuration_thisentity = end - start;

  // current entity 
  start = now();

  async.each(this.entities, function(entity){
    if (entity.update) {
      entity.update(self);
    }
  });

  end = now();
  self._timings.lastDuration_entities = end - start;

  // current entity 
  start = now();
  // FIXME: Use this.speed
  TWEEN.update();
  end = now();
  self._timings.lastDuration_tween = end - start;


  // debug('timings %o', {
  //   taevents: self._timings.lastDuration_taevents,
  //   updateevent: self._timings.lastDuration_updateevent,
  //   tick: self._timings.lastDuration_tick,
  //   cameracontrols: self._timings.lastDuration_cameracontrols,
  //   behaviours: self._timings.lastDuration_behaviours,
  //   thisentity: self._timings.lastDuration_thisentity,
  //   entities: self._timings.lastDuration_entities,
  //   tween: self._timings.lastDuration_tween,
  //   total: self._timings.lastDuration_taevents +
  //     self._timings.lastDuration_updateevent +
  //     self._timings.lastDuration_tick +
  //     self._timings.lastDuration_cameracontrols +
  //     self._timings.lastDuration_behaviours +
  //     self._timings.lastDuration_thisentity +
  //     self._timings.lastDuration_entities +
  //     self._timings.lastDuration_tween + 'ms'
  // });
  
};

/**
 * Where things are rendered, inside the render loop
 * 
 * @fires module:threearena/game#update
 * @fires module:threearena/game#update:behaviours
 */
Arena.prototype.render = function() {

  // this.scene.updateMatrixWorld();

  // render scene
  this.renderer.clear();
  this.composer.render();

  // clear depth buffer & render front scene
  this.renderer.clear( false, true, false );
  this.renderer.render( this.scene2, this.camera );

  if (this.stats) {
    this.stats.update();
  }
};


/////////////////////////////////////////
// UNITY - LIKE

/**
 * Finds a game object by name and returns it.
 * 
 * @param name Name of object
 */
Arena.prototype.find = function(name) {
  return this.scene.getObjectByName(name);
};

/**
 * Finds all game objects tagged tag.
 *
 * @param tag tag name
 */
Arena.prototype.findAllWithTag = function(tag) {
  var found = [];

  this.scene.traverse(function (child) {
    if (child.tags && child.tags.indexOf(tag) > -1) {
      found.push(child);
    }
  });

  return found;
};

/**
 * Finds all game objects tagged tag and returns the nearest one from given position.
 *
 * @param tag tag name
 */
Arena.prototype.findWithTag = function(tag, from, filter) {
  var found = this.findAllWithTag(tag),
      distance = Number.MAX_VALUE,
      nearest = null;
  for (var i = 0; i < found.length; i++) {
    if (!from) {
      return found[i];
    }
    var d = found[i].position.distanceTo(from);
    if (d < distance && (!filter || filter(found[i]))) {
      nearest = found[i];
      distance = d;
    }
  }
  return nearest;
};

/**
 * Finds all game objects of class oneclass.
 *
 * @param oneclass class name
 */
Arena.prototype.findAllWithClass = function(oneclass) {
  var found = [];

  this.scene.traverse(function (child) {
    if (child.constructor.name === oneclass) {
      found.push(child);
    }
  });

  return found;
};

/**
 * Finds all game objects of class oneclass and returns the nearest one from given position.
 *
 * @param tag tag name
 */
Arena.prototype.findWithClass = function(oneclass, from, filter) {
  var found = this.findAllWithClass(oneclass),
      distance = Number.MAX_VALUE,
      nearest = null;
  for (var i = 0; i < found.length; i++) {
    if (!from) {
      return found[i];
    }
    var d = found[i].position.distanceTo(from);
    if (d < distance && (!filter || filter(found[i]))) {
      nearest = found[i];
      distance = d;
    }
  }
  return nearest;
};

/////////////////////////////////////////

/**
 * Fired when the game is ready to be started
 *
 * @event module:threearena/game#ready
 * @type {object}
 */

/**
 * Fired when the game start
 *
 * @event module:threearena/game#start
 * @type {object}
 */

/**
 * Fired on every frame
 *
 * @event module:threearena/game#update
 * @type {Game}
 * @property {float} delta Delta time
 */

/**
 * Fired every some frames
 *
 * @event module:threearena/game#update:behaviours
 * @type {Game}
 * @property {float} delta Delta time
 */

/**
 * Fired when an entity has been added
 *
 * @event module:threearena/game#added:entity
 * @type {Entity}
 */

/**
 * Fired when a static object has been added
 *
 * @event module:threearena/game#added:static
 * @type {Object}
 */

/**
 * Fired when a spawning pool has been added
 *
 * @event module:threearena/game#added:spawningpool
 * @type {SpawningPool}
 */


if (window) { window.Arena = Arena; }

Arena.Behaviours = require('./behaviours/all');
Arena.Characters = require('./character/all');
Arena.Elements = require('./elements/all');
Arena.Spells = require('./spell/all');

Arena.stemkoski = require('./particles/stemkoski_ParticleEngine');



},{"../vendor/detector":90,"../vendor/stats":91,"./behaviours/all":2,"./character/all":8,"./controls/destinationmarker":19,"./controls/dota":20,"./controls/zoneselector":21,"./crowd":22,"./elements/all":23,"./elements/collectible":27,"./elements/interactiveobject":31,"./elements/slifebar":35,"./elements/terrain":38,"./entity":41,"./hud":42,"./hud/spelltexts":45,"./input/mouse":47,"./particles/stemkoski_ParticleEngine":51,"./pathfinding":52,"./settings":54,"./settings-gui":53,"./spell/all":58,"./utils":66,"EventEmitter":71,"__browserify_process":94,"async":72,"debug":73,"inherits":74,"interact":75,"lodash":85,"machinejs":86,"now":87,"tic":88,"tween":89}],47:[function(require,module,exports){
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

        character.emit('destination', {
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
},{"../elements/collectible":27,"../elements/interactiveobject":31,"../elements/terrain":38,"../entity":41,"../settings":54,"../utils":66,"debug":73}],48:[function(require,module,exports){
'use strict';

module.exports = Inventory;

/**
 * Represents a character's inventory
 *
 * @exports Inventory

 * @constructor

 * @param {Entity} entity Entity who owns this inventory
 */
function Inventory (entity) {

  this.entity = entity;

  this.contents = [];
}

/**
 * Add something in the inventory
 * 
 * @param  {Object} data The object data { kind: "Stuff", amount: "123" }
 *
 * @triggers 'entity:collect'
 */
Inventory.prototype.push = function(data) {

  this.contents.push(data);

  this.entity.emit('collect', data);
};


/**
 * Get amount of a given kind
 * 
 * @param  {String} kind
 */
Inventory.prototype.has = function(kind) {

  var amount = 0;

  for (var i = 0; i < this.contents.length; i++) {
    if (this.contents[i].kind === kind) {
      amount += this.contents[i].amount;
    }
  }

  return amount;
};
},{}],49:[function(require,module,exports){
'use strict';

module.exports = Log;

/**
 * Logging facility
 * 
 * @exports threearena/log
 */
function Log( /* arg1, arg2 ... */ ) {
  // var args = Array.prototype.slice.apply(arguments);
  // console.log.apply( console, args );
}

Log.SYS_DEBUG = 'SYS_DEBUG';
Log.SYS_INFO  = 'SYS_INFO';
Log.SYS_ERROR = 'SYS_ERROR';
Log.COMBAT    = 'COMBAT';

},{}],50:[function(require,module,exports){
'use strict';

module.exports = {
  'Pool': Pool,
  'ParticleCloud': ParticleCloud,
  'Aura': Aura
};


function Pool () {
  this.__pools = [];
}

// Get a new Vector
Pool.prototype.get = function() {
  if ( this.__pools.length > 0 ) {
    return this.__pools.pop();
  }

  // console.log( "pool ran out!" )
  return null;
};

// Release a vector back into the pool
Pool.prototype.add = function( v ) {
  this.__pools.push( v );
};


/**
 * @exports threearena/particles/cloud
 */
function ParticleCloud ( length, texture, light, options ) {

  options = options || {};
  this.length = length;
  this.light = light;
  this.emitterpos = options.emitterPosition || new THREE.Vector3( 0, 0, 0 );

  this.delta = 0;
  this.pool = new Pool();

  this.colorSL = options.colorSL || [ 0.6, 0.1 ];

  this.colorHSL = options.colorHSL || new THREE.Color( 0xffffff );

  //////////////////////////////

  this._timeOnShapePath = 0;

  this.particles = new THREE.Geometry();

  for (var i = 0; i < this.length; i ++ ) {

    this.particles.vertices.push( new THREE.Vector3( 1, 1, 1 ) );
    this.pool.add( i );
  
  }

  this.attributes = {
    
    size:  { type: 'f', value: [] },
    pcolor: { type: 'c', value: [] }

  };

  this.uniforms = {
    texture:   { type: 't', value: texture }
  };

  this.shaderMaterial = new THREE.ShaderMaterial( {

    uniforms: this.uniforms,
    attributes: this.attributes,

    vertexShader: document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true

  });

  this.particleCloud = new THREE.ParticleSystem( this.particles, this.shaderMaterial );

  this.particleCloud.dynamic = true;
  // this.particleCloud.sortParticles = true;

  this.values_size = this.attributes.size.value;
  this.values_color = this.attributes.pcolor.value;

  this.reset(1);

  // EMITTER STUFF

  var bind = function ( scope, fn ) {
    return function () {
      return fn.apply( scope, arguments );
    };
  };

  this.hue = 0;

  this.sparksEmitter = new SPARKS.Emitter( new SPARKS.SteadyCounter( 50 ) );

  this.sparksEmitter.addInitializer( new SPARKS.Position( new SPARKS.PointZone( this.emitterpos ) ) );
  this.sparksEmitter.addInitializer( new SPARKS.Lifetime( 5, 2 ));
  this.sparksEmitter.addInitializer( new SPARKS.Target( null, bind( this, this.setTargetParticle ) ) );


  this.sparksEmitter.addInitializer( new SPARKS.Velocity( new SPARKS.PointZone( new THREE.Vector3( 1, 0, 1 ) ) ) );
  // TOTRY Set velocity to move away from centroid

  this.sparksEmitter.addAction( new SPARKS.Age() );
  this.sparksEmitter.addAction( new SPARKS.Accelerate( 0, 1, 0 ) );
  this.sparksEmitter.addAction( new SPARKS.Move() );
  this.sparksEmitter.addAction( new SPARKS.RandomDrift( 0, 2, 0 ) );

  this.sparksEmitter.addCallback( 'created', bind( this, this.onParticleCreated ) );
  this.sparksEmitter.addCallback( 'dead', bind( this, this.onParticleDead ) );
}

ParticleCloud.prototype.reset = function(size) {
  for ( var v = 0; v < this.particleCloud.geometry.vertices.length; v ++ ) {
    this.values_size[ v ] = size || 1;
    this.values_color[ v ] = new THREE.Color( 0x000000 );
    this.particles.vertices[ v ].set( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );
  }
};

ParticleCloud.prototype.setTargetParticle = function() {

  var target = this.pool.get();
  this.values_size[ target ] += Math.random() * 100 + 10;

  return target;
};

ParticleCloud.prototype.onParticleCreated = function( p ) {

  var position = p.position;

  var target = p.target;

  if ( target ) {
    p.target.position = position;
  
    this.hue += 0.001 * this.delta;
    if ( this.hue > 1 ) { this.hue -= 1; }

    // we have a shape to follow
    if (this.shape) {

      this._timeOnShapePath += this.delta;
      if ( this._timeOnShapePath > 1 ) { this._timeOnShapePath -= 1; }

      var pointOnShape = this.shape.getPointAt( this._timeOnShapePath );

      if (pointOnShape) {
        this.emitterpos.x = pointOnShape.x * 1;// - 100;
        this.emitterpos.z = -pointOnShape.y * 1;// + 400;
      }
    }

    this.particles.vertices[ target ] = p.position;

    this.values_color[ target ].setHSL( this.hue, 0.6, 0.1 ).multiply( this.colorHSL );
    // this.values_color[ target ].set( this.colorHSL ); // .setHSL( this.hue, 0.6, 0.1 );
    // this.values_color[ target ].setHSL( this.hue, 0.6, 0.1 );
    // this.values_color[ target ].multiplyScalar( this.colorHSL );
    // this.values_color[ target ].set('#ffffff');
    

    this.values_size[ target ] += 0.003 * this.delta;
    
    if (this.light) {
      this.light.color.setHSL( this.hue, 0.8, 0.5 );
    }
  }
};

ParticleCloud.prototype.onParticleDead = function( particle ) {

  var target = particle.target;

  if ( target ) {
    // Hide the particle
    this.values_color[ target ].setRGB( 0, 0, 0 );
    this.particles.vertices[ target ].set( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );

    // Mark particle system as available by returning to pool
    this.pool.add( particle.target );
  }
};

ParticleCloud.prototype.engineLoopUpdate = function() {

};

ParticleCloud.prototype.start = function () {

  this.sparksEmitter.start();
};

ParticleCloud.prototype.stop = function () {

  this.sparksEmitter.stop();
};

ParticleCloud.prototype.destroy = function () {

  delete this.sparksEmitter;
};

ParticleCloud.prototype.update = function ( delta ) {

  this.delta = delta;
  this.particleCloud.geometry.verticesNeedUpdate = true;
  this.attributes.size.needsUpdate = true;
  this.attributes.pcolor.needsUpdate = true;
};




function Aura ( geometry, particulesCount, texture, light ) {

  // Create particle objects for Three.js
  var cloud = new ParticleCloud( particulesCount, texture, light );

  function shape ( radius, segments ) {
    var circle = new THREE.Shape();

    for (var i = 0; i < segments; i++) {
      var pct = (i + 1) / segments;
      var theta = pct * Math.PI * 2.0;
      var x = radius * Math.cos(theta);
      var y = radius * Math.sin(theta);
      if (i === 0) {
        circle.moveTo(x, y);
      } else {
        circle.lineTo(x, y);
      }
    }
    return circle;
  }

  switch (geometry) {
    case 'point':
      cloud.shape = shape( 0.5, 3);
      break;

    default:
    case 'circle':
      cloud.shape = shape( 6, 17);
      break;
  }

  return cloud;
}

},{}],51:[function(require,module,exports){
/**
* @author Lee Stemkoski   http://www.adelphi.edu/~stemkoski/
*/

///////////////////////////////////////////////////////////////////////////////

/////////////
// SHADERS //
/////////////

// attribute: data that may be different for each particle (such as size and color);
//      can only be used in vertex shader
// varying: used to communicate data from vertex shader to fragment shader
// uniform: data that is the same for each particle (such as texture)

particleVertexShader = 
[
"attribute vec3  customColor;",
"attribute float customOpacity;",
"attribute float customSize;",
"attribute float customAngle;",
"attribute float customVisible;",  // float used as boolean (0 = false, 1 = true)
"varying vec4  vColor;",
"varying float vAngle;",
"void main()",
"{",
  "if ( customVisible > 0.5 )",         // true
    "vColor = vec4( customColor, customOpacity );", //     set color associated to vertex; use later in fragment shader.
  "else",             // false
    "vColor = vec4(0.0, 0.0, 0.0, 0.0);",     //     make particle invisible.
    
  "vAngle = customAngle;",

  "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
  "gl_PointSize = customSize * ( 300.0 / length( mvPosition.xyz ) );",     // scale particles as objects in 3D space
  "gl_Position = projectionMatrix * mvPosition;",
"}"
].join("\n");

particleFragmentShader =
[
"uniform sampler2D texture;",
"varying vec4 vColor;",   
"varying float vAngle;",   
"void main()", 
"{",
  "gl_FragColor = vColor;",
  
  "float c = cos(vAngle);",
  "float s = sin(vAngle);",
  "vec2 rotatedUV = vec2(c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,", 
                        "c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5);",  // rotate UV coordinates to rotate texture
      "vec4 rotatedTexture = texture2D( texture,  rotatedUV );",
  "gl_FragColor = gl_FragColor * rotatedTexture;",    // sets an otherwise white particle texture to desired color
"}"
].join("\n");

///////////////////////////////////////////////////////////////////////////////

/////////////////
// TWEEN CLASS //
/////////////////

function Tween(timeArray, valueArray)
{
  this.times  = timeArray || [];
  this.values = valueArray || [];
}

Tween.prototype.lerp = function(t)
{
  var i = 0;
  var n = this.times.length;
  while (i < n && t > this.times[i])  
    i++;
  if (i == 0) return this.values[0];
  if (i == n) return this.values[n-1];
  var p = (t - this.times[i-1]) / (this.times[i] - this.times[i-1]);
  if (this.values[0] instanceof THREE.Vector3)
    return this.values[i-1].clone().lerp( this.values[i], p );
  else // its a float
    return this.values[i-1] + p * (this.values[i] - this.values[i-1]);
}

///////////////////////////////////////////////////////////////////////////////

////////////////////
// PARTICLE CLASS //
////////////////////

function Particle()
{
  this.position     = new THREE.Vector3();
  this.velocity     = new THREE.Vector3(); // units per second
  this.acceleration = new THREE.Vector3();

  this.angle             = 0;
  this.angleVelocity     = 0; // degrees per second
  this.angleAcceleration = 0; // degrees per second, per second
  
  this.size = 16.0;

  this.color   = new THREE.Color();
  this.opacity = 1.0;
      
  this.age   = 0;
  this.alive = 0; // use float instead of boolean for shader purposes 
}

Particle.prototype.update = function(dt)
{
  this.position.add( this.velocity.clone().multiplyScalar(dt) );
  this.velocity.add( this.acceleration.clone().multiplyScalar(dt) );
  
  // convert from degrees to radians: 0.01745329251 = Math.PI/180
  this.angle         += this.angleVelocity     * 0.01745329251 * dt;
  this.angleVelocity += this.angleAcceleration * 0.01745329251 * dt;

  this.age += dt;
  
  // if the tween for a given attribute is nonempty,
  //  then use it to update the attribute's value

  if ( this.sizeTween.times.length > 0 )
    this.size = this.sizeTween.lerp( this.age );
        
  if ( this.colorTween.times.length > 0 )
  {
    var colorHSL = this.colorTween.lerp( this.age );
    this.color = new THREE.Color().setHSL( colorHSL.x, colorHSL.y, colorHSL.z );
  }
  
  if ( this.opacityTween.times.length > 0 )
    this.opacity = this.opacityTween.lerp( this.age );
}
  
///////////////////////////////////////////////////////////////////////////////

///////////////////////////
// PARTICLE ENGINE CLASS //
///////////////////////////

var Type = Object.freeze({ "CUBE":1, "SPHERE":2 });

function ParticleEngine()
{
  /////////////////////////
  // PARTICLE PROPERTIES //
  /////////////////////////
  
  this.positionStyle = Type.CUBE;   
  this.positionBase   = new THREE.Vector3();
  // cube shape data
  this.positionSpread = new THREE.Vector3();
  // sphere shape data
  this.positionRadius = 0; // distance from base at which particles start
  
  this.velocityStyle = Type.CUBE; 
  // cube movement data
  this.velocityBase       = new THREE.Vector3();
  this.velocitySpread     = new THREE.Vector3(); 
  // sphere movement data
  //   direction vector calculated using initial position
  this.speedBase   = 0;
  this.speedSpread = 0;
  
  this.accelerationBase   = new THREE.Vector3();
  this.accelerationSpread = new THREE.Vector3();  
  
  this.angleBase               = 0;
  this.angleSpread             = 0;
  this.angleVelocityBase       = 0;
  this.angleVelocitySpread     = 0;
  this.angleAccelerationBase   = 0;
  this.angleAccelerationSpread = 0;
  
  this.sizeBase   = 0.0;
  this.sizeSpread = 0.0;
  this.sizeTween  = new Tween();
      
  // store colors in HSL format in a THREE.Vector3 object
  // http://en.wikipedia.org/wiki/HSL_and_HSV
  this.colorBase   = new THREE.Vector3(0.0, 1.0, 0.5); 
  this.colorSpread = new THREE.Vector3(0.0, 0.0, 0.0);
  this.colorTween  = new Tween();
  
  this.opacityBase   = 1.0;
  this.opacitySpread = 0.0;
  this.opacityTween  = new Tween();

  this.blendStyle = THREE.NormalBlending; // false;

  this.particleArray = [];
  this.particlesPerSecond = 100;
  this.particleDeathAge = 1.0;
  
  ////////////////////////
  // EMITTER PROPERTIES //
  ////////////////////////
  
  this.emitterAge      = 0.0;
  this.emitterAlive    = true;
  this.emitterDeathAge = 60; // time (seconds) at which to stop creating particles.
  
  // How many particles could be active at any time?
  this.particleCount = this.particlesPerSecond * Math.min( this.particleDeathAge, this.emitterDeathAge );

  //////////////
  // THREE.JS //
  //////////////
  
  this.particleGeometry = new THREE.Geometry();
  this.particleTexture  = null;
  this.particleMaterial = new THREE.ShaderMaterial( 
  {
    uniforms: 
    {
      texture:   { type: "t", value: this.particleTexture },
    },
    attributes:     
    {
      customVisible:  { type: 'f',  value: [] },
      customAngle:  { type: 'f',  value: [] },
      customSize:   { type: 'f',  value: [] },
      customColor:  { type: 'c',  value: [] },
      customOpacity:  { type: 'f',  value: [] }
    },
    vertexShader:   particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true, // alphaTest: 0.5,  // if having transparency issues, try including: alphaTest: 0.5, 
    blending: THREE.NormalBlending, depthTest: true,
    
  });
  this.particleMesh = new THREE.Mesh();
}
  
ParticleEngine.prototype.setValues = function( parameters )
{
  if ( parameters === undefined ) return;
  
  // clear any previous tweens that might exist
  this.sizeTween    = new Tween();
  this.colorTween   = new Tween();
  this.opacityTween = new Tween();
  
  for ( var key in parameters ) 
    this[ key ] = parameters[ key ];
  
  // attach tweens to particles
  Particle.prototype.sizeTween    = this.sizeTween;
  Particle.prototype.colorTween   = this.colorTween;
  Particle.prototype.opacityTween = this.opacityTween;  
  
  // calculate/set derived particle engine values
  this.particleArray = [];
  this.emitterAge      = 0.0;
  this.emitterAlive    = true;
  this.particleCount = this.particlesPerSecond * Math.min( this.particleDeathAge, this.emitterDeathAge );
  
  this.particleGeometry = new THREE.Geometry();
  this.particleMaterial = new THREE.ShaderMaterial( 
  {
    uniforms: 
    {
      texture:   { type: "t", value: this.particleTexture },
    },
    attributes:     
    {
      customVisible:  { type: 'f',  value: [] },
      customAngle:  { type: 'f',  value: [] },
      customSize:   { type: 'f',  value: [] },
      customColor:  { type: 'c',  value: [] },
      customOpacity:  { type: 'f',  value: [] }
    },
    vertexShader:   particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,  alphaTest: 0.5, // if having transparency issues, try including: alphaTest: 0.5, 
    blending: THREE.NormalBlending, depthTest: true
  });
  this.particleMesh = new THREE.ParticleSystem();
}
  
// helper functions for randomization
ParticleEngine.prototype.randomValue = function(base, spread)
{
  return base + spread * (Math.random() - 0.5);
}
ParticleEngine.prototype.randomVector3 = function(base, spread)
{
  var rand3 = new THREE.Vector3( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
  return new THREE.Vector3().addVectors( base, new THREE.Vector3().multiplyVectors( spread, rand3 ) );
}


ParticleEngine.prototype.createParticle = function()
{
  var particle = new Particle();

  if (this.positionStyle == Type.CUBE)
    particle.position = this.randomVector3( this.positionBase, this.positionSpread ); 
  if (this.positionStyle == Type.SPHERE)
  {
    var z = 2 * Math.random() - 1;
    var t = 6.2832 * Math.random();
    var r = Math.sqrt( 1 - z*z );
    var vec3 = new THREE.Vector3( r * Math.cos(t), r * Math.sin(t), z );
    particle.position = new THREE.Vector3().addVectors( this.positionBase, vec3.multiplyScalar( this.positionRadius ) );
  }
    
  if ( this.velocityStyle == Type.CUBE )
  {
    particle.velocity     = this.randomVector3( this.velocityBase,     this.velocitySpread ); 
  }
  if ( this.velocityStyle == Type.SPHERE )
  {
    var direction = new THREE.Vector3().subVectors( particle.position, this.positionBase );
    var speed     = this.randomValue( this.speedBase, this.speedSpread );
    particle.velocity  = direction.normalize().multiplyScalar( speed );
  }
  
  particle.acceleration = this.randomVector3( this.accelerationBase, this.accelerationSpread ); 

  particle.angle             = this.randomValue( this.angleBase,             this.angleSpread );
  particle.angleVelocity     = this.randomValue( this.angleVelocityBase,     this.angleVelocitySpread );
  particle.angleAcceleration = this.randomValue( this.angleAccelerationBase, this.angleAccelerationSpread );

  particle.size = this.randomValue( this.sizeBase, this.sizeSpread );

  var color = this.randomVector3( this.colorBase, this.colorSpread );
  particle.color = new THREE.Color().setHSL( color.x, color.y, color.z );
  
  particle.opacity = this.randomValue( this.opacityBase, this.opacitySpread );

  particle.age   = 0;
  particle.alive = 0; // particles initialize as inactive
  
  return particle;
}

ParticleEngine.prototype.initialize = function()
{
  // link particle data with geometry/material data
  for (var i = 0; i < this.particleCount; i++)
  {
    // remove duplicate code somehow, here and in update function below.
    this.particleArray[i] = this.createParticle();
    this.particleGeometry.vertices[i] = this.particleArray[i].position;
    this.particleMaterial.attributes.customVisible.value[i] = this.particleArray[i].alive;
    this.particleMaterial.attributes.customColor.value[i]   = this.particleArray[i].color;
    this.particleMaterial.attributes.customOpacity.value[i] = this.particleArray[i].opacity;
    this.particleMaterial.attributes.customSize.value[i]    = this.particleArray[i].size;
    this.particleMaterial.attributes.customAngle.value[i]   = this.particleArray[i].angle;
  }
  
  this.particleMaterial.blending = this.blendStyle;
  if ( this.blendStyle != THREE.NormalBlending) 
    this.particleMaterial.depthTest = false;
  
  this.particleMesh = new THREE.ParticleSystem( this.particleGeometry, this.particleMaterial );
  this.particleMesh.dynamic = true;
  this.particleMesh.sortParticles = true;
}

ParticleEngine.prototype.update = function(dt)
{
  var recycleIndices = [];
  
  // update particle data
  for (var i = 0; i < this.particleCount; i++)
  {
    if ( this.particleArray[i].alive )
    {
      this.particleArray[i].update(dt);

      // check if particle should expire
      // could also use: death by size<0 or alpha<0.
      if ( this.particleArray[i].age > this.particleDeathAge ) 
      {
        this.particleArray[i].alive = 0.0;
        recycleIndices.push(i);
      }
      // update particle properties in shader
      this.particleMaterial.attributes.customVisible.value[i] = this.particleArray[i].alive;
      this.particleMaterial.attributes.customColor.value[i]   = this.particleArray[i].color;
      this.particleMaterial.attributes.customOpacity.value[i] = this.particleArray[i].opacity;
      this.particleMaterial.attributes.customSize.value[i]    = this.particleArray[i].size;
      this.particleMaterial.attributes.customAngle.value[i]   = this.particleArray[i].angle;
    }   
  }

  // check if particle emitter is still running
  if ( !this.emitterAlive ) return;

  // if no particles have died yet, then there are still particles to activate
  if ( this.emitterAge < this.particleDeathAge )
  {
    // determine indices of particles to activate
    var startIndex = Math.round( this.particlesPerSecond * (this.emitterAge +  0) );
    var   endIndex = Math.round( this.particlesPerSecond * (this.emitterAge + dt) );
    if  ( endIndex > this.particleCount ) 
        endIndex = this.particleCount; 
        
    for (var i = startIndex; i < endIndex; i++)
      this.particleArray[i].alive = 1.0;    
  }

  // if any particles have died while the emitter is still running, we imediately recycle them
  for (var j = 0; j < recycleIndices.length; j++)
  {
    var i = recycleIndices[j];
    this.particleArray[i] = this.createParticle();
    this.particleArray[i].alive = 1.0; // activate right away
    this.particleGeometry.vertices[i] = this.particleArray[i].position;
  }

  // stop emitter?
  this.emitterAge += dt;
  if ( this.emitterAge > this.emitterDeathAge )  this.emitterAlive = false;
}

ParticleEngine.prototype.destroy = function()
{
    this.particleMesh.parent.remove( this.particleMesh );
}
///////////////////////////////////////////////////////////////////////////////







/**
* @author Lee Stemkoski   http://www.adelphi.edu/~stemkoski/
*/

/* 
  Particle Engine options:
  
  positionBase   : new THREE.Vector3(),
  positionStyle : Type.CUBE or Type.SPHERE,

  // for Type.CUBE
  positionSpread  : new THREE.Vector3(),

  // for Type.SPHERE
  positionRadius  : 10,
  
  velocityStyle : Type.CUBE or Type.SPHERE,

  // for Type.CUBE
  velocityBase       : new THREE.Vector3(),
  velocitySpread     : new THREE.Vector3(), 

  // for Type.SPHERE
  speedBase   : 20,
  speedSpread : 10,
    
  accelerationBase   : new THREE.Vector3(),
  accelerationSpread : new THREE.Vector3(),
    
  particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/star.png' ),
    
  // rotation of image used for particles
  angleBase               : 0,
  angleSpread             : 0,
  angleVelocityBase       : 0,
  angleVelocitySpread     : 0,
  angleAccelerationBase   : 0,
  angleAccelerationSpread : 0,
    
  // size, color, opacity 
  //   for static  values, use base/spread
  //   for dynamic values, use Tween
  //   (non-empty Tween takes precedence)
  sizeBase   : 20.0,
  sizeSpread : 5.0,
  sizeTween  : new Tween( [0, 1], [1, 20] ),
      
  // colors stored in Vector3 in H,S,L format
  colorBase   : new THREE.Vector3(0.0, 1.0, 0.5),
  colorSpread : new THREE.Vector3(0,0,0),
  colorTween  : new Tween( [0.5, 2], [ new THREE.Vector3(0, 1, 0.5), new THREE.Vector3(1, 1, 0.5) ] ),

  opacityBase   : 1,
  opacitySpread : 0,
  opacityTween  : new Tween( [2, 3], [1, 0] ),
  
  blendStyle    : THREE.NormalBlending (default), THREE.AdditiveBlending

  particlesPerSecond : 200,
  particleDeathAge   : 2.0,   
  emitterDeathAge    : 60 
*/

Examples =
{

  
  // (1) build GUI for easy effects access.
  // (2) write ParticleEngineExamples.js
  
  // Not just any fountain -- a RAINBOW STAR FOUNTAIN of AWESOMENESS
  fountain :
  {
    positionStyle    : Type.CUBE,
    positionBase     : new THREE.Vector3( 0,  5, 0 ),
    positionSpread   : new THREE.Vector3( 10, 0, 10 ),
    
    velocityStyle    : Type.CUBE,
    velocityBase     : new THREE.Vector3( 0,  160, 0 ),
    velocitySpread   : new THREE.Vector3( 100, 20, 100 ), 

    accelerationBase : new THREE.Vector3( 0, -100, 0 ),
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/star.png' ),

    angleBase               : 0,
    angleSpread             : 180,
    angleVelocityBase       : 0,
    angleVelocitySpread     : 360 * 4,
    
    sizeTween    : new Tween( [0, 1], [1, 20] ),
    opacityTween : new Tween( [2, 3], [1, 0] ),
    colorTween   : new Tween( [0.5, 2], [ new THREE.Vector3(0,1,0.5), new THREE.Vector3(0.8, 1, 0.5) ] ),

    particlesPerSecond : 200,
    particleDeathAge   : 3.0,   
    emitterDeathAge    : 60
  },

  fireball :
  {
    positionStyle  : Type.SPHERE,
    positionBase   : new THREE.Vector3( 0, 0, 0 ),
    positionRadius : 0.2,
        
    velocityStyle : Type.SPHERE,
    speedBase     : 0,
    speedSpread   : 2,

    angleBase               : 0,
    angleSpread             : 720,
    angleVelocityBase       : 0,
    angleVelocitySpread     : 720,
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/smokeparticle.png' ),

    sizeTween    : new Tween( [0, 0.1], [1, 15] ),
    opacityTween : new Tween( [0.7, 1], [1, 0] ),
    colorBase    : new THREE.Vector3(0.02, 1, 0.4),
    blendStyle   : THREE.AdditiveBlending,  
    
    particlesPerSecond : 100,
    particleDeathAge   : 1.5,   
    emitterDeathAge    : 60
  },
  
  smoke :
  {
    positionStyle    : Type.CUBE,
    positionBase     : new THREE.Vector3( 0, 0, 0 ),
    positionSpread   : new THREE.Vector3( 10, 0, 10 ),

    velocityStyle    : Type.CUBE,
    velocityBase     : new THREE.Vector3( 0, 150, 0 ),
    velocitySpread   : new THREE.Vector3( 80, 50, 80 ), 
    accelerationBase : new THREE.Vector3( 0,-10,0 ),
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/smokeparticle.png'),

    angleBase               : 0,
    angleSpread             : 720,
    angleVelocityBase       : 0,
    angleVelocitySpread     : 720,
    
    sizeTween    : new Tween( [0, 1], [32, 128] ),
    opacityTween : new Tween( [0.8, 2], [0.5, 0] ),
    colorTween   : new Tween( [0.4, 1], [ new THREE.Vector3(0,0,0.2), new THREE.Vector3(0, 0, 0.5) ] ),

    particlesPerSecond : 200,
    particleDeathAge   : 2.0,   
    emitterDeathAge    : 60
  },
  
  clouds :
  {
    positionStyle  : Type.CUBE,
    positionBase   : new THREE.Vector3( -100, 100,  0 ),
    positionSpread : new THREE.Vector3(    0,  50, 60 ),
    
    velocityStyle  : Type.CUBE,
    velocityBase   : new THREE.Vector3( 40, 0, 0 ),
    velocitySpread : new THREE.Vector3( 20, 0, 0 ), 
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/smokeparticle.png'),

    sizeBase     : 80.0,
    sizeSpread   : 100.0,
    colorBase    : new THREE.Vector3(0.0, 0.0, 1.0), // H,S,L
    opacityTween : new Tween([0,1,4,5],[0,1,1,0]),

    particlesPerSecond : 50,
    particleDeathAge   : 10.0,    
    emitterDeathAge    : 60
  },
    
  snow :
  {
    positionStyle    : Type.CUBE,
    positionBase     : new THREE.Vector3( 0, 200, 0 ),
    positionSpread   : new THREE.Vector3( 500, 0, 500 ),
    
    velocityStyle    : Type.CUBE,
    velocityBase     : new THREE.Vector3( 0, -60, 0 ),
    velocitySpread   : new THREE.Vector3( 50, 20, 50 ), 
    accelerationBase : new THREE.Vector3( 0, -10,0 ),
    
    angleBase               : 0,
    angleSpread             : 720,
    angleVelocityBase       :  0,
    angleVelocitySpread     : 60,
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/snowflake.png' ),
      
    sizeTween    : new Tween( [0, 0.25], [1, 10] ),
    colorBase   : new THREE.Vector3(0.66, 1.0, 0.9), // H,S,L
    opacityTween : new Tween( [2, 3], [0.8, 0] ),

    particlesPerSecond : 200,
    particleDeathAge   : 4.0,   
    emitterDeathAge    : 60
  },
  
  rain :
  {
    positionStyle    : Type.CUBE,
    positionBase     : new THREE.Vector3( 0, 200, 0 ),
    positionSpread   : new THREE.Vector3( 600, 0, 600 ),

    velocityStyle    : Type.CUBE,
    velocityBase     : new THREE.Vector3( 0, -400, 0 ),
    velocitySpread   : new THREE.Vector3( 10, 50, 10 ), 
    accelerationBase : new THREE.Vector3( 0, -10,0 ),
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/raindrop2flip.png' ),

    sizeBase    : 8.0,
    sizeSpread  : 4.0,
    colorBase   : new THREE.Vector3(0.66, 1.0, 0.7), // H,S,L
    colorSpread : new THREE.Vector3(0.00, 0.0, 0.2),
    opacityBase : 0.6,

    particlesPerSecond : 1000,
    particleDeathAge   : 1.0,   
    emitterDeathAge    : 60
  },
    
  starfield :
  {
    positionStyle    : Type.CUBE,
    positionBase     : new THREE.Vector3( 0, 200, 0 ),
    positionSpread   : new THREE.Vector3( 600, 400, 600 ),

    velocityStyle    : Type.CUBE,
    velocityBase     : new THREE.Vector3( 0, 0, 0 ),
    velocitySpread   : new THREE.Vector3( 0.5, 0.5, 0.5 ), 
    
    angleBase               : 0,
    angleSpread             : 720,
    angleVelocityBase       : 0,
    angleVelocitySpread     : 4,

    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/spikey.png' ),
    
    sizeBase    : 10.0,
    sizeSpread  : 2.0,        
    colorBase   : new THREE.Vector3(0.15, 1.0, 0.9), // H,S,L
    colorSpread : new THREE.Vector3(0.00, 0.0, 0.2),
    opacityBase : 1,

    particlesPerSecond : 20000,
    particleDeathAge   : 60.0,    
    emitterDeathAge    : 0.1
  },

  fireflies :
  {
    positionStyle  : Type.CUBE,
    positionBase   : new THREE.Vector3( 0, 100, 0 ),
    positionSpread : new THREE.Vector3( 400, 200, 400 ),

    velocityStyle  : Type.CUBE,
    velocityBase   : new THREE.Vector3( 0, 0, 0 ),
    velocitySpread : new THREE.Vector3( 60, 20, 60 ), 
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/spark.png' ),

    sizeBase   : 30.0,
    sizeSpread : 2.0,
    opacityTween : new Tween([0.0, 1.0, 1.1, 2.0, 2.1, 3.0, 3.1, 4.0, 4.1, 5.0, 5.1, 6.0, 6.1],
                             [0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2] ),       
    colorBase   : new THREE.Vector3(0.30, 1.0, 0.6), // H,S,L
    colorSpread : new THREE.Vector3(0.3, 0.0, 0.0),

    particlesPerSecond : 20,
    particleDeathAge   : 6.1,   
    emitterDeathAge    : 600
  },
  
  leafs :
  {
    positionStyle  : Type.CUBE,
    positionBase   : new THREE.Vector3( 0, 1, 0 ),
    positionSpread : new THREE.Vector3( 1, 2, 1 ),

    velocityStyle  : Type.CUBE,
    velocityBase   : new THREE.Vector3( 0, 1, 0 ),
    velocitySpread : new THREE.Vector3( 60, 20, 60 ), 

    angleBase               : 10,
    angleSpread             : 720,
    angleVelocityBase       : 30,
    angleVelocitySpread     : 0,
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/custom/leafs.png' ),

    sizeBase   : 30.0,
    sizeSpread : 2.0,
    opacityTween : new Tween([0.0, 1.0, 1.1, 2.0, 2.1, 3.0, 3.1, 4.0, 4.1, 5.0, 5.1, 6.0, 6.1],
                             [0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2, 0.2, 1.0, 1.0, 0.2] ),       
    colorBase   : new THREE.Vector3(0.30, 1.0, 0.6), // H,S,L
    colorSpread : new THREE.Vector3(0.3, 0.0, 0.0),

    particlesPerSecond : 100,
    particleDeathAge   : 6.1,   
    emitterDeathAge    : 60
  },
  
  startunnel :
  {
    positionStyle  : Type.CUBE,
    positionBase   : new THREE.Vector3( 0, 0, 0 ),
    positionSpread : new THREE.Vector3( 10, 10, 10 ),

    velocityStyle  : Type.CUBE,
    velocityBase   : new THREE.Vector3( 0, 100, 200 ),
    velocitySpread : new THREE.Vector3( 40, 40, 80 ), 
    
    angleBase               : 0,
    angleSpread             : 720,
    angleVelocityBase       : 10,
    angleVelocitySpread     : 0,
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/spikey.png' ),

    sizeBase    : 4.0,
    sizeSpread  : 2.0,        
    colorBase   : new THREE.Vector3(0.15, 1.0, 0.8), // H,S,L
    opacityBase : 1,
    blendStyle  : THREE.AdditiveBlending,

    particlesPerSecond : 500,
    particleDeathAge   : 4.0,   
    emitterDeathAge    : 60
  },

  firework :
  {
    positionStyle  : Type.SPHERE,
    positionBase   : new THREE.Vector3( 0, 100, 0 ),
    positionRadius : 10,
    
    velocityStyle  : Type.SPHERE,
    speedBase      : 90,
    speedSpread    : 10,
    
    accelerationBase : new THREE.Vector3( 0, -80, 0 ),
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/spark.png' ),
    
    sizeTween    : new Tween( [0.5, 0.7, 1.3], [5, 40, 1] ),
    opacityTween : new Tween( [0.2, 0.7, 2.5], [0.75, 1, 0] ),
    colorTween   : new Tween( [0.4, 0.8, 1.0], [ new THREE.Vector3(0,1,1), new THREE.Vector3(0,1,0.6), new THREE.Vector3(0.8, 1, 0.6) ] ),
    blendStyle   : THREE.AdditiveBlending,  
    
    particlesPerSecond : 3000,
    particleDeathAge   : 2.5,   
    emitterDeathAge    : 0.2
  },

  candle :
  {
    positionStyle  : Type.SPHERE,
    positionBase   : new THREE.Vector3( 0, 50, 0 ),
    positionRadius : 2,
    
    velocityStyle  : Type.CUBE,
    velocityBase   : new THREE.Vector3(0,100,0),
    velocitySpread : new THREE.Vector3(20,0,20),
    
    particleTexture : THREE.ImageUtils.loadTexture( '/gamedata/textures/smokeparticle.png' ),
    
    sizeTween    : new Tween( [0, 0.3, 1.2], [20, 150, 1] ),
    opacityTween : new Tween( [0.9, 1.5], [1, 0] ),
    colorTween   : new Tween( [0.5, 1.0], [ new THREE.Vector3(0.02, 1, 0.5), new THREE.Vector3(0.05, 1, 0) ] ),
    blendStyle : THREE.AdditiveBlending,  
    
    particlesPerSecond : 60,
    particleDeathAge   : 1.5,   
    emitterDeathAge    : 60
  }
  
}


module.exports = {
  ParticleEngine: ParticleEngine,
  Examples: Examples
};
},{}],52:[function(require,module,exports){
'use strict';

var debug = require('debug')('recast:main');
var inherits = require('inherits');
var EventEmitter = require('EventEmitter');

// var now = require('now');

module.exports = Pathfinding;

var callbacks = {}, next = 0;

function Pathfinding () {

  var self = this;

  var emitable = {
    activeAgents: true,
    configured: true,
    built: true
  };

  this.worker = new Worker('../lib/pathfinding/recast.worker.js');

  this.worker.addEventListener('message', function(event){
    var data = event.data;

    if (emitable[data.type]) {
      self.emit(data.type, data.data);
    }

    if (data.funcName !== undefined && callbacks[data.funcName]) {
      callbacks[data.funcName](data.data);
      delete callbacks[data.funcName];
    }
  });
}

inherits(Pathfinding, EventEmitter);

Pathfinding.prototype.messageWorker = function(type, data, callback) {
  var self = this;
  var sendingMessage = {
    type: type,
    data: data
  };
  if (typeof callback === 'function') {
    var funcName = next++;
    callbacks[funcName] = callback;
    sendingMessage.funcName = funcName;
  }
  setTimeout(function(){
    self.worker.postMessage(sendingMessage);
  }, 0);
};

Pathfinding.prototype.config = function(config, callback) {
  this.messageWorker('config', config, callback);
};

Pathfinding.prototype.ready = function() {
  debug('Pathfinding worker ready');
};

Pathfinding.prototype.initWithFile = function(data, callback) {
  this.messageWorker('initWithFile', data, callback);
};

Pathfinding.prototype.initWithFileContent = function(data, callback) {
  this.messageWorker('initWithFileContent', data, callback);
};

Pathfinding.prototype.getRandomPoint = function(callback) {
  this.messageWorker('getRandomPoint', null, callback);
};

Pathfinding.prototype.setPolyUnwalkable = function(position, radius, flags, callback) {
  this.messageWorker('setPolyUnwalkable', { sx:position.x, sy:position.y, sz:position.z, dx:radius.x, dy:radius.y, dz:radius.z, flags:flags }, callback);
};

Pathfinding.prototype.findNearest = function(position, extend, callback) {
  if (typeof extend === 'function' && ! callback) {
    callback = extend;
    extend = { x: 2, y: 4, z: 2 };
  }
  this.messageWorker('findNearestPoint', {
    position: position,
    extend: extend
  }, callback);
};

Pathfinding.prototype.findPath = function(sx, sy, sz, dx, dy, dz, max, callback) {
  this.messageWorker('findPath', { sx:sx, sy:sy, sz:sz, dx:dx, dy:dy, dz:dz, max:max }, callback);
};

Pathfinding.prototype.addCrowdAgent = function(options, callback) {
  this.messageWorker('addCrowdAgent', options, callback);
};

Pathfinding.prototype.updateCrowdAgentParameters = function(agent, options, callback) {
  this.messageWorker('updateCrowdAgentParameters', {
    agent: agent,
    options: options
  }, callback);
};

Pathfinding.prototype.requestMoveVelocity = function(agent, velocity, callback) {
  this.messageWorker('requestMoveVelocity', {
    agent: agent,
    velocity: velocity
  }, callback);
};

Pathfinding.prototype.removeCrowdAgent = function(agent, callback) {
  this.messageWorker('removeCrowdAgent', agent, callback);
};

Pathfinding.prototype.crowdUpdate = function(delta, callback) {
  this.messageWorker('crowdUpdate', delta, callback);
};

Pathfinding.prototype.crowdRequestMoveTarget = function(agent, position, callback) {
  this.messageWorker('crowdRequestMoveTarget', { agent:agent, x:position.x, y:position.y, z:position.z }, callback);
};



},{"EventEmitter":71,"debug":73,"inherits":74}],53:[function(require,module,exports){
'use strict';

/* global dat: true, _gaq: true */

/**
 * @exports SettingsGUI
 * 
 */

var settings = require('./settings');

var gui, crowd, allCrowd;

/**
 * Create a GUI
 *  
 * @return {dat.GUI}  The dat.GUI object
 */
module.exports.create = function( initParams ) {

  if (! settings.enableGUI) { return false; }

  // dat.GUI is global, included in the HTML
  gui = new dat.GUI({ autoPlace: false });
  settings.gui = gui;

  gui.width = 400;
  document.getElementsByTagName('body')[0].appendChild(gui.domElement);

  gui.domElement.addEventListener('click', logSettingsClick);

  function logSettingsClick(){
    gui.domElement.removeEventListener('click', logSettingsClick);
    _gaq.push(['_trackEvent', 'settings', 'open']);
  }

  var f;


  // GENERAL
  f = gui.addFolder('Generic');
  f.add(exports,'shortcut','O').name('Show panels');
  f.add(exports,'shortcut','0').name('Debug renderer');
  f.add(exports,'shortcut','H').name('Heal');
  f.add(settings.data, 'godMode').name('God mode');
  f.add(settings.data, 'quality',{
    'Best quality (antialiasing)': 3,
    'High quality': 2,
    'High performance': 1
  });
  f.add(settings.data, 'framerate').min(1).max(120).name('Framerate (fps)').onChange(framerateUpdated);
  f.add(settings.data, 'visibleCharactersHelpers').name('Entities helpers').onChange(helpersUpdated);
  f.add(settings.data, 'visibleCharactersRoutes').name('Entities routes');

  // CONTROLS
  f = gui.addFolder('Controls');
  f.add(settings.data.controls, 'mouseEnabled').name('Mouse enabled').listen();
  f.add(settings.data.controls, 'gamepadEnabled').name('Gamepad enabled').listen();

  // CAMERA
  f = gui.addFolder('Camera');
  f.add(settings.data, 'cameraType',{
    'Manual': 1,
    'Follow': 2,
  }).name('Type');
  f.add(settings.data, 'cameraHeight').min(10).max(1000).name('Height');
  f.add(settings.data, 'cameraFov').min(-1000).max(1000).name('FOV').listen().onChange(cameraUpdated);

  // FOG
  f = gui.addFolder('Fog');
  f.addColor(settings.data, 'fogColor').name('Color').listen().onChange(fogUpdated);
  f.add(settings.data, 'fogNear', 1, 200).name('Near').listen().onChange(fogUpdated);
  f.add(settings.data, 'fogFar', 1, 2000).name('Far').listen().onChange(fogUpdated);

  /*
  f = gui.addFolder('Camera');
  f.add(settings.data, 'cameraType',CAMERA_TYPES).name('Mode').listen().onChange(function(value){
    settings.data.cameraType = parseInt(value,10);
    settings.emit('cameraTypeChanged');
  }.bind(this));
  f.add(settings.data,'cameraOverlay').name('Overlay').onChange(function(){
    settings.emit('cameraSettingsChanged');
  }.bind(this));
  f.add(settings.data,'cameraFov').min(10).max(100).step(1).name('FOV').onChange(function(){
    settings.emit('cameraSettingsChanged');
  }.bind(this));
  f.add(settings.data,'cameraGrid').min(0).max(1).name('Scanlines').onChange(function(){
    settings.emit('cameraSettingsChanged');
  }.bind(this));
  f.add(exports, 'shortcut','C').name('Log position');
  */


  f = gui.addFolder('Lights');
  f.addColor(settings.data, 'lightAmbientColor').name('Ambient color').onChange(lightsUpdated);

  f.addColor(settings.data, 'lightPointColor').name('Point color').onChange(lightsUpdated);
  f.add(settings.data, 'lightPointIntensity', 0.001, 10).name('Point intensity').onChange(lightsUpdated);
  f.add(settings.data, 'lightPointDistance', 0, 1000).name('Point distance').onChange(lightsUpdated);
  f.add(settings.data, 'lightPointAngle', 0, Math.PI * 2).name('Point angle').onChange(lightsUpdated);

  f.addColor(settings.data, 'lightDirectionalColor').name('Dir color').onChange(lightsUpdated);
  f.add(settings.data, 'lightDirectionalIntensity', 0.001, 10).name('Dir intensity').onChange(lightsUpdated);
  f.add(settings.data, 'lightDirectionalDistance', 0, 1000).name('Dir distance').onChange(lightsUpdated);
  f.add(settings.data, 'lightDirectionalShadows').name('Dir shadows').onChange(lightsUpdated);


  f = crowd = gui.addFolder('Crowd');

  f = f.addFolder('Defaults');
  f.add(settings.data, 'crowdDefaultSeparationWeight', 1, 200).name('SeparationWeight');
  f.add(settings.data, 'crowdDefaultMaxAcceleration', 1, 100).name('Default MaxAcceleration');
  f.add(settings.data, 'crowdDefaultUpdateFlags', 1, 200).name('Default UpdateFlags');
  f.add(settings.data, 'crowdDefaultMaxSpeed', 1, 100).name('Default MaxSpeed');
  f.add(settings.data, 'crowdDefaultRadius', 1, 20).name('Default Radius');
  f.add(settings.data, 'crowdDefaultHeight', 1, 20).name('Default Height');

  allCrowd = {
    crowdSeparationWeight: settings.data.crowdDefaultSeparationWeight,
    crowdMaxAcceleration: settings.data.crowdDefaultMaxAcceleration,
    crowdUpdateFlags: settings.data.crowdDefaultUpdateFlags,
    crowdMaxSpeed: settings.data.crowdDefaultMaxSpeed,
    crowdRadius: settings.data.crowdDefaultRadius
  };
  f = crowd.addFolder('All');
  f.add(allCrowd, 'crowdSeparationWeight', 1, 200).name('SeparationWeight').onChange(allCrowdAgentsUpdated);
  f.add(allCrowd, 'crowdMaxAcceleration', 1, 100).name('MaxAcceleration').onChange(allCrowdAgentsUpdated);
  f.add(allCrowd, 'crowdUpdateFlags', 1, 200).name('UpdateFlags').onChange(allCrowdAgentsUpdated);
  f.add(allCrowd, 'crowdMaxSpeed', 1, 100).name('MaxSpeed').onChange(allCrowdAgentsUpdated);
  f.add(allCrowd, 'crowdRadius', 1, 20).name('Radius').onChange(allCrowdAgentsUpdated);


  if( initParams.isNetwork ){
    f = gui.addFolder('Networking');
    f.add(settings.data, 'keepAliveInterval').min(16).max(1000).name('Keep Alive Interval (ms)');
    f.add(settings.data, 'sendRate').min(1).max(60).name('Send Rate (hz)');

    f = gui.addFolder('Interpolation');
    f.add(settings.data, 'interpolationMaxFrames').min(0).max(120).name('Max frames (0=none)');
    f.add(settings.data, 'interpolationMaxDistance').min(0).max(1000).name('Max distance diff (px/frame)');
    f.add(settings.data, 'interpolationMinDistance').min(0).max(1000).name('Min distance diff (px/frame)');
  }

  gui.close();

  return gui;
};

var entities = {};

function entityFolderName(entity) {
  return 'Entity: ' + entity.id + ' (' + entity.constructor.name + ')';
}

/**
 * Add an entity's controls to the current GUI
 * @param {Entity} entity The entity to report changes
 */
module.exports.addEntityControls = function( entity ) {

  if (! gui || ! crowd) { return false; }

  var folderName = 'Entity: ' + entity.id + ' (' + entity.constructor.name + ')';
  var f = crowd.addFolder(folderName);

  entities[entity.id] = f;
  
  f.add(entity.state, 'life', 1, 200).name('Life').listen().onChange(entityUpdated);
  f.add(entity.state, 'mana', 1, 200).name('Mana').listen().onChange(entityUpdated);
  f.add(entity.state, 'height', 1, 200).name('Height').listen().onChange(entityUpdated);
  f.add(entity.state, 'radius', 1, 200).name('Radius').listen().onChange(entityUpdated);
  f.add(entity.state, 'maxAcceleration', 1, 200).name('maxAcceleration').listen().onChange(entityUpdated);
  f.add(entity.state, 'maxSpeed', 1, 200).name('maxSpeed').listen().onChange(entityUpdated);

  if (entity.behaviour && entity.behaviour.identifier) {
    // too greedy
    // f.add(entity.behaviour, 'identifier').name('State').listen();
  }

  if (entity.character && entity.character.rotation) {
    f.add(entity.character.rotation, 'y', 0, 2 * Math.PI).name('Rotation Y');
  }

  function entityUpdated() {
    helpersUpdated();
    entity.emit('changed');
    entity._crowd_params_need_update = true;
  }
};

/**
 * Remove an entity's controls from the current GUI
 * @param {Entity} entity The entity to remove
 */
module.exports.removeEntityControls = function( entity ) {

  if (! gui || ! crowd) { return false; }

  try {
    gui.removeFolder(entityFolderName(entity));
  }
  catch (e) {
    console.warn('ERROR: ' + entity.id + ' was already removed from GUI');
  }
};

function helpersUpdated () {
  settings.emit('helpersUpdated');
}

function cameraUpdated() {
  settings.emit('cameraUpdated');
}

function allCrowdAgentsUpdated () {
  settings.emit('allCrowdAgentsUpdated', allCrowd);
}

function crowdUpdated() {
  settings.emit('crowdUpdated');
}

function fogUpdated() {
  settings.emit('fogUpdated');
}

function lightsUpdated() {
  settings.emit('lightsUpdated');
}

function framerateUpdated(v) {
  settings.data.timestep = 1000/v;
}

function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp('([?|&])' + key + '=.*?(&|$)', 'i');
  var separator = uri.indexOf('?') !== -1 ? '&' : '?';
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + '=' + value + '$2');
  }
  else {
    return uri + separator + key + '=' + value;
  }
}

exports.shortcut = function(label){
  // keys.trigger(label.toLowerCase());
};


},{"./settings":54}],54:[function(require,module,exports){
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

settings.enableGUI = location ? String(location).indexOf('gui=1') > -1 : false;
settings.enableGLStats = true;

settings.data = {

  /**
   * Rendering quality
   * @type {Number}
   */
  quality: 1,

  /**
   * Framerate
   * @type {Number}
   */
  framerate: 30,

  /**
   * Desired framerate
   * @type {Float}
   */
  timestep: 1000/60,

  /**
   * Max updates per frame, after which a frame will be considered "slow"
   * @type {Number}
   */
  maxUpdatesPerFrame: 60,

  /**
   * Camera type
   * @type {Number}
   */
  cameraType: settings.CAMERA_FOLLOW,

  /**
   * Aliasing setting
   * @type {Boolean}
   */
  antialias: true,

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

  controls: {
    mouseEnabled: true,
    gamepadEnabled: false
  },

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



},{"events":92}],55:[function(require,module,exports){
'use strict';

var TWEEN = require('tween');
var inherits = require('inherits');

module.exports = LifebarShaderMaterial;

/**
 * @exports threearena/shaders/lifebar
 */
function LifebarShaderMaterial () {

  this.shaderOptions = {

    shading: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    transparent: true,

    uniforms: {
      background: { type: 'c', value: new THREE.Color(0x000000) },

      bar1Color: { type: 'c', value: new THREE.Color(0xFF0000) },
      bar1Size: { type: 'f', value: 1.0 },
      bar1WarningSpeed: { type: 'f', value: 0.0 },

      bar2Color: { type: 'c', value: new THREE.Color(0x0000FF) },
      bar2Size: { type: 'f', value: 1.0 },
      bar2WarningSpeed: { type: 'f', value: 0.0 },

      time: { type: 'f', value: 1.0 },
      resolution: { type: 'v2', value: new THREE.Vector2() }
    },

    vertexShader: '' +
      ' varying vec2 vUv; ' +
      ' void main()       ' +
      ' {                 ' +
      '    vUv = uv;      ' +
      '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );   ' +
      '    gl_Position = projectionMatrix * mvPosition;                 ' +
      ' }',

    fragmentShader: '' +
      ' varying vec2 vUv;                ' +
      ' uniform float lifeWarning;       ' +
      ' uniform float manaWarning;       ' +
      ' uniform float warningSpeed;      ' +

      ' uniform float time;              ' +
      ' uniform vec2 mouse;              ' +
      ' uniform vec2 resolution;         ' +

      ' uniform vec4 background;         ' +
      ' uniform vec3 bar2Color;          ' +
      ' uniform float bar2Size;          ' +
      ' uniform vec3 bar1Color;          ' +
      ' uniform float bar1Size;          ' +
      ' uniform float bar2WarningSpeed;  ' +
      ' uniform float bar1WarningSpeed;  ' +
      ' float barWidth = 0.2;            ' +

      ' bool inBar2(float y, float border) { ' +
      '    return (y > 0.3 - barWidth - border && y < 0.1 + barWidth + border);  ' +
      ' } ' +

      ' bool inBar1(float y, float border) { ' +
      '    ' +
      '    return (y > (0.6 + border) && y < 0.6 + (barWidth - border));  ' +
      ' } ' +

      ' void main( void ) { ' +
      '    vec4 background = vec4(1.0, 1.0, 1.0, 0.0);  ' +

      '    vec3 bar2Color = vec3(0.0, 1.0, 0.0);  ' +
      // + '    float bar2Size = 0.9;  ' +

      '    vec3 bar1Color = vec3(0.0, 0.0, 1.0);  ' +
      // + '    float bar1Size = 0.1;  '
      // + '    float bar2WarningSpeed = 10.0;  '
      // + '    float bar1WarningSpeed = 10.0;  '
      '    float lifeWarning;  ' +
      '    float manaWarning;  ' +

      // + '    // vec2 position = ( gl_FragCoord.xy / resolution.xy ) / 4.0;  '
      '    vec2 position = vUv;          ' +

      '    float x = fract(position.x);  ' +
      '    float y = fract(position.y);  ' +

      '    vec4 color;                   ' +
      '    float opacity = sin(x);       ' +

      '    if (inBar2(y, 0.0)) {         ' +
      '        color = vec4(0, 0, 1, opacity)  *  x  /  (bar2Size - x);  ' +
      '    } ' +
      '    else if (inBar2(y, 0.02)) { ' +
      '        color = vec4(sin(time * bar2WarningSpeed), 0, 0, 1.0 - manaWarning);  ' +
      '    } ' +
      '    else if (inBar1(y, 0.02)) { ' +
      '        color = vec4(0, 1, 0, opacity)  *  x  /  (bar1Size - x);  ' +
      '    } ' +
      '    else if (inBar1(y, 0.0)) { ' +
      '        color = vec4(sin(time * bar1WarningSpeed), 0, 0, 1.0 - lifeWarning);  ' +
      '    } ' +
      '    else { ' +
      '        color = background;  ' +
      '    } ' +

      // + '    // this is the critical line: set the actual fragment colour.'
      '    gl_FragColor = color;    ' +
      ' } '
  };

  THREE.ShaderMaterial.apply(this, [ this.shaderOptions ]);
}

inherits(LifebarShaderMaterial, THREE.ShaderMaterial);

LifebarShaderMaterial.prototype.update = function(delta) {

  this.shaderOptions.uniforms.time.value = delta;
};

LifebarShaderMaterial.prototype.setLife = function(value) {

  // this.shaderOptions.uniforms.bar1Size.value = value;
  this.shaderOptions.uniforms.bar1WarningSpeed.value = (this.shaderOptions.uniforms.bar1Size.value < 0.3) ? 20 : 0;

  new TWEEN.Tween(this.shaderOptions.uniforms.bar1Size)
    .to({ value: value }, 100)
    .easing( TWEEN.Easing.Linear.None )
    .start();
};

LifebarShaderMaterial.prototype.setMana = function(value) {

  // this.shaderOptions.uniforms.bar2Size.value = value;
  this.shaderOptions.uniforms.bar2WarningSpeed.value = (this.shaderOptions.uniforms.bar2Size.value < 0.3) ? 20 : 0;

  new TWEEN.Tween(this.shaderOptions.uniforms.bar2Size)
    .to({ value: value }, 100)
    .easing( TWEEN.Easing.Linear.None )
    .start();
};


},{"inherits":74,"tween":89}],56:[function(require,module,exports){
'use strict';

var inherits = require('inherits');

module.exports = LightboltShaderMaterial;

/**
 * @exports threearena/shaders/lightbolt
 */
function LightboltShaderMaterial (strands) {

  THREE.ShaderMaterial.apply(this, [{
    shading: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    transparent: true,

    uniforms: {
      time: { type: 'f', value: 1.0 },
      resolution: { type: 'v2', value: new THREE.Vector2() }
    },
    vertexShader: ' varying vec2 vUv;       '
                + ' void main()             '
                + ' {                       '
                + '    vUv = uv;            '
                + '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );   '
                + '    gl_Position = projectionMatrix * mvPosition;                 '
                + ' }',
    fragmentShader: '  uniform vec2 resolution;             '
                + '    uniform float time;                  '

                + '    varying vec2 vUv;                    '

                        // Lightning shader
                        // rand,noise,fmb functions from https://www.shadertoy.com/view/Xsl3zN

                + '    float rand(vec2 n) {                 '
                + '        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);       '
                + '    }                                    '

                + '    float noise(vec2 n) {                '
                + '        const vec2 d = vec2(0.0, 1.0);   '
                + '        vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));   '
                + '        return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);       '
                + '    }                                 '

                + '    float fbm(vec2 n) {                          '
                + '        float total = 0.0, amplitude = 1.0;      '
                + '        for (int i = 0; i < 7; i++) {            '
                + '            total += noise(n) * amplitude;       '
                + '            n += n;                              '
                + '            amplitude *= 0.5;                    '
                + '        }                                        '
                + '        return total;                            '
                + '    }                                            '

                + '    void main(void)                              '
                + '    {                                            '
                + '        vec2 position = vUv;                     '
                + '        vec4 col = vec4(0,0,0,0);                '

                            // vec2 uv = gl_FragCoord.xy * 1.0 / resolution.xy; // screen space
                + '        vec2 uv = 1.0 * position;        ' // object face space

                            // draw a line, left side is fixed
                + '        vec2 t = uv * vec2(2.0,1.0) - time*3.0;       '
                + '        vec2 t2 = (vec2(1,-1) + uv) * vec2(3.0,1.0) - time*3.0;        ' // a second strand

                            // draw the lines,
                            // this make the left side fixed, can be useful
                            // float ycenter = mix( 0.5, 0.25 + 0.25*fbm( t ), uv.x*4.0);
                            // float ycenter2 = mix( 0.5, 0.25 + 0.25*fbm( t2 ), uv.x*4.0);
                + '        float ycenter = fbm(t)*0.5;       '
                + '        float ycenter2= fbm(t2)*0.5;       '

                            // falloff
                + '        float diff = abs(uv.y - ycenter);       '
                + '        float c1 = 1.0 - mix(0.0,1.0,diff*40.0);       '

                + '        float diff2 = abs(uv.y - ycenter2);       '
                + '        float c2 = 1.0 - mix(0.0,1.0,diff2*20.0);       '

                + '        float c = max(c1,c2);       '
                + '        col = vec4(c*0.4,0.2*c2,c,c);       '
                + '        gl_FragColor = col;       '
                + '    }'
  }]);
}

inherits(LightboltShaderMaterial, THREE.ShaderMaterial);

},{"inherits":74}],57:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var debug = require('debug')('spell');

module.exports = Spell;

/**
 * A castable spell
 * 
 * @exports Spell
 * 
 * @constructor
 * 
 * @param {Object} options
 */
function Spell ( options ) {

  var self = this;

  options = _.merge({

    isMelee: false,
    meleeLifeDamage: 0,
    magicLifeDamage: 0,
    manaDamage: 0,
    source: null,

    cooldown: 0,
    ccd: 0, // current cooldown

    minRange: 1,
    maxRange: 2,

    level: 1,
    image: 'default.png',

    needsTarget: false,
    needsTargetZone: false

  }, options);

  _.each(options, function( values, key ){

    self[ key ] = values;

  });
}

/**
 * Return `true` if this spell cast by source can hit target
 * 
 * @param  {Entity} source         The caster entity
 * @param  {Entity} target         The target entity
 * @param  {Number} toleranceRatio acceptable distance ratio
 * @return {Boolean}               `true` if this spell can hit the specified target      
 */
Spell.prototype.canHit = function (source, target, toleranceRatio) {

  toleranceRatio = toleranceRatio || 1;
  return source !== target && source.state.team !== target.state.team && source.position.distanceTo(target.position) < (this.maxRange * toleranceRatio);
};


/**
 * Start the spell against the specified target
 * 
 * @param  {Entity} source    The caster entity
 * @param  {Entity=} target   The target entity
 */
Spell.prototype.start = function (source, target) {

  debug('Spell ancestor should not be called directly', source, target);
  debugger; // should never happen so fix it now !

  return false;
};

/**
 * Start the spell cooldown
 * 
 * @param  {Entity} source    The caster entity
 * @param  {Entity=} target   The target entity
 */
Spell.prototype.startCooldown = function (source) {

  var self = this,
      start = Date.now();

  self.ccd = self.cooldown;
  
  var updateCD = function(){
    var now = Date.now();

    // cooldown id finished
    if (now >= start + self.cooldown) {
      self.ccd = 0;

    } else {

      // FIXME: Does not work because entity.spells[i].ccd is not an observable

      self.ccd = start + self.cooldown - now;
      debug(self.name, 'cooldown is now ', self.ccd);
      source.emit('changed', source);

      setTimeout(updateCD, 50);
    }
  };

  setTimeout(updateCD, 50);
};

},{"debug":73,"lodash":85}],58:[function(require,module,exports){
module.exports = {
  Bite: require('./bite'),
  FireAura: require('./fireaura'),
  FireBullet: require('./firebullet'),
  FlatFireAura: require('./flatfireaura'),
  Lightbolt: require('./lightbolt'),
  Heal: require('./heal'),
  Teleport: require('./teleport'),
};

},{"./bite":59,"./fireaura":60,"./firebullet":61,"./flatfireaura":62,"./heal":63,"./lightbolt":64,"./teleport":65}],59:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Spell = require('../spell');
var Sound = require('../elements/sound');

module.exports = Bite;

/**
 * @exports threearena/spell/bite
 */
function Bite (options) {

  var self = this;

  options = _.merge({}, options, {
    name: 'bite',
    isMelee: true,
    meleeLifeDamage: 10,

    cooldown: 1 * 1000,

    minRange: 0,
    maxRange: 4,
  });

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 200.0, 1);
  
  window._ta_events.on('update', function(game){
    if (self.source) {
      self.sound.update.call(self.source, game.camera); // called with character as "this"
    }
  });

  Spell.apply(this, [ options ]);
}

inherits(Bite, Spell);

Bite.prototype.name = 'bite';

///////////////////

Bite.prototype.start = function(source, target) {

  if (! target) {
    console.warn('This spell needs a target');
    return;
  }

  this.source = source;
  this.sound.play();
  target.hit(this);
};

},{"../elements/sound":36,"../spell":57,"inherits":74,"lodash":85}],60:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var Spell = require('../spell');
var Particles = require('../particles/cloud');

module.exports = FireAura;

/**
 * @exports threearena/spell/fireaura
 */
function FireAura (options) {

  options = _.merge({}, options, {
    name: 'fireaura',
    maxRange: 6.0,
    cooldown: 20 * 1000
  });

  Spell.apply(this, [ options ]);

  this.aura = Particles.Aura('circle', 1000, THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare1_alpha.png' ), null);
}

inherits(FireAura, Spell);

FireAura.prototype.name = 'fireaura';

FireAura.prototype.start = function (caster, target) {
  var self = this;

  var updateCloud = function(game){
    self.aura.update(game.delta);
  }.bind(self);

  caster.character.root.add(this.aura.particleCloud);

  this.aura.start();
  window._ta_events.on('update', updateCloud);

  setTimeout(function(){
    self.aura.stop();
    caster.character.root.remove(self.aura.particleCloud);
    window._ta_events.removeListener('update', updateCloud);
  }, 5000);
};

},{"../particles/cloud":50,"../spell":57,"inherits":74,"lodash":85}],61:[function(require,module,exports){
'use strict';

var inherits = require('inherits');

var _ = require('lodash');
var TWEEN = require('tween');
var inherits = require('inherits');

var Spell = require('../spell');
var Utils = require('../utils');
var Particles = require('../particles/cloud');
var Sound = require('../elements/sound');

var stemkoski = require('../particles/stemkoski_ParticleEngine');

module.exports = FireBullet;

/**
 * @exports threearena/spell/firebullet
 */
function FireBullet (options) {

  options = _.merge({}, options, {

    name: 'firebullet',

    isMelee: false,
    
    magicLifeDamage: 20,

    maxRange: 50.0,

    level: 1,

    needsTarget: true
  });

  Spell.apply(this, [ options ]);

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 5.0, 50);
  // window._ta_events.on('update', function(game){ self.sound.update(game.camera); });

  // Add a particle system
  this.aura = new stemkoski.ParticleEngine();
  this.aura.setValues(stemkoski.Examples.fireball);
  // this.aura.initialize();

  // this.aura = Particles.Aura('point', 500, THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare0_alpha.png' ), null);
}

inherits(FireBullet, Spell);

FireBullet.prototype.name = 'firebullet';

FireBullet.prototype.start = function (caster, target) {
  var self = this;

  if (! target) {
    console.warn('This spell needs a target');
    return;
  }

  this.sound.play();

  // var endPosition = caster.worldToLocal(target.position.clone());
  // var endPosition = target.position;

  var aura = new stemkoski.ParticleEngine();
  aura.setValues(stemkoski.Examples.fireball);
  aura.initialize();
  aura.particleMesh.position.copy(caster.position);

  var updateCloud = function(game){

    this.update(game.delta);

  }.bind(aura);

  new TWEEN.Tween(aura.particleMesh.position)
    .to(target.position, 200)
    .onStart(function(){
      caster.game.on('update', updateCloud);
      caster.parent.add(aura.particleMesh);
    })
    .onComplete(function(){
      caster.parent.remove(aura.particleMesh);
      caster.game.removeListener('update', updateCloud);
      target.hit(self);
    })
    .start();
};

},{"../elements/sound":36,"../particles/cloud":50,"../particles/stemkoski_ParticleEngine":51,"../spell":57,"../utils":66,"inherits":74,"lodash":85,"tween":89}],62:[function(require,module,exports){
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

  var update = function(game){
    this.aura.rotation.z += game.delta; // * 100 * Math.PI / 180;
  }.bind(self);

  caster.add(this.aura);
  caster.game.on('update', update);

  setTimeout(function(){
    caster.remove(self.aura);
    caster.game.removeListener('update', update);
  }, 5000);
};

},{"../spell":57,"inherits":74,"lodash":85}],63:[function(require,module,exports){
'use strict';

var inherits = require('inherits');

var _ = require('lodash');
var TWEEN = require('tween');
var inherits = require('inherits');

var Spell = require('../spell');
var Utils = require('../utils');
var Particles = require('../particles/cloud');
var Sound = require('../elements/sound');

var stemkoski = require('../particles/stemkoski_ParticleEngine');

module.exports = Heal;

/**
 * @exports threearena/spell/heal
 */
function Heal (options) {

  options = _.merge({}, options, {

    name: 'Heal',

    isMelee: false,
    
    magicLifeDamage: -30,

    maxRange: 50.0,

    level: 1,

    needsTarget: true
  });

  Spell.apply(this, [ options ]);

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 5.0, 50);
  // window._ta_events.on('update', function(game){ self.sound.update(game.camera); });

  // Add a particle system
  this.aura = new stemkoski.ParticleEngine();
  this.aura.setValues(stemkoski.Examples.leafs);
  // this.aura.initialize();

  // this.aura = Particles.Aura('point', 500, THREE.ImageUtils.loadTexture( '/gamedata/textures/lensflare0_alpha.png' ), null);
}

inherits(Heal, Spell);

Heal.prototype.name = 'Heal';

Heal.prototype.canHit = function (source, target, toleranceRatio) {

  toleranceRatio = toleranceRatio || 1;
  return source.state.team === target.state.team && source.position.distanceTo(target.position) < (this.maxRange * toleranceRatio);
};

Heal.prototype.start = function (caster, target) {
  var self = this;

  if (! target) {
    console.warn('This spell needs a target');
    return;
  }

  this.sound.play();

  // var endPosition = caster.worldToLocal(target.position.clone());
  // var endPosition = target.position;

  var aura = new stemkoski.ParticleEngine();
  aura.setValues(stemkoski.Examples.leafs);
  aura.initialize();
  aura.particleMesh.position.copy(caster.position);
  aura.particleMesh.position.y += 10;

  var updateCloud = function(game){

    this.update(game.delta);

  }.bind(aura);

  new TWEEN.Tween(aura.particleMesh.position)
    .to(target.position, 200)
    .onStart(function(){
      caster.game.on('update', updateCloud);
      caster.parent.add(aura.particleMesh);
    })
    .onComplete(function(){
      caster.parent.remove(aura.particleMesh);
      caster.game.removeListener('update', updateCloud);
      target.hit(self);
    })
    .start();
};

},{"../elements/sound":36,"../particles/cloud":50,"../particles/stemkoski_ParticleEngine":51,"../spell":57,"../utils":66,"inherits":74,"lodash":85,"tween":89}],64:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var TWEEN = require('tween');

var Spell = require('../spell');
var LightboltMaterial = require('../shaders/lightbolt');

module.exports = Lightbolt;


/**
 * @exports threearena/spell/lightbolt
 */
function Lightbolt (options) {

  options = _.merge({}, options, {

    name: 'lightbolt',

    isMelee: false,
    magicLifeDamage: 20,

    level: 1,

    minRange: 0,
    maxRange: 10,

    needsTarget: true
  });

  Spell.apply(this, [ options ]);

  this.shaderMaterial = new LightboltMaterial();

  // we need an oriented mesh like this:
  //   _____________
  //  |             |
  //  ° 0,0         |
  //  |_____________|
  //  
  //   ______________
  //  |      °      |
  //  |      0,0    |
  //  |             |
  //  |             |
  //  |             |
  //  |_____________|
  //  

  var geometry = new THREE.PlaneGeometry( 1, 10 );
  // THREE.CylinderGeometry( radiusTop, radiusBottom, height, segmentsRadius, segmentsHeight, openEnded )
  for (var i = 0; i < geometry.vertices.length; i++) {
    geometry.vertices[i].x += 0.5;
    //geometry.vertices[i].y += 5;
  }

  geometry.computeBoundingBox();

  this.plane = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( [ this.shaderMaterial, this.shaderMaterial ] ) );
  //this.plane.rotation.x = 90 * Math.PI / 180;
  // this.plane.position.y *= - .5;
  // this.plane.position.x *= - .5;
  this.plane.position.y += 2;
}

inherits(Lightbolt, Spell);

Lightbolt.prototype.name = 'lightbolt';

///////////////////

Lightbolt.prototype.collideBox = function (box) {
  return this.plane.geometry.boundingBox.isIntersectionBox(box);
};

Lightbolt.prototype.start = function (caster, target) {
  var self = this;
  //self.plane.position.set( caster.position.x, caster.position.y + 5, caster.position.z );

  var update = function(game){
    self.shaderMaterial.uniforms.time.value += game.delta; // * 100 * Math.PI / 180;
  };

  self.tween = new TWEEN.Tween(self.plane.scale)
  .to({ x: 30, y: 3 }, 300) // use 
  .easing( TWEEN.Easing.Elastic.InOut )
  .onStart(function(){
    caster.game.on('update', update);
    caster.add(self.plane);
  })
  .onComplete(function(){
    caster.game.removeListener('update', update);
    self.plane.scale.set( 1, 1, 1 );
    caster.remove(self.plane);
  })
  .onUpdate(function(){
    // hit if our plane intersects the target
    if (target && self.collideBox(target.boundingBox)) {
      target.hit(self);
    }
  })
  .start();
};
},{"../shaders/lightbolt":56,"../spell":57,"inherits":74,"lodash":85,"tween":89}],65:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var TWEEN = require('tween');

var settings = require('../settings');

var Spell = require('../spell');
var Sound = require('../elements/sound');

module.exports = Teleport;

/**
 * @exports threearena/spell/Teleport
 */
function Teleport (options) {

  var self = this;

  options = _.merge({}, options, {
    name: 'teleport',

    cooldown: 1 * 1000,

    minRange: 0,
    maxRange: 50,

    needsTargetZone: true
  });

  this.sound = new Sound(['/gamedata/sounds/' + options.name + '.mp3'], 200.0, 1);
  
  window._ta_events.on('update', function(game){
    if (self.source) {
      self.sound.update.call(self.source, game.camera); // called with character as "this"
    }
  });

  Spell.apply(this, [ options ]);
}

inherits(Teleport, Spell);

Teleport.prototype.name = 'Teleport';

///////////////////

/**
 * Return `true` if this spell cast by source can hit target
 * 
 * @param  {Entity} source         The caster entity
 * @param  {Entity} target         The target entity
 * @param  {Number} toleranceRatio acceptable distance ratio
 * @return {Boolean}               `true` if this spell can hit the specified target      
 */
Teleport.prototype.canHit = function (source, target, toleranceRatio) {

  toleranceRatio = toleranceRatio || 1;
  return source !== target && source.position.distanceTo(target.position) < (this.maxRange * toleranceRatio);
};


Teleport.prototype.start = function(source, target) {

  if (! target) {
    console.warn('This spell needs a target zone');
    return;
  }

  this.sound.play();

  source.game.crowd.teleport(source, target.position, function(){

    // keep the camera setting
    var oldCameraType = settings.data.cameraType;
    settings.data.cameraType = settings.CAMERA_MANUAL;

    var cameraPosition = new THREE.Vector3(
      target.position.x,
      target.position.y + settings.data.cameraHeight,
      target.position.z + 200
    );

    // needed to handle transparency
    source.character.meshBody.material.transparent = true;
    source.character.meshBody.material.opacity = 0.01;


    var tweenOpacity = new TWEEN.Tween(source.character.meshBody.material)
      .to({ opacity: 1.0 }, 400)
      .onComplete(function(){
        source.character.meshBody.material.transparent = false;
      });

    var tweenCamera = new TWEEN.Tween(source.game.camera.position)
      .to(cameraPosition, 200)
      .onComplete(function(){
        settings.data.cameraType = oldCameraType;
      });

    tweenOpacity.start();
    tweenCamera.start();
    
  });
};


Teleport.prototype.updateZoneSelector = function(source, arena) {
  var status = arena._currentZoneSelector.position.distanceTo(source.position) < this.maxRange ? 'enabled' : 'disabled';
  if (arena._currentZoneSelector._dirtyStatus !== status) {
    arena._currentZoneSelector.emit(status);
  }
};

},{"../elements/sound":36,"../settings":54,"../spell":57,"inherits":74,"lodash":85,"tween":89}],66:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var TWEEN = require('tween');

module.exports = {

  /**
   * A basic glowing material, to be used on active objects
   * @type {Object}
   */
  glowmaterial: {
    ambient: new THREE.Color(1, 1, 1),
    vertexShader:   document.getElementById( 'glow_vertexshader'   ).textContent,
    fragmentShader: document.getElementById( 'glow_fragmentshader' ).textContent,
    //side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  },

  /**
   * get a globaly defined callback
   * @param  {Function} wrappedFunction
   * @return {String} the wrapping function name, defined in the global scope
   */
  gcb: function( wrappedFunction ) {

    var now = new Date(),
        tmpname = '__tmp_' + parseInt(Math.random() + now.getTime()) + '__';

    // TODO: remove tmp function when it's done
    // var done = function(){
    //   delete window[tmpname];
    // };

    window[tmpname] = wrappedFunction;

    return tmpname;
  },

  /**
   * Apply a glowing effect on an object
   * @param  {THREE.Mesh} object
   */
  glow: function (object) {
    _.each(this.glowmaterial, function(v, k){
      object.material[ '_' + k] = object.material[k];
      object.material[k] = v;
    });
  },

  /**
   * Remove the glowing effect from an object
   * @param  {THREE.Mesh} object
   */
  unglow: function (object) {
    _.each(this.glowmaterial, function(v, k){
      object.material[k] = object.material[ '_' + k];
    });
  },


  // selectOrAbort: function (funcValidate, funcSelect) {
  //     document.addEventListener('click', function(event){

  //     });
  // }

  meshFromVertices: function (vertices, mat_options) {
      
    var object = new THREE.Object3D();
    var materials = [ new THREE.MeshBasicMaterial(mat_options) ];

    for (var i = 0; i < vertices.length; i++) {
      if (!vertices[i+2]) { break; }

      var child = THREE.SceneUtils.createMultiMaterialObject(
        new THREE.ConvexGeometry([ vertices[i], vertices[i+1], vertices[i+2] ]),
        materials);
      object.add(child);
    }
    return object;
  },

  /**
   * Move an object along a path.
   *  to move entities or characters, use their own moveAlong method
   * @param  {Array|THREE.Shape} the shape, or the points the character will walk along
   * @param  {Object} options, such as
   *              start
   *              onStart
   *              onComplete
   *              onUpdate
   * @return {Tween} the Tween.js object
   */
  moveAlong: function( object, shape, options ) {

    options = _.merge({

      game: null,

      from: 0,
      to: 1,

      duration: null,
      speed: 50,

      start: true,
      yoyo: false,

      onStart: null,
      onComplete: null,
      onUpdate: null,

      smoothness: 100,
      easing: TWEEN.Easing.Linear.None,

    }, options);

    // array of vectors to determine shape
    if (shape instanceof THREE.Shape) {

    } else if (_.isArray(shape)) {
      shape = new THREE.SplineCurve3(shape);

    } else {
      throw '2nd argument is not a Shape, nor an array of vertices';
    }

    var routeMesh;
    if (options.game && options.game.settings.showRoutes) {
      var routeGeometry = new THREE.TubeGeometry(shape, shape.points.length, 1, 1);
      var routeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        opacity: 0.5,
        wireframe: true,
        transparent: true
      });
      routeMesh = new THREE.Mesh(routeGeometry, routeMaterial);
      options.game.scene.add(routeMesh);
    }

    options.duration = options.duration || shape.getLength();
    options.length = options.duration * options.speed;

    var tween = new TWEEN.Tween({ distance: options.from })
      .to({ distance: options.to }, options.length)
      .easing( options.easing )
      .onStart(function(){
        if (options.onStart) { options.onStart(this); }
      })
      .onComplete(function(){
        if (routeMesh && routeMesh.parent) { routeMesh.parent.remove(routeMesh); }
        if (options.onComplete) { options.onComplete(this); }
      })
      .onUpdate(function(){
        // get the position data half way along the path
        var pathPosition = shape.getPointAt(this.distance);

        // move to that position
        object.position.set(pathPosition.x, pathPosition.y, pathPosition.z);

        object.updateMatrix();

        if (options.onUpdate) { options.onUpdate(this, shape); }
      })
      .yoyo(options.yoyo);

    if (options.yoyo) {
      tween.repeat(Infinity);
    }

    if (options.start) { tween.start(); }

    return tween;
  },

  childOf: function ( object, Class ) {

    while (object.parent && ! (object instanceof Class)) {
      object = object.parent;
    }

    return object instanceof Class ? object : null;
  }

};

},{"lodash":85,"tween":89}],67:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var ko = require('knockout');

module.exports = DialogViewModel;

/**
 * @exports threearena/views/dialogview
 */
function DialogViewModel (dialog) {

  var self = this;

  _.each(dialog.data, function(v, k) {
    self[k] = ko.observable(v); // .extend({notify: 'always'});
  });

  ////////////////////////////////     

  this.update = function(values) { /// FIXME !!!!
    _.each(values, function(v, k) {
      if (typeof self[k] !== 'undefined') {
        self[k](v);
      }
    });
  };

  this.click = function (item) {
    console.log('You ' + (item.action === 'sell' ? 'buy' : 'sell') + ' ' + item.name + ' for ' + item.price + ' gold');
  };

  dialog.on('changed', this.update.bind(this));
}
},{"knockout":84,"lodash":85}],68:[function(require,module,exports){
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
},{"../entity":41,"../utils":66,"knockout":84,"lodash":85}],69:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var ko = require('knockout');

module.exports = GameViewModel;

/**
 * @exports threearena/views/gameview
 */
function GameViewModel (game) {

  var self = this;

  this.game = game;

  ////////////////////////////////     
  
  this._currentMap = null;

  ////////////////////////////////     

  self.mapWidth = ko.observable(0);
  self.mapHeight = ko.observable(0);

  self.characters = [
    ko.observable({ x:-1000, z:-1000 }),
  ];

  this.image = ko.observable(null);

  ////////////////////////////////     

  // find the main ground mesh, 
  this.game.on('set:terrain', function() {

    // pass its texture image
    if (game.ground.options.minimap && game.ground.options.minimap.defaultmap) {
      self.image(game.ground.options.minimap.defaultmap);

    } else if (game.ground.options.minimap) {
      self.image(game.ground.options.minimap);

    } else if (game.ground.options.tDiffuse) {
      self.image(game.ground.options.tDiffuse);

    } else if (game.ground.options.map.image.src) {
      self.image(game.ground.options.map.image.src);

    } else {
      // no image :/
      // self.image();
    }

    game.ground.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        var geometry = child.geometry;
        if (!geometry.boundingBox) {
          geometry.computeBoundingBox();
        }

        self.mapWidth(geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        self.mapHeight(geometry.boundingBox.max.z - geometry.boundingBox.min.z);
      }
    });
  });

  this.update = function(game) {

    return;

    _.each(game.entities, function(c,i){
      if (self.characters[i] === undefined) {
        self.characters[i] = ko.observable();
      }

      // position playing characters
      self.characters[i]({
        x: 100 / self.mapWidth() * (game.entities[i].position.x + self.mapWidth() / 2),
        z: 100 / self.mapHeight() * (game.entities[i].position.z + self.mapHeight() / 2)
      });

      // update level map
      if (_.isObject(game.ground.options.minimap)) {
        var found = false;
        _.each(game.ground.options.minimap, function(image, key){
          if (found) { return; }
          var x = game.entities[0].position.x,
              y = game.entities[0].position.y,
              z = game.entities[0].position.z;
          try {
            found = eval(key);
          } catch (e) {

          }
          if (found) {
            self.image(image);
          }
        });
      }
    });
  };

  this.game.on('update', this.update.bind(this));
}

GameViewModel.prototype.onMapClick = function(gameview, event) {
  // ignore if there's no button clicked, useful for ugly mousedrag event
  if (! event.which) { return; }

  var target = $(event.currentTarget);
  var halfX = gameview.mapWidth() / 2,
      halfZ = gameview.mapHeight() / 2,
      mapX = (gameview.mapWidth() / target.width() * event.offsetX) - halfX,
      mapZ = (gameview.mapHeight() / target.height() * event.offsetY) - halfZ + 40;

  this.game.camera.position.set(mapX, 50, mapZ);
};

GameViewModel.prototype.onCharacterHover = function(event) {
};

},{"knockout":84,"lodash":85}],70:[function(require,module,exports){
'use strict';

var _ = require('lodash');
var ko = require('knockout');

module.exports = InteractiveViewModel;

/**
 * @exports threearena/views/interactiveview
 */
function InteractiveViewModel (interactive) {

  var self = this;

  _.each(interactive.menu, function(v, k) {
    self[k] = ko.observable(v); // .extend({notify: 'always'});
  });

  ////////////////////////////////     

  this.update = function(values) { /// FIXME !!!!
    _.each(values, function(v, k) {
      if (typeof self[k] !== 'undefined') {
        self[k](v);
      }
    });
  };

  this.click = function (item) {
    console.log('You ' + (item.action === 'sell' ? 'buy' : 'sell') + ' ' + item.name + ' for ' + item.price + ' gold');
  };

  interactive.on('changed', this.update.bind(this));
}
},{"knockout":84,"lodash":85}],71:[function(require,module,exports){
/*!
 * EventEmitter v4.2.7 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function () {
	'use strict';

	/**
	 * Class for managing events.
	 * Can be extended to provide event functionality in other classes.
	 *
	 * @class EventEmitter Manages event registering and emitting.
	 */
	function EventEmitter() {}

	// Shortcuts to improve speed and size
	var proto = EventEmitter.prototype;
	var exports = this;
	var originalGlobalValue = exports.EventEmitter;

	/**
	 * Finds the index of the listener for the event in it's storage array.
	 *
	 * @param {Function[]} listeners Array of listeners to search through.
	 * @param {Function} listener Method to look for.
	 * @return {Number} Index of the specified listener, -1 if not found
	 * @api private
	 */
	function indexOfListener(listeners, listener) {
		var i = listeners.length;
		while (i--) {
			if (listeners[i].listener === listener) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Alias a method while keeping the context correct, to allow for overwriting of target method.
	 *
	 * @param {String} name The name of the target method.
	 * @return {Function} The aliased method
	 * @api private
	 */
	function alias(name) {
		return function aliasClosure() {
			return this[name].apply(this, arguments);
		};
	}

	/**
	 * Returns the listener array for the specified event.
	 * Will initialise the event object and listener arrays if required.
	 * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
	 * Each property in the object response is an array of listener functions.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Function[]|Object} All listener functions for the event.
	 */
	proto.getListeners = function getListeners(evt) {
		var events = this._getEvents();
		var response;
		var key;

		// Return a concatenated array of all matching events if
		// the selector is a regular expression.
		if (evt instanceof RegExp) {
			response = {};
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					response[key] = events[key];
				}
			}
		}
		else {
			response = events[evt] || (events[evt] = []);
		}

		return response;
	};

	/**
	 * Takes a list of listener objects and flattens it into a list of listener functions.
	 *
	 * @param {Object[]} listeners Raw listener objects.
	 * @return {Function[]} Just the listener functions.
	 */
	proto.flattenListeners = function flattenListeners(listeners) {
		var flatListeners = [];
		var i;

		for (i = 0; i < listeners.length; i += 1) {
			flatListeners.push(listeners[i].listener);
		}

		return flatListeners;
	};

	/**
	 * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Object} All listener functions for an event in an object.
	 */
	proto.getListenersAsObject = function getListenersAsObject(evt) {
		var listeners = this.getListeners(evt);
		var response;

		if (listeners instanceof Array) {
			response = {};
			response[evt] = listeners;
		}

		return response || listeners;
	};

	/**
	 * Adds a listener function to the specified event.
	 * The listener will not be added if it is a duplicate.
	 * If the listener returns true then it will be removed after it is called.
	 * If you pass a regular expression as the event name then the listener will be added to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListener = function addListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var listenerIsWrapped = typeof listener === 'object';
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
				listeners[key].push(listenerIsWrapped ? listener : {
					listener: listener,
					once: false
				});
			}
		}

		return this;
	};

	/**
	 * Alias of addListener
	 */
	proto.on = alias('addListener');

	/**
	 * Semi-alias of addListener. It will add a listener that will be
	 * automatically removed after it's first execution.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addOnceListener = function addOnceListener(evt, listener) {
		return this.addListener(evt, {
			listener: listener,
			once: true
		});
	};

	/**
	 * Alias of addOnceListener.
	 */
	proto.once = alias('addOnceListener');

	/**
	 * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
	 * You need to tell it what event names should be matched by a regex.
	 *
	 * @param {String} evt Name of the event to create.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvent = function defineEvent(evt) {
		this.getListeners(evt);
		return this;
	};

	/**
	 * Uses defineEvent to define multiple events.
	 *
	 * @param {String[]} evts An array of event names to define.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvents = function defineEvents(evts) {
		for (var i = 0; i < evts.length; i += 1) {
			this.defineEvent(evts[i]);
		}
		return this;
	};

	/**
	 * Removes a listener function from the specified event.
	 * When passed a regular expression as the event name, it will remove the listener from all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to remove the listener from.
	 * @param {Function} listener Method to remove from the event.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListener = function removeListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var index;
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				index = indexOfListener(listeners[key], listener);

				if (index !== -1) {
					listeners[key].splice(index, 1);
				}
			}
		}

		return this;
	};

	/**
	 * Alias of removeListener
	 */
	proto.off = alias('removeListener');

	/**
	 * Adds listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
	 * You can also pass it a regular expression to add the array of listeners to all events that match it.
	 * Yeah, this function does quite a bit. That's probably a bad thing.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListeners = function addListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(false, evt, listeners);
	};

	/**
	 * Removes listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be removed.
	 * You can also pass it a regular expression to remove the listeners from all events that match it.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListeners = function removeListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(true, evt, listeners);
	};

	/**
	 * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
	 * The first argument will determine if the listeners are removed (true) or added (false).
	 * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be added/removed.
	 * You can also pass it a regular expression to manipulate the listeners of all events that match it.
	 *
	 * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
		var i;
		var value;
		var single = remove ? this.removeListener : this.addListener;
		var multiple = remove ? this.removeListeners : this.addListeners;

		// If evt is an object then pass each of it's properties to this method
		if (typeof evt === 'object' && !(evt instanceof RegExp)) {
			for (i in evt) {
				if (evt.hasOwnProperty(i) && (value = evt[i])) {
					// Pass the single listener straight through to the singular method
					if (typeof value === 'function') {
						single.call(this, i, value);
					}
					else {
						// Otherwise pass back to the multiple function
						multiple.call(this, i, value);
					}
				}
			}
		}
		else {
			// So evt must be a string
			// And listeners must be an array of listeners
			// Loop over it and pass each one to the multiple method
			i = listeners.length;
			while (i--) {
				single.call(this, evt, listeners[i]);
			}
		}

		return this;
	};

	/**
	 * Removes all listeners from a specified event.
	 * If you do not specify an event then all listeners will be removed.
	 * That means every event will be emptied.
	 * You can also pass a regex to remove all events that match it.
	 *
	 * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeEvent = function removeEvent(evt) {
		var type = typeof evt;
		var events = this._getEvents();
		var key;

		// Remove different things depending on the state of evt
		if (type === 'string') {
			// Remove all listeners for the specified event
			delete events[evt];
		}
		else if (evt instanceof RegExp) {
			// Remove all events matching the regex.
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					delete events[key];
				}
			}
		}
		else {
			// Remove all listeners in all events
			delete this._events;
		}

		return this;
	};

	/**
	 * Alias of removeEvent.
	 *
	 * Added to mirror the node API.
	 */
	proto.removeAllListeners = alias('removeEvent');

	/**
	 * Emits an event of your choice.
	 * When emitted, every listener attached to that event will be executed.
	 * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
	 * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
	 * So they will not arrive within the array on the other side, they will be separate.
	 * You can also pass a regular expression to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {Array} [args] Optional array of arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emitEvent = function emitEvent(evt, args) {
		var listeners = this.getListenersAsObject(evt);
		var listener;
		var i;
		var key;
		var response;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				i = listeners[key].length;

				while (i--) {
					// If the listener returns true then it shall be removed from the event
					// The function is executed either with a basic call or an apply if there is an args array
					listener = listeners[key][i];

					if (listener.once === true) {
						this.removeListener(evt, listener.listener);
					}

					response = listener.listener.apply(this, args || []);

					if (response === this._getOnceReturnValue()) {
						this.removeListener(evt, listener.listener);
					}
				}
			}
		}

		return this;
	};

	/**
	 * Alias of emitEvent
	 */
	proto.trigger = alias('emitEvent');

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emit = function emit(evt) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.emitEvent(evt, args);
	};

	/**
	 * Sets the current value to check against when executing listeners. If a
	 * listeners return value matches the one set here then it will be removed
	 * after execution. This value defaults to true.
	 *
	 * @param {*} value The new value to check for when executing listeners.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.setOnceReturnValue = function setOnceReturnValue(value) {
		this._onceReturnValue = value;
		return this;
	};

	/**
	 * Fetches the current value to check against when executing listeners. If
	 * the listeners return value matches this one then it should be removed
	 * automatically. It will return true by default.
	 *
	 * @return {*|Boolean} The current value to check for or the default, true.
	 * @api private
	 */
	proto._getOnceReturnValue = function _getOnceReturnValue() {
		if (this.hasOwnProperty('_onceReturnValue')) {
			return this._onceReturnValue;
		}
		else {
			return true;
		}
	};

	/**
	 * Fetches the events object and creates one if required.
	 *
	 * @return {Object} The events storage object.
	 * @api private
	 */
	proto._getEvents = function _getEvents() {
		return this._events || (this._events = {});
	};

	/**
	 * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
	 *
	 * @return {Function} Non conflicting EventEmitter class.
	 */
	EventEmitter.noConflict = function noConflict() {
		exports.EventEmitter = originalGlobalValue;
		return EventEmitter;
	};

	// Expose the class either via AMD, CommonJS or the global object
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return EventEmitter;
		});
	}
	else if (typeof module === 'object' && module.exports){
		module.exports = EventEmitter;
	}
	else {
		this.EventEmitter = EventEmitter;
	}
}.call(this));

},{}],72:[function(require,module,exports){
var process=require("__browserify_process");/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

},{"__browserify_process":94}],73:[function(require,module,exports){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

},{}],74:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],75:[function(require,module,exports){
var lock = require('pointer-lock')
  , drag = require('drag-stream')
  , full = require('fullscreen')

var EE = require('events').EventEmitter
  , Stream = require('stream').Stream

module.exports = interact

function interact(el, skiplock) {
  var ee = new EE
    , internal

  if(!lock.available() || skiplock) {
    internal = usedrag(el)
  } else {
    internal = uselock(el, politelydeclined)
  }

  ee.release = function() { internal.release && internal.release() }
  ee.request = function() { internal.request && internal.request() }
  ee.destroy = function() { internal.destroy && internal.destroy() }
  ee.pointerAvailable = function() { return lock.available() }
  ee.fullscreenAvailable = function() { return full.available() }

  forward()

  return ee

  function politelydeclined() {
    ee.emit('opt-out')
    internal.destroy()
    internal = usedrag(el)
    forward()
  }

  function forward() {
    internal.on('attain', function(stream) {
      ee.emit('attain', stream)
    })

    internal.on('release', function() {
      ee.emit('release')
    })
  }
}

function uselock(el, declined) {
  var pointer = lock(el)
    , fs = full(el)

  pointer.on('needs-fullscreen', function() {
    fs.once('attain', function() {
      pointer.request()
    })
    fs.request()
  })

  pointer.on('error', declined)

  return pointer
}

function usedrag(el) {
  var ee = new EE
    , d = drag(el)
    , stream

  d.paused = true

  d.on('resume', function() {
    stream = new Stream
    stream.readable = true
    stream.initial = null
  })

  d.on('data', function(datum) {
    if(!stream) {
      stream = new Stream
      stream.readable = true
      stream.initial = null
    }

    if(!stream.initial) {
      stream.initial = {
        x: datum.dx
      , y: datum.dy
      , t: datum.dt
      }
      return ee.emit('attain', stream)
    }

    if(stream.paused) {
      ee.emit('release')
      stream.emit('end')
      stream.readable = false
      stream.emit('close')
      stream = null
    }

    stream.emit('data', datum)
  })

  return ee
}

},{"drag-stream":76,"events":92,"fullscreen":82,"pointer-lock":83,"stream":99}],76:[function(require,module,exports){
module.exports = dragstream

var Stream = require('stream')
  , read = require('domnode-dom').createReadStream
  , through = require('through')

function dragstream(el) {
  var body = el.ownerDocument.body
    , down = read(el, 'mousedown')
    , up = read(body, 'mouseup', false)
    , move = read(body, 'mousemove', false)
    , anchor = {x: 0, y: 0, t: 0}
    , drag = through(on_move)

  // default to "paused"
  drag.pause()

  down.on('data', on_down)
  up.on('data', on_up)

  return move.pipe(drag)

  // listeners:

  function on_move(ev) {
    if(drag.paused) return

    drag.emit('data', datum(
        ev.screenX - anchor.x
      , ev.screenY - anchor.y
      , +new Date
    ))

    anchor.x = ev.screenX
    anchor.y = ev.screenY
  }

  function on_down(ev) {
    anchor.x = ev.screenX
    anchor.y = ev.screenY
    anchor.t = +new Date
    drag.resume()
    drag.emit('data', datum(
        anchor.x
      , anchor.y
      , anchor.t
    ))
  }

  function on_up(ev) {
    drag.pause()
    drag.emit('data', datum(
        ev.screenX - anchor.x
      , ev.screenY - anchor.y
      , +new Date
    ))
  }

  function datum(dx, dy, when) {
    return {
      dx: dx
    , dy: dy
    , dt: when - anchor.t
    }
  }
}

},{"domnode-dom":77,"stream":99,"through":81}],77:[function(require,module,exports){
module.exports = require('./lib/index')

},{"./lib/index":78}],78:[function(require,module,exports){
var WriteStream = require('./writable')
  , ReadStream = require('./readable')
  , DOMStream = {}

DOMStream.WriteStream = WriteStream
DOMStream.ReadStream = ReadStream

DOMStream.createAppendStream = function(el, mimetype) {
  return new DOMStream.WriteStream(
      el
    , DOMStream.WriteStream.APPEND
    , mimetype
  )
}

DOMStream.createWriteStream = function(el, mimetype) {
  return new DOMStream.WriteStream(
      el
    , DOMStream.WriteStream.WRITE
    , mimetype
  )
}

DOMStream.createReadStream =
DOMStream.createEventStream = function(el, type, preventDefault) {
  preventDefault = preventDefault === undefined ? true : preventDefault

  return new DOMStream.ReadStream(
      el
    , type
    , preventDefault
  )
}

module.exports = DOMStream


},{"./readable":79,"./writable":80}],79:[function(require,module,exports){
module.exports = DOMStream

var Stream = require('stream').Stream

var listener = function(el, type, onmsg) {
  return el.addEventListener(type, onmsg, false)
}

if(typeof $ !== 'undefined')
  listener = function(el, type, onmsg) {
    return el = $(el)[type](onmsg)
  }

if(typeof document !== 'undefined' && !document.createElement('div').addEventListener)
  listener = function(el, type, onmsg) {
    return el.attachEvent('on'+type, onmsg)
  }

function DOMStream(el, eventType, shouldPreventDefault) {
  this.el = el
  this.eventType = eventType
  this.shouldPreventDefault = shouldPreventDefault

  var self = this

  if(el && this.eventType)
    listener(
        this.el
      , this.eventType
      , function() { return self.listen.apply(self, arguments) }
    )

  Stream.call(this)
}

var cons = DOMStream
  , proto = cons.prototype = Object.create(Stream.prototype)

proto.constructor = cons

proto.listen = function(ev) {
  if(this.shouldPreventDefault)
    ev.preventDefault ? ev.preventDefault() : (ev.returnValue = false)

  var collectData =
    this.eventType === 'submit' ||
    this.eventType === 'change' ||
    this.eventType === 'keydown' ||
    this.eventType === 'keyup' ||
    this.eventType === 'input'

  if(collectData) {
    if(this.el.tagName.toUpperCase() === 'FORM')
      return this.handleFormSubmit(ev)

    return this.emit('data', valueFromElement(this.el))
  }

  this.emit('data', ev)
}

proto.handleFormSubmit = function(ev) {
  var elements = []

  if(this.el.querySelectorAll) {
    elements = this.el.querySelectorAll('input,textarea,select')
  } else {
    var inputs = {'INPUT':true, 'TEXTAREA':true, 'SELECT':true}

    var recurse = function(el) {
      for(var i = 0, len = el.childNodes.length; i < len; ++i) {
        if(el.childNodes[i].tagName) {
          if(inputs[el.childNodes[i].tagName.toUpperCase()]) {
            elements.push(el)
          } else {
            recurse(el.childNodes[i])
          }
        }
      }
    }

    recurse(this.el)
  }

  var output = {}
    , attr
    , val

  for(var i = 0, len = elements.length; i < len; ++i) {
    attr = elements[i].getAttribute('name')
    val = valueFromElement(elements[i])

    if(val !== null) {
      output[attr] = val
    }
  }

  return this.emit('data', output)
}

function valueFromElement(el) {
  switch(el.getAttribute('type')) {
    case 'radio':
      return el.checked ? el.value : null
    case 'checkbox':
      return 'data', el.checked
  }
  return el.value
}

},{"stream":99}],80:[function(require,module,exports){
module.exports = DOMStream

var Stream = require('stream').Stream

function DOMStream(el, mode, mimetype) {
  this.el = el
  this.mode = mode
  this.mimetype = mimetype || 'text/html'

  Stream.call(this)
}

var cons = DOMStream
  , proto = cons.prototype = Object.create(Stream.prototype)

proto.constructor = cons

cons.APPEND = 0
cons.WRITE = 1

proto.writable = true

proto.setMimetype = function(mime) {
  this.mimetype = mime
}

proto.write = function(data) {
  var result = (this.mode === cons.APPEND) ? this.append(data) : this.insert(data)
  this.emit('data', this.el.childNodes)
  return result
}

proto.end = function() {

}

proto.insert = function(data) {
  this.el.innerHTML = ''
  return this.append(data)
}

proto.append = function(data) {
  var result = this[this.resolveMimetypeHandler()](data)

  for(var i = 0, len = result.length; i < len; ++i) {
    this.el.appendChild(result[i])
  }

  return true
}

proto.resolveMimetypeHandler = function() {
  var type = this.mimetype.replace(/(\/\w)/, function(x) {
    return x.slice(1).toUpperCase()
  })
  type = type.charAt(0).toUpperCase() + type.slice(1)

  return 'construct'+type
}

proto.constructTextHtml = function(data) {
  var isTableFragment = /(tr|td|th)/.test(data) && !/table/.test(data)
    , div

  if(isTableFragment) {
    // wuh-oh.
    div = document.createElement('table')
  }

  div = div || document.createElement('div')
  div.innerHTML = data 

  return [].slice.call(div.childNodes)
}

proto.constructTextPlain = function(data) {
  var textNode = document.createTextNode(data)

  return [textNode]
}

},{"stream":99}],81:[function(require,module,exports){
var process=require("__browserify_process");var Stream = require('stream')

// through
//
// a stream that does nothing but re-emit the input.
// useful for aggregating a series of changing but not ending streams into one stream)



exports = module.exports = through
through.through = through

//create a readable writable stream.

function through (write, end) {
  write = write || function (data) { this.queue(data) }
  end = end || function () { this.queue(null) }

  var ended = false, destroyed = false, buffer = []
  var stream = new Stream()
  stream.readable = stream.writable = true
  stream.paused = false

  stream.write = function (data) {
    write.call(this, data)
    return !stream.paused
  }

  function drain() {
    while(buffer.length && !stream.paused) {
      var data = buffer.shift()
      if(null === data)
        return stream.emit('end')
      else
        stream.emit('data', data)
    }
  }

  stream.queue = stream.push = function (data) {
    buffer.push(data)
    drain()
    return stream
  }

  //this will be registered as the first 'end' listener
  //must call destroy next tick, to make sure we're after any
  //stream piped from here.
  //this is only a problem if end is not emitted synchronously.
  //a nicer way to do this is to make sure this is the last listener for 'end'

  stream.on('end', function () {
    stream.readable = false
    if(!stream.writable)
      process.nextTick(function () {
        stream.destroy()
      })
  })

  function _end () {
    stream.writable = false
    end.call(stream)
    if(!stream.readable)
      stream.destroy()
  }

  stream.end = function (data) {
    if(ended) return
    ended = true
    if(arguments.length) stream.write(data)
    _end() // will emit or queue
    return stream
  }

  stream.destroy = function () {
    if(destroyed) return
    destroyed = true
    ended = true
    buffer.length = 0
    stream.writable = stream.readable = false
    stream.emit('close')
    return stream
  }

  stream.pause = function () {
    if(stream.paused) return
    stream.paused = true
    stream.emit('pause')
    return stream
  }
  stream.resume = function () {
    if(stream.paused) {
      stream.paused = false
    }
    drain()
    //may have become paused again,
    //as drain emits 'data'.
    if(!stream.paused)
      stream.emit('drain')
    return stream
  }
  return stream
}


},{"__browserify_process":94,"stream":99}],82:[function(require,module,exports){
module.exports = fullscreen
fullscreen.available = available

var EE = require('events').EventEmitter

function available() {
  return !!shim(document.body)
}

function fullscreen(el) {
  var ael = el.addEventListener || el.attachEvent
    , doc = el.ownerDocument
    , body = doc.body
    , rfs = shim(el)
    , ee = new EE

  var vendors = ['', 'webkit', 'moz', 'ms', 'o']

  for(var i = 0, len = vendors.length; i < len; ++i) {
    ael.call(doc, vendors[i]+'fullscreenchange', onfullscreenchange)
    ael.call(doc, vendors[i]+'fullscreenerror', onfullscreenerror)
  }

  ee.release = release
  ee.request = request
  ee.target = fullscreenelement

  if(!shim) {
    setTimeout(function() {
      ee.emit('error', new Error('fullscreen is not supported'))
    }, 0)
  }
  return ee

  function onfullscreenchange() {
    if(!fullscreenelement()) {
      return ee.emit('release')
    }
    ee.emit('attain')
  }

  function onfullscreenerror() {
    ee.emit('error')
  }

  function request() {
    return rfs.call(el)
  }

  function release() {
    (el.exitFullscreen ||
    el.exitFullscreen ||
    el.webkitExitFullScreen ||
    el.webkitExitFullscreen ||
    el.mozExitFullScreen ||
    el.mozExitFullscreen ||
    el.msExitFullScreen ||
    el.msExitFullscreen ||
    el.oExitFullScreen ||
    el.oExitFullscreen).call(el)
  } 

  function fullscreenelement() {
    return 0 ||
      doc.fullScreenElement ||
      doc.fullscreenElement ||
      doc.webkitFullScreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.mozFullscreenElement ||
      doc.msFullScreenElement ||
      doc.msFullscreenElement ||
      doc.oFullScreenElement ||
      doc.oFullscreenElement ||
      null
  }
}

function shim(el) {
  return (el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.webkitRequestFullScreen ||
    el.mozRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen ||
    el.msRequestFullScreen ||
    el.oRequestFullscreen ||
    el.oRequestFullScreen)
}

},{"events":92}],83:[function(require,module,exports){
module.exports = pointer

pointer.available = available

var EE = require('events').EventEmitter
  , Stream = require('stream').Stream

function available() {
  return !!shim(document.body)
}

function pointer(el) {
  var ael = el.addEventListener || el.attachEvent
    , rel = el.removeEventListener || el.detachEvent
    , doc = el.ownerDocument
    , body = doc.body
    , rpl = shim(el) 
    , out = {dx: 0, dy: 0, dt: 0}
    , ee = new EE
    , stream = null
    , lastPageX, lastPageY
    , needsFullscreen = false
    , mouseDownMS

  ael.call(el, 'mousedown', onmousedown, false)
  ael.call(el, 'mouseup', onmouseup, false)
  ael.call(body, 'mousemove', onmove, false)

  var vendors = ['', 'webkit', 'moz', 'ms', 'o']

  for(var i = 0, len = vendors.length; i < len; ++i) {
    ael.call(doc, vendors[i]+'pointerlockchange', onpointerlockchange)
    ael.call(doc, vendors[i]+'pointerlockerror', onpointerlockerror)
  }

  ee.release = release
  ee.target = pointerlockelement
  ee.request = onmousedown
  ee.destroy = function() {
    rel.call(el, 'mouseup', onmouseup, false)
    rel.call(el, 'mousedown', onmousedown, false)
    rel.call(el, 'mousemove', onmove, false)
  }

  if(!shim) {
    setTimeout(function() {
      ee.emit('error', new Error('pointer lock is not supported'))
    }, 0)
  }
  return ee

  function onmousedown(ev) {
    if(pointerlockelement()) {
      return
    }
    mouseDownMS = +new Date
    rpl.call(el)
  }

  function onmouseup(ev) {
    if(!needsFullscreen) {
      return
    }

    ee.emit('needs-fullscreen')
    needsFullscreen = false
  }

  function onpointerlockchange(ev) {
    if(!pointerlockelement()) {
      if(stream) release()
      return
    }

    stream = new Stream
    stream.readable = true
    stream.initial = {x: lastPageX, y: lastPageY, t: Date.now()}

    ee.emit('attain', stream)
  }

  function onpointerlockerror(ev) {
    var dt = +(new Date) - mouseDownMS
    if(dt < 100) {
      // we errored immediately, we need to do fullscreen first.
      needsFullscreen = true
      return
    }

    if(stream) {
      stream.emit('error', ev)
      stream = null
    }
  }

  function release() {
    ee.emit('release')

    if(stream) {
      stream.emit('end')
      stream.readable = false
      stream.emit('close')
      stream = null
    }

    var pel = pointerlockelement()
    if(!pel) {
      return
    }

    (doc.exitPointerLock ||
    doc.mozExitPointerLock ||
    doc.webkitExitPointerLock ||
    doc.msExitPointerLock ||
    doc.oExitPointerLock).call(doc)
  }

  function onmove(ev) {
    lastPageX = ev.pageX
    lastPageY = ev.pageY

    if(!stream) return

    // we're reusing a single object
    // because I'd like to avoid piling up
    // a ton of objects for the garbage
    // collector.
    out.dx =
      ev.movementX || ev.webkitMovementX ||
      ev.mozMovementX || ev.msMovementX ||
      ev.oMovementX || 0

    out.dy = 
      ev.movementY || ev.webkitMovementY ||
      ev.mozMovementY || ev.msMovementY ||
      ev.oMovementY || 0

    out.dt = Date.now() - stream.initial.t

    ee.emit('data', out)
    stream.emit('data', out)
  }

  function pointerlockelement() {
    return 0 ||
      doc.pointerLockElement ||
      doc.mozPointerLockElement ||
      doc.webkitPointerLockElement ||
      doc.msPointerLockElement ||
      doc.oPointerLockElement ||
      null
  }
}

function shim(el) {
  return el.requestPointerLock ||
    el.webkitRequestPointerLock ||
    el.mozRequestPointerLock ||
    el.msRequestPointerLock ||
    el.oRequestPointerLock ||
    null
}

},{"events":92,"stream":99}],84:[function(require,module,exports){
// Knockout JavaScript library v3.0.0
// (c) Steven Sanderson - http://knockoutjs.com/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function(){
var DEBUG=true;
(function(undefined){
    // (0, eval)('this') is a robust way of getting a reference to the global object
    // For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
    var window = this || (0, eval)('this'),
        document = window['document'],
        navigator = window['navigator'],
        jQuery = window["jQuery"],
        JSON = window["JSON"];
(function(factory) {
    // Support three module loading scenarios
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [1] CommonJS/Node.js
        var target = module['exports'] || exports; // module.exports is for Node.js
        factory(target);
    } else if (typeof define === 'function' && define['amd']) {
        // [2] AMD anonymous module
        define(['exports'], factory);
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko'] = {});
    }
}(function(koExports){
// Internally, all KO objects are attached to koExports (even the non-exported ones whose names will be minified by the closure compiler).
// In the future, the following "ko" variable may be made distinct from "koExports" so that private objects are not externally reachable.
var ko = typeof koExports !== 'undefined' ? koExports : {};
// Google Closure Compiler helpers (used only to make the minified file smaller)
ko.exportSymbol = function(koPath, object) {
	var tokens = koPath.split(".");

	// In the future, "ko" may become distinct from "koExports" (so that non-exported objects are not reachable)
	// At that point, "target" would be set to: (typeof koExports !== "undefined" ? koExports : ko)
	var target = ko;

	for (var i = 0; i < tokens.length - 1; i++)
		target = target[tokens[i]];
	target[tokens[tokens.length - 1]] = object;
};
ko.exportProperty = function(owner, publicName, object) {
  owner[publicName] = object;
};
ko.version = "3.0.0";

ko.exportSymbol('version', ko.version);
ko.utils = (function () {
    var objectForEach = function(obj, action) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                action(prop, obj[prop]);
            }
        }
    };

    // Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
    var knownEvents = {}, knownEventTypesByEventName = {};
    var keyEventTypeName = (navigator && /Firefox\/2/i.test(navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';
    knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
    knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
    objectForEach(knownEvents, function(eventType, knownEventsForType) {
        if (knownEventsForType.length) {
            for (var i = 0, j = knownEventsForType.length; i < j; i++)
                knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    });
    var eventsThatMustBeRegisteredUsingAttachEvent = { 'propertychange': true }; // Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406

    // Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
    // Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
    // Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
    // If there is a future need to detect specific versions of IE10+, we will amend this.
    var ieVersion = document && (function() {
        var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
            div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
            iElems[0]
        ) {}
        return version > 4 ? version : undefined;
    }());
    var isIe6 = ieVersion === 6,
        isIe7 = ieVersion === 7;

    function isClickOnCheckableElement(element, eventType) {
        if ((ko.utils.tagNameLower(element) !== "input") || !element.type) return false;
        if (eventType.toLowerCase() != "click") return false;
        var inputType = element.type;
        return (inputType == "checkbox") || (inputType == "radio");
    }

    return {
        fieldsIncludedWithJsonPost: ['authenticity_token', /^__RequestVerificationToken(_.*)?$/],

        arrayForEach: function (array, action) {
            for (var i = 0, j = array.length; i < j; i++)
                action(array[i]);
        },

        arrayIndexOf: function (array, item) {
            if (typeof Array.prototype.indexOf == "function")
                return Array.prototype.indexOf.call(array, item);
            for (var i = 0, j = array.length; i < j; i++)
                if (array[i] === item)
                    return i;
            return -1;
        },

        arrayFirst: function (array, predicate, predicateOwner) {
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate.call(predicateOwner, array[i]))
                    return array[i];
            return null;
        },

        arrayRemoveItem: function (array, itemToRemove) {
            var index = ko.utils.arrayIndexOf(array, itemToRemove);
            if (index >= 0)
                array.splice(index, 1);
        },

        arrayGetDistinctValues: function (array) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(result, array[i]) < 0)
                    result.push(array[i]);
            }
            return result;
        },

        arrayMap: function (array, mapping) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                result.push(mapping(array[i]));
            return result;
        },

        arrayFilter: function (array, predicate) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate(array[i]))
                    result.push(array[i]);
            return result;
        },

        arrayPushAll: function (array, valuesToPush) {
            if (valuesToPush instanceof Array)
                array.push.apply(array, valuesToPush);
            else
                for (var i = 0, j = valuesToPush.length; i < j; i++)
                    array.push(valuesToPush[i]);
            return array;
        },

        addOrRemoveItem: function(array, value, included) {
            var existingEntryIndex = ko.utils.arrayIndexOf(ko.utils.peekObservable(array), value);
            if (existingEntryIndex < 0) {
                if (included)
                    array.push(value);
            } else {
                if (!included)
                    array.splice(existingEntryIndex, 1);
            }
        },

        extend: function (target, source) {
            if (source) {
                for(var prop in source) {
                    if(source.hasOwnProperty(prop)) {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        },

        objectForEach: objectForEach,

        objectMap: function(source, mapping) {
            if (!source)
                return source;
            var target = {};
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    target[prop] = mapping(source[prop], prop, source);
                }
            }
            return target;
        },

        emptyDomNode: function (domNode) {
            while (domNode.firstChild) {
                ko.removeNode(domNode.firstChild);
            }
        },

        moveCleanedNodesToContainerElement: function(nodes) {
            // Ensure it's a real array, as we're about to reparent the nodes and
            // we don't want the underlying collection to change while we're doing that.
            var nodesArray = ko.utils.makeArray(nodes);

            var container = document.createElement('div');
            for (var i = 0, j = nodesArray.length; i < j; i++) {
                container.appendChild(ko.cleanNode(nodesArray[i]));
            }
            return container;
        },

        cloneNodes: function (nodesArray, shouldCleanNodes) {
            for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
                var clonedNode = nodesArray[i].cloneNode(true);
                newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
            }
            return newNodesArray;
        },

        setDomNodeChildren: function (domNode, childNodes) {
            ko.utils.emptyDomNode(domNode);
            if (childNodes) {
                for (var i = 0, j = childNodes.length; i < j; i++)
                    domNode.appendChild(childNodes[i]);
            }
        },

        replaceDomNodes: function (nodeToReplaceOrNodeArray, newNodesArray) {
            var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
            if (nodesToReplaceArray.length > 0) {
                var insertionPoint = nodesToReplaceArray[0];
                var parent = insertionPoint.parentNode;
                for (var i = 0, j = newNodesArray.length; i < j; i++)
                    parent.insertBefore(newNodesArray[i], insertionPoint);
                for (var i = 0, j = nodesToReplaceArray.length; i < j; i++) {
                    ko.removeNode(nodesToReplaceArray[i]);
                }
            }
        },

        fixUpContinuousNodeArray: function(continuousNodeArray, parentNode) {
            // Before acting on a set of nodes that were previously outputted by a template function, we have to reconcile
            // them against what is in the DOM right now. It may be that some of the nodes have already been removed, or that
            // new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
            // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
            // So, this function translates the old "map" output array into its best guess of the set of current DOM nodes.
            //
            // Rules:
            //   [A] Any leading nodes that have been removed should be ignored
            //       These most likely correspond to memoization nodes that were already removed during binding
            //       See https://github.com/SteveSanderson/knockout/pull/440
            //   [B] We want to output a continuous series of nodes. So, ignore any nodes that have already been removed,
            //       and include any nodes that have been inserted among the previous collection

            if (continuousNodeArray.length) {
                // The parent node can be a virtual element; so get the real parent node
                parentNode = (parentNode.nodeType === 8 && parentNode.parentNode) || parentNode;

                // Rule [A]
                while (continuousNodeArray.length && continuousNodeArray[0].parentNode !== parentNode)
                    continuousNodeArray.splice(0, 1);

                // Rule [B]
                if (continuousNodeArray.length > 1) {
                    var current = continuousNodeArray[0], last = continuousNodeArray[continuousNodeArray.length - 1];
                    // Replace with the actual new continuous node set
                    continuousNodeArray.length = 0;
                    while (current !== last) {
                        continuousNodeArray.push(current);
                        current = current.nextSibling;
                        if (!current) // Won't happen, except if the developer has manually removed some DOM elements (then we're in an undefined scenario)
                            return;
                    }
                    continuousNodeArray.push(last);
                }
            }
            return continuousNodeArray;
        },

        setOptionNodeSelectionState: function (optionNode, isSelected) {
            // IE6 sometimes throws "unknown error" if you try to write to .selected directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
            if (ieVersion < 7)
                optionNode.setAttribute("selected", isSelected);
            else
                optionNode.selected = isSelected;
        },

        stringTrim: function (string) {
            return string === null || string === undefined ? '' :
                string.trim ?
                    string.trim() :
                    string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
        },

        stringTokenize: function (string, delimiter) {
            var result = [];
            var tokens = (string || "").split(delimiter);
            for (var i = 0, j = tokens.length; i < j; i++) {
                var trimmed = ko.utils.stringTrim(tokens[i]);
                if (trimmed !== "")
                    result.push(trimmed);
            }
            return result;
        },

        stringStartsWith: function (string, startsWith) {
            string = string || "";
            if (startsWith.length > string.length)
                return false;
            return string.substring(0, startsWith.length) === startsWith;
        },

        domNodeIsContainedBy: function (node, containedByNode) {
            if (node === containedByNode)
                return true;
            if (node.nodeType === 11)
                return false; // Fixes issue #1162 - can't use node.contains for document fragments on IE8
            if (containedByNode.contains)
                return containedByNode.contains(node.nodeType === 3 ? node.parentNode : node);
            if (containedByNode.compareDocumentPosition)
                return (containedByNode.compareDocumentPosition(node) & 16) == 16;
            while (node && node != containedByNode) {
                node = node.parentNode;
            }
            return !!node;
        },

        domNodeIsAttachedToDocument: function (node) {
            return ko.utils.domNodeIsContainedBy(node, node.ownerDocument.documentElement);
        },

        anyDomNodeIsAttachedToDocument: function(nodes) {
            return !!ko.utils.arrayFirst(nodes, ko.utils.domNodeIsAttachedToDocument);
        },

        tagNameLower: function(element) {
            // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
            // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
            // we don't need to do the .toLowerCase() as it will always be lower case anyway.
            return element && element.tagName && element.tagName.toLowerCase();
        },

        registerEventHandler: function (element, eventType, handler) {
            var mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
            if (!mustUseAttachEvent && typeof jQuery != "undefined") {
                if (isClickOnCheckableElement(element, eventType)) {
                    // For click events on checkboxes, jQuery interferes with the event handling in an awkward way:
                    // it toggles the element checked state *after* the click event handlers run, whereas native
                    // click events toggle the checked state *before* the event handler.
                    // Fix this by intecepting the handler and applying the correct checkedness before it runs.
                    var originalHandler = handler;
                    handler = function(event, eventData) {
                        var jQuerySuppliedCheckedState = this.checked;
                        if (eventData)
                            this.checked = eventData.checkedStateBeforeEvent !== true;
                        originalHandler.call(this, event);
                        this.checked = jQuerySuppliedCheckedState; // Restore the state jQuery applied
                    };
                }
                jQuery(element)['bind'](eventType, handler);
            } else if (!mustUseAttachEvent && typeof element.addEventListener == "function")
                element.addEventListener(eventType, handler, false);
            else if (typeof element.attachEvent != "undefined") {
                var attachEventHandler = function (event) { handler.call(element, event); },
                    attachEventName = "on" + eventType;
                element.attachEvent(attachEventName, attachEventHandler);

                // IE does not dispose attachEvent handlers automatically (unlike with addEventListener)
                // so to avoid leaks, we have to remove them manually. See bug #856
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    element.detachEvent(attachEventName, attachEventHandler);
                });
            } else
                throw new Error("Browser doesn't support addEventListener or attachEvent");
        },

        triggerEvent: function (element, eventType) {
            if (!(element && element.nodeType))
                throw new Error("element must be a DOM node when calling triggerEvent");

            if (typeof jQuery != "undefined") {
                var eventData = [];
                if (isClickOnCheckableElement(element, eventType)) {
                    // Work around the jQuery "click events on checkboxes" issue described above by storing the original checked state before triggering the handler
                    eventData.push({ checkedStateBeforeEvent: element.checked });
                }
                jQuery(element)['trigger'](eventType, eventData);
            } else if (typeof document.createEvent == "function") {
                if (typeof element.dispatchEvent == "function") {
                    var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                    var event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                    element.dispatchEvent(event);
                }
                else
                    throw new Error("The supplied element doesn't support dispatchEvent");
            } else if (typeof element.fireEvent != "undefined") {
                // Unlike other browsers, IE doesn't change the checked state of checkboxes/radiobuttons when you trigger their "click" event
                // so to make it consistent, we'll do it manually here
                if (isClickOnCheckableElement(element, eventType))
                    element.checked = element.checked !== true;
                element.fireEvent("on" + eventType);
            }
            else
                throw new Error("Browser doesn't support triggering events");
        },

        unwrapObservable: function (value) {
            return ko.isObservable(value) ? value() : value;
        },

        peekObservable: function (value) {
            return ko.isObservable(value) ? value.peek() : value;
        },

        toggleDomNodeCssClass: function (node, classNames, shouldHaveClass) {
            if (classNames) {
                var cssClassNameRegex = /\S+/g,
                    currentClassNames = node.className.match(cssClassNameRegex) || [];
                ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
                    ko.utils.addOrRemoveItem(currentClassNames, className, shouldHaveClass);
                });
                node.className = currentClassNames.join(" ");
            }
        },

        setTextContent: function(element, textContent) {
            var value = ko.utils.unwrapObservable(textContent);
            if ((value === null) || (value === undefined))
                value = "";

            // We need there to be exactly one child: a text node.
            // If there are no children, more than one, or if it's not a text node,
            // we'll clear everything and create a single text node.
            var innerTextNode = ko.virtualElements.firstChild(element);
            if (!innerTextNode || innerTextNode.nodeType != 3 || ko.virtualElements.nextSibling(innerTextNode)) {
                ko.virtualElements.setDomNodeChildren(element, [document.createTextNode(value)]);
            } else {
                innerTextNode.data = value;
            }

            ko.utils.forceRefresh(element);
        },

        setElementName: function(element, name) {
            element.name = name;

            // Workaround IE 6/7 issue
            // - https://github.com/SteveSanderson/knockout/issues/197
            // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
            if (ieVersion <= 7) {
                try {
                    element.mergeAttributes(document.createElement("<input name='" + element.name + "'/>"), false);
                }
                catch(e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
            }
        },

        forceRefresh: function(node) {
            // Workaround for an IE9 rendering bug - https://github.com/SteveSanderson/knockout/issues/209
            if (ieVersion >= 9) {
                // For text nodes and comment nodes (most likely virtual elements), we will have to refresh the container
                var elem = node.nodeType == 1 ? node : node.parentNode;
                if (elem.style)
                    elem.style.zoom = elem.style.zoom;
            }
        },

        ensureSelectElementIsRenderedCorrectly: function(selectElement) {
            // Workaround for IE9 rendering bug - it doesn't reliably display all the text in dynamically-added select boxes unless you force it to re-render by updating the width.
            // (See https://github.com/SteveSanderson/knockout/issues/312, http://stackoverflow.com/questions/5908494/select-only-shows-first-char-of-selected-option)
            // Also fixes IE7 and IE8 bug that causes selects to be zero width if enclosed by 'if' or 'with'. (See issue #839)
            if (ieVersion) {
                var originalWidth = selectElement.style.width;
                selectElement.style.width = 0;
                selectElement.style.width = originalWidth;
            }
        },

        range: function (min, max) {
            min = ko.utils.unwrapObservable(min);
            max = ko.utils.unwrapObservable(max);
            var result = [];
            for (var i = min; i <= max; i++)
                result.push(i);
            return result;
        },

        makeArray: function(arrayLikeObject) {
            var result = [];
            for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
                result.push(arrayLikeObject[i]);
            };
            return result;
        },

        isIe6 : isIe6,
        isIe7 : isIe7,
        ieVersion : ieVersion,

        getFormFields: function(form, fieldName) {
            var fields = ko.utils.makeArray(form.getElementsByTagName("input")).concat(ko.utils.makeArray(form.getElementsByTagName("textarea")));
            var isMatchingField = (typeof fieldName == 'string')
                ? function(field) { return field.name === fieldName }
                : function(field) { return fieldName.test(field.name) }; // Treat fieldName as regex or object containing predicate
            var matches = [];
            for (var i = fields.length - 1; i >= 0; i--) {
                if (isMatchingField(fields[i]))
                    matches.push(fields[i]);
            };
            return matches;
        },

        parseJson: function (jsonString) {
            if (typeof jsonString == "string") {
                jsonString = ko.utils.stringTrim(jsonString);
                if (jsonString) {
                    if (JSON && JSON.parse) // Use native parsing where available
                        return JSON.parse(jsonString);
                    return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
                }
            }
            return null;
        },

        stringifyJson: function (data, replacer, space) {   // replacer and space are optional
            if (!JSON || !JSON.stringify)
                throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
            return JSON.stringify(ko.utils.unwrapObservable(data), replacer, space);
        },

        postJson: function (urlOrForm, data, options) {
            options = options || {};
            var params = options['params'] || {};
            var includeFields = options['includeFields'] || this.fieldsIncludedWithJsonPost;
            var url = urlOrForm;

            // If we were given a form, use its 'action' URL and pick out any requested field values
            if((typeof urlOrForm == 'object') && (ko.utils.tagNameLower(urlOrForm) === "form")) {
                var originalForm = urlOrForm;
                url = originalForm.action;
                for (var i = includeFields.length - 1; i >= 0; i--) {
                    var fields = ko.utils.getFormFields(originalForm, includeFields[i]);
                    for (var j = fields.length - 1; j >= 0; j--)
                        params[fields[j].name] = fields[j].value;
                }
            }

            data = ko.utils.unwrapObservable(data);
            var form = document.createElement("form");
            form.style.display = "none";
            form.action = url;
            form.method = "post";
            for (var key in data) {
                // Since 'data' this is a model object, we include all properties including those inherited from its prototype
                var input = document.createElement("input");
                input.name = key;
                input.value = ko.utils.stringifyJson(ko.utils.unwrapObservable(data[key]));
                form.appendChild(input);
            }
            objectForEach(params, function(key, value) {
                var input = document.createElement("input");
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });
            document.body.appendChild(form);
            options['submitter'] ? options['submitter'](form) : form.submit();
            setTimeout(function () { form.parentNode.removeChild(form); }, 0);
        }
    }
}());

ko.exportSymbol('utils', ko.utils);
ko.exportSymbol('utils.arrayForEach', ko.utils.arrayForEach);
ko.exportSymbol('utils.arrayFirst', ko.utils.arrayFirst);
ko.exportSymbol('utils.arrayFilter', ko.utils.arrayFilter);
ko.exportSymbol('utils.arrayGetDistinctValues', ko.utils.arrayGetDistinctValues);
ko.exportSymbol('utils.arrayIndexOf', ko.utils.arrayIndexOf);
ko.exportSymbol('utils.arrayMap', ko.utils.arrayMap);
ko.exportSymbol('utils.arrayPushAll', ko.utils.arrayPushAll);
ko.exportSymbol('utils.arrayRemoveItem', ko.utils.arrayRemoveItem);
ko.exportSymbol('utils.extend', ko.utils.extend);
ko.exportSymbol('utils.fieldsIncludedWithJsonPost', ko.utils.fieldsIncludedWithJsonPost);
ko.exportSymbol('utils.getFormFields', ko.utils.getFormFields);
ko.exportSymbol('utils.peekObservable', ko.utils.peekObservable);
ko.exportSymbol('utils.postJson', ko.utils.postJson);
ko.exportSymbol('utils.parseJson', ko.utils.parseJson);
ko.exportSymbol('utils.registerEventHandler', ko.utils.registerEventHandler);
ko.exportSymbol('utils.stringifyJson', ko.utils.stringifyJson);
ko.exportSymbol('utils.range', ko.utils.range);
ko.exportSymbol('utils.toggleDomNodeCssClass', ko.utils.toggleDomNodeCssClass);
ko.exportSymbol('utils.triggerEvent', ko.utils.triggerEvent);
ko.exportSymbol('utils.unwrapObservable', ko.utils.unwrapObservable);
ko.exportSymbol('utils.objectForEach', ko.utils.objectForEach);
ko.exportSymbol('utils.addOrRemoveItem', ko.utils.addOrRemoveItem);
ko.exportSymbol('unwrap', ko.utils.unwrapObservable); // Convenient shorthand, because this is used so commonly

if (!Function.prototype['bind']) {
    // Function.prototype.bind is a standard part of ECMAScript 5th Edition (December 2009, http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
    // In case the browser doesn't implement it natively, provide a JavaScript implementation. This implementation is based on the one in prototype.js
    Function.prototype['bind'] = function (object) {
        var originalFunction = this, args = Array.prototype.slice.call(arguments), object = args.shift();
        return function () {
            return originalFunction.apply(object, args.concat(Array.prototype.slice.call(arguments)));
        };
    };
}

ko.utils.domData = new (function () {
    var uniqueId = 0;
    var dataStoreKeyExpandoPropertyName = "__ko__" + (new Date).getTime();
    var dataStore = {};

    function getAll(node, createIfNotFound) {
        var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
        var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
        if (!hasExistingDataStore) {
            if (!createIfNotFound)
                return undefined;
            dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
            dataStore[dataStoreKey] = {};
        }
        return dataStore[dataStoreKey];
    }

    return {
        get: function (node, key) {
            var allDataForNode = getAll(node, false);
            return allDataForNode === undefined ? undefined : allDataForNode[key];
        },
        set: function (node, key, value) {
            if (value === undefined) {
                // Make sure we don't actually create a new domData key if we are actually deleting a value
                if (getAll(node, false) === undefined)
                    return;
            }
            var allDataForNode = getAll(node, true);
            allDataForNode[key] = value;
        },
        clear: function (node) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            if (dataStoreKey) {
                delete dataStore[dataStoreKey];
                node[dataStoreKeyExpandoPropertyName] = null;
                return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
            }
            return false;
        },

        nextKey: function () {
            return (uniqueId++) + dataStoreKeyExpandoPropertyName;
        }
    };
})();

ko.exportSymbol('utils.domData', ko.utils.domData);
ko.exportSymbol('utils.domData.clear', ko.utils.domData.clear); // Exporting only so specs can clear up after themselves fully

ko.utils.domNodeDisposal = new (function () {
    var domDataKey = ko.utils.domData.nextKey();
    var cleanableNodeTypes = { 1: true, 8: true, 9: true };       // Element, Comment, Document
    var cleanableNodeTypesWithDescendants = { 1: true, 9: true }; // Element, Document

    function getDisposeCallbacksCollection(node, createIfNotFound) {
        var allDisposeCallbacks = ko.utils.domData.get(node, domDataKey);
        if ((allDisposeCallbacks === undefined) && createIfNotFound) {
            allDisposeCallbacks = [];
            ko.utils.domData.set(node, domDataKey, allDisposeCallbacks);
        }
        return allDisposeCallbacks;
    }
    function destroyCallbacksCollection(node) {
        ko.utils.domData.set(node, domDataKey, undefined);
    }

    function cleanSingleNode(node) {
        // Run all the dispose callbacks
        var callbacks = getDisposeCallbacksCollection(node, false);
        if (callbacks) {
            callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
            for (var i = 0; i < callbacks.length; i++)
                callbacks[i](node);
        }

        // Also erase the DOM data
        ko.utils.domData.clear(node);

        // Special support for jQuery here because it's so commonly used.
        // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
        // so notify it to tear down any resources associated with the node & descendants here.
        if ((typeof jQuery == "function") && (typeof jQuery['cleanData'] == "function"))
            jQuery['cleanData']([node]);

        // Also clear any immediate-child comment nodes, as these wouldn't have been found by
        // node.getElementsByTagName("*") in cleanNode() (comment nodes aren't elements)
        if (cleanableNodeTypesWithDescendants[node.nodeType])
            cleanImmediateCommentTypeChildren(node);
    }

    function cleanImmediateCommentTypeChildren(nodeWithChildren) {
        var child, nextChild = nodeWithChildren.firstChild;
        while (child = nextChild) {
            nextChild = child.nextSibling;
            if (child.nodeType === 8)
                cleanSingleNode(child);
        }
    }

    return {
        addDisposeCallback : function(node, callback) {
            if (typeof callback != "function")
                throw new Error("Callback must be a function");
            getDisposeCallbacksCollection(node, true).push(callback);
        },

        removeDisposeCallback : function(node, callback) {
            var callbacksCollection = getDisposeCallbacksCollection(node, false);
            if (callbacksCollection) {
                ko.utils.arrayRemoveItem(callbacksCollection, callback);
                if (callbacksCollection.length == 0)
                    destroyCallbacksCollection(node);
            }
        },

        cleanNode : function(node) {
            // First clean this node, where applicable
            if (cleanableNodeTypes[node.nodeType]) {
                cleanSingleNode(node);

                // ... then its descendants, where applicable
                if (cleanableNodeTypesWithDescendants[node.nodeType]) {
                    // Clone the descendants list in case it changes during iteration
                    var descendants = [];
                    ko.utils.arrayPushAll(descendants, node.getElementsByTagName("*"));
                    for (var i = 0, j = descendants.length; i < j; i++)
                        cleanSingleNode(descendants[i]);
                }
            }
            return node;
        },

        removeNode : function(node) {
            ko.cleanNode(node);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        }
    }
})();
ko.cleanNode = ko.utils.domNodeDisposal.cleanNode; // Shorthand name for convenience
ko.removeNode = ko.utils.domNodeDisposal.removeNode; // Shorthand name for convenience
ko.exportSymbol('cleanNode', ko.cleanNode);
ko.exportSymbol('removeNode', ko.removeNode);
ko.exportSymbol('utils.domNodeDisposal', ko.utils.domNodeDisposal);
ko.exportSymbol('utils.domNodeDisposal.addDisposeCallback', ko.utils.domNodeDisposal.addDisposeCallback);
ko.exportSymbol('utils.domNodeDisposal.removeDisposeCallback', ko.utils.domNodeDisposal.removeDisposeCallback);
(function () {
    var leadingCommentRegex = /^(\s*)<!--(.*?)-->/;

    function simpleHtmlParse(html) {
        // Based on jQuery's "clean" function, but only accounting for table-related elements.
        // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

        // Note that there's still an issue in IE < 9 whereby it will discard comment nodes that are the first child of
        // a descendant node. For example: "<div><!-- mycomment -->abc</div>" will get parsed as "<div>abc</div>"
        // This won't affect anyone who has referenced jQuery, and there's always the workaround of inserting a dummy node
        // (possibly a text node) in front of the comment. So, KO does not attempt to workaround this IE issue automatically at present.

        // Trim whitespace, otherwise indexOf won't work as expected
        var tags = ko.utils.stringTrim(html).toLowerCase(), div = document.createElement("div");

        // Finds the first match from the left column, and returns the corresponding "wrap" data from the right column
        var wrap = tags.match(/^<(thead|tbody|tfoot)/)              && [1, "<table>", "</table>"] ||
                   !tags.indexOf("<tr")                             && [2, "<table><tbody>", "</tbody></table>"] ||
                   (!tags.indexOf("<td") || !tags.indexOf("<th"))   && [3, "<table><tbody><tr>", "</tr></tbody></table>"] ||
                   /* anything else */                                 [0, "", ""];

        // Go to html and back, then peel off extra wrappers
        // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
        var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
        if (typeof window['innerShiv'] == "function") {
            div.appendChild(window['innerShiv'](markup));
        } else {
            div.innerHTML = markup;
        }

        // Move to the right depth
        while (wrap[0]--)
            div = div.lastChild;

        return ko.utils.makeArray(div.lastChild.childNodes);
    }

    function jQueryHtmlParse(html) {
        // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
        if (jQuery['parseHTML']) {
            return jQuery['parseHTML'](html) || []; // Ensure we always return an array and never null
        } else {
            // For jQuery < 1.8.0, we fall back on the undocumented internal "clean" function.
            var elems = jQuery['clean']([html]);

            // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
            // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
            // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
            if (elems && elems[0]) {
                // Find the top-most parent element that's a direct child of a document fragment
                var elem = elems[0];
                while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                    elem = elem.parentNode;
                // ... then detach it
                if (elem.parentNode)
                    elem.parentNode.removeChild(elem);
            }

            return elems;
        }
    }

    ko.utils.parseHtmlFragment = function(html) {
        return typeof jQuery != 'undefined' ? jQueryHtmlParse(html)   // As below, benefit from jQuery's optimisations where possible
                                            : simpleHtmlParse(html);  // ... otherwise, this simple logic will do in most common cases.
    };

    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);

        // There's no legitimate reason to display a stringified observable without unwrapping it, so we'll unwrap it
        html = ko.utils.unwrapObservable(html);

        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();

            // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
            // for example <tr> elements which are not normally allowed to exist on their own.
            // If you've referenced jQuery we'll use that rather than duplicating its code.
            if (typeof jQuery != 'undefined') {
                jQuery(node)['html'](html);
            } else {
                // ... otherwise, use KO's own parsing logic.
                var parsedNodes = ko.utils.parseHtmlFragment(html);
                for (var i = 0; i < parsedNodes.length; i++)
                    node.appendChild(parsedNodes[i]);
            }
        }
    };
})();

ko.exportSymbol('utils.parseHtmlFragment', ko.utils.parseHtmlFragment);
ko.exportSymbol('utils.setHtml', ko.utils.setHtml);

ko.memoization = (function () {
    var memos = {};

    function randomMax8HexChars() {
        return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
    }
    function generateRandomId() {
        return randomMax8HexChars() + randomMax8HexChars();
    }
    function findMemoNodes(rootNode, appendToArray) {
        if (!rootNode)
            return;
        if (rootNode.nodeType == 8) {
            var memoId = ko.memoization.parseMemoText(rootNode.nodeValue);
            if (memoId != null)
                appendToArray.push({ domNode: rootNode, memoId: memoId });
        } else if (rootNode.nodeType == 1) {
            for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
                findMemoNodes(childNodes[i], appendToArray);
        }
    }

    return {
        memoize: function (callback) {
            if (typeof callback != "function")
                throw new Error("You can only pass a function to ko.memoization.memoize()");
            var memoId = generateRandomId();
            memos[memoId] = callback;
            return "<!--[ko_memo:" + memoId + "]-->";
        },

        unmemoize: function (memoId, callbackParams) {
            var callback = memos[memoId];
            if (callback === undefined)
                throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
            try {
                callback.apply(null, callbackParams || []);
                return true;
            }
            finally { delete memos[memoId]; }
        },

        unmemoizeDomNodeAndDescendants: function (domNode, extraCallbackParamsArray) {
            var memos = [];
            findMemoNodes(domNode, memos);
            for (var i = 0, j = memos.length; i < j; i++) {
                var node = memos[i].domNode;
                var combinedParams = [node];
                if (extraCallbackParamsArray)
                    ko.utils.arrayPushAll(combinedParams, extraCallbackParamsArray);
                ko.memoization.unmemoize(memos[i].memoId, combinedParams);
                node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
                if (node.parentNode)
                    node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
            }
        },

        parseMemoText: function (memoText) {
            var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
            return match ? match[1] : null;
        }
    };
})();

ko.exportSymbol('memoization', ko.memoization);
ko.exportSymbol('memoization.memoize', ko.memoization.memoize);
ko.exportSymbol('memoization.unmemoize', ko.memoization.unmemoize);
ko.exportSymbol('memoization.parseMemoText', ko.memoization.parseMemoText);
ko.exportSymbol('memoization.unmemoizeDomNodeAndDescendants', ko.memoization.unmemoizeDomNodeAndDescendants);
ko.extenders = {
    'throttle': function(target, timeout) {
        // Throttling means two things:

        // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
        //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
        target['throttleEvaluation'] = timeout;

        // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
        //     so the target cannot change value synchronously or faster than a certain rate
        var writeTimeoutInstance = null;
        return ko.dependentObservable({
            'read': target,
            'write': function(value) {
                clearTimeout(writeTimeoutInstance);
                writeTimeoutInstance = setTimeout(function() {
                    target(value);
                }, timeout);
            }
        });
    },

    'notify': function(target, notifyWhen) {
        target["equalityComparer"] = notifyWhen == "always" ?
            null :  // null equalityComparer means to always notify
            valuesArePrimitiveAndEqual;
    }
};

var primitiveTypes = { 'undefined':1, 'boolean':1, 'number':1, 'string':1 };
function valuesArePrimitiveAndEqual(a, b) {
    var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
    return oldValueIsPrimitive ? (a === b) : false;
}

function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        ko.utils.objectForEach(requestedExtenders, function(key, value) {
            var extenderHandler = ko.extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, value) || target;
            }
        });
    }
    return target;
}

ko.exportSymbol('extenders', ko.extenders);

ko.subscription = function (target, callback, disposeCallback) {
    this.target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    ko.exportProperty(this, 'dispose', this.dispose);
};
ko.subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

ko.subscribable = function () {
    this._subscriptions = {};

    ko.utils.extend(this, ko.subscribable['fn']);
    ko.exportProperty(this, 'subscribe', this.subscribe);
    ko.exportProperty(this, 'extend', this.extend);
    ko.exportProperty(this, 'getSubscriptionsCount', this.getSubscriptionsCount);
}

var defaultEvent = "change";

ko.subscribable['fn'] = {
    subscribe: function (callback, callbackTarget, event) {
        event = event || defaultEvent;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(this, boundCallback, function () {
            ko.utils.arrayRemoveItem(this._subscriptions[event], subscription);
        }.bind(this));

        if (!this._subscriptions[event])
            this._subscriptions[event] = [];
        this._subscriptions[event].push(subscription);
        return subscription;
    },

    "notifySubscribers": function (valueToNotify, event) {
        event = event || defaultEvent;
        if (this.hasSubscriptionsForEvent(event)) {
            try {
                ko.dependencyDetection.begin();
                for (var a = this._subscriptions[event].slice(0), i = 0, subscription; subscription = a[i]; ++i) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
                    if (subscription && (subscription.isDisposed !== true))
                        subscription.callback(valueToNotify);
                }
            } finally {
                ko.dependencyDetection.end();
            }
        }
    },

    hasSubscriptionsForEvent: function(event) {
        return this._subscriptions[event] && this._subscriptions[event].length;
    },

    getSubscriptionsCount: function () {
        var total = 0;
        ko.utils.objectForEach(this._subscriptions, function(eventName, subscriptions) {
            total += subscriptions.length;
        });
        return total;
    },

    extend: applyExtenders
};


ko.isSubscribable = function (instance) {
    return instance != null && typeof instance.subscribe == "function" && typeof instance["notifySubscribers"] == "function";
};

ko.exportSymbol('subscribable', ko.subscribable);
ko.exportSymbol('isSubscribable', ko.isSubscribable);

ko.dependencyDetection = (function () {
    var _frames = [];

    return {
        begin: function (callback) {
            _frames.push(callback && { callback: callback, distinctDependencies:[] });
        },

        end: function () {
            _frames.pop();
        },

        registerDependency: function (subscribable) {
            if (!ko.isSubscribable(subscribable))
                throw new Error("Only subscribable things can act as dependencies");
            if (_frames.length > 0) {
                var topFrame = _frames[_frames.length - 1];
                if (!topFrame || ko.utils.arrayIndexOf(topFrame.distinctDependencies, subscribable) >= 0)
                    return;
                topFrame.distinctDependencies.push(subscribable);
                topFrame.callback(subscribable);
            }
        },

        ignore: function(callback, callbackTarget, callbackArgs) {
            try {
                _frames.push(null);
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                _frames.pop();
            }
        }
    };
})();
ko.observable = function (initialValue) {
    var _latestValue = initialValue;

    function observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if (!observable['equalityComparer'] || !observable['equalityComparer'](_latestValue, arguments[0])) {
                observable.valueWillMutate();
                _latestValue = arguments[0];
                if (DEBUG) observable._latestValue = _latestValue;
                observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return _latestValue;
        }
    }
    if (DEBUG) observable._latestValue = _latestValue;
    ko.subscribable.call(observable);
    observable.peek = function() { return _latestValue };
    observable.valueHasMutated = function () { observable["notifySubscribers"](_latestValue); }
    observable.valueWillMutate = function () { observable["notifySubscribers"](_latestValue, "beforeChange"); }
    ko.utils.extend(observable, ko.observable['fn']);

    ko.exportProperty(observable, 'peek', observable.peek);
    ko.exportProperty(observable, "valueHasMutated", observable.valueHasMutated);
    ko.exportProperty(observable, "valueWillMutate", observable.valueWillMutate);

    return observable;
}

ko.observable['fn'] = {
    "equalityComparer": valuesArePrimitiveAndEqual
};

var protoProperty = ko.observable.protoProperty = "__ko_proto__";
ko.observable['fn'][protoProperty] = ko.observable;

ko.hasPrototype = function(instance, prototype) {
    if ((instance === null) || (instance === undefined) || (instance[protoProperty] === undefined)) return false;
    if (instance[protoProperty] === prototype) return true;
    return ko.hasPrototype(instance[protoProperty], prototype); // Walk the prototype chain
};

ko.isObservable = function (instance) {
    return ko.hasPrototype(instance, ko.observable);
}
ko.isWriteableObservable = function (instance) {
    // Observable
    if ((typeof instance == "function") && instance[protoProperty] === ko.observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == "function") && (instance[protoProperty] === ko.dependentObservable) && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}


ko.exportSymbol('observable', ko.observable);
ko.exportSymbol('isObservable', ko.isObservable);
ko.exportSymbol('isWriteableObservable', ko.isWriteableObservable);
ko.observableArray = function (initialValues) {
    initialValues = initialValues || [];

    if (typeof initialValues != 'object' || !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

    var result = ko.observable(initialValues);
    ko.utils.extend(result, ko.observableArray['fn']);
    return result.extend({'trackArrayChanges':true});
};

ko.observableArray['fn'] = {
    'remove': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0; i < underlyingArray.length; i++) {
            var value = underlyingArray[i];
            if (predicate(value)) {
                if (removedValues.length === 0) {
                    this.valueWillMutate();
                }
                removedValues.push(value);
                underlyingArray.splice(i, 1);
                i--;
            }
        }
        if (removedValues.length) {
            this.valueHasMutated();
        }
        return removedValues;
    },

    'removeAll': function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var underlyingArray = this.peek();
            var allValues = underlyingArray.slice(0);
            this.valueWillMutate();
            underlyingArray.splice(0, underlyingArray.length);
            this.valueHasMutated();
            return allValues;
        }
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return this['remove'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'destroy': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var predicate = typeof valueOrPredicate == "function" && !ko.isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        this.valueWillMutate();
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        this.valueHasMutated();
    },

    'destroyAll': function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return this['destroy'](function() { return true });

        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return this['destroy'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'indexOf': function (item) {
        var underlyingArray = this();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    },

    'replace': function(oldItem, newItem) {
        var index = this['indexOf'](oldItem);
        if (index >= 0) {
            this.valueWillMutate();
            this.peek()[index] = newItem;
            this.valueHasMutated();
        }
    }
};

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
        var underlyingArray = this.peek();
        this.valueWillMutate();
        this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments);
        var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
        this.valueHasMutated();
        return methodCallResult;
    };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
ko.utils.arrayForEach(["slice"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        var underlyingArray = this();
        return underlyingArray[methodName].apply(underlyingArray, arguments);
    };
});

ko.exportSymbol('observableArray', ko.observableArray);
var arrayChangeEventName = 'arrayChange';
ko.extenders['trackArrayChanges'] = function(target) {
    // Only modify the target observable once
    if (target.cacheDiffForKnownOperation) {
        return;
    }
    var trackingChanges = false,
        cachedDiff = null,
        pendingNotifications = 0,
        underlyingSubscribeFunction = target.subscribe;

    // Intercept "subscribe" calls, and for array change events, ensure change tracking is enabled
    target.subscribe = target['subscribe'] = function(callback, callbackTarget, event) {
        if (event === arrayChangeEventName) {
            trackChanges();
        }
        return underlyingSubscribeFunction.apply(this, arguments);
    };

    function trackChanges() {
        // Calling 'trackChanges' multiple times is the same as calling it once
        if (trackingChanges) {
            return;
        }

        trackingChanges = true;

        // Intercept "notifySubscribers" to track how many times it was called.
        var underlyingNotifySubscribersFunction = target['notifySubscribers'];
        target['notifySubscribers'] = function(valueToNotify, event) {
            if (!event || event === defaultEvent) {
                ++pendingNotifications;
            }
            return underlyingNotifySubscribersFunction.apply(this, arguments);
        };

        // Each time the array changes value, capture a clone so that on the next
        // change it's possible to produce a diff
        var previousContents = [].concat(target.peek() || []);
        cachedDiff = null;
        target.subscribe(function(currentContents) {
            // Make a copy of the current contents and ensure it's an array
            currentContents = [].concat(currentContents || []);

            // Compute the diff and issue notifications, but only if someone is listening
            if (target.hasSubscriptionsForEvent(arrayChangeEventName)) {
                var changes = getChanges(previousContents, currentContents);
                if (changes.length) {
                    target['notifySubscribers'](changes, arrayChangeEventName);
                }
            }

            // Eliminate references to the old, removed items, so they can be GCed
            previousContents = currentContents;
            cachedDiff = null;
            pendingNotifications = 0;
        });
    }

    function getChanges(previousContents, currentContents) {
        // We try to re-use cached diffs.
        // The only scenario where pendingNotifications > 1 is when using the KO 'deferred updates' plugin,
        // which without this check would not be compatible with arrayChange notifications. Without that
        // plugin, notifications are always issued immediately so we wouldn't be queueing up more than one.
        if (!cachedDiff || pendingNotifications > 1) {
            cachedDiff = ko.utils.compareArrays(previousContents, currentContents, { 'sparse': true });
        }

        return cachedDiff;
    }

    target.cacheDiffForKnownOperation = function(rawArray, operationName, args) {
        // Only run if we're currently tracking changes for this observable array
        // and there aren't any pending deferred notifications.
        if (!trackingChanges || pendingNotifications) {
            return;
        }
        var diff = [],
            arrayLength = rawArray.length,
            argsLength = args.length,
            offset = 0;

        function pushDiff(status, value, index) {
            diff.push({ 'status': status, 'value': value, 'index': index });
        }
        switch (operationName) {
            case 'push':
                offset = arrayLength;
            case 'unshift':
                for (var index = 0; index < argsLength; index++) {
                    pushDiff('added', args[index], offset + index);
                }
                break;

            case 'pop':
                offset = arrayLength - 1;
            case 'shift':
                if (arrayLength) {
                    pushDiff('deleted', rawArray[offset], offset);
                }
                break;

            case 'splice':
                // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
                // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
                var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
                    endDeleteIndex = argsLength === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength),
                    endAddIndex = startIndex + argsLength - 2,
                    endIndex = Math.max(endDeleteIndex, endAddIndex);
                for (var index = startIndex, argsIndex = 2; index < endIndex; ++index, ++argsIndex) {
                    if (index < endDeleteIndex)
                        pushDiff('deleted', rawArray[index], index);
                    if (index < endAddIndex)
                        pushDiff('added', args[argsIndex], index);
                }
                break;

            default:
                return;
        }
        cachedDiff = diff;
    };
};
ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    var _latestValue,
        _hasBeenEvaluated = false,
        _isBeingEvaluated = false,
        _suppressDisposalUntilDisposeWhenReturnsFalse = false,
        readFunction = evaluatorFunctionOrOptions;

    if (readFunction && typeof readFunction == "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = readFunction;
        readFunction = options["read"];
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        if (!readFunction)
            readFunction = options["read"];
    }
    if (typeof readFunction != "function")
        throw new Error("Pass a function that returns the value of the ko.computed");

    function addSubscriptionToDependency(subscribable) {
        _subscriptionsToDependencies.push(subscribable.subscribe(evaluatePossiblyAsync));
    }

    function disposeAllSubscriptionsToDependencies() {
        ko.utils.arrayForEach(_subscriptionsToDependencies, function (subscription) {
            subscription.dispose();
        });
        _subscriptionsToDependencies = [];
    }

    function evaluatePossiblyAsync() {
        var throttleEvaluationTimeout = dependentObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(evaluationTimeoutInstance);
            evaluationTimeoutInstance = setTimeout(evaluateImmediate, throttleEvaluationTimeout);
        } else
            evaluateImmediate();
    }

    function evaluateImmediate() {
        if (_isBeingEvaluated) {
            // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
            // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
            // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
            // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
            return;
        }

        if (disposeWhen && disposeWhen()) {
            // See comment below about _suppressDisposalUntilDisposeWhenReturnsFalse
            if (!_suppressDisposalUntilDisposeWhenReturnsFalse) {
                dispose();
                _hasBeenEvaluated = true;
                return;
            }
        } else {
            // It just did return false, so we can stop suppressing now
            _suppressDisposalUntilDisposeWhenReturnsFalse = false;
        }

        _isBeingEvaluated = true;
        try {
            // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
            // Then, during evaluation, we cross off any that are in fact still being used.
            var disposalCandidates = ko.utils.arrayMap(_subscriptionsToDependencies, function(item) {return item.target;});

            ko.dependencyDetection.begin(function(subscribable) {
                var inOld;
                if ((inOld = ko.utils.arrayIndexOf(disposalCandidates, subscribable)) >= 0)
                    disposalCandidates[inOld] = undefined; // Don't want to dispose this subscription, as it's still being used
                else
                    addSubscriptionToDependency(subscribable); // Brand new subscription - add it
            });

            var newValue = evaluatorFunctionTarget ? readFunction.call(evaluatorFunctionTarget) : readFunction();

            // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
            for (var i = disposalCandidates.length - 1; i >= 0; i--) {
                if (disposalCandidates[i])
                    _subscriptionsToDependencies.splice(i, 1)[0].dispose();
            }
            _hasBeenEvaluated = true;

            if (!dependentObservable['equalityComparer'] || !dependentObservable['equalityComparer'](_latestValue, newValue)) {
                dependentObservable["notifySubscribers"](_latestValue, "beforeChange");

                _latestValue = newValue;
                if (DEBUG) dependentObservable._latestValue = _latestValue;
                dependentObservable["notifySubscribers"](_latestValue);
            }
        } finally {
            ko.dependencyDetection.end();
            _isBeingEvaluated = false;
        }

        if (!_subscriptionsToDependencies.length)
            dispose();
    }

    function dependentObservable() {
        if (arguments.length > 0) {
            if (typeof writeFunction === "function") {
                // Writing a value
                writeFunction.apply(evaluatorFunctionTarget, arguments);
            } else {
                throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
            }
            return this; // Permits chained assignments
        } else {
            // Reading the value
            if (!_hasBeenEvaluated)
                evaluateImmediate();
            ko.dependencyDetection.registerDependency(dependentObservable);
            return _latestValue;
        }
    }

    function peek() {
        if (!_hasBeenEvaluated)
            evaluateImmediate();
        return _latestValue;
    }

    function isActive() {
        return !_hasBeenEvaluated || _subscriptionsToDependencies.length > 0;
    }

    // By here, "options" is always non-null
    var writeFunction = options["write"],
        disposeWhenNodeIsRemoved = options["disposeWhenNodeIsRemoved"] || options.disposeWhenNodeIsRemoved || null,
        disposeWhenOption = options["disposeWhen"] || options.disposeWhen,
        disposeWhen = disposeWhenOption,
        dispose = disposeAllSubscriptionsToDependencies,
        _subscriptionsToDependencies = [],
        evaluationTimeoutInstance = null;

    if (!evaluatorFunctionTarget)
        evaluatorFunctionTarget = options["owner"];

    dependentObservable.peek = peek;
    dependentObservable.getDependenciesCount = function () { return _subscriptionsToDependencies.length; };
    dependentObservable.hasWriteFunction = typeof options["write"] === "function";
    dependentObservable.dispose = function () { dispose(); };
    dependentObservable.isActive = isActive;

    ko.subscribable.call(dependentObservable);
    ko.utils.extend(dependentObservable, ko.dependentObservable['fn']);

    ko.exportProperty(dependentObservable, 'peek', dependentObservable.peek);
    ko.exportProperty(dependentObservable, 'dispose', dependentObservable.dispose);
    ko.exportProperty(dependentObservable, 'isActive', dependentObservable.isActive);
    ko.exportProperty(dependentObservable, 'getDependenciesCount', dependentObservable.getDependenciesCount);

    // Add a "disposeWhen" callback that, on each evaluation, disposes if the node was removed without using ko.removeNode.
    if (disposeWhenNodeIsRemoved) {
        // Since this computed is associated with a DOM node, and we don't want to dispose the computed
        // until the DOM node is *removed* from the document (as opposed to never having been in the document),
        // we'll prevent disposal until "disposeWhen" first returns false.
        _suppressDisposalUntilDisposeWhenReturnsFalse = true;

        // Only watch for the node's disposal if the value really is a node. It might not be,
        // e.g., { disposeWhenNodeIsRemoved: true } can be used to opt into the "only dispose
        // after first false result" behaviour even if there's no specific node to watch. This
        // technique is intended for KO's internal use only and shouldn't be documented or used
        // by application code, as it's likely to change in a future version of KO.
        if (disposeWhenNodeIsRemoved.nodeType) {
            disposeWhen = function () {
                return !ko.utils.domNodeIsAttachedToDocument(disposeWhenNodeIsRemoved) || (disposeWhenOption && disposeWhenOption());
            };
        }
    }

    // Evaluate, unless deferEvaluation is true
    if (options['deferEvaluation'] !== true)
        evaluateImmediate();

    // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
    // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
    if (disposeWhenNodeIsRemoved && isActive()) {
        dispose = function() {
            ko.utils.domNodeDisposal.removeDisposeCallback(disposeWhenNodeIsRemoved, dispose);
            disposeAllSubscriptionsToDependencies();
        };
        ko.utils.domNodeDisposal.addDisposeCallback(disposeWhenNodeIsRemoved, dispose);
    }

    return dependentObservable;
};

ko.isComputed = function(instance) {
    return ko.hasPrototype(instance, ko.dependentObservable);
};

var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
ko.dependentObservable[protoProp] = ko.observable;

ko.dependentObservable['fn'] = {
    "equalityComparer": valuesArePrimitiveAndEqual
};
ko.dependentObservable['fn'][protoProp] = ko.dependentObservable;

ko.exportSymbol('dependentObservable', ko.dependentObservable);
ko.exportSymbol('computed', ko.dependentObservable); // Make "ko.computed" an alias for "ko.dependentObservable"
ko.exportSymbol('isComputed', ko.isComputed);

(function() {
    var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)

    ko.toJS = function(rootObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.toJS, pass the object you want to convert.");

        // We just unwrap everything at every level in the object graph
        return mapJsObjectGraph(rootObject, function(valueToMap) {
            // Loop because an observable's value might in turn be another observable wrapper
            for (var i = 0; ko.isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
                valueToMap = valueToMap();
            return valueToMap;
        });
    };

    ko.toJSON = function(rootObject, replacer, space) {     // replacer and space are optional
        var plainJavaScriptObject = ko.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject, replacer, space);
    };

    function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
        visitedObjects = visitedObjects || new objectLookup();

        rootObject = mapInputCallback(rootObject);
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean));
        if (!canHaveProperties)
            return rootObject;

        var outputProperties = rootObject instanceof Array ? [] : {};
        visitedObjects.save(rootObject, outputProperties);

        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = mapInputCallback(rootObject[indexer]);

            switch (typeof propertyValue) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                    outputProperties[indexer] = propertyValue;
                    break;
                case "object":
                case "undefined":
                    var previouslyMappedValue = visitedObjects.get(propertyValue);
                    outputProperties[indexer] = (previouslyMappedValue !== undefined)
                        ? previouslyMappedValue
                        : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
                    break;
            }
        });

        return outputProperties;
    }

    function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                visitorCallback(i);

            // For arrays, also respect toJSON property for custom mappings (fixes #278)
            if (typeof rootObject['toJSON'] == 'function')
                visitorCallback('toJSON');
        } else {
            for (var propertyName in rootObject) {
                visitorCallback(propertyName);
            }
        }
    };

    function objectLookup() {
        this.keys = [];
        this.values = [];
    };

    objectLookup.prototype = {
        constructor: objectLookup,
        save: function(key, value) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            if (existingIndex >= 0)
                this.values[existingIndex] = value;
            else {
                this.keys.push(key);
                this.values.push(value);
            }
        },
        get: function(key) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            return (existingIndex >= 0) ? this.values[existingIndex] : undefined;
        }
    };
})();

ko.exportSymbol('toJS', ko.toJS);
ko.exportSymbol('toJSON', ko.toJSON);
(function () {
    var hasDomDataExpandoProperty = '__ko__hasDomDataOptionValue__';

    // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
    // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
    // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
    ko.selectExtensions = {
        readValue : function(element) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    if (element[hasDomDataExpandoProperty] === true)
                        return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
                    return ko.utils.ieVersion <= 7
                        ? (element.getAttributeNode('value') && element.getAttributeNode('value').specified ? element.value : element.text)
                        : element.value;
                case 'select':
                    return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
                default:
                    return element.value;
            }
        },

        writeValue: function(element, value) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    switch(typeof value) {
                        case "string":
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, undefined);
                            if (hasDomDataExpandoProperty in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                                delete element[hasDomDataExpandoProperty];
                            }
                            element.value = value;
                            break;
                        default:
                            // Store arbitrary object using DomData
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                            element[hasDomDataExpandoProperty] = true;

                            // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
                            element.value = typeof value === "number" ? value : "";
                            break;
                    }
                    break;
                case 'select':
                    if (value === "")
                        value = undefined;
                    if (value === null || value === undefined)
                        element.selectedIndex = -1;
                    for (var i = element.options.length - 1; i >= 0; i--) {
                        if (ko.selectExtensions.readValue(element.options[i]) == value) {
                            element.selectedIndex = i;
                            break;
                        }
                    }
                    // for drop-down select, ensure first is selected
                    if (!(element.size > 1) && element.selectedIndex === -1) {
                        element.selectedIndex = 0;
                    }
                    break;
                default:
                    if ((value === null) || (value === undefined))
                        value = "";
                    element.value = value;
                    break;
            }
        }
    };
})();

ko.exportSymbol('selectExtensions', ko.selectExtensions);
ko.exportSymbol('selectExtensions.readValue', ko.selectExtensions.readValue);
ko.exportSymbol('selectExtensions.writeValue', ko.selectExtensions.writeValue);
ko.expressionRewriting = (function () {
    var javaScriptReservedWords = ["true", "false", "null", "undefined"];

    // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
    // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
    // This also will not properly handle nested brackets (e.g., obj1[obj2['prop']]; see #911).
    var javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;

    function getWriteableValue(expression) {
        if (ko.utils.arrayIndexOf(javaScriptReservedWords, expression) >= 0)
            return false;
        var match = expression.match(javaScriptAssignmentTarget);
        return match === null ? false : match[1] ? ('Object(' + match[1] + ')' + match[2]) : expression;
    }

    // The following regular expressions will be used to split an object-literal string into tokens

        // These two match strings, either with double quotes or single quotes
    var stringDouble = '"(?:[^"\\\\]|\\\\.)*"',
        stringSingle = "'(?:[^'\\\\]|\\\\.)*'",
        // Matches a regular expression (text enclosed by slashes), but will also match sets of divisions
        // as a regular expression (this is handled by the parsing loop below).
        stringRegexp = '/(?:[^/\\\\]|\\\\.)*/\w*',
        // These characters have special meaning to the parser and must not appear in the middle of a
        // token, except as part of a string.
        specials = ',"\'{}()/:[\\]',
        // Match text (at least two characters) that does not contain any of the above special characters,
        // although some of the special characters are allowed to start it (all but the colon and comma).
        // The text can contain spaces, but leading or trailing spaces are skipped.
        everyThingElse = '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']',
        // Match any non-space character not matched already. This will match colons and commas, since they're
        // not matched by "everyThingElse", but will also match any other single character that wasn't already
        // matched (for example: in "a: 1, b: 2", each of the non-space characters will be matched by oneNotSpace).
        oneNotSpace = '[^\\s]',

        // Create the actual regular expression by or-ing the above strings. The order is important.
        bindingToken = RegExp(stringDouble + '|' + stringSingle + '|' + stringRegexp + '|' + everyThingElse + '|' + oneNotSpace, 'g'),

        // Match end of previous token to determine whether a slash is a division or regex.
        divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/,
        keywordRegexLookBehind = {'in':1,'return':1,'typeof':1};

    function parseObjectLiteral(objectLiteralString) {
        // Trim leading and trailing spaces from the string
        var str = ko.utils.stringTrim(objectLiteralString);

        // Trim braces '{' surrounding the whole object literal
        if (str.charCodeAt(0) === 123) str = str.slice(1, -1);

        // Split into tokens
        var result = [], toks = str.match(bindingToken), key, values, depth = 0;

        if (toks) {
            // Append a comma so that we don't need a separate code block to deal with the last item
            toks.push(',');

            for (var i = 0, tok; tok = toks[i]; ++i) {
                var c = tok.charCodeAt(0);
                // A comma signals the end of a key/value pair if depth is zero
                if (c === 44) { // ","
                    if (depth <= 0) {
                        if (key)
                            result.push(values ? {key: key, value: values.join('')} : {'unknown': key});
                        key = values = depth = 0;
                        continue;
                    }
                // Simply skip the colon that separates the name and value
                } else if (c === 58) { // ":"
                    if (!values)
                        continue;
                // A set of slashes is initially matched as a regular expression, but could be division
                } else if (c === 47 && i && tok.length > 1) {  // "/"
                    // Look at the end of the previous token to determine if the slash is actually division
                    var match = toks[i-1].match(divisionLookBehind);
                    if (match && !keywordRegexLookBehind[match[0]]) {
                        // The slash is actually a division punctuator; re-parse the remainder of the string (not including the slash)
                        str = str.substr(str.indexOf(tok) + 1);
                        toks = str.match(bindingToken);
                        toks.push(',');
                        i = -1;
                        // Continue with just the slash
                        tok = '/';
                    }
                // Increment depth for parentheses, braces, and brackets so that interior commas are ignored
                } else if (c === 40 || c === 123 || c === 91) { // '(', '{', '['
                    ++depth;
                } else if (c === 41 || c === 125 || c === 93) { // ')', '}', ']'
                    --depth;
                // The key must be a single token; if it's a string, trim the quotes
                } else if (!key && !values) {
                    key = (c === 34 || c === 39) /* '"', "'" */ ? tok.slice(1, -1) : tok;
                    continue;
                }
                if (values)
                    values.push(tok);
                else
                    values = [tok];
            }
        }
        return result;
    }

    // Two-way bindings include a write function that allow the handler to update the value even if it's not an observable.
    var twoWayBindings = {};

    function preProcessBindings(bindingsStringOrKeyValueArray, bindingOptions) {
        bindingOptions = bindingOptions || {};

        function processKeyValue(key, val) {
            var writableVal;
            function callPreprocessHook(obj) {
                return (obj && obj['preprocess']) ? (val = obj['preprocess'](val, key, processKeyValue)) : true;
            }
            if (!callPreprocessHook(ko['getBindingHandler'](key)))
                return;

            if (twoWayBindings[key] && (writableVal = getWriteableValue(val))) {
                // For two-way bindings, provide a write method in case the value
                // isn't a writable observable.
                propertyAccessorResultStrings.push("'" + key + "':function(_z){" + writableVal + "=_z}");
            }

            // Values are wrapped in a function so that each value can be accessed independently
            if (makeValueAccessors) {
                val = 'function(){return ' + val + ' }';
            }
            resultStrings.push("'" + key + "':" + val);
        }

        var resultStrings = [],
            propertyAccessorResultStrings = [],
            makeValueAccessors = bindingOptions['valueAccessors'],
            keyValueArray = typeof bindingsStringOrKeyValueArray === "string" ?
                parseObjectLiteral(bindingsStringOrKeyValueArray) : bindingsStringOrKeyValueArray;

        ko.utils.arrayForEach(keyValueArray, function(keyValue) {
            processKeyValue(keyValue.key || keyValue['unknown'], keyValue.value);
        });

        if (propertyAccessorResultStrings.length)
            processKeyValue('_ko_property_writers', "{" + propertyAccessorResultStrings.join(",") + "}");

        return resultStrings.join(",");
    }

    return {
        bindingRewriteValidators: [],

        twoWayBindings: twoWayBindings,

        parseObjectLiteral: parseObjectLiteral,

        preProcessBindings: preProcessBindings,

        keyValueArrayContainsKey: function(keyValueArray, key) {
            for (var i = 0; i < keyValueArray.length; i++)
                if (keyValueArray[i]['key'] == key)
                    return true;
            return false;
        },

        // Internal, private KO utility for updating model properties from within bindings
        // property:            If the property being updated is (or might be) an observable, pass it here
        //                      If it turns out to be a writable observable, it will be written to directly
        // allBindings:         An object with a get method to retrieve bindings in the current execution context.
        //                      This will be searched for a '_ko_property_writers' property in case you're writing to a non-observable
        // key:                 The key identifying the property to be written. Example: for { hasFocus: myValue }, write to 'myValue' by specifying the key 'hasFocus'
        // value:               The value to be written
        // checkIfDifferent:    If true, and if the property being written is a writable observable, the value will only be written if
        //                      it is !== existing value on that writable observable
        writeValueToProperty: function(property, allBindings, key, value, checkIfDifferent) {
            if (!property || !ko.isObservable(property)) {
                var propWriters = allBindings.get('_ko_property_writers');
                if (propWriters && propWriters[key])
                    propWriters[key](value);
            } else if (ko.isWriteableObservable(property) && (!checkIfDifferent || property.peek() !== value)) {
                property(value);
            }
        }
    };
})();

ko.exportSymbol('expressionRewriting', ko.expressionRewriting);
ko.exportSymbol('expressionRewriting.bindingRewriteValidators', ko.expressionRewriting.bindingRewriteValidators);
ko.exportSymbol('expressionRewriting.parseObjectLiteral', ko.expressionRewriting.parseObjectLiteral);
ko.exportSymbol('expressionRewriting.preProcessBindings', ko.expressionRewriting.preProcessBindings);

// Making bindings explicitly declare themselves as "two way" isn't ideal in the long term (it would be better if
// all bindings could use an official 'property writer' API without needing to declare that they might). However,
// since this is not, and has never been, a public API (_ko_property_writers was never documented), it's acceptable
// as an internal implementation detail in the short term.
// For those developers who rely on _ko_property_writers in their custom bindings, we expose _twoWayBindings as an
// undocumented feature that makes it relatively easy to upgrade to KO 3.0. However, this is still not an official
// public API, and we reserve the right to remove it at any time if we create a real public property writers API.
ko.exportSymbol('expressionRewriting._twoWayBindings', ko.expressionRewriting.twoWayBindings);

// For backward compatibility, define the following aliases. (Previously, these function names were misleading because
// they referred to JSON specifically, even though they actually work with arbitrary JavaScript object literal expressions.)
ko.exportSymbol('jsonExpressionRewriting', ko.expressionRewriting);
ko.exportSymbol('jsonExpressionRewriting.insertPropertyAccessorsIntoJson', ko.expressionRewriting.preProcessBindings);
(function() {
    // "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
    // may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
    // If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
    // of that virtual hierarchy
    //
    // The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
    // without having to scatter special cases all over the binding and templating code.

    // IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
    // but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
    // So, use node.text where available, and node.nodeValue elsewhere
    var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";

    var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+([\s\S]+))?\s*-->$/ : /^\s*ko(?:\s+([\s\S]+))?\s*$/;
    var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
    var htmlTagsWithOptionallyClosingChildren = { 'ul': true, 'ol': true };

    function isStartComment(node) {
        return (node.nodeType == 8) && startCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
    }

    function isEndComment(node) {
        return (node.nodeType == 8) && endCommentRegex.test(commentNodesHaveTextProperty ? node.text : node.nodeValue);
    }

    function getVirtualChildren(startComment, allowUnbalanced) {
        var currentNode = startComment;
        var depth = 1;
        var children = [];
        while (currentNode = currentNode.nextSibling) {
            if (isEndComment(currentNode)) {
                depth--;
                if (depth === 0)
                    return children;
            }

            children.push(currentNode);

            if (isStartComment(currentNode))
                depth++;
        }
        if (!allowUnbalanced)
            throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
        return null;
    }

    function getMatchingEndComment(startComment, allowUnbalanced) {
        var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
        if (allVirtualChildren) {
            if (allVirtualChildren.length > 0)
                return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
            return startComment.nextSibling;
        } else
            return null; // Must have no matching end comment, and allowUnbalanced is true
    }

    function getUnbalancedChildTags(node) {
        // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
        //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
        var childNode = node.firstChild, captureRemaining = null;
        if (childNode) {
            do {
                if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
                    captureRemaining.push(childNode);
                else if (isStartComment(childNode)) {
                    var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
                    if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
                        childNode = matchingEndComment;
                    else
                        captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
                } else if (isEndComment(childNode)) {
                    captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
                }
            } while (childNode = childNode.nextSibling);
        }
        return captureRemaining;
    }

    ko.virtualElements = {
        allowedBindings: {},

        childNodes: function(node) {
            return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
        },

        emptyNode: function(node) {
            if (!isStartComment(node))
                ko.utils.emptyDomNode(node);
            else {
                var virtualChildren = ko.virtualElements.childNodes(node);
                for (var i = 0, j = virtualChildren.length; i < j; i++)
                    ko.removeNode(virtualChildren[i]);
            }
        },

        setDomNodeChildren: function(node, childNodes) {
            if (!isStartComment(node))
                ko.utils.setDomNodeChildren(node, childNodes);
            else {
                ko.virtualElements.emptyNode(node);
                var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
                for (var i = 0, j = childNodes.length; i < j; i++)
                    endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
            }
        },

        prepend: function(containerNode, nodeToPrepend) {
            if (!isStartComment(containerNode)) {
                if (containerNode.firstChild)
                    containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                else
                    containerNode.appendChild(nodeToPrepend);
            } else {
                // Start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
            }
        },

        insertAfter: function(containerNode, nodeToInsert, insertAfterNode) {
            if (!insertAfterNode) {
                ko.virtualElements.prepend(containerNode, nodeToInsert);
            } else if (!isStartComment(containerNode)) {
                // Insert after insertion point
                if (insertAfterNode.nextSibling)
                    containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                else
                    containerNode.appendChild(nodeToInsert);
            } else {
                // Children of start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
            }
        },

        firstChild: function(node) {
            if (!isStartComment(node))
                return node.firstChild;
            if (!node.nextSibling || isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        nextSibling: function(node) {
            if (isStartComment(node))
                node = getMatchingEndComment(node);
            if (node.nextSibling && isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        hasBindingValue: isStartComment,

        virtualNodeBindingValue: function(node) {
            var regexMatch = (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
            return regexMatch ? regexMatch[1] : null;
        },

        normaliseVirtualElementDomStructure: function(elementVerified) {
            // Workaround for https://github.com/SteveSanderson/knockout/issues/155
            // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
            // that are direct descendants of <ul> into the preceding <li>)
            if (!htmlTagsWithOptionallyClosingChildren[ko.utils.tagNameLower(elementVerified)])
                return;

            // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
            // must be intended to appear *after* that child, so move them there.
            var childNode = elementVerified.firstChild;
            if (childNode) {
                do {
                    if (childNode.nodeType === 1) {
                        var unbalancedTags = getUnbalancedChildTags(childNode);
                        if (unbalancedTags) {
                            // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
                            var nodeToInsertBefore = childNode.nextSibling;
                            for (var i = 0; i < unbalancedTags.length; i++) {
                                if (nodeToInsertBefore)
                                    elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore);
                                else
                                    elementVerified.appendChild(unbalancedTags[i]);
                            }
                        }
                    }
                } while (childNode = childNode.nextSibling);
            }
        }
    };
})();
ko.exportSymbol('virtualElements', ko.virtualElements);
ko.exportSymbol('virtualElements.allowedBindings', ko.virtualElements.allowedBindings);
ko.exportSymbol('virtualElements.emptyNode', ko.virtualElements.emptyNode);
//ko.exportSymbol('virtualElements.firstChild', ko.virtualElements.firstChild);     // firstChild is not minified
ko.exportSymbol('virtualElements.insertAfter', ko.virtualElements.insertAfter);
//ko.exportSymbol('virtualElements.nextSibling', ko.virtualElements.nextSibling);   // nextSibling is not minified
ko.exportSymbol('virtualElements.prepend', ko.virtualElements.prepend);
ko.exportSymbol('virtualElements.setDomNodeChildren', ko.virtualElements.setDomNodeChildren);
(function() {
    var defaultBindingAttributeName = "data-bind";

    ko.bindingProvider = function() {
        this.bindingCache = {};
    };

    ko.utils.extend(ko.bindingProvider.prototype, {
        'nodeHasBindings': function(node) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName) != null;   // Element
                case 8: return ko.virtualElements.hasBindingValue(node); // Comment node
                default: return false;
            }
        },

        'getBindings': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext);
            return bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node) : null;
        },

        'getBindingAccessors': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext);
            return bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node, {'valueAccessors':true}) : null;
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'getBindingsString': function(node, bindingContext) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName);   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node); // Comment node
                default: return null;
            }
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'parseBindingsString': function(bindingsString, bindingContext, node, options) {
            try {
                var bindingFunction = createBindingsStringEvaluatorViaCache(bindingsString, this.bindingCache, options);
                return bindingFunction(bindingContext, node);
            } catch (ex) {
                ex.message = "Unable to parse bindings.\nBindings value: " + bindingsString + "\nMessage: " + ex.message;
                throw ex;
            }
        }
    });

    ko.bindingProvider['instance'] = new ko.bindingProvider();

    function createBindingsStringEvaluatorViaCache(bindingsString, cache, options) {
        var cacheKey = bindingsString + (options && options['valueAccessors'] || '');
        return cache[cacheKey]
            || (cache[cacheKey] = createBindingsStringEvaluator(bindingsString, options));
    }

    function createBindingsStringEvaluator(bindingsString, options) {
        // Build the source for a function that evaluates "expression"
        // For each scope variable, add an extra level of "with" nesting
        // Example result: with(sc1) { with(sc0) { return (expression) } }
        var rewrittenBindings = ko.expressionRewriting.preProcessBindings(bindingsString, options),
            functionBody = "with($context){with($data||{}){return{" + rewrittenBindings + "}}}";
        return new Function("$context", "$element", functionBody);
    }
})();

ko.exportSymbol('bindingProvider', ko.bindingProvider);
(function () {
    ko.bindingHandlers = {};

    // The following element types will not be recursed into during binding. In the future, we
    // may consider adding <template> to this list, because such elements' contents are always
    // intended to be bound in a different context from where they appear in the document.
    var bindingDoesNotRecurseIntoElementTypes = {
        // Don't want bindings that operate on text nodes to mutate <script> contents,
        // because it's unexpected and a potential XSS issue
        'script': true
    };

    // Use an overridable method for retrieving binding handlers so that a plugins may support dynamically created handlers
    ko['getBindingHandler'] = function(bindingKey) {
        return ko.bindingHandlers[bindingKey];
    };

    // The ko.bindingContext constructor is only called directly to create the root context. For child
    // contexts, use bindingContext.createChildContext or bindingContext.extend.
    ko.bindingContext = function(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback) {

        // The binding context object includes static properties for the current, parent, and root view models.
        // If a view model is actually stored in an observable, the corresponding binding context object, and
        // any child contexts, must be updated when the view model is changed.
        function updateContext() {
            // Most of the time, the context will directly get a view model object, but if a function is given,
            // we call the function to retrieve the view model. If the function accesses any obsevables (or is
            // itself an observable), the dependency is tracked, and those observables can later cause the binding
            // context to be updated.
            var dataItem = isFunc ? dataItemOrAccessor() : dataItemOrAccessor;

            if (parentContext) {
                // When a "parent" context is given, register a dependency on the parent context. Thus whenever the
                // parent context is updated, this context will also be updated.
                if (parentContext._subscribable)
                    parentContext._subscribable();

                // Copy $root and any custom properties from the parent context
                ko.utils.extend(self, parentContext);

                // Because the above copy overwrites our own properties, we need to reset them.
                // During the first execution, "subscribable" isn't set, so don't bother doing the update then.
                if (subscribable) {
                    self._subscribable = subscribable;
                }
            } else {
                self['$parents'] = [];
                self['$root'] = dataItem;

                // Export 'ko' in the binding context so it will be available in bindings and templates
                // even if 'ko' isn't exported as a global, such as when using an AMD loader.
                // See https://github.com/SteveSanderson/knockout/issues/490
                self['ko'] = ko;
            }
            self['$rawData'] = dataItemOrAccessor;
            self['$data'] = dataItem;
            if (dataItemAlias)
                self[dataItemAlias] = dataItem;

            // The extendCallback function is provided when creating a child context or extending a context.
            // It handles the specific actions needed to finish setting up the binding context. Actions in this
            // function could also add dependencies to this binding context.
            if (extendCallback)
                extendCallback(self, parentContext, dataItem);

            return self['$data'];
        }
        function disposeWhen() {
            return nodes && !ko.utils.anyDomNodeIsAttachedToDocument(nodes);
        }

        var self = this,
            isFunc = typeof(dataItemOrAccessor) == "function",
            nodes,
            subscribable = ko.dependentObservable(updateContext, null, { disposeWhen: disposeWhen, disposeWhenNodeIsRemoved: true });

        // At this point, the binding context has been initialized, and the "subscribable" computed observable is
        // subscribed to any observables that were accessed in the process. If there is nothing to track, the
        // computed will be inactive, and we can safely throw it away. If it's active, the computed is stored in
        // the context object.
        if (subscribable.isActive()) {
            self._subscribable = subscribable;

            // Always notify because even if the model ($data) hasn't changed, other context properties might have changed
            subscribable['equalityComparer'] = null;

            // We need to be able to dispose of this computed observable when it's no longer needed. This would be
            // easy if we had a single node to watch, but binding contexts can be used by many different nodes, and
            // we cannot assume that those nodes have any relation to each other. So instead we track any node that
            // the context is attached to, and dispose the computed when all of those nodes have been cleaned.

            // Add properties to *subscribable* instead of *self* because any properties added to *self* may be overwritten on updates
            nodes = [];
            subscribable._addNode = function(node) {
                nodes.push(node);
                ko.utils.domNodeDisposal.addDisposeCallback(node, function(node) {
                    ko.utils.arrayRemoveItem(nodes, node);
                    if (!nodes.length) {
                        subscribable.dispose();
                        self._subscribable = subscribable = undefined;
                    }
                });
            };
        }
    }

    // Extend the binding context hierarchy with a new view model object. If the parent context is watching
    // any obsevables, the new child context will automatically get a dependency on the parent context.
    // But this does not mean that the $data value of the child context will also get updated. If the child
    // view model also depends on the parent view model, you must provide a function that returns the correct
    // view model on each update.
    ko.bindingContext.prototype['createChildContext'] = function (dataItemOrAccessor, dataItemAlias, extendCallback) {
        return new ko.bindingContext(dataItemOrAccessor, this, dataItemAlias, function(self, parentContext) {
            // Extend the context hierarchy by setting the appropriate pointers
            self['$parentContext'] = parentContext;
            self['$parent'] = parentContext['$data'];
            self['$parents'] = (parentContext['$parents'] || []).slice(0);
            self['$parents'].unshift(self['$parent']);
            if (extendCallback)
                extendCallback(self);
        });
    };

    // Extend the binding context with new custom properties. This doesn't change the context hierarchy.
    // Similarly to "child" contexts, provide a function here to make sure that the correct values are set
    // when an observable view model is updated.
    ko.bindingContext.prototype['extend'] = function(properties) {
        return new ko.bindingContext(this['$rawData'], this, null, function(self) {
            ko.utils.extend(self, typeof(properties) == "function" ? properties() : properties);
        });
    };

    // Returns the valueAccesor function for a binding value
    function makeValueAccessor(value) {
        return function() {
            return value;
        };
    }

    // Returns the value of a valueAccessor function
    function evaluateValueAccessor(valueAccessor) {
        return valueAccessor();
    }

    // Given a function that returns bindings, create and return a new object that contains
    // binding value-accessors functions. Each accessor function calls the original function
    // so that it always gets the latest value and all dependencies are captured. This is used
    // by ko.applyBindingsToNode and getBindingsAndMakeAccessors.
    function makeAccessorsFromFunction(callback) {
        return ko.utils.objectMap(ko.dependencyDetection.ignore(callback), function(value, key) {
            return function() {
                return callback()[key];
            };
        });
    }

    // Given a bindings function or object, create and return a new object that contains
    // binding value-accessors functions. This is used by ko.applyBindingsToNode.
    function makeBindingAccessors(bindings, context, node) {
        if (typeof bindings === 'function') {
            return makeAccessorsFromFunction(bindings.bind(null, context, node));
        } else {
            return ko.utils.objectMap(bindings, makeValueAccessor);
        }
    }

    // This function is used if the binding provider doesn't include a getBindingAccessors function.
    // It must be called with 'this' set to the provider instance.
    function getBindingsAndMakeAccessors(node, context) {
        return makeAccessorsFromFunction(this['getBindings'].bind(this, node, context));
    }

    function validateThatBindingIsAllowedForVirtualElements(bindingName) {
        var validator = ko.virtualElements.allowedBindings[bindingName];
        if (!validator)
            throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements")
    }

    function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
        var currentChild,
            nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement),
            provider = ko.bindingProvider['instance'],
            preprocessNode = provider['preprocessNode'];

        // Preprocessing allows a binding provider to mutate a node before bindings are applied to it. For example it's
        // possible to insert new siblings after it, and/or replace the node with a different one. This can be used to
        // implement custom binding syntaxes, such as {{ value }} for string interpolation, or custom element types that
        // trigger insertion of <template> contents at that point in the document.
        if (preprocessNode) {
            while (currentChild = nextInQueue) {
                nextInQueue = ko.virtualElements.nextSibling(currentChild);
                preprocessNode.call(provider, currentChild);
            }
            // Reset nextInQueue for the next loop
            nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);
        }

        while (currentChild = nextInQueue) {
            // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
            nextInQueue = ko.virtualElements.nextSibling(currentChild);
            applyBindingsToNodeAndDescendantsInternal(bindingContext, currentChild, bindingContextsMayDifferFromDomParentElement);
        }
    }

    function applyBindingsToNodeAndDescendantsInternal (bindingContext, nodeVerified, bindingContextMayDifferFromDomParentElement) {
        var shouldBindDescendants = true;

        // Perf optimisation: Apply bindings only if...
        // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
        //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
        var isElement = (nodeVerified.nodeType === 1);
        if (isElement) // Workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

        var shouldApplyBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
                               || ko.bindingProvider['instance']['nodeHasBindings'](nodeVerified);       // Case (2)
        if (shouldApplyBindings)
            shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, bindingContext, bindingContextMayDifferFromDomParentElement)['shouldBindDescendants'];

        if (shouldBindDescendants && !bindingDoesNotRecurseIntoElementTypes[ko.utils.tagNameLower(nodeVerified)]) {
            // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
            //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
            //    hence bindingContextsMayDifferFromDomParentElement is false
            //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
            //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
            //    hence bindingContextsMayDifferFromDomParentElement is true
            applyBindingsToDescendantsInternal(bindingContext, nodeVerified, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
        }
    }

    var boundElementDomDataKey = ko.utils.domData.nextKey();


    function topologicalSortBindings(bindings) {
        // Depth-first sort
        var result = [],                // The list of key/handler pairs that we will return
            bindingsConsidered = {},    // A temporary record of which bindings are already in 'result'
            cyclicDependencyStack = []; // Keeps track of a depth-search so that, if there's a cycle, we know which bindings caused it
        ko.utils.objectForEach(bindings, function pushBinding(bindingKey) {
            if (!bindingsConsidered[bindingKey]) {
                var binding = ko['getBindingHandler'](bindingKey);
                if (binding) {
                    // First add dependencies (if any) of the current binding
                    if (binding['after']) {
                        cyclicDependencyStack.push(bindingKey);
                        ko.utils.arrayForEach(binding['after'], function(bindingDependencyKey) {
                            if (bindings[bindingDependencyKey]) {
                                if (ko.utils.arrayIndexOf(cyclicDependencyStack, bindingDependencyKey) !== -1) {
                                    throw Error("Cannot combine the following bindings, because they have a cyclic dependency: " + cyclicDependencyStack.join(", "));
                                } else {
                                    pushBinding(bindingDependencyKey);
                                }
                            }
                        });
                        cyclicDependencyStack.pop();
                    }
                    // Next add the current binding
                    result.push({ key: bindingKey, handler: binding });
                }
                bindingsConsidered[bindingKey] = true;
            }
        });

        return result;
    }

    function applyBindingsToNodeInternal(node, sourceBindings, bindingContext, bindingContextMayDifferFromDomParentElement) {
        // Prevent multiple applyBindings calls for the same node, except when a binding value is specified
        var alreadyBound = ko.utils.domData.get(node, boundElementDomDataKey);
        if (!sourceBindings) {
            if (alreadyBound) {
                throw Error("You cannot apply bindings multiple times to the same element.");
            }
            ko.utils.domData.set(node, boundElementDomDataKey, true);
        }

        // Optimization: Don't store the binding context on this node if it's definitely the same as on node.parentNode, because
        // we can easily recover it just by scanning up the node's ancestors in the DOM
        // (note: here, parent node means "real DOM parent" not "virtual parent", as there's no O(1) way to find the virtual parent)
        if (!alreadyBound && bindingContextMayDifferFromDomParentElement)
            ko.storedBindingContextForNode(node, bindingContext);

        // Use bindings if given, otherwise fall back on asking the bindings provider to give us some bindings
        var bindings;
        if (sourceBindings && typeof sourceBindings !== 'function') {
            bindings = sourceBindings;
        } else {
            var provider = ko.bindingProvider['instance'],
                getBindings = provider['getBindingAccessors'] || getBindingsAndMakeAccessors;

            if (sourceBindings || bindingContext._subscribable) {
                // When an obsevable view model is used, the binding context will expose an observable _subscribable value.
                // Get the binding from the provider within a computed observable so that we can update the bindings whenever
                // the binding context is updated.
                var bindingsUpdater = ko.dependentObservable(
                    function() {
                        bindings = sourceBindings ? sourceBindings(bindingContext, node) : getBindings.call(provider, node, bindingContext);
                        // Register a dependency on the binding context
                        if (bindings && bindingContext._subscribable)
                            bindingContext._subscribable();
                        return bindings;
                    },
                    null, { disposeWhenNodeIsRemoved: node }
                );

                if (!bindings || !bindingsUpdater.isActive())
                    bindingsUpdater = null;
            } else {
                bindings = ko.dependencyDetection.ignore(getBindings, provider, [node, bindingContext]);
            }
        }

        var bindingHandlerThatControlsDescendantBindings;
        if (bindings) {
            // Return the value accessor for a given binding. When bindings are static (won't be updated because of a binding
            // context update), just return the value accessor from the binding. Otherwise, return a function that always gets
            // the latest binding value and registers a dependency on the binding updater.
            var getValueAccessor = bindingsUpdater
                ? function(bindingKey) {
                    return function() {
                        return evaluateValueAccessor(bindingsUpdater()[bindingKey]);
                    };
                } : function(bindingKey) {
                    return bindings[bindingKey];
                };

            // Use of allBindings as a function is maintained for backwards compatibility, but its use is deprecated
            function allBindings() {
                return ko.utils.objectMap(bindingsUpdater ? bindingsUpdater() : bindings, evaluateValueAccessor);
            }
            // The following is the 3.x allBindings API
            allBindings['get'] = function(key) {
                return bindings[key] && evaluateValueAccessor(getValueAccessor(key));
            };
            allBindings['has'] = function(key) {
                return key in bindings;
            };

            // First put the bindings into the right order
            var orderedBindings = topologicalSortBindings(bindings);

            // Go through the sorted bindings, calling init and update for each
            ko.utils.arrayForEach(orderedBindings, function(bindingKeyAndHandler) {
                // Note that topologicalSortBindings has already filtered out any nonexistent binding handlers,
                // so bindingKeyAndHandler.handler will always be nonnull.
                var handlerInitFn = bindingKeyAndHandler.handler["init"],
                    handlerUpdateFn = bindingKeyAndHandler.handler["update"],
                    bindingKey = bindingKeyAndHandler.key;

                if (node.nodeType === 8) {
                    validateThatBindingIsAllowedForVirtualElements(bindingKey);
                }

                try {
                    // Run init, ignoring any dependencies
                    if (typeof handlerInitFn == "function") {
                        ko.dependencyDetection.ignore(function() {
                            var initResult = handlerInitFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);

                            // If this binding handler claims to control descendant bindings, make a note of this
                            if (initResult && initResult['controlsDescendantBindings']) {
                                if (bindingHandlerThatControlsDescendantBindings !== undefined)
                                    throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                                bindingHandlerThatControlsDescendantBindings = bindingKey;
                            }
                        });
                    }

                    // Run update in its own computed wrapper
                    if (typeof handlerUpdateFn == "function") {
                        ko.dependentObservable(
                            function() {
                                handlerUpdateFn(node, getValueAccessor(bindingKey), allBindings, bindingContext['$data'], bindingContext);
                            },
                            null,
                            { disposeWhenNodeIsRemoved: node }
                        );
                    }
                } catch (ex) {
                    ex.message = "Unable to process binding \"" + bindingKey + ": " + bindings[bindingKey] + "\"\nMessage: " + ex.message;
                    throw ex;
                }
            });
        }

        return {
            'shouldBindDescendants': bindingHandlerThatControlsDescendantBindings === undefined
        };
    };

    var storedBindingContextDomDataKey = ko.utils.domData.nextKey();
    ko.storedBindingContextForNode = function (node, bindingContext) {
        if (arguments.length == 2) {
            ko.utils.domData.set(node, storedBindingContextDomDataKey, bindingContext);
            if (bindingContext._subscribable)
                bindingContext._subscribable._addNode(node);
        } else {
            return ko.utils.domData.get(node, storedBindingContextDomDataKey);
        }
    }

    function getBindingContext(viewModelOrBindingContext) {
        return viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
            ? viewModelOrBindingContext
            : new ko.bindingContext(viewModelOrBindingContext);
    }

    ko.applyBindingAccessorsToNode = function (node, bindings, viewModelOrBindingContext) {
        if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(node);
        return applyBindingsToNodeInternal(node, bindings, getBindingContext(viewModelOrBindingContext), true);
    };

    ko.applyBindingsToNode = function (node, bindings, viewModelOrBindingContext) {
        var context = getBindingContext(viewModelOrBindingContext);
        return ko.applyBindingAccessorsToNode(node, makeBindingAccessors(bindings, context, node), context);
    };

    ko.applyBindingsToDescendants = function(viewModelOrBindingContext, rootNode) {
        if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
            applyBindingsToDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
    };

    ko.applyBindings = function (viewModelOrBindingContext, rootNode) {
        if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

        applyBindingsToNodeAndDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
    };

    // Retrieving binding context from arbitrary nodes
    ko.contextFor = function(node) {
        // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
        switch (node.nodeType) {
            case 1:
            case 8:
                var context = ko.storedBindingContextForNode(node);
                if (context) return context;
                if (node.parentNode) return ko.contextFor(node.parentNode);
                break;
        }
        return undefined;
    };
    ko.dataFor = function(node) {
        var context = ko.contextFor(node);
        return context ? context['$data'] : undefined;
    };

    ko.exportSymbol('bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('applyBindings', ko.applyBindings);
    ko.exportSymbol('applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('applyBindingAccessorsToNode', ko.applyBindingAccessorsToNode);
    ko.exportSymbol('applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('contextFor', ko.contextFor);
    ko.exportSymbol('dataFor', ko.dataFor);
})();
var attrHtmlToJavascriptMap = { 'class': 'className', 'for': 'htmlFor' };
ko.bindingHandlers['attr'] = {
    'update': function(element, valueAccessor, allBindings) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        ko.utils.objectForEach(value, function(attrName, attrValue) {
            attrValue = ko.utils.unwrapObservable(attrValue);

            // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
            // when someProp is a "no value"-like value (strictly null, false, or undefined)
            // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
            var toRemove = (attrValue === false) || (attrValue === null) || (attrValue === undefined);
            if (toRemove)
                element.removeAttribute(attrName);

            // In IE <= 7 and IE8 Quirks Mode, you have to use the Javascript property name instead of the
            // HTML attribute name for certain attributes. IE8 Standards Mode supports the correct behavior,
            // but instead of figuring out the mode, we'll just set the attribute through the Javascript
            // property for IE <= 8.
            if (ko.utils.ieVersion <= 8 && attrName in attrHtmlToJavascriptMap) {
                attrName = attrHtmlToJavascriptMap[attrName];
                if (toRemove)
                    element.removeAttribute(attrName);
                else
                    element[attrName] = attrValue;
            } else if (!toRemove) {
                element.setAttribute(attrName, attrValue.toString());
            }

            // Treat "name" specially - although you can think of it as an attribute, it also needs
            // special handling on older versions of IE (https://github.com/SteveSanderson/knockout/pull/333)
            // Deliberately being case-sensitive here because XHTML would regard "Name" as a different thing
            // entirely, and there's no strong reason to allow for such casing in HTML.
            if (attrName === "name") {
                ko.utils.setElementName(element, toRemove ? "" : attrValue.toString());
            }
        });
    }
};
(function() {

ko.bindingHandlers['checked'] = {
    'after': ['value', 'attr'],
    'init': function (element, valueAccessor, allBindings) {
        function checkedValue() {
            return allBindings['has']('checkedValue')
                ? ko.utils.unwrapObservable(allBindings.get('checkedValue'))
                : element.value;
        }

        function updateModel() {
            // This updates the model value from the view value.
            // It runs in response to DOM events (click) and changes in checkedValue.
            var isChecked = element.checked,
                elemValue = useCheckedValue ? checkedValue() : isChecked;

            // When we're first setting up this computed, don't change any model state.
            if (!shouldSet) {
                return;
            }

            // We can ignore unchecked radio buttons, because some other radio
            // button will be getting checked, and that one can take care of updating state.
            if (isRadio && !isChecked) {
                return;
            }

            var modelValue = ko.dependencyDetection.ignore(valueAccessor);
            if (isValueArray) {
                if (oldElemValue !== elemValue) {
                    // When we're responding to the checkedValue changing, and the element is
                    // currently checked, replace the old elem value with the new elem value
                    // in the model array.
                    if (isChecked) {
                        ko.utils.addOrRemoveItem(modelValue, elemValue, true);
                        ko.utils.addOrRemoveItem(modelValue, oldElemValue, false);
                    }

                    oldElemValue = elemValue;
                } else {
                    // When we're responding to the user having checked/unchecked a checkbox,
                    // add/remove the element value to the model array.
                    ko.utils.addOrRemoveItem(modelValue, elemValue, isChecked);
                }
            } else {
                ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'checked', elemValue, true);
            }
        };

        function updateView() {
            // This updates the view value from the model value.
            // It runs in response to changes in the bound (checked) value.
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (isValueArray) {
                // When a checkbox is bound to an array, being checked represents its value being present in that array
                element.checked = ko.utils.arrayIndexOf(modelValue, checkedValue()) >= 0;
            } else if (isCheckbox) {
                // When a checkbox is bound to any other value (not an array), being checked represents the value being trueish
                element.checked = modelValue;
            } else {
                // For radio buttons, being checked means that the radio button's value corresponds to the model value
                element.checked = (checkedValue() === modelValue);
            }
        };

        var isCheckbox = element.type == "checkbox",
            isRadio = element.type == "radio";

        // Only bind to check boxes and radio buttons
        if (!isCheckbox && !isRadio) {
            return;
        }

        var isValueArray = isCheckbox && (ko.utils.unwrapObservable(valueAccessor()) instanceof Array),
            oldElemValue = isValueArray ? checkedValue() : undefined,
            useCheckedValue = isRadio || isValueArray,
            shouldSet = false;

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if (isRadio && !element.name)
            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });

        // Set up two computeds to update the binding:

        // The first responds to changes in the checkedValue value and to element clicks
        ko.dependentObservable(updateModel, null, { disposeWhenNodeIsRemoved: element });
        ko.utils.registerEventHandler(element, "click", updateModel);

        // The second responds to changes in the model value (the one associated with the checked binding)
        ko.dependentObservable(updateView, null, { disposeWhenNodeIsRemoved: element });

        shouldSet = true;
    }
};
ko.expressionRewriting.twoWayBindings['checked'] = true;

ko.bindingHandlers['checkedValue'] = {
    'update': function (element, valueAccessor) {
        element.value = ko.utils.unwrapObservable(valueAccessor());
    }
};

})();var classesWrittenByBindingKey = '__ko__cssValue';
ko.bindingHandlers['css'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (typeof value == "object") {
            ko.utils.objectForEach(value, function(className, shouldHaveClass) {
                shouldHaveClass = ko.utils.unwrapObservable(shouldHaveClass);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            });
        } else {
            value = String(value || ''); // Make sure we don't try to store or set a non-string value
            ko.utils.toggleDomNodeCssClass(element, element[classesWrittenByBindingKey], false);
            element[classesWrittenByBindingKey] = value;
            ko.utils.toggleDomNodeCssClass(element, value, true);
        }
    }
};
ko.bindingHandlers['enable'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers['disable'] = {
    'update': function (element, valueAccessor) {
        ko.bindingHandlers['enable']['update'](element, function() { return !ko.utils.unwrapObservable(valueAccessor()) });
    }
};
// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
function makeEventHandlerShortcut(eventName) {
    ko.bindingHandlers[eventName] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var newValueAccessor = function () {
                var result = {};
                result[eventName] = valueAccessor();
                return result;
            };
            return ko.bindingHandlers['event']['init'].call(this, element, newValueAccessor, allBindings, viewModel, bindingContext);
        }
    }
}

ko.bindingHandlers['event'] = {
    'init' : function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var eventsToHandle = valueAccessor() || {};
        ko.utils.objectForEach(eventsToHandle, function(eventName) {
            if (typeof eventName == "string") {
                ko.utils.registerEventHandler(element, eventName, function (event) {
                    var handlerReturnValue;
                    var handlerFunction = valueAccessor()[eventName];
                    if (!handlerFunction)
                        return;

                    try {
                        // Take all the event args, and prefix with the viewmodel
                        var argsForHandler = ko.utils.makeArray(arguments);
                        viewModel = bindingContext['$data'];
                        argsForHandler.unshift(viewModel);
                        handlerReturnValue = handlerFunction.apply(viewModel, argsForHandler);
                    } finally {
                        if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                            if (event.preventDefault)
                                event.preventDefault();
                            else
                                event.returnValue = false;
                        }
                    }

                    var bubble = allBindings.get(eventName + 'Bubble') !== false;
                    if (!bubble) {
                        event.cancelBubble = true;
                        if (event.stopPropagation)
                            event.stopPropagation();
                    }
                });
            }
        });
    }
};
// "foreach: someExpression" is equivalent to "template: { foreach: someExpression }"
// "foreach: { data: someExpression, afterAdd: myfn }" is equivalent to "template: { foreach: someExpression, afterAdd: myfn }"
ko.bindingHandlers['foreach'] = {
    makeTemplateValueAccessor: function(valueAccessor) {
        return function() {
            var modelValue = valueAccessor(),
                unwrappedValue = ko.utils.peekObservable(modelValue);    // Unwrap without setting a dependency here

            // If unwrappedValue is the array, pass in the wrapped value on its own
            // The value will be unwrapped and tracked within the template binding
            // (See https://github.com/SteveSanderson/knockout/issues/523)
            if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
                return { 'foreach': modelValue, 'templateEngine': ko.nativeTemplateEngine.instance };

            // If unwrappedValue.data is the array, preserve all relevant options and unwrap again value so we get updates
            ko.utils.unwrapObservable(modelValue);
            return {
                'foreach': unwrappedValue['data'],
                'as': unwrappedValue['as'],
                'includeDestroyed': unwrappedValue['includeDestroyed'],
                'afterAdd': unwrappedValue['afterAdd'],
                'beforeRemove': unwrappedValue['beforeRemove'],
                'afterRender': unwrappedValue['afterRender'],
                'beforeMove': unwrappedValue['beforeMove'],
                'afterMove': unwrappedValue['afterMove'],
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        };
    },
    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['init'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor));
    },
    'update': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['update'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor), allBindings, viewModel, bindingContext);
    }
};
ko.expressionRewriting.bindingRewriteValidators['foreach'] = false; // Can't rewrite control flow bindings
ko.virtualElements.allowedBindings['foreach'] = true;
var hasfocusUpdatingProperty = '__ko_hasfocusUpdating';
var hasfocusLastValue = '__ko_hasfocusLastValue';
ko.bindingHandlers['hasfocus'] = {
    'init': function(element, valueAccessor, allBindings) {
        var handleElementFocusChange = function(isFocused) {
            // Where possible, ignore which event was raised and determine focus state using activeElement,
            // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
            // However, not all KO-targeted browsers (Firefox 2) support activeElement. For those browsers,
            // prevent a loss of focus when changing tabs/windows by setting a flag that prevents hasfocus
            // from calling 'blur()' on the element when it loses focus.
            // Discussion at https://github.com/SteveSanderson/knockout/pull/352
            element[hasfocusUpdatingProperty] = true;
            var ownerDoc = element.ownerDocument;
            if ("activeElement" in ownerDoc) {
                var active;
                try {
                    active = ownerDoc.activeElement;
                } catch(e) {
                    // IE9 throws if you access activeElement during page load (see issue #703)
                    active = ownerDoc.body;
                }
                isFocused = (active === element);
            }
            var modelValue = valueAccessor();
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'hasfocus', isFocused, true);

            //cache the latest value, so we can avoid unnecessarily calling focus/blur in the update function
            element[hasfocusLastValue] = isFocused;
            element[hasfocusUpdatingProperty] = false;
        };
        var handleElementFocusIn = handleElementFocusChange.bind(null, true);
        var handleElementFocusOut = handleElementFocusChange.bind(null, false);

        ko.utils.registerEventHandler(element, "focus", handleElementFocusIn);
        ko.utils.registerEventHandler(element, "focusin", handleElementFocusIn); // For IE
        ko.utils.registerEventHandler(element, "blur",  handleElementFocusOut);
        ko.utils.registerEventHandler(element, "focusout",  handleElementFocusOut); // For IE
    },
    'update': function(element, valueAccessor) {
        var value = !!ko.utils.unwrapObservable(valueAccessor()); //force boolean to compare with last value
        if (!element[hasfocusUpdatingProperty] && element[hasfocusLastValue] !== value) {
            value ? element.focus() : element.blur();
            ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, value ? "focusin" : "focusout"]); // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
        }
    }
};
ko.expressionRewriting.twoWayBindings['hasfocus'] = true;

ko.bindingHandlers['hasFocus'] = ko.bindingHandlers['hasfocus']; // Make "hasFocus" an alias
ko.expressionRewriting.twoWayBindings['hasFocus'] = true;
ko.bindingHandlers['html'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor) {
        // setHtml will unwrap the value if needed
        ko.utils.setHtml(element, valueAccessor());
    }
};
var withIfDomDataKey = ko.utils.domData.nextKey();
// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element) {
            ko.utils.domData.set(element, withIfDomDataKey, {});
            return { 'controlsDescendantBindings': true };
        },
        'update': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var withIfData = ko.utils.domData.get(element, withIfDomDataKey),
                dataValue = ko.utils.unwrapObservable(valueAccessor()),
                shouldDisplay = !isNot !== !dataValue, // equivalent to isNot ? !dataValue : !!dataValue
                isFirstRender = !withIfData.savedNodes,
                needsRefresh = isFirstRender || isWith || (shouldDisplay !== withIfData.didDisplayOnLastUpdate);

            if (needsRefresh) {
                if (isFirstRender) {
                    withIfData.savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                }

                if (shouldDisplay) {
                    if (!isFirstRender) {
                        ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(withIfData.savedNodes));
                    }
                    ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
                } else {
                    ko.virtualElements.emptyNode(element);
                }

                withIfData.didDisplayOnLastUpdate = shouldDisplay;
            }
        }
    };
    ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
    ko.virtualElements.allowedBindings[bindingKey] = true;
}

// Construct the actual binding handlers
makeWithIfBinding('if');
makeWithIfBinding('ifnot', false /* isWith */, true /* isNot */);
makeWithIfBinding('with', true /* isWith */, false /* isNot */,
    function(bindingContext, dataValue) {
        return bindingContext['createChildContext'](dataValue);
    }
);
ko.bindingHandlers['options'] = {
    'init': function(element) {
        if (ko.utils.tagNameLower(element) !== "select")
            throw new Error("options binding applies only to SELECT elements");

        // Remove all existing <option>s.
        while (element.length > 0) {
            element.remove(0);
        }

        // Ensures that the binding processor doesn't try to bind the options
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor, allBindings) {
        function selectedOptions() {
            return ko.utils.arrayFilter(element.options, function (node) { return node.selected; });
        }

        var selectWasPreviouslyEmpty = element.length == 0;
        var previousScrollTop = (!selectWasPreviouslyEmpty && element.multiple) ? element.scrollTop : null;

        var unwrappedArray = ko.utils.unwrapObservable(valueAccessor());
        var includeDestroyed = allBindings.get('optionsIncludeDestroyed');
        var captionPlaceholder = {};
        var captionValue;
        var previousSelectedValues;
        if (element.multiple) {
            previousSelectedValues = ko.utils.arrayMap(selectedOptions(), ko.selectExtensions.readValue);
        } else {
            previousSelectedValues = element.selectedIndex >= 0 ? [ ko.selectExtensions.readValue(element.options[element.selectedIndex]) ] : [];
        }

        if (unwrappedArray) {
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return includeDestroyed || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // If caption is included, add it to the array
            if (allBindings['has']('optionsCaption')) {
                captionValue = ko.utils.unwrapObservable(allBindings.get('optionsCaption'));
                // If caption value is null or undefined, don't show a caption
                if (captionValue !== null && captionValue !== undefined) {
                    filteredArray.unshift(captionPlaceholder);
                }
            }
        } else {
            // If a falsy value is provided (e.g. null), we'll simply empty the select element
            unwrappedArray = [];
        }

        function applyToObject(object, predicate, defaultValue) {
            var predicateType = typeof predicate;
            if (predicateType == "function")    // Given a function; run it against the data value
                return predicate(object);
            else if (predicateType == "string") // Given a string; treat it as a property name on the data value
                return object[predicate];
            else                                // Given no optionsText arg; use the data value itself
                return defaultValue;
        }

        // The following functions can run at two different times:
        // The first is when the whole array is being updated directly from this binding handler.
        // The second is when an observable value for a specific array entry is updated.
        // oldOptions will be empty in the first case, but will be filled with the previously generated option in the second.
        var itemUpdate = false;
        function optionForArrayItem(arrayEntry, index, oldOptions) {
            if (oldOptions.length) {
                previousSelectedValues = oldOptions[0].selected ? [ ko.selectExtensions.readValue(oldOptions[0]) ] : [];
                itemUpdate = true;
            }
            var option = document.createElement("option");
            if (arrayEntry === captionPlaceholder) {
                ko.utils.setTextContent(option, allBindings.get('optionsCaption'));
                ko.selectExtensions.writeValue(option, undefined);
            } else {
                // Apply a value to the option element
                var optionValue = applyToObject(arrayEntry, allBindings.get('optionsValue'), arrayEntry);
                ko.selectExtensions.writeValue(option, ko.utils.unwrapObservable(optionValue));

                // Apply some text to the option element
                var optionText = applyToObject(arrayEntry, allBindings.get('optionsText'), optionValue);
                ko.utils.setTextContent(option, optionText);
            }
            return [option];
        }

        function setSelectionCallback(arrayEntry, newOptions) {
            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
            // That's why we first added them without selection. Now it's time to set the selection.
            if (previousSelectedValues.length) {
                var isSelected = ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[0])) >= 0;
                ko.utils.setOptionNodeSelectionState(newOptions[0], isSelected);

                // If this option was changed from being selected during a single-item update, notify the change
                if (itemUpdate && !isSelected)
                    ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
            }
        }

        var callback = setSelectionCallback;
        if (allBindings['has']('optionsAfterRender')) {
            callback = function(arrayEntry, newOptions) {
                setSelectionCallback(arrayEntry, newOptions);
                ko.dependencyDetection.ignore(allBindings.get('optionsAfterRender'), null, [newOptions[0], arrayEntry !== captionPlaceholder ? arrayEntry : undefined]);
            }
        }

        ko.utils.setDomNodeChildrenFromArrayMapping(element, filteredArray, optionForArrayItem, null, callback);

        // Determine if the selection has changed as a result of updating the options list
        var selectionChanged;
        if (element.multiple) {
            // For a multiple-select box, compare the new selection count to the previous one
            // But if nothing was selected before, the selection can't have changed
            selectionChanged = previousSelectedValues.length && selectedOptions().length < previousSelectedValues.length;
        } else {
            // For a single-select box, compare the current value to the previous value
            // But if nothing was selected before or nothing is selected now, just look for a change in selection
            selectionChanged = (previousSelectedValues.length && element.selectedIndex >= 0)
                ? (ko.selectExtensions.readValue(element.options[element.selectedIndex]) !== previousSelectedValues[0])
                : (previousSelectedValues.length || element.selectedIndex >= 0);
        }

        // Ensure consistency between model value and selected option.
        // If the dropdown was changed so that selection is no longer the same,
        // notify the value or selectedOptions binding.
        if (selectionChanged)
            ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);

        // Workaround for IE bug
        ko.utils.ensureSelectElementIsRenderedCorrectly(element);

        if (previousScrollTop && Math.abs(previousScrollTop - element.scrollTop) > 20)
            element.scrollTop = previousScrollTop;
    }
};
ko.bindingHandlers['options'].optionValueDomDataKey = ko.utils.domData.nextKey();
ko.bindingHandlers['selectedOptions'] = {
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        ko.utils.registerEventHandler(element, "change", function () {
            var value = valueAccessor(), valueToWrite = [];
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected)
                    valueToWrite.push(ko.selectExtensions.readValue(node));
            });
            ko.expressionRewriting.writeValueToProperty(value, allBindings, 'selectedOptions', valueToWrite);
        });
    },
    'update': function (element, valueAccessor) {
        if (ko.utils.tagNameLower(element) != "select")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(valueAccessor());
        if (newValue && typeof newValue.length == "number") {
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                ko.utils.setOptionNodeSelectionState(node, isSelected);
            });
        }
    }
};
ko.expressionRewriting.twoWayBindings['selectedOptions'] = true;
ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        ko.utils.objectForEach(value, function(styleName, styleValue) {
            styleValue = ko.utils.unwrapObservable(styleValue);
            element.style[styleName] = styleValue || ""; // Empty string removes the value, whereas null/undefined have no effect
        });
    }
};
ko.bindingHandlers['submit'] = {
    'init': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (typeof valueAccessor() != "function")
            throw new Error("The value for a submit binding must be a function");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            var handlerReturnValue;
            var value = valueAccessor();
            try { handlerReturnValue = value.call(bindingContext['$data'], element); }
            finally {
                if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                    if (event.preventDefault)
                        event.preventDefault();
                    else
                        event.returnValue = false;
                }
            }
        });
    }
};
ko.bindingHandlers['text'] = {
	'init': function() {
		// Prevent binding on the dynamically-injected text node (as developers are unlikely to expect that, and it has security implications).
		// It should also make things faster, as we no longer have to consider whether the text node might be bindable.
        return { 'controlsDescendantBindings': true };
	},
    'update': function (element, valueAccessor) {
        ko.utils.setTextContent(element, valueAccessor());
    }
};
ko.virtualElements.allowedBindings['text'] = true;
ko.bindingHandlers['uniqueName'] = {
    'init': function (element, valueAccessor) {
        if (valueAccessor()) {
            var name = "ko_unique_" + (++ko.bindingHandlers['uniqueName'].currentIndex);
            ko.utils.setElementName(element, name);
        }
    }
};
ko.bindingHandlers['uniqueName'].currentIndex = 0;
ko.bindingHandlers['value'] = {
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        // Always catch "change" event; possibly other events too if asked
        var eventsToCatch = ["change"];
        var requestedEventsToCatch = allBindings.get("valueUpdate");
        var propertyChangedFired = false;
        if (requestedEventsToCatch) {
            if (typeof requestedEventsToCatch == "string") // Allow both individual event names, and arrays of event names
                requestedEventsToCatch = [requestedEventsToCatch];
            ko.utils.arrayPushAll(eventsToCatch, requestedEventsToCatch);
            eventsToCatch = ko.utils.arrayGetDistinctValues(eventsToCatch);
        }

        var valueUpdateHandler = function() {
            propertyChangedFired = false;
            var modelValue = valueAccessor();
            var elementValue = ko.selectExtensions.readValue(element);
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'value', elementValue);
        }

        // Workaround for https://github.com/SteveSanderson/knockout/issues/122
        // IE doesn't fire "change" events on textboxes if the user selects a value from its autocomplete list
        var ieAutoCompleteHackNeeded = ko.utils.ieVersion && element.tagName.toLowerCase() == "input" && element.type == "text"
                                       && element.autocomplete != "off" && (!element.form || element.form.autocomplete != "off");
        if (ieAutoCompleteHackNeeded && ko.utils.arrayIndexOf(eventsToCatch, "propertychange") == -1) {
            ko.utils.registerEventHandler(element, "propertychange", function () { propertyChangedFired = true });
            ko.utils.registerEventHandler(element, "blur", function() {
                if (propertyChangedFired) {
                    valueUpdateHandler();
                }
            });
        }

        ko.utils.arrayForEach(eventsToCatch, function(eventName) {
            // The syntax "after<eventname>" means "run the handler asynchronously after the event"
            // This is useful, for example, to catch "keydown" events after the browser has updated the control
            // (otherwise, ko.selectExtensions.readValue(this) will receive the control's value *before* the key event)
            var handler = valueUpdateHandler;
            if (ko.utils.stringStartsWith(eventName, "after")) {
                handler = function() { setTimeout(valueUpdateHandler, 0) };
                eventName = eventName.substring("after".length);
            }
            ko.utils.registerEventHandler(element, eventName, handler);
        });
    },
    'update': function (element, valueAccessor) {
        var valueIsSelectOption = ko.utils.tagNameLower(element) === "select";
        var newValue = ko.utils.unwrapObservable(valueAccessor());
        var elementValue = ko.selectExtensions.readValue(element);
        var valueHasChanged = (newValue !== elementValue);

        if (valueHasChanged) {
            var applyValueAction = function () { ko.selectExtensions.writeValue(element, newValue); };
            applyValueAction();

            if (valueIsSelectOption) {
                if (newValue !== ko.selectExtensions.readValue(element)) {
                    // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
                    // because you're not allowed to have a model value that disagrees with a visible UI selection.
                    ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                } else {
                    // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
                    // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
                    // to apply the value as well.
                    setTimeout(applyValueAction, 0);
                }
            }
        }
    }
};
ko.expressionRewriting.twoWayBindings['value'] = true;
ko.bindingHandlers['visible'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
};
// 'click' is just a shorthand for the usual full-length event:{click:handler}
makeEventHandlerShortcut('click');
// If you want to make a custom template engine,
//
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents,
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }'
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

ko.templateEngine = function () { };

ko.templateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    throw new Error("Override renderTemplateSource");
};

ko.templateEngine.prototype['createJavaScriptEvaluatorBlock'] = function (script) {
    throw new Error("Override createJavaScriptEvaluatorBlock");
};

ko.templateEngine.prototype['makeTemplateSource'] = function(template, templateDocument) {
    // Named template
    if (typeof template == "string") {
        templateDocument = templateDocument || document;
        var elem = templateDocument.getElementById(template);
        if (!elem)
            throw new Error("Cannot find template with ID " + template);
        return new ko.templateSources.domElement(elem);
    } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
        // Anonymous template
        return new ko.templateSources.anonymousTemplate(template);
    } else
        throw new Error("Unknown template type: " + template);
};

ko.templateEngine.prototype['renderTemplate'] = function (template, bindingContext, options, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    return this['renderTemplateSource'](templateSource, bindingContext, options);
};

ko.templateEngine.prototype['isTemplateRewritten'] = function (template, templateDocument) {
    // Skip rewriting if requested
    if (this['allowTemplateRewriting'] === false)
        return true;
    return this['makeTemplateSource'](template, templateDocument)['data']("isRewritten");
};

ko.templateEngine.prototype['rewriteTemplate'] = function (template, rewriterCallback, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    var rewritten = rewriterCallback(templateSource['text']());
    templateSource['text'](rewritten);
    templateSource['data']("isRewritten", true);
};

ko.exportSymbol('templateEngine', ko.templateEngine);

ko.templateRewriting = (function () {
    var memoizeDataBindingAttributeSyntaxRegex = /(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi;
    var memoizeVirtualContainerBindingSyntaxRegex = /<!--\s*ko\b\s*([\s\S]*?)\s*-->/g;

    function validateDataBindValuesForRewriting(keyValueArray) {
        var allValidators = ko.expressionRewriting.bindingRewriteValidators;
        for (var i = 0; i < keyValueArray.length; i++) {
            var key = keyValueArray[i]['key'];
            if (allValidators.hasOwnProperty(key)) {
                var validator = allValidators[key];

                if (typeof validator === "function") {
                    var possibleErrorMessage = validator(keyValueArray[i]['value']);
                    if (possibleErrorMessage)
                        throw new Error(possibleErrorMessage);
                } else if (!validator) {
                    throw new Error("This template engine does not support the '" + key + "' binding within its templates");
                }
            }
        }
    }

    function constructMemoizedTagReplacement(dataBindAttributeValue, tagToRetain, nodeName, templateEngine) {
        var dataBindKeyValueArray = ko.expressionRewriting.parseObjectLiteral(dataBindAttributeValue);
        validateDataBindValuesForRewriting(dataBindKeyValueArray);
        var rewrittenDataBindAttributeValue = ko.expressionRewriting.preProcessBindings(dataBindKeyValueArray, {'valueAccessors':true});

        // For no obvious reason, Opera fails to evaluate rewrittenDataBindAttributeValue unless it's wrapped in an additional
        // anonymous function, even though Opera's built-in debugger can evaluate it anyway. No other browser requires this
        // extra indirection.
        var applyBindingsToNextSiblingScript =
            "ko.__tr_ambtns(function($context,$element){return(function(){return{ " + rewrittenDataBindAttributeValue + " } })()},'" + nodeName.toLowerCase() + "')";
        return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
    }

    return {
        ensureTemplateIsRewritten: function (template, templateEngine, templateDocument) {
            if (!templateEngine['isTemplateRewritten'](template, templateDocument))
                templateEngine['rewriteTemplate'](template, function (htmlString) {
                    return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                }, templateDocument);
        },

        memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
            return htmlString.replace(memoizeDataBindingAttributeSyntaxRegex, function () {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[4], /* tagToRetain: */ arguments[1], /* nodeName: */ arguments[2], templateEngine);
            }).replace(memoizeVirtualContainerBindingSyntaxRegex, function() {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[1], /* tagToRetain: */ "<!-- ko -->", /* nodeName: */ "#comment", templateEngine);
            });
        },

        applyMemoizedBindingsToNextSibling: function (bindings, nodeName) {
            return ko.memoization.memoize(function (domNode, bindingContext) {
                var nodeToBind = domNode.nextSibling;
                if (nodeToBind && nodeToBind.nodeName.toLowerCase() === nodeName) {
                    ko.applyBindingAccessorsToNode(nodeToBind, bindings, bindingContext);
                }
            });
        }
    }
})();


// Exported only because it has to be referenced by string lookup from within rewritten template
ko.exportSymbol('__tr_ambtns', ko.templateRewriting.applyMemoizedBindingsToNextSibling);
(function() {
    // A template source represents a read/write way of accessing a template. This is to eliminate the need for template loading/saving
    // logic to be duplicated in every template engine (and means they can all work with anonymous templates, etc.)
    //
    // Two are provided by default:
    //  1. ko.templateSources.domElement       - reads/writes the text content of an arbitrary DOM element
    //  2. ko.templateSources.anonymousElement - uses ko.utils.domData to read/write text *associated* with the DOM element, but
    //                                           without reading/writing the actual element text content, since it will be overwritten
    //                                           with the rendered template output.
    // You can implement your own template source if you want to fetch/store templates somewhere other than in DOM elements.
    // Template sources need to have the following functions:
    //   text() 			- returns the template text from your storage location
    //   text(value)		- writes the supplied template text to your storage location
    //   data(key)			- reads values stored using data(key, value) - see below
    //   data(key, value)	- associates "value" with this template and the key "key". Is used to store information like "isRewritten".
    //
    // Optionally, template sources can also have the following functions:
    //   nodes()            - returns a DOM element containing the nodes of this template, where available
    //   nodes(value)       - writes the given DOM element to your storage location
    // If a DOM element is available for a given template source, template engines are encouraged to use it in preference over text()
    // for improved speed. However, all templateSources must supply text() even if they don't supply nodes().
    //
    // Once you've implemented a templateSource, make your template engine use it by subclassing whatever template engine you were
    // using and overriding "makeTemplateSource" to return an instance of your custom template source.

    ko.templateSources = {};

    // ---- ko.templateSources.domElement -----

    ko.templateSources.domElement = function(element) {
        this.domElement = element;
    }

    ko.templateSources.domElement.prototype['text'] = function(/* valueToWrite */) {
        var tagNameLower = ko.utils.tagNameLower(this.domElement),
            elemContentsProperty = tagNameLower === "script" ? "text"
                                 : tagNameLower === "textarea" ? "value"
                                 : "innerHTML";

        if (arguments.length == 0) {
            return this.domElement[elemContentsProperty];
        } else {
            var valueToWrite = arguments[0];
            if (elemContentsProperty === "innerHTML")
                ko.utils.setHtml(this.domElement, valueToWrite);
            else
                this.domElement[elemContentsProperty] = valueToWrite;
        }
    };

    var dataDomDataPrefix = ko.utils.domData.nextKey() + "_";
    ko.templateSources.domElement.prototype['data'] = function(key /*, valueToWrite */) {
        if (arguments.length === 1) {
            return ko.utils.domData.get(this.domElement, dataDomDataPrefix + key);
        } else {
            ko.utils.domData.set(this.domElement, dataDomDataPrefix + key, arguments[1]);
        }
    };

    // ---- ko.templateSources.anonymousTemplate -----
    // Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
    // For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
    // Writing to "text" is still supported, but then the template data will not be available as DOM nodes.

    var anonymousTemplatesDomDataKey = ko.utils.domData.nextKey();
    ko.templateSources.anonymousTemplate = function(element) {
        this.domElement = element;
    }
    ko.templateSources.anonymousTemplate.prototype = new ko.templateSources.domElement();
    ko.templateSources.anonymousTemplate.prototype.constructor = ko.templateSources.anonymousTemplate;
    ko.templateSources.anonymousTemplate.prototype['text'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
            if (templateData.textData === undefined && templateData.containerData)
                templateData.textData = templateData.containerData.innerHTML;
            return templateData.textData;
        } else {
            var valueToWrite = arguments[0];
            ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {textData: valueToWrite});
        }
    };
    ko.templateSources.domElement.prototype['nodes'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
            return templateData.containerData;
        } else {
            var valueToWrite = arguments[0];
            ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {containerData: valueToWrite});
        }
    };

    ko.exportSymbol('templateSources', ko.templateSources);
    ko.exportSymbol('templateSources.domElement', ko.templateSources.domElement);
    ko.exportSymbol('templateSources.anonymousTemplate', ko.templateSources.anonymousTemplate);
})();
(function () {
    var _templateEngine;
    ko.setTemplateEngine = function (templateEngine) {
        if ((templateEngine != undefined) && !(templateEngine instanceof ko.templateEngine))
            throw new Error("templateEngine must inherit from ko.templateEngine");
        _templateEngine = templateEngine;
    }

    function invokeForEachNodeInContinuousRange(firstNode, lastNode, action) {
        var node, nextInQueue = firstNode, firstOutOfRangeNode = ko.virtualElements.nextSibling(lastNode);
        while (nextInQueue && ((node = nextInQueue) !== firstOutOfRangeNode)) {
            nextInQueue = ko.virtualElements.nextSibling(node);
            action(node, nextInQueue);
        }
    }

    function activateBindingsOnContinuousNodeArray(continuousNodeArray, bindingContext) {
        // To be used on any nodes that have been rendered by a template and have been inserted into some parent element
        // Walks through continuousNodeArray (which *must* be continuous, i.e., an uninterrupted sequence of sibling nodes, because
        // the algorithm for walking them relies on this), and for each top-level item in the virtual-element sense,
        // (1) Does a regular "applyBindings" to associate bindingContext with this node and to activate any non-memoized bindings
        // (2) Unmemoizes any memos in the DOM subtree (e.g., to activate bindings that had been memoized during template rewriting)

        if (continuousNodeArray.length) {
            var firstNode = continuousNodeArray[0],
                lastNode = continuousNodeArray[continuousNodeArray.length - 1],
                parentNode = firstNode.parentNode,
                provider = ko.bindingProvider['instance'],
                preprocessNode = provider['preprocessNode'];

            if (preprocessNode) {
                invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node, nextNodeInRange) {
                    var nodePreviousSibling = node.previousSibling;
                    var newNodes = preprocessNode.call(provider, node);
                    if (newNodes) {
                        if (node === firstNode)
                            firstNode = newNodes[0] || nextNodeInRange;
                        if (node === lastNode)
                            lastNode = newNodes[newNodes.length - 1] || nodePreviousSibling;
                    }
                });

                // Because preprocessNode can change the nodes, including the first and last nodes, update continuousNodeArray to match.
                // We need the full set, including inner nodes, because the unmemoize step might remove the first node (and so the real
                // first node needs to be in the array).
                continuousNodeArray.length = 0;
                if (!firstNode) { // preprocessNode might have removed all the nodes, in which case there's nothing left to do
                    return;
                }
                if (firstNode === lastNode) {
                    continuousNodeArray.push(firstNode);
                } else {
                    continuousNodeArray.push(firstNode, lastNode);
                    ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
                }
            }

            // Need to applyBindings *before* unmemoziation, because unmemoization might introduce extra nodes (that we don't want to re-bind)
            // whereas a regular applyBindings won't introduce new memoized nodes
            invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                if (node.nodeType === 1 || node.nodeType === 8)
                    ko.applyBindings(bindingContext, node);
            });
            invokeForEachNodeInContinuousRange(firstNode, lastNode, function(node) {
                if (node.nodeType === 1 || node.nodeType === 8)
                    ko.memoization.unmemoizeDomNodeAndDescendants(node, [bindingContext]);
            });

            // Make sure any changes done by applyBindings or unmemoize are reflected in the array
            ko.utils.fixUpContinuousNodeArray(continuousNodeArray, parentNode);
        }
    }

    function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
        return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                        : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                        : null;
    }

    function executeTemplate(targetNodeOrNodeArray, renderMode, template, bindingContext, options) {
        options = options || {};
        var firstTargetNode = targetNodeOrNodeArray && getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
        var templateDocument = firstTargetNode && firstTargetNode.ownerDocument;
        var templateEngineToUse = (options['templateEngine'] || _templateEngine);
        ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse, templateDocument);
        var renderedNodesArray = templateEngineToUse['renderTemplate'](template, bindingContext, options, templateDocument);

        // Loosely check result is an array of DOM nodes
        if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
            throw new Error("Template engine must return an array of DOM nodes");

        var haveAddedNodesToParent = false;
        switch (renderMode) {
            case "replaceChildren":
                ko.virtualElements.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "replaceNode":
                ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "ignoreTargetNode": break;
            default:
                throw new Error("Unknown renderMode: " + renderMode);
        }

        if (haveAddedNodesToParent) {
            activateBindingsOnContinuousNodeArray(renderedNodesArray, bindingContext);
            if (options['afterRender'])
                ko.dependencyDetection.ignore(options['afterRender'], null, [renderedNodesArray, bindingContext['$data']]);
        }

        return renderedNodesArray;
    }

    ko.renderTemplate = function (template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode) {
        options = options || {};
        if ((options['templateEngine'] || _templateEngine) == undefined)
            throw new Error("Set a template engine before calling renderTemplate");
        renderMode = renderMode || "replaceChildren";

        if (targetNodeOrNodeArray) {
            var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);

            var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
            var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;

            return ko.dependentObservable( // So the DOM is automatically updated when any dependency changes
                function () {
                    // Ensure we've got a proper binding context to work with
                    var bindingContext = (dataOrBindingContext && (dataOrBindingContext instanceof ko.bindingContext))
                        ? dataOrBindingContext
                        : new ko.bindingContext(ko.utils.unwrapObservable(dataOrBindingContext));

                    // Support selecting template as a function of the data being rendered
                    var templateName = typeof(template) == 'function' ? template(bindingContext['$data'], bindingContext) : template;

                    var renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext, options);
                    if (renderMode == "replaceNode") {
                        targetNodeOrNodeArray = renderedNodesArray;
                        firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    }
                },
                null,
                { disposeWhen: whenToDispose, disposeWhenNodeIsRemoved: activelyDisposeWhenNodeIsRemoved }
            );
        } else {
            // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
            return ko.memoization.memoize(function (domNode) {
                ko.renderTemplate(template, dataOrBindingContext, options, domNode, "replaceNode");
            });
        }
    };

    ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode, parentBindingContext) {
        // Since setDomNodeChildrenFromArrayMapping always calls executeTemplateForArrayItem and then
        // activateBindingsCallback for added items, we can store the binding context in the former to use in the latter.
        var arrayItemContext;

        // This will be called by setDomNodeChildrenFromArrayMapping to get the nodes to add to targetNode
        var executeTemplateForArrayItem = function (arrayValue, index) {
            // Support selecting template as a function of the data being rendered
            arrayItemContext = parentBindingContext['createChildContext'](arrayValue, options['as'], function(context) {
                context['$index'] = index;
            });
            var templateName = typeof(template) == 'function' ? template(arrayValue, arrayItemContext) : template;
            return executeTemplate(null, "ignoreTargetNode", templateName, arrayItemContext, options);
        }

        // This will be called whenever setDomNodeChildrenFromArrayMapping has added nodes to targetNode
        var activateBindingsCallback = function(arrayValue, addedNodesArray, index) {
            activateBindingsOnContinuousNodeArray(addedNodesArray, arrayItemContext);
            if (options['afterRender'])
                options['afterRender'](addedNodesArray, arrayValue);
        };

        return ko.dependentObservable(function () {
            var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray) || [];
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return options['includeDestroyed'] || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // Call setDomNodeChildrenFromArrayMapping, ignoring any observables unwrapped within (most likely from a callback function).
            // If the array items are observables, though, they will be unwrapped in executeTemplateForArrayItem and managed within setDomNodeChildrenFromArrayMapping.
            ko.dependencyDetection.ignore(ko.utils.setDomNodeChildrenFromArrayMapping, null, [targetNode, filteredArray, executeTemplateForArrayItem, options, activateBindingsCallback]);

        }, null, { disposeWhenNodeIsRemoved: targetNode });
    };

    var templateComputedDomDataKey = ko.utils.domData.nextKey();
    function disposeOldComputedAndStoreNewOne(element, newComputed) {
        var oldComputed = ko.utils.domData.get(element, templateComputedDomDataKey);
        if (oldComputed && (typeof(oldComputed.dispose) == 'function'))
            oldComputed.dispose();
        ko.utils.domData.set(element, templateComputedDomDataKey, (newComputed && newComputed.isActive()) ? newComputed : undefined);
    }

    ko.bindingHandlers['template'] = {
        'init': function(element, valueAccessor) {
            // Support anonymous templates
            var bindingValue = ko.utils.unwrapObservable(valueAccessor());
            if (typeof bindingValue == "string" || bindingValue['name']) {
                // It's a named template - clear the element
                ko.virtualElements.emptyNode(element);
            } else {
                // It's an anonymous template - store the element contents, then clear the element
                var templateNodes = ko.virtualElements.childNodes(element),
                    container = ko.utils.moveCleanedNodesToContainerElement(templateNodes); // This also removes the nodes from their current parent
                new ko.templateSources.anonymousTemplate(element)['nodes'](container);
            }
            return { 'controlsDescendantBindings': true };
        },
        'update': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var templateName = ko.utils.unwrapObservable(valueAccessor()),
                options = {},
                shouldDisplay = true,
                dataValue,
                templateComputed = null;

            if (typeof templateName != "string") {
                options = templateName;
                templateName = ko.utils.unwrapObservable(options['name']);

                // Support "if"/"ifnot" conditions
                if ('if' in options)
                    shouldDisplay = ko.utils.unwrapObservable(options['if']);
                if (shouldDisplay && 'ifnot' in options)
                    shouldDisplay = !ko.utils.unwrapObservable(options['ifnot']);

                dataValue = ko.utils.unwrapObservable(options['data']);
            }

            if ('foreach' in options) {
                // Render once for each data point (treating data set as empty if shouldDisplay==false)
                var dataArray = (shouldDisplay && options['foreach']) || [];
                templateComputed = ko.renderTemplateForEach(templateName || element, dataArray, options, element, bindingContext);
            } else if (!shouldDisplay) {
                ko.virtualElements.emptyNode(element);
            } else {
                // Render once for this single data point (or use the viewModel if no data was provided)
                var innerBindingContext = ('data' in options) ?
                    bindingContext['createChildContext'](dataValue, options['as']) :  // Given an explitit 'data' value, we create a child binding context for it
                    bindingContext;                                                        // Given no explicit 'data' value, we retain the same binding context
                templateComputed = ko.renderTemplate(templateName || element, innerBindingContext, options, element);
            }

            // It only makes sense to have a single template computed per element (otherwise which one should have its output displayed?)
            disposeOldComputedAndStoreNewOne(element, templateComputed);
        }
    };

    // Anonymous templates can't be rewritten. Give a nice error message if you try to do it.
    ko.expressionRewriting.bindingRewriteValidators['template'] = function(bindingValue) {
        var parsedBindingValue = ko.expressionRewriting.parseObjectLiteral(bindingValue);

        if ((parsedBindingValue.length == 1) && parsedBindingValue[0]['unknown'])
            return null; // It looks like a string literal, not an object literal, so treat it as a named template (which is allowed for rewriting)

        if (ko.expressionRewriting.keyValueArrayContainsKey(parsedBindingValue, "name"))
            return null; // Named templates can be rewritten, so return "no error"
        return "This template engine does not support anonymous templates nested within its templates";
    };

    ko.virtualElements.allowedBindings['template'] = true;
})();

ko.exportSymbol('setTemplateEngine', ko.setTemplateEngine);
ko.exportSymbol('renderTemplate', ko.renderTemplate);

ko.utils.compareArrays = (function () {
    var statusNotInOld = 'added', statusNotInNew = 'deleted';

    // Simple calculation based on Levenshtein distance.
    function compareArrays(oldArray, newArray, options) {
        // For backward compatibility, if the third arg is actually a bool, interpret
        // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
        options = (typeof options === 'boolean') ? { 'dontLimitMoves': options } : (options || {});
        oldArray = oldArray || [];
        newArray = newArray || [];

        if (oldArray.length <= newArray.length)
            return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
        else
            return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
    }

    function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, options) {
        var myMin = Math.min,
            myMax = Math.max,
            editDistanceMatrix = [],
            smlIndex, smlIndexMax = smlArray.length,
            bigIndex, bigIndexMax = bigArray.length,
            compareRange = (bigIndexMax - smlIndexMax) || 1,
            maxDistance = smlIndexMax + bigIndexMax + 1,
            thisRow, lastRow,
            bigIndexMaxForRow, bigIndexMinForRow;

        for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
            lastRow = thisRow;
            editDistanceMatrix.push(thisRow = []);
            bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
            bigIndexMinForRow = myMax(0, smlIndex - 1);
            for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                if (!bigIndex)
                    thisRow[bigIndex] = smlIndex + 1;
                else if (!smlIndex)  // Top row - transform empty array into new array via additions
                    thisRow[bigIndex] = bigIndex + 1;
                else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                    thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
                else {
                    var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                    var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                    thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
                }
            }
        }

        var editScript = [], meMinusOne, notInSml = [], notInBig = [];
        for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
            meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
            if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
                notInSml.push(editScript[editScript.length] = {     // added
                    'status': statusNotInSml,
                    'value': bigArray[--bigIndex],
                    'index': bigIndex });
            } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                notInBig.push(editScript[editScript.length] = {     // deleted
                    'status': statusNotInBig,
                    'value': smlArray[--smlIndex],
                    'index': smlIndex });
            } else {
                --bigIndex;
                --smlIndex;
                if (!options['sparse']) {
                    editScript.push({
                        'status': "retained",
                        'value': bigArray[bigIndex] });
                }
            }
        }

        if (notInSml.length && notInBig.length) {
            // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
            // smlIndexMax keeps the time complexity of this algorithm linear.
            var limitFailedCompares = smlIndexMax * 10, failedCompares,
                a, d, notInSmlItem, notInBigItem;
            // Go through the items that have been added and deleted and try to find matches between them.
            for (failedCompares = a = 0; (options['dontLimitMoves'] || failedCompares < limitFailedCompares) && (notInSmlItem = notInSml[a]); a++) {
                for (d = 0; notInBigItem = notInBig[d]; d++) {
                    if (notInSmlItem['value'] === notInBigItem['value']) {
                        notInSmlItem['moved'] = notInBigItem['index'];
                        notInBigItem['moved'] = notInSmlItem['index'];
                        notInBig.splice(d,1);       // This item is marked as moved; so remove it from notInBig list
                        failedCompares = d = 0;     // Reset failed compares count because we're checking for consecutive failures
                        break;
                    }
                }
                failedCompares += d;
            }
        }
        return editScript.reverse();
    }

    return compareArrays;
})();

ko.exportSymbol('utils.compareArrays', ko.utils.compareArrays);

(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
    // You can use this, for example, to activate bindings on those nodes.

    function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
        // Map this array value inside a dependentObservable so we re-map when any dependency changes
        var mappedNodes = [];
        var dependentObservable = ko.dependentObservable(function() {
            var newMappedNodes = mapping(valueToMap, index, ko.utils.fixUpContinuousNodeArray(mappedNodes, containerNode)) || [];

            // On subsequent evaluations, just replace the previously-inserted DOM nodes
            if (mappedNodes.length > 0) {
                ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
                if (callbackAfterAddingNodes)
                    ko.dependencyDetection.ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index]);
            }

            // Replace the contents of the mappedNodes array, thereby updating the record
            // of which nodes would be deleted if valueToMap was itself later removed
            mappedNodes.splice(0, mappedNodes.length);
            ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
        }, null, { disposeWhenNodeIsRemoved: containerNode, disposeWhen: function() { return !ko.utils.anyDomNodeIsAttachedToDocument(mappedNodes); } });
        return { mappedNodes : mappedNodes, dependentObservable : (dependentObservable.isActive() ? dependentObservable : undefined) };
    }

    var lastMappingResultDomDataKey = ko.utils.domData.nextKey();

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options, callbackAfterAddingNodes) {
        // Compare the provided array against the previous one
        array = array || [];
        options = options || {};
        var isFirstExecution = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) === undefined;
        var lastMappingResult = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) || [];
        var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
        var editScript = ko.utils.compareArrays(lastArray, array, options['dontLimitMoves']);

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var newMappingResultIndex = 0;

        var nodesToDelete = [];
        var itemsToProcess = [];
        var itemsForBeforeRemoveCallbacks = [];
        var itemsForMoveCallbacks = [];
        var itemsForAfterAddCallbacks = [];
        var mapData;

        function itemMovedOrRetained(editScriptIndex, oldPosition) {
            mapData = lastMappingResult[oldPosition];
            if (newMappingResultIndex !== oldPosition)
                itemsForMoveCallbacks[editScriptIndex] = mapData;
            // Since updating the index might change the nodes, do so before calling fixUpContinuousNodeArray
            mapData.indexObservable(newMappingResultIndex++);
            ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode);
            newMappingResult.push(mapData);
            itemsToProcess.push(mapData);
        }

        function callCallback(callback, items) {
            if (callback) {
                for (var i = 0, n = items.length; i < n; i++) {
                    if (items[i]) {
                        ko.utils.arrayForEach(items[i].mappedNodes, function(node) {
                            callback(node, i, items[i].arrayEntry);
                        });
                    }
                }
            }
        }

        for (var i = 0, editScriptItem, movedIndex; editScriptItem = editScript[i]; i++) {
            movedIndex = editScriptItem['moved'];
            switch (editScriptItem['status']) {
                case "deleted":
                    if (movedIndex === undefined) {
                        mapData = lastMappingResult[lastMappingResultIndex];

                        // Stop tracking changes to the mapping for these nodes
                        if (mapData.dependentObservable)
                            mapData.dependentObservable.dispose();

                        // Queue these nodes for later removal
                        nodesToDelete.push.apply(nodesToDelete, ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode));
                        if (options['beforeRemove']) {
                            itemsForBeforeRemoveCallbacks[i] = mapData;
                            itemsToProcess.push(mapData);
                        }
                    }
                    lastMappingResultIndex++;
                    break;

                case "retained":
                    itemMovedOrRetained(i, lastMappingResultIndex++);
                    break;

                case "added":
                    if (movedIndex !== undefined) {
                        itemMovedOrRetained(i, movedIndex);
                    } else {
                        mapData = { arrayEntry: editScriptItem['value'], indexObservable: ko.observable(newMappingResultIndex++) };
                        newMappingResult.push(mapData);
                        itemsToProcess.push(mapData);
                        if (!isFirstExecution)
                            itemsForAfterAddCallbacks[i] = mapData;
                    }
                    break;
            }
        }

        // Call beforeMove first before any changes have been made to the DOM
        callCallback(options['beforeMove'], itemsForMoveCallbacks);

        // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
        ko.utils.arrayForEach(nodesToDelete, options['beforeRemove'] ? ko.cleanNode : ko.removeNode);

        // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
        for (var i = 0, nextNode = ko.virtualElements.firstChild(domNode), lastNode, node; mapData = itemsToProcess[i]; i++) {
            // Get nodes for newly added items
            if (!mapData.mappedNodes)
                ko.utils.extend(mapData, mapNodeAndRefreshWhenChanged(domNode, mapping, mapData.arrayEntry, callbackAfterAddingNodes, mapData.indexObservable));

            // Put nodes in the right place if they aren't there already
            for (var j = 0; node = mapData.mappedNodes[j]; nextNode = node.nextSibling, lastNode = node, j++) {
                if (node !== nextNode)
                    ko.virtualElements.insertAfter(domNode, node, lastNode);
            }

            // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
            if (!mapData.initialized && callbackAfterAddingNodes) {
                callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes, mapData.indexObservable);
                mapData.initialized = true;
            }
        }

        // If there's a beforeRemove callback, call it after reordering.
        // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
        // some sort of animation, which is why we first reorder the nodes that will be removed. If the
        // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
        // Perhaps we'll make that change in the future if this scenario becomes more common.
        callCallback(options['beforeRemove'], itemsForBeforeRemoveCallbacks);

        // Finally call afterMove and afterAdd callbacks
        callCallback(options['afterMove'], itemsForMoveCallbacks);
        callCallback(options['afterAdd'], itemsForAfterAddCallbacks);

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);
    }
})();

ko.exportSymbol('utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);
ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.nativeTemplateEngine.prototype.constructor = ko.nativeTemplateEngine;
ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    var useNodesIfAvailable = !(ko.utils.ieVersion < 9), // IE<9 cloneNode doesn't work properly
        templateNodesFunc = useNodesIfAvailable ? templateSource['nodes'] : null,
        templateNodes = templateNodesFunc ? templateSource['nodes']() : null;

    if (templateNodes) {
        return ko.utils.makeArray(templateNodes.cloneNode(true).childNodes);
    } else {
        var templateText = templateSource['text']();
        return ko.utils.parseHtmlFragment(templateText);
    }
};

ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);
(function() {
    ko.jqueryTmplTemplateEngine = function () {
        // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl
        // doesn't expose a version number, so we have to infer it.
        // Note that as of Knockout 1.3, we only support jQuery.tmpl 1.0.0pre and later,
        // which KO internally refers to as version "2", so older versions are no longer detected.
        var jQueryTmplVersion = this.jQueryTmplVersion = (function() {
            if ((typeof(jQuery) == "undefined") || !(jQuery['tmpl']))
                return 0;
            // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
            try {
                if (jQuery['tmpl']['tag']['tmpl']['open'].toString().indexOf('__') >= 0) {
                    // Since 1.0.0pre, custom tags should append markup to an array called "__"
                    return 2; // Final version of jquery.tmpl
                }
            } catch(ex) { /* Apparently not the version we were looking for */ }

            return 1; // Any older version that we don't support
        })();

        function ensureHasReferencedJQueryTemplates() {
            if (jQueryTmplVersion < 2)
                throw new Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");
        }

        function executeTemplate(compiledTemplate, data, jQueryTemplateOptions) {
            return jQuery['tmpl'](compiledTemplate, data, jQueryTemplateOptions);
        }

        this['renderTemplateSource'] = function(templateSource, bindingContext, options) {
            options = options || {};
            ensureHasReferencedJQueryTemplates();

            // Ensure we have stored a precompiled version of this template (don't want to reparse on every render)
            var precompiled = templateSource['data']('precompiled');
            if (!precompiled) {
                var templateText = templateSource['text']() || "";
                // Wrap in "with($whatever.koBindingContext) { ... }"
                templateText = "{{ko_with $item.koBindingContext}}" + templateText + "{{/ko_with}}";

                precompiled = jQuery['template'](null, templateText);
                templateSource['data']('precompiled', precompiled);
            }

            var data = [bindingContext['$data']]; // Prewrap the data in an array to stop jquery.tmpl from trying to unwrap any arrays
            var jQueryTemplateOptions = jQuery['extend']({ 'koBindingContext': bindingContext }, options['templateOptions']);

            var resultNodes = executeTemplate(precompiled, data, jQueryTemplateOptions);
            resultNodes['appendTo'](document.createElement("div")); // Using "appendTo" forces jQuery/jQuery.tmpl to perform necessary cleanup work

            jQuery['fragments'] = {}; // Clear jQuery's fragment cache to avoid a memory leak after a large number of template renders
            return resultNodes;
        };

        this['createJavaScriptEvaluatorBlock'] = function(script) {
            return "{{ko_code ((function() { return " + script + " })()) }}";
        };

        this['addTemplate'] = function(templateName, templateMarkup) {
            document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
        };

        if (jQueryTmplVersion > 0) {
            jQuery['tmpl']['tag']['ko_code'] = {
                open: "__.push($1 || '');"
            };
            jQuery['tmpl']['tag']['ko_with'] = {
                open: "with($1) {",
                close: "} "
            };
        }
    };

    ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();
    ko.jqueryTmplTemplateEngine.prototype.constructor = ko.jqueryTmplTemplateEngine;

    // Use this one by default *only if jquery.tmpl is referenced*
    var jqueryTmplTemplateEngineInstance = new ko.jqueryTmplTemplateEngine();
    if (jqueryTmplTemplateEngineInstance.jQueryTmplVersion > 0)
        ko.setTemplateEngine(jqueryTmplTemplateEngineInstance);

    ko.exportSymbol('jqueryTmplTemplateEngine', ko.jqueryTmplTemplateEngine);
})();
}));
}());
})();

},{}],85:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

},{}],86:[function(require,module,exports){
/*
  Machine.js
  by mary rose cook
  http://github.com/maryrosecook/machinejs

  Make behaviour trees in JavaScript.
  See index.html for an example.

  Uses Base.js by Dean Edwards.  Thanks, Dean.
*/

(function() {

  var Base=function(){if(arguments.length)this==window?Base.prototype.extend.call(arguments[0],arguments.callee.prototype):this.extend(arguments[0])};Base.version="1.0.2"; Base.prototype={extend:function(b,d){var g=Base.prototype.extend;if(arguments.length==2){var e=this[b],h=this.constructor?this.constructor.prototype:null;if(e instanceof Function&&d instanceof Function&&e.valueOf()!=d.valueOf()&&/\bbase\b/.test(d)){var a=d;d=function(){var k=this.base,l=this;this.base=e;this.baseClass=h;var m=a.apply(this,arguments);this.base=k;this.baseClass=l;return m};d.valueOf=function(){return a};d.toString=function(){return String(a)}}return this[b]=d}else if(b){var i={toSource:null}, c=["toString","valueOf"];if(Base._prototyping)c[2]="constructor";for(var j=0;f=c[j];j++)b[f]!=i[f]&&g.call(this,f,b[f]);for(var f in b)i[f]||g.call(this,f,b[f])}return this},base:function(){}}; Base.extend=function(b,d){var g=Base.prototype.extend;b||(b={});Base._prototyping=true;var e=new this;g.call(e,b);var h=e.constructor;e.constructor=this;delete Base._prototyping;var a=function(){Base._prototyping||h.apply(this,arguments);this.constructor=a};a.prototype=e;a.extend=this.extend;a.implement=this.implement;a.create=this.create;a.getClassName=this.getClassName;a.toString=function(){return String(h)};a.isInstance=function(c){return typeof c!="undefined"&&c!==null&&c.constructor&&c.constructor.__ancestors&& c.constructor.__ancestors[a.getClassName()]};g.call(a,d);b=h?a:e;b.init instanceof Function&&b.init();if(!a.__ancestors){a.__ancestors={};a.__ancestors[a.getClassName()]=true;var i=function(c){if(c.prototype&&c.prototype.constructor&&c.prototype.constructor.getClassName){a.__ancestors[c.prototype.constructor.getClassName()]=true;i(c.prototype.constructor)}};i(a)}if(a.getClassName)b.className=a.getClassName();return b};Base.implement=function(b){if(b instanceof Function)b=b.prototype;this.prototype.extend(b)}; Base.create=function(){};Base.getClassName=function(){return"Base"};Base.isInstance=function(){};

  /*
    The tree generator.  Instantiate and then call generateTree(),
    passing the JSON definition of the tree and the object the tree controls.
  */
  var Machine = module.exports = Base.extend({
    constructor: function() { },

    // makes behaviour tree from passed json and returns the root node
    generateTree: function(treeJson, actor, states) {
      states = states || actor;
      return this.read(treeJson, null, actor, states);
    },

    // reads in all nodes in passed json, constructing a tree of nodes as it goes
    read: function(subTreeJson, parent, actor, states) {
      var node = null;
      if (subTreeJson.pointer == true)
        node = new Pointer(subTreeJson.identifier,
                           subTreeJson.test,
                           subTreeJson.strategy,
                           parent,
                           actor,
                           states);
      else
        node = new State(subTreeJson.identifier,
                         subTreeJson.test,
                         subTreeJson.strategy,
                         parent,
                         actor,
                         states);

      node.report = subTreeJson.report;

      if(subTreeJson.children !== undefined)
        for (var i = 0; i < subTreeJson.children.length; i++)
          node.children[node.children.length] = this.read(subTreeJson.children[i],
                                                          node, actor, states);

      return node;
    }
  }, {
    getClassName: function() {
      return "Machine";
    }
  });

  // EXPORT
  window['Machine'] = Machine;

  /*
    The object for nodes in the tree.
  */
  var Node = Base.extend({
    identifier: null,
    test: null,
    strategy: null,
    parent: null,
    children: null,
    actor: null,
    states: null,
    report: null,

    constructor: function(identifier, test, strategy, parent, actor, states) {
      this.identifier = identifier;
      this.test = test;
      this.strategy = strategy;
      this.parent = parent;
      this.actor = actor;
      this.states = states;
      this.children = [];
    },

    // A tick of the clock.  Returns the next state.
    tick: function() {
      if (this.isAction()) // run an actual action
        this.run();

      var potentialNextState = this.nextState();
      var actualNextState = null;
      if (potentialNextState !== null)
        actualNextState = potentialNextState.transition();
      else if (this.can()) // no child state, try and stay in this one
        actualNextState = this;
      else // can't stay in this one, so back up the tree
        actualNextState = this.nearestRunnableAncestor().transition();

      return actualNextState;
    },

    // gets next state that would be moved to from current state
    nextState: function() {
      var strategy = this.strategy;
      if (strategy === undefined) {
        var ancestor = this.nearestAncestorWithStrategy();
        if (ancestor !== null)
          strategy = ancestor.strategy;
      }

      if (strategy !== null)
        return this[strategy].call(this);
      else
        return null;
    },

    isTransition: function() {
      return this.children.length > 0 || this instanceof Pointer;
    },

    isAction: function() {
      return !this.isTransition();
    },

    // returns true if actor allowed to enter this state
    can: function() {
      var functionName = this.test; // can specify custom test function name
      if (functionName === undefined) // no override so go with default function name
        functionName = "can" + this.identifier[0].toUpperCase() + this.identifier.substring(1, this.identifier.length);

      if (this.states[functionName] !== undefined)
        return this.states[functionName].call(this.actor);
      else // no canX() function defined - assume can
        return true;
    },

    // switches state to direct child of root state with passed identifier
    // use very sparingly - really only for important events that
    // require machine to temporarily relinquish control over actor
    // e.g. a soldier who is mostly autonomous, but occasionally receives orders
    warp: function(identifier) {
      var rootNodeChildren = this.getRootNode().children;
      for(var i = 0; i < rootNodeChildren.length; i++)
        if(rootNodeChildren[i].identifier == identifier)
          return rootNodeChildren[i];

      return this; // couldn't find node - stay in current state
    },

    // returns first child that can run
    prioritised: function() {
      return this.nextRunnable(this.children);
    },

    // gets next runnable node in passed list
    nextRunnable: function(nodes) {
      for (var i = 0; i < nodes.length; i++)
        if (nodes[i].can())
          return nodes[i];

      return null;
    },

    // runs all runnable children in order, then kicks up to children's closest runnable ancestor
    sequential: function() {
      var nextState = null;
      if (this.isAction()) // want to get next runnable child or go back up to grandparent
      {
        var foundThis = false;
        for (var i = 0; i < this.parent.children.length; i++) {
          var sibling = this.parent.children[i];
          if (this.identifier == sibling.identifier)
            foundThis = true;
          else if (foundThis && sibling.can())
            return sibling;
        }
      }
      else // at a sequential parent so try to run first runnable child
      {
        var firstRunnableChild = this.nextRunnable(this.children);
        if (firstRunnableChild !== null)
          return firstRunnableChild;
      }

      return this.nearestRunnableAncestor(); // no more runnable children in the sequence so return first runnable ancestor
    },

    // returns first namesake forebear encountered when going directly up tree
    nearestAncestor: function(test) {
      if (this.parent === null)
        return null;
      else if (test.call(this.parent) === true)
        return this.parent;
      else
        return this.parent.nearestAncestor(test);
    },

    // returns root node of whole tree
    getRootNode: function() {
      if(this.parent === null)
        return this;
      else
        return this.parent.getRootNode();
    },

    nearestAncestorWithStrategy: function() {
      return this.nearestAncestor(function() {
        return this.strategy !== undefined && this.strategy !== null;
      });
    },

    // returns nearest ancestor that can run
    nearestRunnableAncestor: function() {
      return this.nearestAncestor(function() {
        return this.can();
      });
    },

    nearestNamesakeAncestor: function(identifier) {
      return this.nearestAncestor(function() {
        return this.identifier == identifier;
      });
    }
  }, {
    getClassName: function() {
      return "Node";
    }
  });


  /*
    A normal state in the tree.
  */
  var State = Node.extend({
    transition: function() {
      return this;
    },

    // run the behaviour associated with this state
    run: function() {
      this.states[this.identifier].call(this.actor); // run the action
    }
  }, {
    getClassName: function() {
      return "State";
    }
  });

  /*
    A pointer state in the tree.  Directs the actor to a synonymous state
    further up the tree.  Which synonymous state the actor transitions to
    is dependent on the pointer's strategy.
  */
  var Pointer = Node.extend({
    // transition out of this state using the state's strategy
    transition: function() {
      return this[this.strategy].call(this);
    },

    // a strategy that moves to the first synonymous ancestor
    hereditory: function() {
      return this.nearestNamesakeAncestor(this.identifier);
    }
  }, {
    getClassName: function() {
      return "Pointer";
    }
  });

})();


},{}],87:[function(require,module,exports){

module.exports = (function() {
  return typeof window != 'undefined' && window.performance
    ? (window.performance.now
    || window.performance.mozNow
    || window.performance.msNow
    || window.performance.oNow
    || window.performance.webkitNow
    || Date.now).bind(window.performance || {})
    : Date.now || function(){ return +new Date() };
})()

},{}],88:[function(require,module,exports){
/*
 * tic
 * https://github.com/shama/tic
 *
 * Copyright (c) 2013 Kyle Robinson Young
 * Licensed under the MIT license.
 */

function Tic() { this._things = []; }
module.exports = function() { return new Tic(); };

Tic.prototype._stack = function(thing) {
  var self = this;
  self._things.push(thing);
  var i = self._things.length - 1;
  return function() { delete self._things[i]; }
};

Tic.prototype.interval = Tic.prototype.setInterval = function(fn, at) {
  return this._stack({
    fn: fn, at: at, args: Array.prototype.slice.call(arguments, 2),
    elapsed: 0, once: false
  });
};

Tic.prototype.timeout = Tic.prototype.setTimeout = function(fn, at) {
  return this._stack({
    fn: fn, at: at, args: Array.prototype.slice.call(arguments, 2),
    elapsed: 0, once: true
  });
};

Tic.prototype.tick = function(dt) {
  var self = this;
  self._things.forEach(function(thing, i) {
    thing.elapsed += dt;
    if (thing.elapsed > thing.at) {
      thing.elapsed -= thing.at;
      thing.fn.apply(thing.fn, thing.args || []);
      if (thing.once) {
        delete self._things[i];
      }
    }
  });
};

},{}],89:[function(require,module,exports){
// tween.js - http://github.com/sole/tween.js
/**
 * @author sole / http://soledadpenades.com
 * @author mrdoob / http://mrdoob.com
 * @author Robert Eisele / http://www.xarg.org
 * @author Philippe / http://philippe.elsass.me
 * @author Robert Penner / http://www.robertpenner.com/easing_terms_of_use.html
 * @author Paul Lewis / http://www.aerotwist.com/
 * @author lechecacharro
 * @author Josh Faul / http://jocafa.com/
 * @author egraether / http://egraether.com/
 * @author endel / http://endel.me
 * @author Ben Delarre / http://delarre.net
 */

// Date.now shim for (ahem) Internet Explo(d|r)er
if ( Date.now === undefined ) {

	Date.now = function () {

		return new Date().valueOf();

	};

}

var TWEEN = TWEEN || ( function () {

	var _tweens = [];

	return {

		REVISION: '12',

		getAll: function () {

			return _tweens;

		},

		removeAll: function () {

			_tweens = [];

		},

		add: function ( tween ) {

			_tweens.push( tween );

		},

		remove: function ( tween ) {

			var i = _tweens.indexOf( tween );

			if ( i !== -1 ) {

				_tweens.splice( i, 1 );

			}

		},

		update: function ( time ) {

			if ( _tweens.length === 0 ) return false;

			var i = 0;

			time = time !== undefined ? time : ( typeof window !== 'undefined' && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now() );

			while ( i < _tweens.length ) {

				if ( _tweens[ i ].update( time ) ) {

					i++;

				} else {

					_tweens.splice( i, 1 );

				}

			}

			return true;

		}
	};

} )();

TWEEN.Tween = function ( object ) {

	var _object = object;
	var _valuesStart = {};
	var _valuesEnd = {};
	var _valuesStartRepeat = {};
	var _duration = 1000;
	var _repeat = 0;
	var _yoyo = false;
	var _isPlaying = false;
	var _reversed = false;
	var _delayTime = 0;
	var _startTime = null;
	var _easingFunction = TWEEN.Easing.Linear.None;
	var _interpolationFunction = TWEEN.Interpolation.Linear;
	var _chainedTweens = [];
	var _onStartCallback = null;
	var _onStartCallbackFired = false;
	var _onUpdateCallback = null;
	var _onCompleteCallback = null;

	// Set all starting values present on the target object
	for ( var field in object ) {

		_valuesStart[ field ] = parseFloat(object[field], 10);

	}

	this.to = function ( properties, duration ) {

		if ( duration !== undefined ) {

			_duration = duration;

		}

		_valuesEnd = properties;

		return this;

	};

	this.start = function ( time ) {

		TWEEN.add( this );

		_isPlaying = true;

		_onStartCallbackFired = false;

		_startTime = time !== undefined ? time : ( typeof window !== 'undefined' && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now() );
		_startTime += _delayTime;

		for ( var property in _valuesEnd ) {

			// check if an Array was provided as property value
			if ( _valuesEnd[ property ] instanceof Array ) {

				if ( _valuesEnd[ property ].length === 0 ) {

					continue;

				}

				// create a local copy of the Array with the start value at the front
				_valuesEnd[ property ] = [ _object[ property ] ].concat( _valuesEnd[ property ] );

			}

			_valuesStart[ property ] = _object[ property ];

			if( ( _valuesStart[ property ] instanceof Array ) === false ) {
				_valuesStart[ property ] *= 1.0; // Ensures we're using numbers, not strings
			}

			_valuesStartRepeat[ property ] = _valuesStart[ property ] || 0;

		}

		return this;

	};

	this.stop = function () {

		if ( !_isPlaying ) {
			return this;
		}

		TWEEN.remove( this );
		_isPlaying = false;
		this.stopChainedTweens();
		return this;

	};

	this.stopChainedTweens = function () {

		for ( var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++ ) {

			_chainedTweens[ i ].stop();

		}

	};

	this.delay = function ( amount ) {

		_delayTime = amount;
		return this;

	};

	this.repeat = function ( times ) {

		_repeat = times;
		return this;

	};

	this.yoyo = function( yoyo ) {

		_yoyo = yoyo;
		return this;

	};


	this.easing = function ( easing ) {

		_easingFunction = easing;
		return this;

	};

	this.interpolation = function ( interpolation ) {

		_interpolationFunction = interpolation;
		return this;

	};

	this.chain = function () {

		_chainedTweens = arguments;
		return this;

	};

	this.onStart = function ( callback ) {

		_onStartCallback = callback;
		return this;

	};

	this.onUpdate = function ( callback ) {

		_onUpdateCallback = callback;
		return this;

	};

	this.onComplete = function ( callback ) {

		_onCompleteCallback = callback;
		return this;

	};

	this.update = function ( time ) {

		var property;

		if ( time < _startTime ) {

			return true;

		}

		if ( _onStartCallbackFired === false ) {

			if ( _onStartCallback !== null ) {

				_onStartCallback.call( _object );

			}

			_onStartCallbackFired = true;

		}

		var elapsed = ( time - _startTime ) / _duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		var value = _easingFunction( elapsed );

		for ( property in _valuesEnd ) {

			var start = _valuesStart[ property ] || 0;
			var end = _valuesEnd[ property ];

			if ( end instanceof Array ) {

				_object[ property ] = _interpolationFunction( end, value );

			} else {

                // Parses relative end values with start as base (e.g.: +10, -3)
				if ( typeof(end) === "string" ) {
					end = start + parseFloat(end, 10);
				}

				// protect against non numeric properties.
                if ( typeof(end) === "number" ) {
					_object[ property ] = start + ( end - start ) * value;
				}

			}

		}

		if ( _onUpdateCallback !== null ) {

			_onUpdateCallback.call( _object, value );

		}

		if ( elapsed == 1 ) {

			if ( _repeat > 0 ) {

				if( isFinite( _repeat ) ) {
					_repeat--;
				}

				// reassign starting values, restart by making startTime = now
				for( property in _valuesStartRepeat ) {

					if ( typeof( _valuesEnd[ property ] ) === "string" ) {
						_valuesStartRepeat[ property ] = _valuesStartRepeat[ property ] + parseFloat(_valuesEnd[ property ], 10);
					}

					if (_yoyo) {
						var tmp = _valuesStartRepeat[ property ];
						_valuesStartRepeat[ property ] = _valuesEnd[ property ];
						_valuesEnd[ property ] = tmp;
						_reversed = !_reversed;
					}
					_valuesStart[ property ] = _valuesStartRepeat[ property ];

				}

				_startTime = time + _delayTime;

				return true;

			} else {

				if ( _onCompleteCallback !== null ) {

					_onCompleteCallback.call( _object );

				}

				for ( var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++ ) {

					_chainedTweens[ i ].start( time );

				}

				return false;

			}

		}

		return true;

	};

};


TWEEN.Easing = {

	Linear: {

		None: function ( k ) {

			return k;

		}

	},

	Quadratic: {

		In: function ( k ) {

			return k * k;

		},

		Out: function ( k ) {

			return k * ( 2 - k );

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
			return - 0.5 * ( --k * ( k - 2 ) - 1 );

		}

	},

	Cubic: {

		In: function ( k ) {

			return k * k * k;

		},

		Out: function ( k ) {

			return --k * k * k + 1;

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
			return 0.5 * ( ( k -= 2 ) * k * k + 2 );

		}

	},

	Quartic: {

		In: function ( k ) {

			return k * k * k * k;

		},

		Out: function ( k ) {

			return 1 - ( --k * k * k * k );

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
			return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );

		}

	},

	Quintic: {

		In: function ( k ) {

			return k * k * k * k * k;

		},

		Out: function ( k ) {

			return --k * k * k * k * k + 1;

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
			return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );

		}

	},

	Sinusoidal: {

		In: function ( k ) {

			return 1 - Math.cos( k * Math.PI / 2 );

		},

		Out: function ( k ) {

			return Math.sin( k * Math.PI / 2 );

		},

		InOut: function ( k ) {

			return 0.5 * ( 1 - Math.cos( Math.PI * k ) );

		}

	},

	Exponential: {

		In: function ( k ) {

			return k === 0 ? 0 : Math.pow( 1024, k - 1 );

		},

		Out: function ( k ) {

			return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );

		},

		InOut: function ( k ) {

			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
			return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );

		}

	},

	Circular: {

		In: function ( k ) {

			return 1 - Math.sqrt( 1 - k * k );

		},

		Out: function ( k ) {

			return Math.sqrt( 1 - ( --k * k ) );

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
			return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function ( k ) {

			var s, a = 0.1, p = 0.4;
			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( !a || a < 1 ) { a = 1; s = p / 4; }
			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
			return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );

		},

		Out: function ( k ) {

			var s, a = 0.1, p = 0.4;
			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( !a || a < 1 ) { a = 1; s = p / 4; }
			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
			return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );

		},

		InOut: function ( k ) {

			var s, a = 0.1, p = 0.4;
			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( !a || a < 1 ) { a = 1; s = p / 4; }
			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
			if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
			return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;

		}

	},

	Back: {

		In: function ( k ) {

			var s = 1.70158;
			return k * k * ( ( s + 1 ) * k - s );

		},

		Out: function ( k ) {

			var s = 1.70158;
			return --k * k * ( ( s + 1 ) * k + s ) + 1;

		},

		InOut: function ( k ) {

			var s = 1.70158 * 1.525;
			if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
			return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );

		}

	},

	Bounce: {

		In: function ( k ) {

			return 1 - TWEEN.Easing.Bounce.Out( 1 - k );

		},

		Out: function ( k ) {

			if ( k < ( 1 / 2.75 ) ) {

				return 7.5625 * k * k;

			} else if ( k < ( 2 / 2.75 ) ) {

				return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;

			} else if ( k < ( 2.5 / 2.75 ) ) {

				return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;

			} else {

				return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;

			}

		},

		InOut: function ( k ) {

			if ( k < 0.5 ) return TWEEN.Easing.Bounce.In( k * 2 ) * 0.5;
			return TWEEN.Easing.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function ( v, k ) {

		var m = v.length - 1, f = m * k, i = Math.floor( f ), fn = TWEEN.Interpolation.Utils.Linear;

		if ( k < 0 ) return fn( v[ 0 ], v[ 1 ], f );
		if ( k > 1 ) return fn( v[ m ], v[ m - 1 ], m - f );

		return fn( v[ i ], v[ i + 1 > m ? m : i + 1 ], f - i );

	},

	Bezier: function ( v, k ) {

		var b = 0, n = v.length - 1, pw = Math.pow, bn = TWEEN.Interpolation.Utils.Bernstein, i;

		for ( i = 0; i <= n; i++ ) {
			b += pw( 1 - k, n - i ) * pw( k, i ) * v[ i ] * bn( n, i );
		}

		return b;

	},

	CatmullRom: function ( v, k ) {

		var m = v.length - 1, f = m * k, i = Math.floor( f ), fn = TWEEN.Interpolation.Utils.CatmullRom;

		if ( v[ 0 ] === v[ m ] ) {

			if ( k < 0 ) i = Math.floor( f = m * ( 1 + k ) );

			return fn( v[ ( i - 1 + m ) % m ], v[ i ], v[ ( i + 1 ) % m ], v[ ( i + 2 ) % m ], f - i );

		} else {

			if ( k < 0 ) return v[ 0 ] - ( fn( v[ 0 ], v[ 0 ], v[ 1 ], v[ 1 ], -f ) - v[ 0 ] );
			if ( k > 1 ) return v[ m ] - ( fn( v[ m ], v[ m ], v[ m - 1 ], v[ m - 1 ], f - m ) - v[ m ] );

			return fn( v[ i ? i - 1 : 0 ], v[ i ], v[ m < i + 1 ? m : i + 1 ], v[ m < i + 2 ? m : i + 2 ], f - i );

		}

	},

	Utils: {

		Linear: function ( p0, p1, t ) {

			return ( p1 - p0 ) * t + p0;

		},

		Bernstein: function ( n , i ) {

			var fc = TWEEN.Interpolation.Utils.Factorial;
			return fc( n ) / fc( i ) / fc( n - i );

		},

		Factorial: ( function () {

			var a = [ 1 ];

			return function ( n ) {

				var s = 1, i;
				if ( a[ n ] ) return a[ n ];
				for ( i = n; i > 1; i-- ) s *= i;
				return a[ n ] = s;

			};

		} )(),

		CatmullRom: function ( p0, p1, p2, p3, t ) {

			var v0 = ( p2 - p0 ) * 0.5, v1 = ( p3 - p1 ) * 0.5, t2 = t * t, t3 = t * t2;
			return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;

		}

	}

};

module.exports=TWEEN;
},{}],90:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

module.exports = function() {
  return {
  	canvas : !! window.CanvasRenderingContext2D,
  	webgl : ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )(),
  	workers : !! window.Worker,
  	fileapi : window.File && window.FileReader && window.FileList && window.Blob,

  	getWebGLErrorMessage : function () {

  		var domElement = document.createElement( 'div' );

  		domElement.style.fontFamily = 'monospace';
  		domElement.style.fontSize = '13px';
  		domElement.style.textAlign = 'center';
  		domElement.style.background = '#eee';
  		domElement.style.color = '#000';
  		domElement.style.padding = '1em';
  		domElement.style.width = '475px';
  		domElement.style.margin = '5em auto 0';

  		if ( ! this.webgl ) {

  			domElement.innerHTML = window.WebGLRenderingContext ? [
  				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br />',
  				'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
  			].join( '\n' ) : [
  				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>',
  				'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
  			].join( '\n' );

  		}

  		return domElement;

  	},

  	addGetWebGLMessage : function ( parameters ) {

  		var parent, id, domElement;

  		parameters = parameters || {};

  		parent = parameters.parent !== undefined ? parameters.parent : document.body;
  		id = parameters.id !== undefined ? parameters.id : 'oldie';

  		domElement = Detector.getWebGLErrorMessage();
  		domElement.id = id;

  		parent.appendChild( domElement );

  	}

  };
}

},{}],91:[function(require,module,exports){
/**
 * @author mrdoob / http://mrdoob.com/
 */

var Stats = function () {

	var startTime = Date.now(), prevTime = startTime;
	var ms = 0, msMin = Infinity, msMax = 0;
	var fps = 0, fpsMin = Infinity, fpsMax = 0;
	var frames = 0, mode = 0;

	var container = document.createElement( 'div' );
	container.id = 'stats';
	container.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); setMode( ++ mode % 2 ) }, false );
	container.style.cssText = 'width:80px;opacity:0.9;cursor:pointer';

	var fpsDiv = document.createElement( 'div' );
	fpsDiv.id = 'fps';
	fpsDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#002';
	container.appendChild( fpsDiv );

	var fpsText = document.createElement( 'div' );
	fpsText.id = 'fpsText';
	fpsText.style.cssText = 'color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
	fpsText.innerHTML = 'FPS';
	fpsDiv.appendChild( fpsText );

	var fpsGraph = document.createElement( 'div' );
	fpsGraph.id = 'fpsGraph';
	fpsGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0ff';
	fpsDiv.appendChild( fpsGraph );

	while ( fpsGraph.children.length < 74 ) {

		var bar = document.createElement( 'span' );
		bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#113';
		fpsGraph.appendChild( bar );

	}

	var msDiv = document.createElement( 'div' );
	msDiv.id = 'ms';
	msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;display:none';
	container.appendChild( msDiv );

	var msText = document.createElement( 'div' );
	msText.id = 'msText';
	msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
	msText.innerHTML = 'MS';
	msDiv.appendChild( msText );

	var msGraph = document.createElement( 'div' );
	msGraph.id = 'msGraph';
	msGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0f0';
	msDiv.appendChild( msGraph );

	while ( msGraph.children.length < 74 ) {

		var bar = document.createElement( 'span' );
		bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#131';
		msGraph.appendChild( bar );

	}

	var setMode = function ( value ) {

		mode = value;

		switch ( mode ) {

			case 0:
				fpsDiv.style.display = 'block';
				msDiv.style.display = 'none';
				break;
			case 1:
				fpsDiv.style.display = 'none';
				msDiv.style.display = 'block';
				break;
		}

	}

	var updateGraph = function ( dom, value ) {

		var child = dom.appendChild( dom.firstChild );
		child.style.height = value + 'px';

	}

	return {

		REVISION: 11,

		domElement: container,

		setMode: setMode,

		begin: function () {

			startTime = Date.now();

		},

		end: function () {

			var time = Date.now();

			ms = time - startTime;
			msMin = Math.min( msMin, ms );
			msMax = Math.max( msMax, ms );

			msText.textContent = ms + ' MS (' + msMin + '-' + msMax + ')';
			updateGraph( msGraph, Math.min( 30, 30 - ( ms / 200 ) * 30 ) );

			frames ++;

			if ( time > prevTime + 1000 ) {

				fps = Math.round( ( frames * 1000 ) / ( time - prevTime ) );
				fpsMin = Math.min( fpsMin, fps );
				fpsMax = Math.max( fpsMax, fps );

				fpsText.textContent = fps + ' FPS (' + fpsMin + '-' + fpsMax + ')';
				updateGraph( fpsGraph, Math.min( 30, 30 - ( fps / 100 ) * 30 ) );

				prevTime = time;
				frames = 0;

			}

			return time;

		},

		update: function () {

			startTime = this.end();

		}

	}

};

module.exports = Stats
},{}],92:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],93:[function(require,module,exports){
module.exports=require(74)
},{}],94:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],95:[function(require,module,exports){
var base64 = require('base64-js')
var TA = require('typedarray')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * Use a shim for browsers that lack Typed Array support (< IE 9, < FF 3.6,
 * < Chrome 6, < Safari 5, < Opera 11.5, < iOS 4.1).
 */
var xDataView = typeof DataView === 'undefined'
  ? TA.DataView : DataView
var xArrayBuffer = typeof ArrayBuffer === 'undefined'
  ? TA.ArrayBuffer : ArrayBuffer
var xUint8Array = typeof Uint8Array === 'undefined'
  ? TA.Uint8Array : Uint8Array

/**
 * Check to see if the browser supports augmenting a `Uint8Array` instance.
 */
var browserSupport = (function () {
  try {
    var arr = new xUint8Array(0)
    arr.foo = function () { return 42 }
    return 42 === arr.foo()
  } catch (e) {
    return false
  }
})()

/**
 * Also use the shim in Firefox 4-17 (even though they have native Uint8Array),
 * since they don't support Proxy. Without that, it is not possible to augment
 * native Uint8Array instances in Firefox.
 */
if (xUint8Array !== TA.Uint8Array && !browserSupport) {
  xDataView = TA.DataView
  xArrayBuffer = TA.ArrayBuffer
  xUint8Array = TA.Uint8Array
  browserSupport = true
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 *
 * Firefox is a special case because it doesn't allow augmenting "native" object
 * instances. See `ProxyBuffer` below for more details.
 */
function Buffer (subject, encoding) {
  var type = typeof subject

  // Work-around: node's base64 implementation
  // allows for non-padded strings while base64-js
  // does not..
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // Assume object is an array
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf = augment(new xUint8Array(length))
  if (Buffer.isBuffer(subject)) {
    // Speed optimization -- use set if we're copying from a Uint8Array
    buf.set(subject)
  } else if (isArrayIsh(subject)) {
    // Treat array-ish objects as a byte array.
    for (var i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function(encoding) {
  switch ((encoding + '').toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
    case 'raw':
      return true

    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return b && b._isBuffer
}

Buffer.byteLength = function (str, encoding) {
  switch (encoding || 'utf8') {
    case 'hex':
      return str.length / 2

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length

    case 'ascii':
    case 'binary':
      return str.length

    case 'base64':
      return base64ToBytes(str).length

    default:
      throw new Error('Unknown encoding')
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) {
    throw new Error('Usage: Buffer.concat(list, [totalLength])\n' +
        'list should be an Array.')
  }

  var i
  var buf

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      buf = list[i]
      totalLength += buf.length
    }
  }

  var buffer = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    buf = list[i]
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var bytes, pos
  return Buffer._charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
}

function _asciiWrite (buf, string, offset, length) {
  var bytes, pos
  return Buffer._charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var bytes, pos
  return Buffer._charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
}

function BufferWrite (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  switch (encoding) {
    case 'hex':
      return _hexWrite(this, string, offset, length)

    case 'utf8':
    case 'utf-8':
      return _utf8Write(this, string, offset, length)

    case 'ascii':
      return _asciiWrite(this, string, offset, length)

    case 'binary':
      return _binaryWrite(this, string, offset, length)

    case 'base64':
      return _base64Write(this, string, offset, length)

    default:
      throw new Error('Unknown encoding')
  }
}

function BufferToString (encoding, start, end) {
  var self = (this instanceof ProxyBuffer)
    ? this._proxy
    : this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  switch (encoding) {
    case 'hex':
      return _hexSlice(self, start, end)

    case 'utf8':
    case 'utf-8':
      return _utf8Slice(self, start, end)

    case 'ascii':
      return _asciiSlice(self, start, end)

    case 'binary':
      return _binarySlice(self, start, end)

    case 'base64':
      return _base64Slice(self, start, end)

    default:
      throw new Error('Unknown encoding')
  }
}

function BufferToJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
function BufferCopy (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start)
    throw new Error('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new Error('targetStart out of bounds')
  if (start < 0 || start >= source.length)
    throw new Error('sourceStart out of bounds')
  if (end < 0 || end > source.length)
    throw new Error('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  // copy!
  for (var i = 0; i < end - start; i++)
    target[i + target_start] = this[i + start]
}

function _base64Slice (buf, start, end) {
  var bytes = buf.slice(start, end)
  return base64.fromByteArray(bytes)
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

// TODO: add test that modifying the new buffer slice will modify memory in the
// original buffer! Use code from:
// http://nodejs.org/api/buffer.html#buffer_buf_slice_start_end
function BufferSlice (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)
  return augment(this.subarray(start, end)) // Uint8Array built-in method
}

function BufferReadUInt8 (offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < buf.length, 'Trying to read beyond buffer length')
  }

  if (offset >= buf.length)
    return

  return buf[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setUint8(0, buf[len - 1])
    return dv.getUint16(0, littleEndian)
  } else {
    return buf._dataview.getUint16(offset, littleEndian)
  }
}

function BufferReadUInt16LE (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

function BufferReadUInt16BE (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    for (var i = 0; i + offset < len; i++) {
      dv.setUint8(i, buf[i + offset])
    }
    return dv.getUint32(0, littleEndian)
  } else {
    return buf._dataview.getUint32(offset, littleEndian)
  }
}

function BufferReadUInt32LE (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

function BufferReadUInt32BE (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

function BufferReadInt8 (offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < buf.length, 'Trying to read beyond buffer length')
  }

  if (offset >= buf.length)
    return

  return buf._dataview.getInt8(offset)
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setUint8(0, buf[len - 1])
    return dv.getInt16(0, littleEndian)
  } else {
    return buf._dataview.getInt16(offset, littleEndian)
  }
}

function BufferReadInt16LE (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

function BufferReadInt16BE (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    for (var i = 0; i + offset < len; i++) {
      dv.setUint8(i, buf[i + offset])
    }
    return dv.getInt32(0, littleEndian)
  } else {
    return buf._dataview.getInt32(offset, littleEndian)
  }
}

function BufferReadInt32LE (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

function BufferReadInt32BE (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return buf._dataview.getFloat32(offset, littleEndian)
}

function BufferReadFloatLE (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

function BufferReadFloatBE (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return buf._dataview.getFloat64(offset, littleEndian)
}

function BufferReadDoubleLE (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

function BufferReadDoubleBE (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

function BufferWriteUInt8 (value, offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= buf.length) return

  buf[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setUint16(0, value, littleEndian)
    buf[offset] = dv.getUint8(0)
  } else {
    buf._dataview.setUint16(offset, value, littleEndian)
  }
}

function BufferWriteUInt16LE (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

function BufferWriteUInt16BE (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    dv.setUint32(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setUint32(offset, value, littleEndian)
  }
}

function BufferWriteUInt32LE (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

function BufferWriteUInt32BE (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

function BufferWriteInt8 (value, offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= buf.length) return

  buf._dataview.setInt8(offset, value)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setInt16(0, value, littleEndian)
    buf[offset] = dv.getUint8(0)
  } else {
    buf._dataview.setInt16(offset, value, littleEndian)
  }
}

function BufferWriteInt16LE (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

function BufferWriteInt16BE (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    dv.setInt32(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setInt32(offset, value, littleEndian)
  }
}

function BufferWriteInt32LE (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

function BufferWriteInt32BE (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    dv.setFloat32(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setFloat32(offset, value, littleEndian)
  }
}

function BufferWriteFloatLE (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

function BufferWriteFloatBE (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 7 >= len) {
    var dv = new xDataView(new xArrayBuffer(8))
    dv.setFloat64(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setFloat64(offset, value, littleEndian)
  }
}

function BufferWriteDoubleLE (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

function BufferWriteDoubleBE (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
function BufferFill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('value is not a number')
  }

  if (end < start) throw new Error('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds')
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds')
  }

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

function BufferInspect () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

// Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
// Added in Node 0.12.
function BufferToArrayBuffer () {
  return (new Buffer(this)).buffer
}


// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

/**
 * Class: ProxyBuffer
 * ==================
 *
 * Only used in Firefox, since Firefox does not allow augmenting "native"
 * objects (like Uint8Array instances) with new properties for some unknown
 * (probably silly) reason. So we'll use an ES6 Proxy (supported since
 * Firefox 18) to wrap the Uint8Array instance without actually adding any
 * properties to it.
 *
 * Instances of this "fake" Buffer class are the "target" of the
 * ES6 Proxy (see `augment` function).
 *
 * We couldn't just use the `Uint8Array` as the target of the `Proxy` because
 * Proxies have an important limitation on trapping the `toString` method.
 * `Object.prototype.toString.call(proxy)` gets called whenever something is
 * implicitly cast to a String. Unfortunately, with a `Proxy` this
 * unconditionally returns `Object.prototype.toString.call(target)` which would
 * always return "[object Uint8Array]" if we used the `Uint8Array` instance as
 * the target. And, remember, in Firefox we cannot redefine the `Uint8Array`
 * instance's `toString` method.
 *
 * So, we use this `ProxyBuffer` class as the proxy's "target". Since this class
 * has its own custom `toString` method, it will get called whenever `toString`
 * gets called, implicitly or explicitly, on the `Proxy` instance.
 *
 * We also have to define the Uint8Array methods `subarray` and `set` on
 * `ProxyBuffer` because if we didn't then `proxy.subarray(0)` would have its
 * `this` set to `proxy` (a `Proxy` instance) which throws an exception in
 * Firefox which expects it to be a `TypedArray` instance.
 */
function ProxyBuffer (arr) {
  this._arr = arr

  if (arr.byteLength !== 0)
    this._dataview = new xDataView(arr.buffer, arr.byteOffset, arr.byteLength)
}

ProxyBuffer.prototype = {
  _isBuffer: true,
  write: BufferWrite,
  toString: BufferToString,
  toLocaleString: BufferToString,
  toJSON: BufferToJSON,
  copy: BufferCopy,
  slice: BufferSlice,
  readUInt8: BufferReadUInt8,
  readUInt16LE: BufferReadUInt16LE,
  readUInt16BE: BufferReadUInt16BE,
  readUInt32LE: BufferReadUInt32LE,
  readUInt32BE: BufferReadUInt32BE,
  readInt8: BufferReadInt8,
  readInt16LE: BufferReadInt16LE,
  readInt16BE: BufferReadInt16BE,
  readInt32LE: BufferReadInt32LE,
  readInt32BE: BufferReadInt32BE,
  readFloatLE: BufferReadFloatLE,
  readFloatBE: BufferReadFloatBE,
  readDoubleLE: BufferReadDoubleLE,
  readDoubleBE: BufferReadDoubleBE,
  writeUInt8: BufferWriteUInt8,
  writeUInt16LE: BufferWriteUInt16LE,
  writeUInt16BE: BufferWriteUInt16BE,
  writeUInt32LE: BufferWriteUInt32LE,
  writeUInt32BE: BufferWriteUInt32BE,
  writeInt8: BufferWriteInt8,
  writeInt16LE: BufferWriteInt16LE,
  writeInt16BE: BufferWriteInt16BE,
  writeInt32LE: BufferWriteInt32LE,
  writeInt32BE: BufferWriteInt32BE,
  writeFloatLE: BufferWriteFloatLE,
  writeFloatBE: BufferWriteFloatBE,
  writeDoubleLE: BufferWriteDoubleLE,
  writeDoubleBE: BufferWriteDoubleBE,
  fill: BufferFill,
  inspect: BufferInspect,
  toArrayBuffer: BufferToArrayBuffer,
  subarray: function () {
    return this._arr.subarray.apply(this._arr, arguments)
  },
  set: function () {
    return this._arr.set.apply(this._arr, arguments)
  }
}

var ProxyHandler = {
  get: function (target, name) {
    if (name in target) return target[name]
    else return target._arr[name]
  },
  set: function (target, name, value) {
    target._arr[name] = value
  }
}

function augment (arr) {
  if (browserSupport) {
    arr._isBuffer = true

    // Augment the Uint8Array *instance* (not the class!) with Buffer methods
    arr.write = BufferWrite
    arr.toString = BufferToString
    arr.toLocaleString = BufferToString
    arr.toJSON = BufferToJSON
    arr.copy = BufferCopy
    arr.slice = BufferSlice
    arr.readUInt8 = BufferReadUInt8
    arr.readUInt16LE = BufferReadUInt16LE
    arr.readUInt16BE = BufferReadUInt16BE
    arr.readUInt32LE = BufferReadUInt32LE
    arr.readUInt32BE = BufferReadUInt32BE
    arr.readInt8 = BufferReadInt8
    arr.readInt16LE = BufferReadInt16LE
    arr.readInt16BE = BufferReadInt16BE
    arr.readInt32LE = BufferReadInt32LE
    arr.readInt32BE = BufferReadInt32BE
    arr.readFloatLE = BufferReadFloatLE
    arr.readFloatBE = BufferReadFloatBE
    arr.readDoubleLE = BufferReadDoubleLE
    arr.readDoubleBE = BufferReadDoubleBE
    arr.writeUInt8 = BufferWriteUInt8
    arr.writeUInt16LE = BufferWriteUInt16LE
    arr.writeUInt16BE = BufferWriteUInt16BE
    arr.writeUInt32LE = BufferWriteUInt32LE
    arr.writeUInt32BE = BufferWriteUInt32BE
    arr.writeInt8 = BufferWriteInt8
    arr.writeInt16LE = BufferWriteInt16LE
    arr.writeInt16BE = BufferWriteInt16BE
    arr.writeInt32LE = BufferWriteInt32LE
    arr.writeInt32BE = BufferWriteInt32BE
    arr.writeFloatLE = BufferWriteFloatLE
    arr.writeFloatBE = BufferWriteFloatBE
    arr.writeDoubleLE = BufferWriteDoubleLE
    arr.writeDoubleBE = BufferWriteDoubleBE
    arr.fill = BufferFill
    arr.inspect = BufferInspect

    // Only add `toArrayBuffer` if the browser supports ArrayBuffer natively
    if (xUint8Array !== TA.Uint8Array)
      arr.toArrayBuffer = BufferToArrayBuffer

    if (arr.byteLength !== 0)
      arr._dataview = new xDataView(arr.buffer, arr.byteOffset, arr.byteLength)

    return arr

  } else {
    // This is a browser that doesn't support augmenting the `Uint8Array`
    // instance (*ahem* Firefox) so use an ES6 `Proxy`.
    var proxyBuffer = new ProxyBuffer(arr)
    var proxy = new Proxy(proxyBuffer, ProxyHandler)
    proxyBuffer._proxy = proxy
    return proxy
  }
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayIsh (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }

  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos, i = 0
  while (i < length) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break

    dst[i + offset] = src[i]
    i++
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint (value, max) {
  assert(typeof (value) == 'number', 'cannot write a non-number as a number')
  assert(value >= 0,
      'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert(typeof (value) == 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754(value, max, min) {
  assert(typeof (value) == 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":96,"typedarray":97}],96:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}],97:[function(require,module,exports){
var undefined = (void 0); // Paranoia

// Beyond this value, index getters/setters (i.e. array[0], array[1]) are so slow to
// create, and consume so much memory, that the browser appears frozen.
var MAX_ARRAY_LENGTH = 1e5;

// Approximations of internal ECMAScript conversion functions
var ECMAScript = (function() {
  // Stash a copy in case other scripts modify these
  var opts = Object.prototype.toString,
      ophop = Object.prototype.hasOwnProperty;

  return {
    // Class returns internal [[Class]] property, used to avoid cross-frame instanceof issues:
    Class: function(v) { return opts.call(v).replace(/^\[object *|\]$/g, ''); },
    HasProperty: function(o, p) { return p in o; },
    HasOwnProperty: function(o, p) { return ophop.call(o, p); },
    IsCallable: function(o) { return typeof o === 'function'; },
    ToInt32: function(v) { return v >> 0; },
    ToUint32: function(v) { return v >>> 0; }
  };
}());

// Snapshot intrinsics
var LN2 = Math.LN2,
    abs = Math.abs,
    floor = Math.floor,
    log = Math.log,
    min = Math.min,
    pow = Math.pow,
    round = Math.round;

// ES5: lock down object properties
function configureProperties(obj) {
  if (getOwnPropNames && defineProp) {
    var props = getOwnPropNames(obj), i;
    for (i = 0; i < props.length; i += 1) {
      defineProp(obj, props[i], {
        value: obj[props[i]],
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
  }
}

// emulate ES5 getter/setter API using legacy APIs
// http://blogs.msdn.com/b/ie/archive/2010/09/07/transitioning-existing-code-to-the-es5-getter-setter-apis.aspx
// (second clause tests for Object.defineProperty() in IE<9 that only supports extending DOM prototypes, but
// note that IE<9 does not support __defineGetter__ or __defineSetter__ so it just renders the method harmless)
var defineProp
if (Object.defineProperty && (function() {
      try {
        Object.defineProperty({}, 'x', {});
        return true;
      } catch (e) {
        return false;
      }
    })()) {
  defineProp = Object.defineProperty;
} else {
  defineProp = function(o, p, desc) {
    if (!o === Object(o)) throw new TypeError("Object.defineProperty called on non-object");
    if (ECMAScript.HasProperty(desc, 'get') && Object.prototype.__defineGetter__) { Object.prototype.__defineGetter__.call(o, p, desc.get); }
    if (ECMAScript.HasProperty(desc, 'set') && Object.prototype.__defineSetter__) { Object.prototype.__defineSetter__.call(o, p, desc.set); }
    if (ECMAScript.HasProperty(desc, 'value')) { o[p] = desc.value; }
    return o;
  };
}

var getOwnPropNames = Object.getOwnPropertyNames || function (o) {
  if (o !== Object(o)) throw new TypeError("Object.getOwnPropertyNames called on non-object");
  var props = [], p;
  for (p in o) {
    if (ECMAScript.HasOwnProperty(o, p)) {
      props.push(p);
    }
  }
  return props;
};

// ES5: Make obj[index] an alias for obj._getter(index)/obj._setter(index, value)
// for index in 0 ... obj.length
function makeArrayAccessors(obj) {
  if (!defineProp) { return; }

  if (obj.length > MAX_ARRAY_LENGTH) throw new RangeError("Array too large for polyfill");

  function makeArrayAccessor(index) {
    defineProp(obj, index, {
      'get': function() { return obj._getter(index); },
      'set': function(v) { obj._setter(index, v); },
      enumerable: true,
      configurable: false
    });
  }

  var i;
  for (i = 0; i < obj.length; i += 1) {
    makeArrayAccessor(i);
  }
}

// Internal conversion functions:
//    pack<Type>()   - take a number (interpreted as Type), output a byte array
//    unpack<Type>() - take a byte array, output a Type-like number

function as_signed(value, bits) { var s = 32 - bits; return (value << s) >> s; }
function as_unsigned(value, bits) { var s = 32 - bits; return (value << s) >>> s; }

function packI8(n) { return [n & 0xff]; }
function unpackI8(bytes) { return as_signed(bytes[0], 8); }

function packU8(n) { return [n & 0xff]; }
function unpackU8(bytes) { return as_unsigned(bytes[0], 8); }

function packU8Clamped(n) { n = round(Number(n)); return [n < 0 ? 0 : n > 0xff ? 0xff : n & 0xff]; }

function packI16(n) { return [(n >> 8) & 0xff, n & 0xff]; }
function unpackI16(bytes) { return as_signed(bytes[0] << 8 | bytes[1], 16); }

function packU16(n) { return [(n >> 8) & 0xff, n & 0xff]; }
function unpackU16(bytes) { return as_unsigned(bytes[0] << 8 | bytes[1], 16); }

function packI32(n) { return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]; }
function unpackI32(bytes) { return as_signed(bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], 32); }

function packU32(n) { return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]; }
function unpackU32(bytes) { return as_unsigned(bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], 32); }

function packIEEE754(v, ebits, fbits) {

  var bias = (1 << (ebits - 1)) - 1,
      s, e, f, ln,
      i, bits, str, bytes;

  function roundToEven(n) {
    var w = floor(n), f = n - w;
    if (f < 0.5)
      return w;
    if (f > 0.5)
      return w + 1;
    return w % 2 ? w + 1 : w;
  }

  // Compute sign, exponent, fraction
  if (v !== v) {
    // NaN
    // http://dev.w3.org/2006/webapi/WebIDL/#es-type-mapping
    e = (1 << ebits) - 1; f = pow(2, fbits - 1); s = 0;
  } else if (v === Infinity || v === -Infinity) {
    e = (1 << ebits) - 1; f = 0; s = (v < 0) ? 1 : 0;
  } else if (v === 0) {
    e = 0; f = 0; s = (1 / v === -Infinity) ? 1 : 0;
  } else {
    s = v < 0;
    v = abs(v);

    if (v >= pow(2, 1 - bias)) {
      e = min(floor(log(v) / LN2), 1023);
      f = roundToEven(v / pow(2, e) * pow(2, fbits));
      if (f / pow(2, fbits) >= 2) {
        e = e + 1;
        f = 1;
      }
      if (e > bias) {
        // Overflow
        e = (1 << ebits) - 1;
        f = 0;
      } else {
        // Normalized
        e = e + bias;
        f = f - pow(2, fbits);
      }
    } else {
      // Denormalized
      e = 0;
      f = roundToEven(v / pow(2, 1 - bias - fbits));
    }
  }

  // Pack sign, exponent, fraction
  bits = [];
  for (i = fbits; i; i -= 1) { bits.push(f % 2 ? 1 : 0); f = floor(f / 2); }
  for (i = ebits; i; i -= 1) { bits.push(e % 2 ? 1 : 0); e = floor(e / 2); }
  bits.push(s ? 1 : 0);
  bits.reverse();
  str = bits.join('');

  // Bits to bytes
  bytes = [];
  while (str.length) {
    bytes.push(parseInt(str.substring(0, 8), 2));
    str = str.substring(8);
  }
  return bytes;
}

function unpackIEEE754(bytes, ebits, fbits) {

  // Bytes to bits
  var bits = [], i, j, b, str,
      bias, s, e, f;

  for (i = bytes.length; i; i -= 1) {
    b = bytes[i - 1];
    for (j = 8; j; j -= 1) {
      bits.push(b % 2 ? 1 : 0); b = b >> 1;
    }
  }
  bits.reverse();
  str = bits.join('');

  // Unpack sign, exponent, fraction
  bias = (1 << (ebits - 1)) - 1;
  s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
  e = parseInt(str.substring(1, 1 + ebits), 2);
  f = parseInt(str.substring(1 + ebits), 2);

  // Produce number
  if (e === (1 << ebits) - 1) {
    return f !== 0 ? NaN : s * Infinity;
  } else if (e > 0) {
    // Normalized
    return s * pow(2, e - bias) * (1 + f / pow(2, fbits));
  } else if (f !== 0) {
    // Denormalized
    return s * pow(2, -(bias - 1)) * (f / pow(2, fbits));
  } else {
    return s < 0 ? -0 : 0;
  }
}

function unpackF64(b) { return unpackIEEE754(b, 11, 52); }
function packF64(v) { return packIEEE754(v, 11, 52); }
function unpackF32(b) { return unpackIEEE754(b, 8, 23); }
function packF32(v) { return packIEEE754(v, 8, 23); }


//
// 3 The ArrayBuffer Type
//

(function() {

  /** @constructor */
  var ArrayBuffer = function ArrayBuffer(length) {
    length = ECMAScript.ToInt32(length);
    if (length < 0) throw new RangeError('ArrayBuffer size is not a small enough positive integer');

    this.byteLength = length;
    this._bytes = [];
    this._bytes.length = length;

    var i;
    for (i = 0; i < this.byteLength; i += 1) {
      this._bytes[i] = 0;
    }

    configureProperties(this);
  };

  exports.ArrayBuffer = exports.ArrayBuffer || ArrayBuffer;

  //
  // 4 The ArrayBufferView Type
  //

  // NOTE: this constructor is not exported
  /** @constructor */
  var ArrayBufferView = function ArrayBufferView() {
    //this.buffer = null;
    //this.byteOffset = 0;
    //this.byteLength = 0;
  };

  //
  // 5 The Typed Array View Types
  //

  function makeConstructor(bytesPerElement, pack, unpack) {
    // Each TypedArray type requires a distinct constructor instance with
    // identical logic, which this produces.

    var ctor;
    ctor = function(buffer, byteOffset, length) {
      var array, sequence, i, s;

      if (!arguments.length || typeof arguments[0] === 'number') {
        // Constructor(unsigned long length)
        this.length = ECMAScript.ToInt32(arguments[0]);
        if (length < 0) throw new RangeError('ArrayBufferView size is not a small enough positive integer');

        this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        this.buffer = new ArrayBuffer(this.byteLength);
        this.byteOffset = 0;
      } else if (typeof arguments[0] === 'object' && arguments[0].constructor === ctor) {
        // Constructor(TypedArray array)
        array = arguments[0];

        this.length = array.length;
        this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        this.buffer = new ArrayBuffer(this.byteLength);
        this.byteOffset = 0;

        for (i = 0; i < this.length; i += 1) {
          this._setter(i, array._getter(i));
        }
      } else if (typeof arguments[0] === 'object' &&
                 !(arguments[0] instanceof ArrayBuffer || ECMAScript.Class(arguments[0]) === 'ArrayBuffer')) {
        // Constructor(sequence<type> array)
        sequence = arguments[0];

        this.length = ECMAScript.ToUint32(sequence.length);
        this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        this.buffer = new ArrayBuffer(this.byteLength);
        this.byteOffset = 0;

        for (i = 0; i < this.length; i += 1) {
          s = sequence[i];
          this._setter(i, Number(s));
        }
      } else if (typeof arguments[0] === 'object' &&
                 (arguments[0] instanceof ArrayBuffer || ECMAScript.Class(arguments[0]) === 'ArrayBuffer')) {
        // Constructor(ArrayBuffer buffer,
        //             optional unsigned long byteOffset, optional unsigned long length)
        this.buffer = buffer;

        this.byteOffset = ECMAScript.ToUint32(byteOffset);
        if (this.byteOffset > this.buffer.byteLength) {
          throw new RangeError("byteOffset out of range");
        }

        if (this.byteOffset % this.BYTES_PER_ELEMENT) {
          // The given byteOffset must be a multiple of the element
          // size of the specific type, otherwise an exception is raised.
          throw new RangeError("ArrayBuffer length minus the byteOffset is not a multiple of the element size.");
        }

        if (arguments.length < 3) {
          this.byteLength = this.buffer.byteLength - this.byteOffset;

          if (this.byteLength % this.BYTES_PER_ELEMENT) {
            throw new RangeError("length of buffer minus byteOffset not a multiple of the element size");
          }
          this.length = this.byteLength / this.BYTES_PER_ELEMENT;
        } else {
          this.length = ECMAScript.ToUint32(length);
          this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        }

        if ((this.byteOffset + this.byteLength) > this.buffer.byteLength) {
          throw new RangeError("byteOffset and length reference an area beyond the end of the buffer");
        }
      } else {
        throw new TypeError("Unexpected argument type(s)");
      }

      this.constructor = ctor;

      configureProperties(this);
      makeArrayAccessors(this);
    };

    ctor.prototype = new ArrayBufferView();
    ctor.prototype.BYTES_PER_ELEMENT = bytesPerElement;
    ctor.prototype._pack = pack;
    ctor.prototype._unpack = unpack;
    ctor.BYTES_PER_ELEMENT = bytesPerElement;

    // getter type (unsigned long index);
    ctor.prototype._getter = function(index) {
      if (arguments.length < 1) throw new SyntaxError("Not enough arguments");

      index = ECMAScript.ToUint32(index);
      if (index >= this.length) {
        return undefined;
      }

      var bytes = [], i, o;
      for (i = 0, o = this.byteOffset + index * this.BYTES_PER_ELEMENT;
           i < this.BYTES_PER_ELEMENT;
           i += 1, o += 1) {
        bytes.push(this.buffer._bytes[o]);
      }
      return this._unpack(bytes);
    };

    // NONSTANDARD: convenience alias for getter: type get(unsigned long index);
    ctor.prototype.get = ctor.prototype._getter;

    // setter void (unsigned long index, type value);
    ctor.prototype._setter = function(index, value) {
      if (arguments.length < 2) throw new SyntaxError("Not enough arguments");

      index = ECMAScript.ToUint32(index);
      if (index >= this.length) {
        return undefined;
      }

      var bytes = this._pack(value), i, o;
      for (i = 0, o = this.byteOffset + index * this.BYTES_PER_ELEMENT;
           i < this.BYTES_PER_ELEMENT;
           i += 1, o += 1) {
        this.buffer._bytes[o] = bytes[i];
      }
    };

    // void set(TypedArray array, optional unsigned long offset);
    // void set(sequence<type> array, optional unsigned long offset);
    ctor.prototype.set = function(index, value) {
      if (arguments.length < 1) throw new SyntaxError("Not enough arguments");
      var array, sequence, offset, len,
          i, s, d,
          byteOffset, byteLength, tmp;

      if (typeof arguments[0] === 'object' && arguments[0].constructor === this.constructor) {
        // void set(TypedArray array, optional unsigned long offset);
        array = arguments[0];
        offset = ECMAScript.ToUint32(arguments[1]);

        if (offset + array.length > this.length) {
          throw new RangeError("Offset plus length of array is out of range");
        }

        byteOffset = this.byteOffset + offset * this.BYTES_PER_ELEMENT;
        byteLength = array.length * this.BYTES_PER_ELEMENT;

        if (array.buffer === this.buffer) {
          tmp = [];
          for (i = 0, s = array.byteOffset; i < byteLength; i += 1, s += 1) {
            tmp[i] = array.buffer._bytes[s];
          }
          for (i = 0, d = byteOffset; i < byteLength; i += 1, d += 1) {
            this.buffer._bytes[d] = tmp[i];
          }
        } else {
          for (i = 0, s = array.byteOffset, d = byteOffset;
               i < byteLength; i += 1, s += 1, d += 1) {
            this.buffer._bytes[d] = array.buffer._bytes[s];
          }
        }
      } else if (typeof arguments[0] === 'object' && typeof arguments[0].length !== 'undefined') {
        // void set(sequence<type> array, optional unsigned long offset);
        sequence = arguments[0];
        len = ECMAScript.ToUint32(sequence.length);
        offset = ECMAScript.ToUint32(arguments[1]);

        if (offset + len > this.length) {
          throw new RangeError("Offset plus length of array is out of range");
        }

        for (i = 0; i < len; i += 1) {
          s = sequence[i];
          this._setter(offset + i, Number(s));
        }
      } else {
        throw new TypeError("Unexpected argument type(s)");
      }
    };

    // TypedArray subarray(long begin, optional long end);
    ctor.prototype.subarray = function(start, end) {
      function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

      start = ECMAScript.ToInt32(start);
      end = ECMAScript.ToInt32(end);

      if (arguments.length < 1) { start = 0; }
      if (arguments.length < 2) { end = this.length; }

      if (start < 0) { start = this.length + start; }
      if (end < 0) { end = this.length + end; }

      start = clamp(start, 0, this.length);
      end = clamp(end, 0, this.length);

      var len = end - start;
      if (len < 0) {
        len = 0;
      }

      return new this.constructor(
        this.buffer, this.byteOffset + start * this.BYTES_PER_ELEMENT, len);
    };

    return ctor;
  }

  var Int8Array = makeConstructor(1, packI8, unpackI8);
  var Uint8Array = makeConstructor(1, packU8, unpackU8);
  var Uint8ClampedArray = makeConstructor(1, packU8Clamped, unpackU8);
  var Int16Array = makeConstructor(2, packI16, unpackI16);
  var Uint16Array = makeConstructor(2, packU16, unpackU16);
  var Int32Array = makeConstructor(4, packI32, unpackI32);
  var Uint32Array = makeConstructor(4, packU32, unpackU32);
  var Float32Array = makeConstructor(4, packF32, unpackF32);
  var Float64Array = makeConstructor(8, packF64, unpackF64);

  exports.Int8Array = exports.Int8Array || Int8Array;
  exports.Uint8Array = exports.Uint8Array || Uint8Array;
  exports.Uint8ClampedArray = exports.Uint8ClampedArray || Uint8ClampedArray;
  exports.Int16Array = exports.Int16Array || Int16Array;
  exports.Uint16Array = exports.Uint16Array || Uint16Array;
  exports.Int32Array = exports.Int32Array || Int32Array;
  exports.Uint32Array = exports.Uint32Array || Uint32Array;
  exports.Float32Array = exports.Float32Array || Float32Array;
  exports.Float64Array = exports.Float64Array || Float64Array;
}());

//
// 6 The DataView View Type
//

(function() {
  function r(array, index) {
    return ECMAScript.IsCallable(array.get) ? array.get(index) : array[index];
  }

  var IS_BIG_ENDIAN = (function() {
    var u16array = new(exports.Uint16Array)([0x1234]),
        u8array = new(exports.Uint8Array)(u16array.buffer);
    return r(u8array, 0) === 0x12;
  }());

  // Constructor(ArrayBuffer buffer,
  //             optional unsigned long byteOffset,
  //             optional unsigned long byteLength)
  /** @constructor */
  var DataView = function DataView(buffer, byteOffset, byteLength) {
    if (arguments.length === 0) {
      buffer = new exports.ArrayBuffer(0);
    } else if (!(buffer instanceof exports.ArrayBuffer || ECMAScript.Class(buffer) === 'ArrayBuffer')) {
      throw new TypeError("TypeError");
    }

    this.buffer = buffer || new exports.ArrayBuffer(0);

    this.byteOffset = ECMAScript.ToUint32(byteOffset);
    if (this.byteOffset > this.buffer.byteLength) {
      throw new RangeError("byteOffset out of range");
    }

    if (arguments.length < 3) {
      this.byteLength = this.buffer.byteLength - this.byteOffset;
    } else {
      this.byteLength = ECMAScript.ToUint32(byteLength);
    }

    if ((this.byteOffset + this.byteLength) > this.buffer.byteLength) {
      throw new RangeError("byteOffset and length reference an area beyond the end of the buffer");
    }

    configureProperties(this);
  };

  function makeGetter(arrayType) {
    return function(byteOffset, littleEndian) {

      byteOffset = ECMAScript.ToUint32(byteOffset);

      if (byteOffset + arrayType.BYTES_PER_ELEMENT > this.byteLength) {
        throw new RangeError("Array index out of range");
      }
      byteOffset += this.byteOffset;

      var uint8Array = new exports.Uint8Array(this.buffer, byteOffset, arrayType.BYTES_PER_ELEMENT),
          bytes = [], i;
      for (i = 0; i < arrayType.BYTES_PER_ELEMENT; i += 1) {
        bytes.push(r(uint8Array, i));
      }

      if (Boolean(littleEndian) === Boolean(IS_BIG_ENDIAN)) {
        bytes.reverse();
      }

      return r(new arrayType(new exports.Uint8Array(bytes).buffer), 0);
    };
  }

  DataView.prototype.getUint8 = makeGetter(exports.Uint8Array);
  DataView.prototype.getInt8 = makeGetter(exports.Int8Array);
  DataView.prototype.getUint16 = makeGetter(exports.Uint16Array);
  DataView.prototype.getInt16 = makeGetter(exports.Int16Array);
  DataView.prototype.getUint32 = makeGetter(exports.Uint32Array);
  DataView.prototype.getInt32 = makeGetter(exports.Int32Array);
  DataView.prototype.getFloat32 = makeGetter(exports.Float32Array);
  DataView.prototype.getFloat64 = makeGetter(exports.Float64Array);

  function makeSetter(arrayType) {
    return function(byteOffset, value, littleEndian) {

      byteOffset = ECMAScript.ToUint32(byteOffset);
      if (byteOffset + arrayType.BYTES_PER_ELEMENT > this.byteLength) {
        throw new RangeError("Array index out of range");
      }

      // Get bytes
      var typeArray = new arrayType([value]),
          byteArray = new exports.Uint8Array(typeArray.buffer),
          bytes = [], i, byteView;

      for (i = 0; i < arrayType.BYTES_PER_ELEMENT; i += 1) {
        bytes.push(r(byteArray, i));
      }

      // Flip if necessary
      if (Boolean(littleEndian) === Boolean(IS_BIG_ENDIAN)) {
        bytes.reverse();
      }

      // Write them
      byteView = new exports.Uint8Array(this.buffer, byteOffset, arrayType.BYTES_PER_ELEMENT);
      byteView.set(bytes);
    };
  }

  DataView.prototype.setUint8 = makeSetter(exports.Uint8Array);
  DataView.prototype.setInt8 = makeSetter(exports.Int8Array);
  DataView.prototype.setUint16 = makeSetter(exports.Uint16Array);
  DataView.prototype.setInt16 = makeSetter(exports.Int16Array);
  DataView.prototype.setUint32 = makeSetter(exports.Uint32Array);
  DataView.prototype.setInt32 = makeSetter(exports.Int32Array);
  DataView.prototype.setFloat32 = makeSetter(exports.Float32Array);
  DataView.prototype.setFloat64 = makeSetter(exports.Float64Array);

  exports.DataView = exports.DataView || DataView;

}());

},{}],98:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;
var inherits = require('inherits');
var setImmediate = require('process/browser.js').nextTick;
var Readable = require('./readable.js');
var Writable = require('./writable.js');

inherits(Duplex, Readable);

Duplex.prototype.write = Writable.prototype.write;
Duplex.prototype.end = Writable.prototype.end;
Duplex.prototype._write = Writable.prototype._write;

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  var self = this;
  setImmediate(function () {
    self.end();
  });
}

},{"./readable.js":102,"./writable.js":104,"inherits":93,"process/browser.js":100}],99:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('./readable.js');
Stream.Writable = require('./writable.js');
Stream.Duplex = require('./duplex.js');
Stream.Transform = require('./transform.js');
Stream.PassThrough = require('./passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"./duplex.js":98,"./passthrough.js":101,"./readable.js":102,"./transform.js":103,"./writable.js":104,"events":92,"inherits":93}],100:[function(require,module,exports){
module.exports=require(94)
},{}],101:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./transform.js');
var inherits = require('inherits');
inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./transform.js":103,"inherits":93}],102:[function(require,module,exports){
var process=require("__browserify_process");// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;
Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;
var Stream = require('./index.js');
var Buffer = require('buffer').Buffer;
var setImmediate = require('process/browser.js').nextTick;
var StringDecoder;

var inherits = require('inherits');
inherits(Readable, Stream);

function ReadableState(options, stream) {
  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = false;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // In streams that never have any data, and do push(null) right away,
  // the consumer can miss the 'end' event if they do some I/O before
  // consuming the stream.  So, we don't emit('end') until some reading
  // happens.
  this.calledRead = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (typeof chunk === 'string' && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null || chunk === undefined) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      // update the buffer info.
      state.length += state.objectMode ? 1 : chunk.length;
      if (addToFront) {
        state.buffer.unshift(chunk);
      } else {
        state.reading = false;
        state.buffer.push(chunk);
      }

      if (state.needReadable)
        emitReadable(stream);

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || n === null) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  var state = this._readableState;
  state.calledRead = true;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;

  // if we currently have less than the highWaterMark, then also read some
  if (state.length - n <= state.highWaterMark)
    doRead = true;

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading)
    doRead = false;

  if (doRead) {
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read called its callback synchronously, then `reading`
  // will be false, and we need to re-evaluate how much data we
  // can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we happened to read() exactly the remaining amount in the
  // buffer, and the EOF has been seen at this point, then make sure
  // that we emit 'end' on the very next tick.
  if (state.ended && !state.endEmitted && state.length === 0)
    endReadable(this);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode &&
      !er) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // if we've ended and we have some data left, then emit
  // 'readable' now to make sure it gets picked up.
  if (state.length > 0)
    emitReadable(stream);
  else
    endReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (state.emittedReadable)
    return;

  state.emittedReadable = true;
  if (state.sync)
    setImmediate(function() {
      emitReadable_(stream);
    });
  else
    emitReadable_(stream);
}

function emitReadable_(stream) {
  stream.emit('readable');
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    setImmediate(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    setImmediate(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    if (readable !== src) return;
    cleanup();
  }

  function onend() {
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (!dest._writableState || dest._writableState.needDrain)
      ondrain();
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  // check for listeners before emit removes one-time listeners.
  var errListeners = EE.listenerCount(dest, 'error');
  function onerror(er) {
    unpipe();
    if (errListeners === 0 && EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  dest.once('error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    // the handler that waits for readable events after all
    // the data gets sucked out in flow.
    // This would be easier to follow with a .once() handler
    // in flow(), but that is too slow.
    this.on('readable', pipeOnReadable);

    state.flowing = true;
    setImmediate(function() {
      flow(src);
    });
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var dest = this;
    var state = src._readableState;
    state.awaitDrain--;
    if (state.awaitDrain === 0)
      flow(src);
  };
}

function flow(src) {
  var state = src._readableState;
  var chunk;
  state.awaitDrain = 0;

  function write(dest, i, list) {
    var written = dest.write(chunk);
    if (false === written) {
      state.awaitDrain++;
    }
  }

  while (state.pipesCount && null !== (chunk = src.read())) {

    if (state.pipesCount === 1)
      write(state.pipes, 0, null);
    else
      forEach(state.pipes, write);

    src.emit('data', chunk);

    // if anyone needs a drain, then we have to wait for that.
    if (state.awaitDrain > 0)
      return;
  }

  // if every destination was unpiped, either before entering this
  // function, or in the while loop, then stop flowing.
  //
  // NB: This is a pretty rare edge case.
  if (state.pipesCount === 0) {
    state.flowing = false;

    // if there were data event listeners added, then switch to old mode.
    if (EE.listenerCount(src, 'data') > 0)
      emitDataEvents(src);
    return;
  }

  // at this point, no one needed a drain, so we just ran out of data
  // on the next readable event, start it over again.
  state.ranOut = true;
}

function pipeOnReadable() {
  if (this._readableState.ranOut) {
    this._readableState.ranOut = false;
    flow(this);
  }
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data' && !this._readableState.flowing)
    emitDataEvents(this);

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        this.read(0);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  emitDataEvents(this);
  this.read(0);
  this.emit('resume');
};

Readable.prototype.pause = function() {
  emitDataEvents(this, true);
  this.emit('pause');
};

function emitDataEvents(stream, startPaused) {
  var state = stream._readableState;

  if (state.flowing) {
    // https://github.com/isaacs/readable-stream/issues/16
    throw new Error('Cannot switch to old mode now.');
  }

  var paused = startPaused || false;
  var readable = false;

  // convert to an old-style stream.
  stream.readable = true;
  stream.pipe = Stream.prototype.pipe;
  stream.on = stream.addListener = Stream.prototype.on;

  stream.on('readable', function() {
    readable = true;

    var c;
    while (!paused && (null !== (c = stream.read())))
      stream.emit('data', c);

    if (c === null) {
      readable = false;
      stream._readableState.needReadable = true;
    }
  });

  stream.pause = function() {
    paused = true;
    this.emit('pause');
  };

  stream.resume = function() {
    paused = false;
    if (readable)
      setImmediate(function() {
        stream.emit('readable');
      });
    else
      this.read(0);
    this.emit('resume');
  };

  // now make it start, just in case it hadn't already.
  stream.emit('readable');
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (typeof stream[i] === 'function' &&
        typeof this[i] === 'undefined') {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, function (x) {
      return self.emit.apply(self, ev, x);
    });
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted && state.calledRead) {
    state.ended = true;
    setImmediate(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

},{"./index.js":99,"__browserify_process":94,"buffer":95,"events":92,"inherits":93,"process/browser.js":100,"string_decoder":105}],103:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./duplex.js');
var inherits = require('inherits');
inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined)
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  var ts = this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('finish', function() {
    if ('function' === typeof this._flush)
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (ts.writechunk && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var rs = stream._readableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./duplex.js":98,"inherits":93}],104:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;
Writable.WritableState = WritableState;

var inherits = require('inherits');
var Stream = require('./index.js');
var setImmediate = require('process/browser.js').nextTick;
var Buffer = require('buffer').Buffer;

inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];
}

function Writable(options) {
  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Stream.Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  setImmediate(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    setImmediate(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (typeof cb !== 'function')
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb))
    ret = writeOrBuffer(this, state, chunk, encoding, cb);

  return ret;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  state.needDrain = !ret;

  if (state.writing)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    setImmediate(function() {
      cb(er);
    });
  else
    cb(er);

  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished && !state.bufferProcessing && state.buffer.length)
      clearBuffer(stream, state);

    if (sync) {
      setImmediate(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  cb();
  if (finished)
    finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  for (var c = 0; c < state.buffer.length; c++) {
    var entry = state.buffer[c];
    var chunk = entry.chunk;
    var encoding = entry.encoding;
    var cb = entry.callback;
    var len = state.objectMode ? 1 : chunk.length;

    doWrite(stream, state, len, chunk, encoding, cb);

    // if we didn't call the onwrite immediately, then
    // it means that we need to wait until it does.
    // also, that means that the chunk and cb are currently
    // being processed, so move the buffer counter past them.
    if (state.writing) {
      c++;
      break;
    }
  }

  state.bufferProcessing = false;
  if (c < state.buffer.length)
    state.buffer = state.buffer.slice(c);
  else
    state.buffer.length = 0;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (typeof chunk !== 'undefined' && chunk !== null)
    this.write(chunk, encoding);

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    state.finished = true;
    stream.emit('finish');
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      setImmediate(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

},{"./index.js":99,"buffer":95,"inherits":93,"process/browser.js":100}],105:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

function assertEncoding(encoding) {
  if (encoding && !Buffer.isEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  this.charBuffer = new Buffer(6);
  this.charReceived = 0;
  this.charLength = 0;
};


StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  var offset = 0;

  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var i = (buffer.length >= this.charLength - this.charReceived) ?
                this.charLength - this.charReceived :
                buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, offset, i);
    this.charReceived += (i - offset);
    offset = i;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (i == buffer.length) return charStr;

    // otherwise cut off the characters end from the beginning of this buffer
    buffer = buffer.slice(i, buffer.length);
    break;
  }

  var lenIncomplete = this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - lenIncomplete, end);
    this.charReceived = lenIncomplete;
    end -= lenIncomplete;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    this.charBuffer.write(charStr.charAt(charStr.length - 1), this.encoding);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }

  return i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 2;
  this.charLength = incomplete ? 2 : 0;
  return incomplete;
}

function base64DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 3;
  this.charLength = incomplete ? 3 : 0;
  return incomplete;
}

},{"buffer":95}]},{},[1])
;