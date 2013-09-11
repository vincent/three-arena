
define('threearena/views/entityview',
    ['lodash', 'knockout', 'threearena/entity'], function(_, ko, Entity) {

    var EntityViewModel = function(entity) {

        var self = this;

        _.each(entity.state, function(v, k) {
            self[k] = ko.observable(v);
        });
     
        this.update = function(values) {
            _.each(entity.state, function(v, k) {
                if (typeof self[k] !== 'undefined') {
                    self[k](v);
                }
            });
        };

        entity.on('changed', _.bind( this.update, this ));
    };

    return EntityViewModel;
});