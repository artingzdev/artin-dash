import { colorChannel } from "../colors";
import { gameState } from "../state/gameState";
import { getRenderedSize, getTextureDimensions, setColorChannel, unitsToPixels } from "../utils";

/*  --- OBJECT TYPES ---------
    0: solid
    2: hazard
    3: inverse gravity portal
    4: normal gravity portal
    5: ship portal
    6: cube portal
    7: decoration
    8: yellow jump pad
    9: pink jump pad
    10: gravity pad
    11: yellow jump ring
    12: pink jump ring
    13: gravity ring
    14: inverse mirror portal
    15: normal mirror portal
    16: ball portal
    17: regular size portal
    18: mini size portal
    19: ufo portal
    20: modifier
    21: breakable
    22: secret coin
    23: dual portal
    24: dual off portal
    25: slope
    26: wave portal
    27: robot portal
    28: teleport portal
    29: green ring
    30: collectible
    31: user coin
    32: drop ring
    33: spider portal
    34: red jump pad
    35: red jump ring
    36: custom ring
    37: dash ring
    38: gravity dash ring
    39: collision object
    40: special
    41: swing portal
    42: gravity toggle portal
    43: spider portal
    44: spider pad
    45: enter effect object
    46: teleport orb
    47: animated hazard
*/

export class GameObject extends Phaser.GameObjects.Container {
    constructor(scene, object, objectDefs = null) {
        super(scene, 0, 0);

        let trigger;

        switch (object.objectId) { // do something if the object id meets these exceptions
            case 3029: // change background trigger
                trigger = {
                    type: 'changeBg',
                    x: object.x,
                    changeID: String(object.changeID).padStart(2, "0")
                }
                gameState.triggers.push(trigger);
                break;
            case 3030: // change ground trigger
                trigger = {
                    type: 'changeG',
                    x: object.x,
                    changeID: String(object.changeID).padStart(2, "0")
                }
                gameState.triggers.push(trigger);

                break;
            case 3031: // change middleground trigger
                trigger = {
                    type: 'changeMg',
                    x: object.x,
                    changeID: String(object.changeID).padStart(2, "0")
                }
                gameState.triggers.push(trigger);

                break;
            case 32: // enable ghost trail trigger
                trigger = {
                    type: 'ghostTrailEnable',
                    x: object.x
                }
                gameState.triggers.push(trigger);
                break;
            case 33: // disable ghost trail trigger
                trigger = {
                    type: 'ghostTrailDisable',
                    x: object.x
                }
                gameState.triggers.push(trigger);
                break;
            case 914:
                return;

            case 899:
            case 29:
            case 30:
            case 105:
            case 744:
            case 900:
            case 915: {

                trigger = {
                    type: 'color',
                    x: object.x,
                    red: object.red,
                    green: object.green,
                    blue: object.blue,
                    duration: 0,
                    targetID: 1,
                    blending: false,
                    opacity: 1,
                    activated: false
                };

                if (object.duration !== undefined)
                    trigger.duration = object.duration * 1000;

                if (object.targetColorId !== undefined)
                    trigger.targetID = object.targetColorId;

                if (object.blending !== undefined)
                    trigger.blending = object.blending;

                if (object.opacity !== undefined)
                    trigger.opacity = object.opacity;

                switch (object.objectId) {
                    case 29: trigger.targetID = 1000; break;
                    case 30: trigger.targetID = 1001; break;
                    case 105: trigger.targetID = 1004; break;
                    case 744: trigger.targetID = 1003; break;
                    case 900: trigger.targetID = 1009; break;
                    case 915: trigger.targetID = 1002; break;
                }

                gameState.triggers.push(trigger);
                break;
            }
        }

        const jsonIds = objectDefs ?? scene.cache.json.get('objects');
        
        this.json = jsonIds[object.objectId];
        this.spriteSheetName = this.json.spritesheet.replace(/\.png$/, '');


        // base sprite
        this.frameName = this.json.frame;
        this.textureDimensions = getTextureDimensions(scene, this.spriteSheetName, this.frameName);
        this.base = new Phaser.GameObjects.Image(scene, 0, 0, this.spriteSheetName, this.frameName);
        this.base.setDisplaySize(
            getRenderedSize(this.textureDimensions.width),
            getRenderedSize(this.textureDimensions.height)
        );      
        this.base.containerZ = 0;
        if (this.json.colorable) this.colorChannelID = this.json.default_base_color_channel;
        else this.colorChannelID = this.json.color_channel;
        if (this.json.colorable && object.mainColorChannelId) this.colorChannelID = object.mainColorChannelId;
        if (![0, -1].includes(this.json.default_base_color_channel) && this.colorChannelID !== undefined) setColorChannel(this.base, this.colorChannelID);

        this.add([this.base]);  


        // child sprites
        if (this.json.children) {
            this.json.children.forEach(child => {
                this.frameName = child.frame;
                if (child.isglow) this.spriteSheetName = 'GJ_GameSheetGlow-uhd';
                else this.spriteSheetName = this.json.spritesheet.replace(/\.png$/, '');
                this.textureDimensions = getTextureDimensions(scene, this.spriteSheetName, this.frameName);


                const childSprite = new Phaser.GameObjects.Image(scene, 0, 0, this.spriteSheetName, this.frameName);

                this.colorChannelID = null;
                if (child.color_channel) this.colorChannelID = child.color_channel; // set default color
                if (child.colorable && object.secondaryColorChannelId) { // set object's color if possible
                    this.colorChannelID = object.secondaryColorChannelId;
                    
                }
                if (this.colorChannelID !== null) setColorChannel(childSprite, this.colorChannelID);
                

                // child-specific transformations
                if (child.anchor_x !== undefined) childSprite.originX = child.anchor_x + 0.5;
                if (child.anchor_y !== undefined) childSprite.originY = child.anchor_y + 0.5;
                if (child.flip_x !== undefined) childSprite.setFlipX(child.flip_x);
                if (child.flip_y !== undefined) childSprite.setFlipY(child.flip_y);
                if (child.rot !== undefined) childSprite.setAngle(child.rot);
                if (child.scale_x !== undefined) childSprite.scaleX = child.scale_x;
                if (child.scale_y !== undefined) childSprite.scaleY = child.scale_y;
                if (child.x !== undefined) childSprite.x = unitsToPixels(child.x);
                if (child.y !== undefined) childSprite.y = unitsToPixels(child.y);

                childSprite.setDisplaySize(
                    getRenderedSize(this.textureDimensions.width),
                    getRenderedSize(this.textureDimensions.height)
                );      

                if (child.isglow) { // glow frame properties
                    childSprite.setBlendMode(Phaser.BlendModes.ADD)
                    childSprite.alpha = 0.67;
                    if (this.json.colorable && object.mainColorChannelId) childSprite.tint = colorChannel[object.mainColorChannelId].toTint();
                }

                const childZ = typeof child.z === "number" ? child.z : 0;
                childSprite.containerZ = childZ;
                let insertIndex = this.list.findIndex(item => (item.containerZ ?? 0) > childZ);
                if (insertIndex === -1) insertIndex = this.list.length;                


                this.addAt(childSprite, insertIndex);
            });
        }


        // final container properties
        this.angle = object.rotation !== undefined ? object.rotation : 0;
        if (object.scaleX) this.scaleX = object.scaleX;
        if (object.scaleY) this.scaleY = object.scaleY;
        if (object.scale) this.setScale(object.scaleX, object.scaleY)
        if (object.flipH) this.scaleX *= -1;
        if (object.flipV) this.scaleY *= -1;
        this.setPosition(unitsToPixels(object.x), gameState.screen.height - unitsToPixels(object.y))
        if (this.frameName.startsWith("edit")) this.setAlpha(0); // hide editor-only objects


        let layer = this.json.default_z_layer;
        let order = this.json.default_z_order;
        if (object.zLayer !== undefined) layer = object.zLayer;
        if (object.zOrder !== undefined) order = object.zOrder;
        this._z = order;

        switch(layer) {
            case -5: scene.b5Layer.add(this); break;
            case -3: scene.b4Layer.add(this); break;
            case -1: scene.b3Layer.add(this); break;
            case 1: scene.b2Layer.add(this); break;
            case 3: scene.b1Layer.add(this); break;
            case 5: scene.t1Layer.add(this); break;
            case 7: scene.t2Layer.add(this); break;
            case 9: scene.t3Layer.add(this); break;
            case 11: scene.t4Layer.add(this); break;
        }

        this.isDynamic = object.isDynamic === true || object.dynamic === true;
        this._updateCullBounds();

        this.setVisible(false);
        if (this.isDynamic && Array.isArray(scene.dynamicObjects)) {
            scene.dynamicObjects.push(this);
        } else if (Array.isArray(scene.staticObjects)) {
            scene.staticObjects.push(this);
        }


        // create hitbox based on object type
        const hitboxAngleRad = Phaser.Math.DegToRad(this.angle);
        switch (this.json.object_type) {
            case 0: // solid
                this.hitbox = scene.matter.add.rectangle(
                    unitsToPixels(object.x + this.json.hitbox.midX),
                    gameState.screen.height - unitsToPixels(object.y),
                    unitsToPixels(this.json.hitbox.size.width),
                    unitsToPixels(this.json.hitbox.size.height),
                    {
                        isStatic: true,
                        friction: 0,
                        restitution: 0,
                        angle: 0
                    }
                );
                this.hitbox.plugin = this.hitbox.plugin ?? {};
                this.hitbox.plugin.objectType = 0;
                break;
            case 2: // hazard
                this.hitbox = scene.matter.add.rectangle(
                    unitsToPixels(object.x + this.json.hitbox.midX),
                    gameState.screen.height - unitsToPixels(object.y),
                    unitsToPixels(this.json.hitbox.size.width * this.scaleX),
                    unitsToPixels(this.json.hitbox.size.height * this.scaleY),
                    {
                        isStatic: true,
                        isSensor: true,
                        friction: 0,
                        restitution: 0,
                        angle: hitboxAngleRad
                    }
                );
                this.hitbox.plugin = this.hitbox.plugin ?? {};
                this.hitbox.plugin.isHazard = true;
                break;      
            case 3: // inverse gravity portal
                this.hitbox = scene.matter.add.rectangle(
                    unitsToPixels(object.x + this.json.hitbox.midX),
                    gameState.screen.height - unitsToPixels(object.y),
                    unitsToPixels(this.json.hitbox.size.width * this.scaleX),
                    unitsToPixels(this.json.hitbox.size.height * this.scaleY),
                    {
                        isStatic: true,
                        isSensor: true,
                        friction: 0,
                        restitution: 0,
                        angle: hitboxAngleRad
                    }
                );
                this.hitbox.plugin = this.hitbox.plugin ?? {};
                this.hitbox.plugin.isInverseGravityPortal = true;
                break;
            case 4: // normal gravity portal
                this.hitbox = scene.matter.add.rectangle(
                    unitsToPixels(object.x + this.json.hitbox.midX),
                    gameState.screen.height - unitsToPixels(object.y),
                    unitsToPixels(this.json.hitbox.size.width * this.scaleX),
                    unitsToPixels(this.json.hitbox.size.height * this.scaleY),
                    {
                        isStatic: true,
                        isSensor: true,
                        friction: 0,
                        restitution: 0,
                        angle: hitboxAngleRad
                    }
                );
                this.hitbox.plugin = this.hitbox.plugin ?? {};
                this.hitbox.plugin.isNormalGravityPortal = true;
                break;
            case 11: // yellow jump ring
                this.hitbox = scene.matter.add.rectangle(
                    unitsToPixels(object.x + this.json.hitbox.midX),
                    gameState.screen.height - unitsToPixels(object.y),
                    unitsToPixels(this.json.hitbox.size.width * this.scaleX),
                    unitsToPixels(this.json.hitbox.size.height * this.scaleY),
                    {
                        isStatic: true,
                        isSensor: true,
                        friction: 0,
                        restitution: 0,
                        angle: hitboxAngleRad
                    }
                );
                this.hitbox.plugin = this.hitbox.plugin ?? {};
                this.hitbox.plugin.isYellowJumpRing = true;
                this.hitbox.plugin.isActivated = false;
                break;
        }
    }

    _updateCullBounds() {
        const bounds = this.getBounds();
        this._cullBounds = {
            minX: bounds.x,
            maxX: bounds.right,
            minY: bounds.y,
            maxY: bounds.bottom
        };
    }
}
