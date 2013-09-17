/**
 * @module Entity
 */
define('threearena/entity',
    ['lodash', 'microevent', 'threejs', 'knockout', 'threearena/log', 'threearena/utils', 'threearena/elements/lifebar'],

    function(_, MicroEvent, THREE, ko, log, Utils, LifeBar) {

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
        this.trigger('changed', this.state);
    };

    Entity.prototype = new THREE.Object3D();

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
