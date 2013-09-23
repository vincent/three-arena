/**
 * @module Entity
 */
define('threearena/entity',
    ['lodash', 'microevent', 'threejs', 'knockout', 'threearena/log', 'threearena/utils', 'threearena/elements/lifebar', 'threearena/pathfinding/recast.emcc.dota.mountains',],

function(_, MicroEvent, THREE, ko, log, Utils, LifeBar, PathFinding) {
    PathFinding = Module;

    /**
     * A living entity
     * 
     * @fires 'changed' when state (attributes, spells, etc) change
     * @fires 'hit' when being hit
     * @fires 'death' when being killed
     *
     * @constructor
     * @param {Object} options
     *          name, image, life, mana, strength, agility, intelligence,
     *          spells, level, meleeDef, meleeDamage, spellDefense, spellDamage
     */
    var Entity = function(options) {

        var self = this;

        THREE.Object3D.apply(this);

        this.state = _.merge({

            name: Math.random(),
            image: '/gamedata/unknown.png',

            life: 100,
            mana: 0,

            strength: 0,
            agility: 0,
            intelligence: 0,

            spells: [],

            level: 1,

            meleeDefense: 1,
            meleeDamage: 1,

            spellDefense: 1,
            spellDamage: 1,

        }, options);

        this._baseLife = this.state.life;
        this._baseMana = this.state.mana;

        this.attachLifeBar();

        this.states = {

            idle: function() { },

            canFightObjective: function () {
                return self.objective && self.state.spells[0].canHit(self, self.objective);
            },
            fightObjective: function () {
                self.cast(self.state.spells[0], self.objective);
            },

            canFightNearbyEnnemy: function () {
                var spell;
                if (self.state.autoAttackSpell !== null && self.state.autoAttacks && self.state.spells[ self.state.autoAttackSpell ]) {

                    var i = -1,
                        charDistance,
                        minDistance = Number.MAX_VALUE,
                        spell = self.state.spells[ self.state.autoAttackSpell ];

                    self._nearestEnnemy = false;
                    while (i++ < game.pcs.length - 1) {

                        charDistance = game.pcs[i].position.distanceTo(self.position);

                        if (charDistance < minDistance && self.state.team != game.pcs[i].state.team && spell.canHit(self, game.pcs[i], 3)) {
                            minDistance = charDistance;
                            self._nearestEnnemy = game.pcs[i];
                        }
                    }
                }
                if (! self._nearestEnnemy) {

                    if (self._isFighting) {
                        // was fighting, must replan
                        self._currentRoute = null;
                        self._isMoving = false;
                    }

                    // nnope, no one's there
                    self._isFighting = false;
                    return false;

                } else {

                    return true;
                }
            },
            fightNearbyEnnemy: function () {
                if (self._currentTween) {
                    self._isMoving = false;
                    self._currentTween.stop();
                    self._currentTween.onComplete();
                }
                self._isFighting = true;
                self.cast(self.state.spells[0], self._nearestEnnemy);
            },

            plotCourseToObjective: function () {
                self._currentRoute || PathFinding.findPath(
                    self.position.x, self.position.y, self.position.z,
                    self.objective.position.x, self.objective.position.y, self.objective.position.z,
                    100000,
                    Utils.gcb( _.bind( self._setRoute, self) )
                );
            },
            canPlotCourseToObjective: function () {
                return self.objective && ! this._isFighting && ! self._currentRoute;
            },

            followCourseToObjective: function () {
                if (self._isMoving || ! self._currentRoute) return;
                if (self._currentTween) {
                    self._currentTween.stop();
                    self._currentTween.onComplete();
                }
                this._isFighting = false;
                self._currentTween = self.moveAlong(self._currentRoute, {
                    onStart: function(){
                        self._isMoving = true;
                    },
                    onComplete: function(){
                        self._isMoving = false;
                        //self._currentRoute = null;
                    }
                });
            },

            canFollowCourseToObjective: function () {
                return self.objective 
                        && self._currentRoute 
                        && ! this._isFighting 
                        && ! self.states.canFightObjective()
                        && ! self.states.canFightNearbyEnnemy();
            },

            moveAttackToObjective: function () {
                self.states.followCourseToObjective();
            },

            canMoveAttackToObjective: function () {
                return (self.objective && self.objective.position.distanceTo(self.position) > 2);
            },

        };

        this.trigger('changed', this.state);
    };

    Entity.prototype = new THREE.Object3D();

    //////////////////

    Entity.prototype._setRoute = function (linepoints) {

        if (linepoints && linepoints.length > 0) {
            log(log.SYS_DEBUG, '%o finds a way from %o to %o', this, linepoints[0], linepoints[linepoints.length - 1]);

            this._currentRoute = linepoints; // new THREE.SplineCurve3(linepoints);

        } else {
            this._currentRoute = null;
        }
    }

    //////////////////

    /**
     * Attach a life/mana bar above the entity
     */
    Entity.prototype.attachLifeBar = function() {

        this.lifebar = new LifeBar();
        this.updateLifeBar();
        this.add(this.lifebar);
    };

    /**
     * Update the character lifebar
     */
    Entity.prototype.updateLifeBar = function() {

        var eventData = {
            life: this._baseLife === false ? false : this._baseLife > 0 ? 1 / this._baseLife * this.state.life : 0,
            mana: this._baseMana === false ? false : this._baseMana > 0 ? 1 / this._baseMana * this.state.mana : 0
        };

        this.trigger('changed', eventData);

        this.lifebar.set(eventData);
    };

    /**
     * Add a life amount
     * @param  {Number} increment
     * @return {Number} new life amount
     */
    Entity.prototype.incrementLife = function(inc) {

        if (!(this.state.life <= 0 && inc < 0)) {
            this.state.life += inc;
        }
        return this.state.life;
    };

    /**
     * Add a mana amount
     * @param  {Number} inc
     * @return {Number} new mana amount
     */
    Entity.prototype.incrementMana = function(inc) {

        if (!(this.state.mana <= 0 && inc < 0)) {
            this.state.mana += inc;
        }
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
    Entity.prototype.moveAlong = function(linepoints) {

        throw "Parent class Entity cannot move";
    };

    /**
     * Learn a spell
     * @param  {Spell} spell
     * @trigger 'changed'
     */
    Entity.prototype.learnSpell = function(spell) {

        this.state.spells.push(new spell({ source: this }));

        this.trigger('changed', this);
    };

    /**
     * Cast a spell
     * @param  {Spell} spell
     * @return {Boolean} True if spell has been casted
     */
    Entity.prototype.cast = function(spell, target) {

        log(log.COMBAT, '%o begins to cast %o', this, spell);

        spell.start(this, target);
    };

    /**
     * Hit this entity with a spell
     * @param  {Spell} spell
     * @triggers 'hit', 'changed', 'death'
     */
    Entity.prototype.hit = function(spell) {

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

        this.trigger('hit', eventData);

        log(log.COMBAT, '%o hit %o with %o : %d + %d + %d (%s) - %s' ,
            spell.source, this,
            spell.name, eventData.magicLifeDamageReceived, eventData.meleeLifeDamageReceived, eventData.manaDamageReceived,
            (spell.isCritical ? 'critical' : 'normal'), eventData.damageAbsorbed
        );

        // send events
        if (this.isDead()) {
            this.trigger('death', eventData);
        }
    };

    Entity.prototype.constructor = Entity;
    MicroEvent.mixin(Entity);
    return Entity;
});
