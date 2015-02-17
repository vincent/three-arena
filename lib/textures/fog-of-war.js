
'use strict';

module.exports = FogOfWarMap;

/*


    var box  = arena.ground.boundingBoxNormalized.max;
    var size = nearestPow2(Math.max(box.x, box.y));

    var fowMap = new FowMap(size, size);


    document.getElementsByTagName('body')[0].appendChild(fowMap.canvas);
    fowMap.canvas.style.position = 'absolute';
    fowMap.canvas.style.right = '0';
    fowMap.canvas.style.top = '100px';





      fowMap.render(
        _.map(arena.entities, function (e) {
          return e.position;
        })
      );

      // fowtexture.needsUpdate = true;


*/


function FogOfWarMap (width, height) {

    // create canvas
    this.canvas = document.createElement( 'canvas' );

    this.canvas.width  = width;
    this.canvas.height = height;

    // get context
    this.context = this.canvas.getContext('2d');
    this.background();
}

FogOfWarMap.prototype.background = function() {

    this.context.fillStyle = 'rgba( 0, 0, 0, 0 )';
    // this.context.fillStyle = 'rgba(255, 255, 255, 255 )';
    this.context.fillRect( 0, 0, this.canvas.width, this.canvas.height );
};

FogOfWarMap.prototype.render = function(locations) {

    // return;

    for (var i = 0; i < locations.length; i++) {

        var loc = locations[i];
        var radius = 10.0;

        // transform in texture coordinates
        // loc = arena.inTerrainDatum(loc);

        this.context.beginPath();
        this.context.arc(loc.x, loc.z, radius, 0, 2 * Math.PI, true);
        this.context.fillStyle = 'rgba( 255, 255, 255, 1 )';
        this.context.fill();

        // Create gradient
        // var grd = this.context.createRadialGradient(loc.x, loc.y, 0.000, loc.x, loc.y, radius);

        // // Add colors
        // grd.addColorStop(0.000, 'rgba(255, 255, 255, 1.000)');
        // grd.addColorStop(1.000, 'rgba(0, 0, 0, 1.000)');

        // // Fill with gradient
        // this.context.fillStyle = grd;
        // this.context.fillRect(0, 0, 300.000, 300.000);
    }
};
