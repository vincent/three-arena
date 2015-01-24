module.exports = TargetSystem;

function TargetSystem (arena, entity) {
    var self = this;

    this.arena = arena;
    this.entity = entity;
    this.currentTarget = null;

    this._filterEnemy = (function (obj) {
        return obj.state.team != self.entity.state.team;
    }).bind(this);
};

TargetSystem.prototype.current = function() {
    return this.currentTarget;
};

TargetSystem.prototype.hasTarget = function() {
    return this.currentTarget != null;
};

TargetSystem.prototype.hasTargetOrThrow = function() {
    if (! this.hasTarget()) {
        throw new Error('not currently targetting');
    }
};

TargetSystem.prototype.findNearest = function() {
    var self = this;
    this.currentTarget = this.arena.findWithClass('Entity',  this._filterEnemy);
    return this.current();
};

TargetSystem.prototype.distanceToTarget = function() {
    this.hasTargetOrThrow();
    return this.currentTarget.position.distanceTo(this.entity.position);
};

TargetSystem.prototype.isTargetStillNearest = function() {
    this.hasTargetOrThrow();
    return this.currentTarget === this.arena.findWithClass('Entity', this._filterEnemy);
};

TargetSystem.prototype.isTargetStillPresent = function(maxDistance) {
    if (! maxDistance) { maxDistance = 10; }
    return this.hasTarget() && ! this.current().isDead() && this.distanceToTarget() < maxDistance;
};

TargetSystem.prototype.isTargetInSight = function(maxDistance) {
    if (! maxDistance) { maxDistance = 10; }
    return this.hasTarget()
                    && ! this.current().isDead()
                    && this.distanceToTarget() < maxDistance
                    /* && this.arena.pathfinding.raycast(this.entity.position, this.current().position) */
                    ;
};

TargetSystem.prototype.bestSpellForTarget = function(entity) {
    var spell, target = entity;
    if (! target) {
        this.hasTargetOrThrow();
        target = this.current();
    }

    var maxDamage = 0;

    // autoAttackSpell has been forced
    if (this.entity.state.autoAttackSpell && this.entity.state.spells[ this.entity.state.autoAttackSpell ]) {
        spell = this.entity.state.spells[ this.entity.state.autoAttackSpell ];

    // find a spell
    } else {
        for (var i = 0; i < this.entity.state.spells.length; i++) {
            var _spell = this.entity.state.spells[i];
            if (_spell.canHit(this.entity, target, 5) && maxDamage < _spell.meleeLifeDamage) {
                spell = _spell;
            }
        }
    }

    return spell;
};

