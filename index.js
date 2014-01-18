'use strict';

require('debug').enable(d(''));

module.exports = {
  Arena: require('./lib/index.js')
};


function d(enabled){
  if (enabled || !location) { return enabled; }
  var m = /&?d=([^&]+)/g.exec(location.search);
  if (m) {
    return m[1].replace(/%20|\+/g,' ');
  } else {
    return '';
  }
}
