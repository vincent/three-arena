
define('threearena/entity',
    ['lodash', 'threejs', 'threearena/log', 'threearena/utils', 'threearena/elements/lifebar'], function(_, THREE, log, Utils, LifeBar) {

    var Entity = function( options ) {

        THREE.Object3D.apply( this );

        this.state = _.merge({

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
    };

    Entity.prototype = new THREE.Object3D();

    Entity.prototype.attachLifeBar = function( ) {

        this.lifebar = new LifeBar();
        this.updateLifeBar();

        this.add( this.lifebar );
    };

    Entity.prototype.updateLifeBar = function( ) {

        this.lifebar.setLife( this._baseLife > 0 ? 1 / this._baseLife * this.state.life : 0 );
        this.lifebar.setMana( this._baseMana > 0 ? 1 / this._baseMana * this.state.mana : 0 );            
    };

    Entity.prototype.isDead = function( ) {

        return this.state.life <= 0;
    };

    Entity.prototype.incrementLife = function( inc ) {

        if (!(this.state.life <= 0 && inc < 0)) {
            this.state.life += inc;
        }
        return this.state.life;
    };

    Entity.prototype.incrementMana = function( inc ) {

        if (!(this.state.mana <= 0 && inc < 0)) {
            this.state.mana += inc;
        }
        return this.state.mana;
    };

    Entity.prototype.isAlive = function( ) {

        return ! this.isDead();
    };

    Entity.prototype.isOutOfMana = function( ) {

        return this.state.mana <= 0;
    };

    Entity.prototype.moveAlong = function( linepoints ) {

    };

    Entity.prototype.emit = function( eventName, data ) {
        // Entity should be an event emitter
    };

    Entity.prototype.hit = function( spell ) {

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
        this.incrementLife( -totalLifeDamage );
        this.incrementMana( -manaDamageReceived );
        this.updateLifeBar();

        log( 'combat', '%o hit %o with %o : %d + %d + %d (%s) - %s' ,
            spell.source, this,
            spell.name, magicLifeDamageReceived, meleeLifeDamageReceived, manaDamageReceived,
            (spell.isCritical ? 'critical' : 'normal'), damageAbsorbed
        );

        // send events
        if (! this.isDead()) {

            if (meleeLifeDamageReceived > 0) {
                this.emit( 'lifedamage' , { amount: meleeLifeDamageReceived })
            }
            if (manaDamageReceived > 0) {
                this.emit( 'manadamage' , { amount: manaDamageReceived })
            }
            if (damageAbsorbed > 0) {
                this.emit( 'absorbeddamage' , { amount: damageAbsorbed })
            }

        } else {

            this.emit( 'death' , { amount: totalLifeDamage });
        }
    };

    Entity.prototype.constructor = Entity;

    return Entity;
});
