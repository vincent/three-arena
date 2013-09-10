
define('threearena/log',
    ['lodash', 'threejs'], function(_, THREE) {

    var Log = function ( type, arg1, arg2 /* ... */ ) {
    	var args = Array.prototype.slice.apply(arguments);
    	var type = String(args.shift()).toUpperCase();

    	console.log.apply( console, args );
    };

    Log.SYS_DEBUG = 'SYS_DEBUG';
    Log.SYS_INFO  = 'SYS_INFO';
    Log.SYS_ERROR = 'SYS_ERROR';
    Log.COMBAT    = 'COMBAT';

    return Log;
});