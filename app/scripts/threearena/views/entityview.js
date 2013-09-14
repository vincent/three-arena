
define('threearena/views/entityview',
    ['lodash', 'knockout', 'threearena/entity'], function(_, ko, Entity) {

    var EntityViewModel = function(entity) {

        var self = this;

        _.each(entity.state, function(v, k) {
            self[k] = ko.observable(v); // .extend({notify: 'always'});
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
        this.cast = _.bind( entity.cast, entity );

        entity.bind('changed', _.bind( this.update, this ));
    };

    return EntityViewModel;
});