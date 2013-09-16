
define('threearena/views/gameview',
    ['lodash', 'knockout', 'threearena/game'], function(_, ko, Entity) {

    var GameViewModel = function(game) {

        var self = this;

        self.mapWidth = ko.observable(0);
        self.mapHeight = ko.observable(0);

        self.characters = [
            ko.observable({ x:-1, z:-1 }),
            ko.observable({ x:-1, z:-1 })
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
                if (self.characters[i] === undefined) {
                    self.characters[i] = ko.observable();
                }

                // get playing characters
                self.characters[i]({
                    x: 100 / self.mapWidth() * (game.pcs[i].position.x + self.mapWidth() / 2),
                    z: 100 / self.mapHeight() * (game.pcs[i].position.z + self.mapHeight() / 2)
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