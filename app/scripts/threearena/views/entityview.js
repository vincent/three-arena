
define('threearena/views/entityview',
    ['lodash', 'knockout', 'threearena/entity', 'threearena/utils'], function(_, ko, Entity, Utils) {

    /**
     * @exports threearena/views/entityview
     */
    var EntityViewModel = function(entity, game) {

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
                game.waitForSelection(function(targets){
                    var target = Utils.getEntity(targets[0].object);

                    if (target && target instanceof Entity) {

                        if (spell.canHit(entity, target)) {
                           entity.cast(spell, target);

                        } else {
                            console.log("C'est trop loin !");
                        }
                    }
                });
            } else {
                entity.cast(spell, null);
            }
        };

        entity.bind('changed', _.bind( this.update, this ));
    };

    return EntityViewModel;
});