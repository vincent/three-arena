
define('threearena/views/gameview',
    ['lodash', 'knockout', 'threearena/game'], function(_, ko, Entity) {

    /**
     * @exports threearena/views/gameview
     */
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

        // find the main ground mesh, 
        game.ground.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                var geometry = child.geometry;
                if (!geometry.boundingBox) {
                    geometry.computeBoundingBox();
                }

                self.mapWidth(geometry.boundingBox.max.x - geometry.boundingBox.min.x);
                self.mapHeight(geometry.boundingBox.max.z - geometry.boundingBox.min.z);
            }
        });

        // pass its texture image
        self.image(game.ground.options.tDiffuse);

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

    GameViewModel.prototype.onMapClick = function(gameview, event) {
        // ignore if there's no button clicked
        if (! event.which) return;

        var target = $(event.currentTarget);
        var halfX = gameview.mapWidth() / 2,
            halfZ = gameview.mapHeight() / 2,
            mapX = (gameview.mapWidth() / target.width() * event.offsetX) - halfX,
            mapZ = (gameview.mapHeight() / target.height() * event.offsetY) - halfZ + 40;

/*
      if (! game.camera._currentTween) { // && game.camera._currentTween.stop();
        game.camera._currentTween = tween;
      } else {
        game.camera._currentTween.chain(tween);
      }
      game.camera._currentTween.start();

 */

/*
        // if (! game.camera._currentTween) && game.camera._currentTween.stop();
        game.camera._currentTween = new TWEEN.Tween(game.camera.position)
            .to({ x:mapX, y:game.camera.position.y, z:mapZ }, 20)
            .easing(TWEEN.Easing.Quadratic.InOut)
        game.camera._currentTween.start();
*/
        game.camera.position.set(mapX, 50, mapZ);
    };

    GameViewModel.prototype.onCharacterHover = function(event) {
        debugger;
    };

    return GameViewModel;
});