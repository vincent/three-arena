'use strict';

var _ = require('lodash');
var ko = require('knockout');

module.exports = DialogViewModel;

/**
 * @exports threearena/views/dialogview
 */
function DialogViewModel (dialog) {

  var self = this;

  _.each(dialog.data, function(v, k) {
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
    console.log('You ' + (item.action === 'sell' ? 'buy' : 'sell') + ' ' + item.name + ' for ' + item.price + ' gold');
  };

  dialog.on('changed', this.update.bind(this));
}