        character.root.aura = Particles.Aura('circle', 1000, THREE.ImageUtils.loadTexture( "/gamedata/textures/lensflare2.jpg" ), null);
        character.root.add(character.root.aura.particleCloud);
        character.root.aura.start();
        window.addEventListener( 'render-update', _.bind( function(event){
        	character.root.aura.update( event.detail.delta );
        }, character.root.aura ) );

