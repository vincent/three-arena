'use strict';

module.exports = Spiral;

/**
 * @exports threearena/geometries/spiral
 */
function Spiral (radiusTop, radiusBottom, height, radialSegments, heightSegments, yOffset) {

    this.vertices = [];

    radiusTop       = radiusTop !== undefined ? radiusTop : 8;
    radiusBottom    = radiusBottom !== undefined ? radiusBottom : 8;
    height          = height !== undefined ? height : 10;
    yOffset         = yOffset ||  0;

    radialSegments  = radialSegments || 16;
    heightSegments  = heightSegments || 10;

    var thetaStart  = 0;
    var thetaLength = 2 * Math.PI;

    var x, y, vertices = [];

    for ( y = 0; y <= heightSegments; y ++ ) {

        var verticesRow = [];
        var uvsRow = [];

        var v = y / heightSegments;
        var radius = v * ( radiusBottom - radiusTop ) + radiusTop;

        for ( x = 0; x < radialSegments; x ++ ) {

            var u = x / radialSegments;

            var vertex = new THREE.Vector3();
            vertex.x = radius * Math.sin( u * thetaLength + thetaStart );
            vertex.y = yOffset + (v * height);
            vertex.z = radius * Math.cos( u * thetaLength + thetaStart );

            this.vertices.push( vertex );

            verticesRow.push( this.vertices.length - 1 );

        }

        vertices.push( verticesRow );

    }

    var spline = new THREE.SplineCurve3(this.vertices);

    return spline;
}
