
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
            life: this._baseLife > 0 ? 1 / this._baseLife * this.state.life : 0,
            mana: this._baseMana > 0 ? 1 / this._baseMana * this.state.mana : 0
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

    };


    // TODO: Make entity an event emitter
    // Entity.prototype.events = {
    //     'changed': [],
    // };
    // Entity.prototype.emit = function(eventName, data) {
    //     _.each(this.events[eventName], function(callback){
    //         callback(data);
    //     });
    // };
    // Entity.prototype.on = function(eventName, callback) {
    //     this.events[eventName] = this.events[eventName] || [];
    //     this.events[eventName].push(callback);
    // };

    Entity.prototype.hit = function(spell) {

        var meleeLifeDamageReceived = 0,
            magicLifeDamageReceived = 0,
            manaDamageReceived = 0,
            damageAbsorbed = 0,
            dodged = 0;

        meleeLifeDamageReceived = spell.meleeLifeDamage - damageAbsorbed;
        magicLifeDamageReceived = spell.magicLifeDamage - damageAbsorbed;
        manaDamageReceived = spell.manaDamage  - damageAbsorbed;

        var totalLifeDamage = meleeLifeDamageReceived + magicLifeDamageReceived;

        // apply hits
        this.incrementLife(-totalLifeDamage);
        this.incrementMana(-manaDamageReceived);
        this.updateLifeBar();

        log(log.COMBAT, '%o hit %o with %o : %d + %d + %d (%s) - %s' ,
            spell.source, this,
            spell.name, magicLifeDamageReceived, meleeLifeDamageReceived, manaDamageReceived,
            (spell.isCritical ? 'critical' : 'normal'), damageAbsorbed
        );

        // send events
        if (! this.isDead()) {

            if (meleeLifeDamageReceived > 0) {
                this.trigger('changed' , { amount: meleeLifeDamageReceived })
            }
            if (manaDamageReceived > 0) {
                this.trigger('manadamage' , { amount: manaDamageReceived })
            }
            if (damageAbsorbed > 0) {
                this.trigger('absorbeddamage' , { amount: damageAbsorbed })
            }

        } else {

            this.trigger('death' , { amount: totalLifeDamage });
        }
    };

    Entity.prototype.constructor = Entity;
    MicroEvent.mixin(Entity);

    return Entity;
});
