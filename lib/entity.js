'use strict';

var now = require('now');
var _ = require('lodash');
var debug = require('debug')('entity');
var inherits = require('inherits');
//var EventEmitter = require('events').EventEmitter;

var log = require('./log');
var TWEEN = require('tween');
var settings = require('./settings');
var LifeBar = require('./elements/slifebar');
var AttackCircle = require('./controls/attackcircle');
var Inventory = require('./inventory');
var Steering = require('./ai/steering');
var TargetSystem = require('./target-system');
var CoverSystem = require('./cover-system');

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

  this.steerings = new Steering.machine();
  // this.steerings.currently('seek', true);
  // this.steerings.currently('wander', true);

  this.targetSystem = new TargetSystem(this.game, this);
  this.coverSystem = new CoverSystem(this.game, this);

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
Entity.prototype.toString = function () {

  return this.constructor.name + '#' + this.id;
};

/**
 * Return the current entity target
 */
Entity.prototype.currentTarget = function () {

  return this._crowd_destination || this._crowd_following;
};

/**
 * Return the current entity target
 */
Entity.prototype.setTarget = function (targetInfos) {

  this.emit('destination', targetInfos);
  this._crowd_destination = targetInfos;

  return this;
};

/**
 * Return the current entity target
 */
Entity.prototype.clearTarget = function () {

  this.emit('nodestination');
  this._crowd_destination = this._crowd_following = null;

  return this;
};


/**
 * Return the current entity target
 */
Entity.prototype.atTarget = function () {

  return this.currentTarget().position.distanceTo(this.position) < 3.0;
};

/**
 * Return the current entity target
 */
Entity.prototype.hasTarget = function () {

  return !! this.currentTarget();
};


/**
 * Apply defined steerings functions to the current entity
 */
Entity.prototype.applySteerings = function () {

  var now = Date.now();

  if (this._lastSteerings === undefined || this._lastSteerings < now - 500) {
    this._lastSteerings = now;

    if (this.hasTarget() && ! this.atTarget() && this.steerings.currently('seek')) {
      this.game.pathfinder.crowdRequestMoveTarget(this._crowd_idx, Steering.seek(this.arena, this, this.currentTarget()));

    } else if (this.hasTarget() && this.steerings.currently('flee')) {
      this.game.pathfinder.crowdRequestMoveTarget(this._crowd_idx, Steering.flee(this.arena, this, this.currentTarget()));

    } else if (this.hasTarget() && this.steerings.currently('hide')) {
      this.game.pathfinder.crowdRequestMoveTarget(this._crowd_idx, Steering.hide(this.arena, this, this.currentTarget()));

    } else {
      // clear crowd targetting
      // this.clearTarget();

      if (this.steerings.currently('wander')) {
        this.game.pathfinder.crowdRequestMoveTarget(this._crowd_idx, Steering.wander(this.arena, this));
      }
    }

  }

  return this;
};

/**
 * Attach a life/mana bar above the entity
 */
Entity.prototype.attachLifeBar = function () {

  this.lifebar = new LifeBar();
};

/**
 * Update the character lifebar
 */
Entity.prototype.updateLifeBar = function () {

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
Entity.prototype.attachTombstone = function () {

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
      var children;

      if (self.children) {
        children = _.clone(self.children);
        _.each(children, function(child){ self.remove(child); });
      }

      if (self.character && self.character.children) {
        children = _.clone(self.character.children);
        _.each(children, function(child){ self.character.remove(child); });
      }

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

Entity.prototype.jump = function() {
  var self = this;
  if (! self.jumpingTween) {
    self.jumpingTween = new TWEEN.Tween({
          jump: 0
      })
      .to({
          jump: 1
      }, 500)
      .onUpdate(function(){
          var height = 10;
          // self.position.y = 10 * (1 - Math.abs(this.jump));
          self.position.y = height - Math.abs(this.jump % (2*height) - height);
      })
      .onComplete(function(){
          self.jumpingTween = null;
      })
      .start();
  }
};

Entity.prototype.quests = function() {

    return this.questMark && this._quests ? this._quests : null;
};

/**
 * Learn a spell
 * @param  {Spell} spell class
 * @trigger 'changed'
 */
Entity.prototype.learnSpell = function(SpellClass, args) {

  var spell = new SpellClass(_.extend(args || {}, { source: this }));

  if (args && args.events) {
    _.each(args.events, function (func, event) {
      spell.on(event, func);
    });
  }

  this.state.spells.push(spell);

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
