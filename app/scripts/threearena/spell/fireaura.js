        character.root.aura = Particles.Aura('circle', 1000, THREE.ImageUtils.loadTexture( "/gamedata/textures/lensflare2.jpg" ), null);
        character.root.add(character.root.aura.particleCloud);
        character.root.aura.start();
        window._ta_events.bind('update', _.bind(function(game){
        	character.root.aura.update(game.delta);
        }, character.root.aura));

