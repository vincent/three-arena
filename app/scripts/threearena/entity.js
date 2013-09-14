
define('threearena/entity',
    ['lodash', 'microevent', 'threejs', 'knockout', 'threearena/log', 'threearena/utils', 'threearena/elements/lifebar'],

    function(_, MicroEvent, THREE, ko, log, Utils, LifeBar) {

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

    Entity.prototype.attachLifeBar = function() {

        this.lifebar = new LifeBar();
        this.updateLifeBar();
        this.add(this.lifebar);
    };

    Entity.prototype.updateLifeBar = function() {

        var eventData = {
            life: this._baseLife === false ? false : this._baseLife > 0 ? 1 / this._baseLife * this.state.life : 0,
            mana: this._baseMana === false ? false : this._baseMana > 0 ? 1 / this._baseMana * this.state.mana : 0
        };

        this.trigger('changed', eventData);

        this.lifebar.set(eventData);
    };

    Entity.prototype.isDead = function() {

        return this.state.life <= 0;
    };

    Entity.prototype.incrementLife = function(inc) {

        if (!(this.state.life <= 0 && inc < 0)) {
            this.state.life += inc;
        }
        return this.state.life;
    };

    Entity.prototype.incrementMana = function(inc) {

        if (!(this.state.mana <= 0 && inc < 0)) {
            this.state.mana += inc;
        }
        return this.state.mana;
    };

    Entity.prototype.isAlive = function() {

        return ! this.isDead();
    };

    Entity.prototype.isOutOfMana = function() {

        return this.state.mana <= 0;
    };

    Entity.prototype.moveAlong = function(linepoints) {

        throw "Parent class Entity cannot move";
    };

    Entity.prototype.learnSpell = function(spell) {

        this.state.spells.push(new spell({ source: this }));

        this.trigger('changed', this);
    };

    Entity.prototype.cast = function(spell) {

        log(log.COMBAT, '%o begins to cast %o', this, spell);
    };

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
