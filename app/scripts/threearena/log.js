
define('threearena/log',
    ['lodash', 'threejs'], function(_, THREE) {

    var Log = function ( type, arg1, arg2 /* ... */ ) {
    	var args = Array.prototype.slice.apply(arguments);
    	var type = String(args.shift()).toUpperCase();

    	console.log.apply( console, args );
    }

    return Log;
});