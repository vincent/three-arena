
define('threearena/views/interactiveview',
    ['lodash', 'knockout', 'threearena/elements/interactiveobject'], function(_, ko, Entity) {

    var EntityViewModel = function(interactive) {

        var self = this;

        _.each(interactive.menu, function(v, k) {
            self[k] = ko.observable(v); // .extend({notify: 'always'});
        });

        ////////////////////////////////     

        this.update = function(values) { /// FIXME !!!!
            _.each(values, function(v, k) {
                if (typeof self[k] !== 'undefined') {
                    self[k](v);
                }
            });
        };

        this.click = function (item) {
            alert('You ' + (item.action === 'sell' ? 'buy' : 'sell') + ' ' + item.name + ' for ' + item.price + ' gold')
        };

        interactive.bind('changed', _.bind( this.update, this ));
    };

    return EntityViewModel;
});