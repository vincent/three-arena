module.exports = {
    seek:       require('./seek'),
    flee:         require('./flee'),
    arrive:     require('./arrive'),
    // pursuit:    require('./pursuit'),
    // evade:   require('./evade'),
    wander:  require('./wander'),
};

var steerings = Object.keys(module.exports);

function Machine () {
    this.behaviours = {};
    for (var i = 0; i < steerings.length; i++) {
        this.behaviours[ steerings[i] ] = false;
    }
}

Machine.prototype.empty = function() {
    for (var i = 0; i < steerings.length; i++) {
        if (this.behaviours[ steerings[i] ]) {
            return false;
        }
    }
    return true;
};

Machine.prototype.currently = function (behaviour, force) {
    var present = this.behaviours[behaviour];

    if (force !== undefined) {
        if (force != present) {
            this.behaviours[behaviour] = force;
        }
        return force;
    }
    return present;
};

Machine.prototype.off = function(behaviour) {
    return this.currently(behaviour, false);
};

module.exports.machine = Machine;