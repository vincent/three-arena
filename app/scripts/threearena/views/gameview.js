
define('threearena/views/gameview',
    ['lodash', 'knockout', 'threearena/game'], function(_, ko, Entity) {

    var GameViewModel = function(game) {

        var self = this;

        self.mapWidth = ko.observable(0);
        self.mapHeight = ko.observable(0);

        self.characters = [
            ko.observable({ x:0, z:0 }),
            ko.observable({ x:0, z:0 }),
        ];
        this.image = ko.observable(null);

        ////////////////////////////////     

        // find the main ground mesh, pass its texture image
        game.ground.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                self.image(child.material.uniforms.tDiffuse.value.image.src);

                var geometry = child.geometry;
                if (!geometry.boundingBox) {
                    geometry.computeBoundingBox();
                    self.mapWidth(geometry.boundingBox.max.x - geometry.boundingBox.min.x);
                    self.mapHeight(geometry.boundingBox.max.z - geometry.boundingBox.min.z);
                }
            }
        });

        this.update = function(game) {
            _.each(game.pcs, function(c,i){
                // get playing characters
                self.characters[1]({
                    x: 100 / self.mapWidth() * (game.pcs[1].position.x + self.mapWidth() / 2),
                    z: 100 / self.mapHeight() * (game.pcs[1].position.z + self.mapHeight() / 2)
                });
            });
        };

        game.bind('update', _.bind( this.update, this ));
    };

    GameViewModel.prototype.onMapClick = function(event) {
        debugger;
    };

    GameViewModel.prototype.onCharacterHover = function(event) {
        debugger;
    };

    return GameViewModel;
});