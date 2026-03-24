import { colorChannel, resetLevelChannels } from "../colors";
import { gameState } from "../state/gameState";
import { computeJumpVelocity, getGamePlayerColor, getParticleScale, getRenderedSize, getTextureDimensions, gridSpacesToPixels, randInt, unitsToPixels } from "../utils";
import gpp from '../data/gameplayParameters.json';

export class Player extends Phaser.GameObjects.Container {
    getBodiesInRadius(scene, radius = unitsToPixels(150)) {

        const px = this.hitbox.position.x
        const py = this.hitbox.position.y

        const region = {
            min: { x: px - radius, y: py - radius },
            max: { x: px + radius, y: py + radius }
        }

        const bodies = this.scene.matter.query.region(
            scene.matter.world.localWorld.bodies,
            region
        )

        return bodies
    }

    getCollidableBodies(scene) {

        const bodies = this.getBodiesInRadius(scene)

        return bodies.filter(body =>
            body !== this.hitbox &&
            body !== this.innerHitbox &&
            !body.isSensor
        )
    }

    getHazardBodies(scene) {

        const bodies = this.getBodiesInRadius(scene)

        return bodies.filter(body =>
            body !== this.hitbox &&
            body !== this.innerHitbox &&
            body.isSensor &&
            body.plugin?.isHazard === true
        )
    }

    hasHorizontalOverlap(playerMinX, playerMaxX, bodyBounds) {
        return playerMaxX > bodyBounds.min.x && playerMinX < bodyBounds.max.x;
    }

    hasSupportBelow(scene, bodyX, bodyY, halfWidth, halfHeight, epsilon = 1.5) {
        const playerMinX = bodyX - halfWidth;
        const playerMaxX = bodyX + halfWidth;
        const playerBottom = bodyY + halfHeight;
        const bodies = this.getCollidableBodies(scene);

        for (const body of bodies) {
            const bounds = body.bounds;
            if (!this.hasHorizontalOverlap(playerMinX, playerMaxX, bounds)) continue;

            const otherTop = bounds.min.y;
            if (Math.abs(playerBottom - otherTop) <= epsilon) {
                return true;
            }
        }

        return false;
    }

    hasSupportAbove(scene, bodyX, bodyY, halfWidth, halfHeight, epsilon = 1.5) {
        const playerMinX = bodyX - halfWidth;
        const playerMaxX = bodyX + halfWidth;
        const playerTop = bodyY - halfHeight;
        const bodies = this.getCollidableBodies(scene);

        for (const body of bodies) {
            const bounds = body.bounds;
            if (!this.hasHorizontalOverlap(playerMinX, playerMaxX, bounds)) continue;

            const otherBottom = bounds.max.y;
            if (Math.abs(playerTop - otherBottom) <= epsilon) {
                return true;
            }
        }

        return false;
    }

    resolveVerticalCollision(scene, currentBodyX, currentBodyY, targetBodyX, targetBodyY) {
        const deltaY = targetBodyY - currentBodyY

        // Skip expensive collision checks if no vertical movement
        if (Math.abs(deltaY) < 0.0001) {
            return {
                y: targetBodyY,
                hitFloor: false,
                hitCeiling: false
            }
        }

        const bodies = this.getCollidableBodies(scene)

        const bounds = this.hitbox.bounds

        const playerHalfWidth = bounds.max.x - this.hitbox.position.x
        const playerHalfHeight = bounds.max.y - this.hitbox.position.y

        const currentTop = currentBodyY - playerHalfHeight
        const currentBottom = currentBodyY + playerHalfHeight

        const targetTop = targetBodyY - playerHalfHeight
        const targetBottom = targetBodyY + playerHalfHeight

        const playerMinX = currentBodyX - playerHalfWidth
        const playerMaxX = currentBodyX + playerHalfWidth

        let correctedY = targetBodyY
        let hitFloor = false
        let hitCeiling = false

        for (const body of bodies)
        {
            const b = body.bounds

            const otherMinX = b.min.x
            const otherMaxX = b.max.x
            const otherTop = b.min.y
            const otherBottom = b.max.y

            // Fast vertical rejection
            if (deltaY > 0 && targetBottom < otherTop - 2) continue
            if (deltaY < 0 && targetTop > otherBottom + 2) continue

            // Horizontal overlap test
            if (playerMaxX <= otherMinX || playerMinX >= otherMaxX) continue

            // Landing collision
            if (deltaY > 0 &&
                currentBottom <= otherTop &&
                targetBottom >= otherTop)
            {
                correctedY = otherTop - playerHalfHeight
                hitFloor = true
                break
            }

            // Ceiling collision
            if (deltaY < 0 &&
                currentTop >= otherBottom &&
                targetTop <= otherBottom)
            {
                correctedY = otherBottom + playerHalfHeight
                hitCeiling = true
                break
            }
        }

        return {
            y: correctedY,
            hitFloor,
            hitCeiling
        }
    }

    createPlayerSprite(key, frameName, scene, tintColorChannel = null) {
        const dimensions = getTextureDimensions(this.scene, key, frameName);

        const sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, key, frameName);
        sprite.setDisplaySize(
            getRenderedSize(dimensions.width),
            getRenderedSize(dimensions.height)
        );

        if (tintColorChannel !== null) {
            sprite.tint = colorChannel[tintColorChannel].toTint();
        }

        return { sprite, dimensions };
    }

    constructor(scene) {
        super(scene, 0, 0);

        //_cube __________________________________________________________________________
        const cubekey = `player_${gameState.settings.cubeID}`;

        const cubeSecondary = this.createPlayerSprite(cubekey, `${cubekey}_2_001.png`, scene, 1006);
        this.cubeSecondary = cubeSecondary.sprite;

        const cubePrimary = this.createPlayerSprite(cubekey, `${cubekey}_001.png`, scene, 1005);
        this.cubePrimary = cubePrimary.sprite;

        const cubeGlow = this.createPlayerSprite(cubekey, `${cubekey}_glow_001.png`, scene, 10000);
        this.cubeGlow = cubeGlow.sprite;

        const cubeExtra = this.createPlayerSprite(cubekey, `${cubekey}_extra_001.png`, scene);
        this.cubeExtra = cubeExtra.sprite;
        //__________________________________________________________________________
        gameState.player.x = 0;
        gameState.player.y = gameState.screen.height;
        this.setPosition(
            gameState.player.x,
            gameState.player.y
        );

        this.add([
            this.cubeSecondary, this.cubePrimary, this.cubeGlow, this.cubeExtra // cube sprites
        ]);
        

        // Create player hitbox
        this.hitbox = scene.matter.add.rectangle(
            this.x,
            this.y,
            unitsToPixels(30),
            unitsToPixels(30),
            {
                inertia: Infinity, // prevent rotation
                friction: 0,
                frictionAir: 0,
                restitution: 0
            }
        );

        // Create player inner hitbox (for specific solid collisions)
        this.innerHitbox = scene.matter.add.rectangle(
            this.x,
            this.y,
            unitsToPixels(9),
            unitsToPixels(9),
            {
                inertia: Infinity, // prevent rotation
                friction: 0,
                frictionAir: 0,
                restitution: 0
            }
        );

        // ghost trail particle
        this.ghostTrail = scene.add.particles(0, 0, cubekey, {

            frame: `${cubekey}_001.png`,
            blendMode: Phaser.BlendModes.ADD,
            tint: getGamePlayerColor(1005),
            frequency: 60,
            alpha: {start: 1, end: 0, ease: 'Power2'},
            lifespan: 400,
            angle: 180,
            rotate: { onEmit: () => this.angle },
            scale: {
                start: getParticleScale(scene, cubekey, `${cubekey}_001.png`, 30),
                end: getParticleScale(scene, cubekey, `${cubekey}_001.png`, 22.5),
            }
        });
        this.ghostTrail.startFollow(this);
        
        // player drag effect when landed
        this.dragEffect = scene.add.particles(0, 0, 'particleSheet', {

            frame: 'particle_00_001.png',
            blendMode: Phaser.BlendModes.ADD,
            tint: getGamePlayerColor(1005),
            lifespan: {min: 500, max: 800},
            frequency: 20,
            angle: {min: -90-45, max: -90+45},
            speed: {min: unitsToPixels(55), max: unitsToPixels(95)},

            //posvar
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, 0, unitsToPixels(1) * 2, unitsToPixels(3) * 2)
            },

            gravityX: 0,
            gravityY: unitsToPixels(300),

            scale: {
                onEmit: () => getParticleScale(scene, 'particleSheet', "particle_00_001.png", randInt(4, 7)), // start
                onUpdate: (particle, key, t, value) => Phaser.Math.Linear(value, 0, t) // end
            },

            alpha: {start: 1, end: 0, ease: 'Power2'}
        });
        this.dragEffect.startFollow(this, unitsToPixels(-12), unitsToPixels(11));
        this.dragEffectFlipped = scene.add.particles(0, 0, 'particleSheet', {

            frame: 'particle_00_001.png',
            blendMode: Phaser.BlendModes.ADD,
            tint: getGamePlayerColor(1005),
            lifespan: {min: 500, max: 800},
            frequency: 20,
            angle: {min: 90-45, max: 90+45},
            speed: {min: unitsToPixels(55), max: unitsToPixels(95)},

            //posvar
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, 0, unitsToPixels(1) * 2, unitsToPixels(3) * 2)
            },

            gravityX: 0,
            gravityY: unitsToPixels(-300),

            scale: {
                onEmit: () => getParticleScale(scene, 'particleSheet', "particle_00_001.png", randInt(4, 7)), // start
                onUpdate: (particle, key, t, value) => Phaser.Math.Linear(value, 0, t) // end
            },

            alpha: {start: 1, end: 0, ease: 'Power2'}
        });

        this.dragEffectFlipped.startFollow(this, unitsToPixels(-12), unitsToPixels(-15));

        this.hitbox.ignoreGravity = true;
        this.innerHitbox.ignoreGravity = true;
        this.landed = true;
        this.grounded = true; // touching the ground

        this.easeStartAngle = null;
        this.easeStartTime = null;

        this.consecutiveJumps = 0;

        this.rotationDirection = 1;

        this.deltaY = 0;
        this.deltaX = 0;
        this.lastY = gameState.player.y;
        this.lastX = gameState.player.x;

        this.screenX = this.x - scene.cameras.main.scrollX;
        this.isFollowedByCamera = false;
        this.isDragEffectRunning = true;
        this.wasTouchingHazard = false;
        this.rotationTween = null;
        this.blinkTimer = null;
        this.deathHideTimer = null;
        this.respawnTimer = null;

        this.deathHideDelay = 50;
        this.respawnDelay = 500;
        this.respawnLandingLockFrames = 0;

        scene.add.existing(this); // add player sprites to the scene

        scene.matter.world.on("collisionstart", (event) => { // collision detection (sensors only, once per collision)
            for (const pair of event.pairs) {

                const a = pair.bodyA
                const b = pair.bodyB

                if (a === this.innerHitbox || b === this.innerHitbox) return;

                if (a === this.hitbox || b === this.hitbox) {

                    const other = a === this.hitbox ? b : a

                    if (other.plugin?.isHazard === true) {
                        this.die(scene);
                    }
                    else if (other.plugin?.isInverseGravityPortal === true) {
                        this.flipGravity(true);
                    }
                    else if (other.plugin?.isNormalGravityPortal === true) {
                        this.flipGravity(false);
                    }
                    else if (other.plugin?.isYellowJumpRing === true && scene.jumpHeld) {
                        this.jump(true);
                    }
                }
            }
        })

        scene.matter.world.on("collisionactive", (event) => { // collision detection (sensors only, every frame of collision)
            for (const pair of event.pairs) {

                const a = pair.bodyA
                const b = pair.bodyB

                if (a === this.innerHitbox || b === this.innerHitbox) return;

                if (a === this.hitbox || b === this.hitbox) {

                    const other = a === this.hitbox ? b : a

                    if (other.plugin?.isYellowJumpRing === true && !other.plugin.isActivated && scene.jumpHeld) {
                        this.jump(true);
                        other.plugin.isActivated = true;
                    }
                }
            }
        })
    }

    rotateTo(targetAngle, duration){
        if (this.rotationTween) {
            this.rotationTween.remove();
            this.rotationTween = null;
        }

        this.rotationTween = this.scene.tweens.add({
            targets: this,
            angle: targetAngle,
            duration: duration,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.rotationTween = null;
            }
        });
    }

    incrementRotation(playerState, dt) {

        if (!playerState.miniMode) {
            switch (playerState.gamemode) {
                case 0: // cube
                    if (!this.landed) {
                        this.angle += playerState.cube.big.rotationSpeed * this.rotationDirection * dt;
                    }
                    break;
            }
        }
    }

    spawnDeathEffect(scene) {
        const deathEffect = scene.add.particles(this.x - unitsToPixels(10), this.y - unitsToPixels(10), 'particleSheet', {
            frame: 'particle_00_001.png',
            blendMode: Phaser.BlendModes.ADD,
            tint: getGamePlayerColor(1005),
            lifespan: { min: 10 - 800, max: 10 + 800 }, // lifetime
            frequency: 0.3,
            angle: { min: 0 - 360, max:  + 360 },
            speed: { min: unitsToPixels(250 - 150), max: unitsToPixels(250 + 150) },
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, 0, unitsToPixels(10) * 2, unitsToPixels(10) * 2)
            },
            scale: {
                start: getParticleScale(scene, 'particleSheet', "particle_00_001.png", 12.5),
                end: 0,
                random: true
            },
            alpha: {
                start: 1,
                end: 0
            },
            duration: 50
        });

        const circleEffect = scene.add.circle(this.x, this.y, gridSpacesToPixels(.5), getGamePlayerColor(1005))
            .setAlpha(1)
            .setScale(1)
            .setBlendMode(Phaser.BlendModes.ADD);

        scene.tweens.add({
            targets: circleEffect,
            scale: 7,
            alpha: 0,
            duration: 450,
            ease: 'Linear',
            onComplete: () => {
                circleEffect.destroy();
            }

        })

        if (scene.groundLayerRef && scene.children.exists(scene.groundLayerRef)) {
            scene.children.moveBelow(deathEffect, scene.groundLayerRef);
            scene.children.moveBelow(circleEffect, scene.groundLayerRef);
        }
        if (scene.ceilingLayerRef && scene.children.exists(scene.ceilingLayerRef)) {
            scene.children.moveBelow(deathEffect, scene.ceilingLayerRef);
            scene.children.moveBelow(circleEffect, scene.ceilingLayerRef);
        }

        scene.time.delayedCall(1000, () => {
            if (deathEffect && deathEffect.active) {
                deathEffect.destroy();
            }
        });
    }

    spawnLandEffect(scene, flip = false) {
        const offsetY = flip === true ? unitsToPixels(-14) : unitsToPixels(14);
        const landEffect = scene.add.particles(this.x, this.y + offsetY, 'particleSheet', {
            frame: 'particle_00_001.png',
            blendMode: Phaser.BlendModes.ADD,
            tint: getGamePlayerColor(1005),
            lifespan: { min: 0, max: 600 },
            frequency: 15,
            angle: { min: -90 - 60, max: -90 + 60 },
            speed: { min: unitsToPixels(150 - 25), max: unitsToPixels(150 + 25) },
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, 0, unitsToPixels(10) * 2, unitsToPixels(0) * 2)
            },
            gravityX: 0,
            gravityY: unitsToPixels(500),
            scale: {
                start: getParticleScale(scene, 'particleSheet', "particle_00_001.png", 5),
                end: 0
            },
            alpha: { start: 1, end: 0, ease: 'Power2' },
            duration: 100
        });

        if (flip) {
            landEffect.scaleY = -1;
        }

        if (scene.groundLayerRef && scene.children.exists(scene.groundLayerRef)) {
            scene.children.moveBelow(landEffect, scene.groundLayerRef);
        }
        if (scene.ceilingLayerRef && scene.children.exists(scene.ceilingLayerRef)) {
            scene.children.moveBelow(landEffect, scene.ceilingLayerRef);
        }

        scene.time.delayedCall(750, () => {
            if (landEffect && landEffect.active) {
                landEffect.destroy();
            }
        });
    }

    updateDragEffect(flip = false) {
        if (flip === true) {
            this.dragEffect.alpha = 0;
            this.dragEffectFlipped.alpha = 1;
        } else {
            this.dragEffect.alpha = 1;
            this.dragEffectFlipped.alpha = 0;
        }
    }

    updateDragEffectDir(playerState) {
        if (playerState.flipGravity) {
            this.updateDragEffect(true);
        } else {
            this.updateDragEffect(false);
        }
    }

    updateGhostTrail(playerState) {
        if (playerState.ghostTrailOn) this.ghostTrail.start();
        else this.ghostTrail.stop();
    }

    handlePlayerCollision(scene, playerState, halfWidth, halfHeight, dt) {
        const deltaX = unitsToPixels(scene.scrollSpeedAmount, false) * dt;
        const deltaY = unitsToPixels(playerState.velocity, false) * dt;
        const currentBodyX = this.hitbox.position.x;
        const currentBodyY = playerState.y;
        const nextPlayerX = playerState.x + deltaX;
        const nextPlayerY = playerState.y + deltaY;
        const targetBodyX = nextPlayerX;

        const collision = this.resolveVerticalCollision(
            scene,
            currentBodyX,
            currentBodyY,
            targetBodyX,
            nextPlayerY,
            halfWidth,
            halfHeight
        );

        if (this.respawnLandingLockFrames > 0) {
            this.respawnLandingLockFrames--;
        }

        if (this.landed && this.respawnLandingLockFrames === 0) {
            const hasSupportBelow = this.hasSupportBelow(scene, this.hitbox.position.x, playerState.y, halfWidth, halfHeight);
            const hasSupportAbove = this.hasSupportAbove(scene, this.hitbox.position.x, playerState.y, halfWidth, halfHeight);
            if (playerState.flipGravity) {
                if (!hasSupportAbove) {
                    this.landed = false;
                }
            } else {
                if (!hasSupportBelow) {
                    this.landed = false;
                }                
            }
        }

        playerState.x = nextPlayerX;
        playerState.y = collision.y;

        if (playerState.y >= gameState.screen.height - halfHeight) {
            playerState.y = gameState.screen.height - halfHeight;
        }   

        if (collision.hitFloor) {
            if (!playerState.flipGravity) {
                this.landed = true;
                playerState.velocity = 0;
            }

        } else if (collision.hitCeiling) {
            if (playerState.flipGravity) {
                this.landed = true;
                playerState.velocity = 0;
            }
        }
    }

    updateVelocity(playerState, dt, gravityMultiplier) {
        // update player velocity (independent from Player.landed)
        if (playerState.miniMode || playerState.gamemode !== 0) {
            return;
        }

        const cubePhysics = playerState.cube.big;
        const terminalVelocity = cubePhysics.terminalVelocity;
        const nextVelocity = playerState.velocity + (cubePhysics.acceleration * gravityMultiplier * dt);

        playerState.velocity = Math.max(
            -terminalVelocity,
            Math.min(nextVelocity, terminalVelocity)
        );
    }

    runLandedCheck(playerState) {
        if (!this.landed) { // in the air
            if (this.isDragEffectRunning) {
                this.dragEffect.stop();
                this.dragEffectFlipped.stop();
                this.isDragEffectRunning = false;
            }
            if (this.rotationTween) {
                this.rotationTween.remove();
                this.rotationTween = null;
            }
        } else { // on ground/object
            if (!this.isDragEffectRunning) {
                this.dragEffect.start();
                this.dragEffectFlipped.start();
                this.isDragEffectRunning = true;
            }

            if (playerState.flipGravity) this.rotationDirection = -1;
            else this.rotationDirection = 1;
            
            playerState.velocity = 0;
        }
    }

    runSingleLandedCheck(playerState, wasLanded, scene) {
        if (!wasLanded && this.landed) { // as soon as the player lands on an object or one of the grounds (runs once per landing, not every frame)
            if (playerState.flipGravity) {
                this.rotationDirection = -1;
                this.spawnLandEffect(scene, true);
            } 
            else {
                this.rotationDirection = 1;
                this.spawnLandEffect(scene, false);
            } 

            const landedAndJumpHeld = scene.jumpHeld;

            if (landedAndJumpHeld) {
                this.consecutiveJumps++;
            }
            else {
                this.consecutiveJumps = 0;
            }

            const targetAngle = Math.round(this.angle / 90) * 90; // determine angle to snap player back to normal
            let easeDuration = 0;
            
            switch(playerState.gamemode) { // determine which ease duration to use
                case 0: easeDuration = playerState.cube.easeDuration; break; // cube
            }
            
            this.rotateTo(targetAngle, easeDuration);
        }
    }

    updateConsecutiveJumps(playerState) {
        if (this.consecutiveJumps > 1) {
            playerState.cube.jumpIndex = 1;
        }
        else {
            playerState.cube.jumpIndex = 0;
        }
    }

    updateSpritePos(playerState, scene) {
        this.x = playerState.x;
        scene.matter.body.setPosition(this.hitbox, {
            x: playerState.x,
            y: playerState.y
        });
        scene.matter.body.setPosition(this.innerHitbox, {
            x: playerState.x,
            y: playerState.y
        });

        this.y = playerState.y;
    }

    updatePlayerDeltaPos(playerState) {
        this.deltaY = playerState.y - this.lastY;
        this.lastY = playerState.y;
        this.deltaX = playerState.x - this.lastX;
        this.lastX = playerState.x;
    }

    updateGrounded(playerState, halfHeight){
        this.grounded = Math.round(gameState.screen.height - playerState.y - halfHeight) == 0 ? true : false;
    }

    updateScreenX(scene) {
        this.screenX = this.x - scene.cameras.main.scrollX;
    }

    update(scene, dt) { // physics
        const player = gameState.player; // player state reference
        const bodyBounds = this.hitbox.bounds;
        const halfWidth = (bodyBounds.max.x - bodyBounds.min.x) / 2;
        const halfHeight = (bodyBounds.max.y - bodyBounds.min.y) / 2;
        const wasLanded = this.landed;
        const gravityMultiplier = player.flipGravity ? -1 : 1;

        this.updateGrounded(player, halfHeight);
        this.updateScreenX(scene);

        this.updateDragEffectDir(player);
        this.updateGhostTrail(player)
        this.incrementRotation(player, dt);

        this.updatePlayerDeltaPos(player);

        this.handlePlayerCollision(scene, player, halfWidth, halfHeight, dt);

        this.updateVelocity(player, dt, gravityMultiplier);

        this.runLandedCheck(player);
        this.runSingleLandedCheck(player, wasLanded, scene);

        this.updateConsecutiveJumps(player);
        this.updateSpritePos(player, scene);
    }

    jump(forceJump, multiplier) {

        const player = gameState.player; // player state alias

        if (this.landed || forceJump === true) { // jump ↓
            if (this.consecutiveJumps === 0) this.consecutiveJumps++;

            this.easeStartAngle = null;
            this.easeStartTime = null;

            this.landed = false;
            if (!player.miniMode) { // big
                switch(player.gamemode) {
                    case 0: // cube
                        if (!player.flipGravity) {
                            player.velocity = -(computeJumpVelocity(gameState.player.cube.big.acceleration, gpp.speeds[gameState.settings.gameSpeed].jumpHeightCubeBig[player.cube.jumpIndex]));
                        } else {
                            player.velocity = (computeJumpVelocity(gameState.player.cube.big.acceleration, gpp.speeds[gameState.settings.gameSpeed].jumpHeightCubeBig[player.cube.jumpIndex]));
                        }
                        break;
                }
            }
        }
    }

    flipGravity(flip) {
        const player = gameState.player; // player state alias

        if (flip === true) { // yellow gravity portal behavior
            gameState.player.flipGravity = true;
            this.landed = false;
            this.easeStartAngle = null;
            this.easeStartTime = null;
        }
        else if (flip === false) { // blue gravity portal behavior
            gameState.player.flipGravity = false;
        }
        else if (flip === undefined) { // green gravity portal behavior
            if (player.flipGravity) {
                gameState.player.flipGravity = false;
            }
            else {
                gameState.player.flipGravity = true;
                this.landed = false;
                this.easeStartAngle = null;
                this.easeStartTime = null;
            }
        }

        return
    }

    clearRespawnTimers() {
        if (this.deathHideTimer) {
            this.deathHideTimer.remove(false);
            this.deathHideTimer = null;
        }
        if (this.respawnTimer) {
            this.respawnTimer.remove(false);
            this.respawnTimer = null;
        }
    }

    stopBlink() {
        if (this.blinkTimer) {
            this.blinkTimer.remove(false);
            this.blinkTimer = null;
        }
        this.setAlpha(1);
    }

    resetHitboxActivation(scene) {
        const bodies = scene?.matter?.world?.localWorld?.bodies;
        if (!Array.isArray(bodies)) return;

        for (const body of bodies) {
            if (!body) continue;
            body.plugin = body.plugin ?? {};
            body.plugin.isActivated = false;
        }
    }

    freezeHitboxes() {
        const matterBody = this.scene.matter.body;
        const freezeBody = (body) => {
            matterBody.setVelocity(body, { x: 0, y: 0 });
            matterBody.setAngularVelocity(body, 0);
            matterBody.setStatic(body, true);
            matterBody.setPosition(body, {
                x: gameState.player.x,
                y: gameState.player.y
            });
        };

        freezeBody(this.hitbox);
        freezeBody(this.innerHitbox);
    }

    unfreezeHitboxes() {
        const matterBody = this.scene.matter.body;
        const unfreezeBody = (body) => {
            matterBody.setStatic(body, false);
            matterBody.setVelocity(body, { x: 0, y: 0 });
            matterBody.setAngularVelocity(body, 0);
            matterBody.setPosition(body, {
                x: gameState.player.x,
                y: gameState.player.y
            });
        };

        unfreezeBody(this.hitbox);
        unfreezeBody(this.innerHitbox);
    }

    blink(scene) { // hard on/off blink on respawn
        this.stopBlink();

        const totalToggles = 6; // 4 full blinks
        let toggles = 0;

        this.blinkTimer = scene.time.addEvent({
            delay: 45,
            repeat: totalToggles - 1,
            callback: () => {
                this.setAlpha(this.alpha === 1 ? 0 : 1);
                toggles++;

                if (toggles >= totalToggles) {
                    this.setAlpha(1);
                    this.blinkTimer = null;
                }
            }
        });
    }

    respawn(scene) {
        const player = gameState.player;
        const screen = gameState.screen;
        const triggers = gameState.triggers;

        this.clearRespawnTimers();
        player.attempts++;
        player.x = 0;
        player.y = screen.height - unitsToPixels(15);
        player.isDead = false;
        this.unfreezeHitboxes();
        this.stopBlink();
        this.setAngle(0);
        this.blink(scene);
        this.landed = true;
        this.respawnLandingLockFrames = 12;
        resetLevelChannels(scene);
        this.resetHitboxActivation(scene);

        gameState.settings.backgroundID = gameState.levelDefaults.settings.backgroundID;
        gameState.settings.groundID = gameState.levelDefaults.settings.groundID;
        gameState.settings.middlegroundID = gameState.levelDefaults.settings.middlegroundID;
        gameState.settings.backgroundSpeed = gameState.levelDefaults.settings.backgroundSpeed;
        gameState.settings.middlegroundSpeedX = gameState.levelDefaults.settings.middlegroundSpeedX;
        gameState.settings.middlegroundSpeedY = gameState.levelDefaults.settings.middlegroundSpeedY;
        gameState.settings.gameSpeed = gameState.levelDefaults.settings.gameSpeed;
        gameState.player.gamemode = gameState.levelDefaults.player.gamemode;
        gameState.player.flipGravity = gameState.levelDefaults.player.flipGravity;

        scene.backgroundLayerRef.updateTexture();
        scene.middlegroundLayerRef.updateTexture();
        scene.groundLayerRef.updateTexture(scene);

        triggers.forEach((trigger) => {
            trigger.activated = false;
        })

        scene.cameras.main.scrollY = gameState.camera.minY;

        this.ghostTrailOn = false;
        this.ghostTrail.stop();
    }

    die(scene) {
        const player = gameState.player; // player state alias
        if (player.isDead) return;

        this.clearRespawnTimers();
        this.stopBlink();
        player.isDead = true;
        this.freezeHitboxes();
        scene.tweens.killAll(); // kill every active tween before spawning death FX
        this.rotationTween = null;

        this.spawnDeathEffect(scene);
        scene.cameras.main.shake(200, 0.0015);

        this.deathHideTimer = scene.time.delayedCall(this.deathHideDelay, () => {
            this.setAlpha(0);
            this.deathHideTimer = null;
        });

        this.respawnTimer = scene.time.delayedCall(this.respawnDelay, () => {
            this.respawn(scene);
            this.respawnTimer = null;
        });
    }

    checkTriggers(scene) {
        const triggers = gameState.triggers;
        const player = gameState.player;

        if (triggers == [] || triggers === undefined) return;

        const enqueueVisualTextureChange = (type) => {
            if (!Array.isArray(scene.pendingVisualTextureChanges)) {
                scene.pendingVisualTextureChanges = [];
            }
            const alreadyQueued = scene.pendingVisualTextureChanges.some(
                (change) => change.type === type
            );
            if (!alreadyQueued) {
                scene.pendingVisualTextureChanges.push({ type });
            }
        };

        triggers.forEach((trigger) => {
            if (trigger.activated) return;
            if (player.x < unitsToPixels(trigger.x)) return; // only activate trigger once player has passed it

            // continue if player x >= trigger x (player is after trigger)
            switch(trigger.type) {
                case 'color':
                    if (trigger.red === undefined ||
                        trigger.green === undefined  ||
                        trigger.blue === undefined
                    ) return; // stop if the necessary information is missing

                    let duration = 0;
                    if (trigger.duration) duration = trigger.duration;

                    let targetID = 1;
                    if (trigger.targetID) targetID = trigger.targetID;

                    colorChannel[targetID].setTarget(trigger.red, trigger.green, trigger.blue, duration);

                    switch(targetID) {
                        case 1000: scene.backgroundLayerRef.changeColor(); break;
                        case 1001: scene.groundLayerRef.changeColor(1001); break;
                        case 1002: scene.groundLayerRef.changeColor(1002); break;
                        case 1009: scene.groundLayerRef.changeColor(1009); break;
                        case 1013: scene.middlegroundLayerRef.changeColor(1013); break;
                        case 1014: scene.middlegroundLayerRef.changeColor(1014); break;
                    }
                    break;
                case 'ghostTrailEnable':
                    player.ghostTrailOn = true;
                    break;
                case 'ghostTrailDisable':
                    player.ghostTrailOn = false;
                    break;
                case 'changeBg':
                    gameState.settings.backgroundID = trigger.changeID;
                    enqueueVisualTextureChange('changeBg');
                    break;
                case 'changeG':
                    gameState.settings.groundID = trigger.changeID;
                    enqueueVisualTextureChange('changeG');
                    break;
                case 'changeMg':
                    gameState.settings.middlegroundID = trigger.changeID;
                    enqueueVisualTextureChange('changeMg');
                    break;
            }
            trigger.activated = true;
        }) 
    }
}