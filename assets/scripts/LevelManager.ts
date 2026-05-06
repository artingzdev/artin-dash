import { _decorator, Component } from 'cc';
import { ADBackgroundLayer } from './ADBackgroundLayer';
import { ADGroundLayer } from './ADGroundLayer';
import { ADMGLayer } from './ADMGLayer';
import { GameLayer, LayerManager } from './LayerManager';
import { cosDeg, getCachedJson, sinDeg } from './utils';
import { GameObject, ObjectType } from './GameObject';
import { CollisionRect } from './CollisionRect';
import { ColorChannelManager } from './ColorChannelManager';
import { CameraController } from './CameraController';
import { EnterEffectManager } from './EnterEffectManager';
import { TriggerManager } from './TriggerManager';
import { PlayLayer } from './PlayLayer';
const { ccclass } = _decorator;

interface levelDefaultSettings {
        defaultChannelColors: [ID: number, r: number, g: number, b: number, a: number, blending: boolean][];
}

@ccclass('LevelManager')
export class LevelManager extends Component {

        private static activeBuckets: Set<number> = new Set();
        private static activeBucketsArray: number[] = [];
        public static levelSections: CollisionRect[][] = [];
        public static levelBuckets: GameObject[][] = [];
        public static sectionWidth: number = 150;

        public static levelDefaultSettings: levelDefaultSettings = {
                defaultChannelColors: []
        };

        private static nearbyBuffer: CollisionRect[] = [];
        private static immutableColorChannelIds: number[] = [1005, 1006, 1010, 1011, 1007, 1012];

        public static levelLoadingFinished: boolean = false;
        private static lastVisibleRange = { min: -1, max: -1 };

        // object de/reactivation (rings, pads, portals...)
        public static activatedObjects: CollisionRect[] = [];


        /**
         * Deactivates all objects in the level that have been triggered (e.g. pads, rings, portals).
         * @returns 
         */
        public static deactivateObjects(): void {
                const activatedObjects = LevelManager.activatedObjects;
                if (activatedObjects.length < 1) return;

                for (let i = 0; i < activatedObjects.length; i++) {
                        activatedObjects[i].activated = false;
                }
                activatedObjects.length = 0;
        }

        public static loadLevelFromJson(filename: string): void {
                this.levelLoadingFinished = false;

                this.levelSections.length = 0;
                this.levelBuckets.length = 0;
                this.lastVisibleRange.min = -1;
                this.lastVisibleRange.max = -1;
                this.activeBuckets.clear();
                this.activeBucketsArray.length = 0;
                TriggerManager.clearTriggersArray();
                this.levelDefaultSettings.defaultChannelColors = [];

                // write some code to clear the existing level...

                //
                const level = getCachedJson(filename).json as Record<string, any>;
                if (!level) return;

                const header = level.header;
                const objects = level.objects;
                if (!header) return;

                // -------- level header loading ----------------------------
                // load bg, g, and mg types
                const backgroundID = header.backgroundTextureId;
                const groundID = header.groundTextureId;
                const middlegroundID = header.middlegroundTextureId;

                const backgroundLayer = LayerManager.getLayer(GameLayer.BG)?.children[0]?.getComponent(ADBackgroundLayer);
                const groundLayer = LayerManager.getLayer(GameLayer.G)?.children[0]?.getComponent(ADGroundLayer);
                const ceilingLayer = LayerManager.getLayer(GameLayer.G)?.children[1]?.getComponent(ADGroundLayer);
                const middlegroundLayer = LayerManager.getLayer(GameLayer.MG)?.children[0]?.getComponent(ADMGLayer);

                if (backgroundID) backgroundLayer?.swapBackground(backgroundID);
                if (groundID) groundLayer?.swapGround(groundID);
                if (groundID) ceilingLayer?.swapGround(groundID);
                if (middlegroundID) middlegroundLayer?.swapMiddleground(middlegroundID);

                // -------- level objects loading ----------------------------
                if (!objects || !Array.isArray(objects)) return;

                const objectList = getCachedJson('objects').json as Record<string, any>;
                this.levelSections.length = 0;

                let currentLength = 0; // keep track of the level's length
                for (let i = 0; i < objects.length; i++) { // loop through every object in the level and build them
                        const object = objects[i];
                        const objectID = object.objectId;

                        const objectDefaults = objectList[objectID];
                        let frameName: string = objectDefaults.frame;

                        if (frameName.startsWith("edit")) {
                                TriggerManager.runTriggerCheck(object);
                                continue;
                        }

                        const defaultZLayer = objectDefaults.default_z_layer;
                        
                        const x = object.x;
                        const y = object.y;
                        const rotation = object.rotation;
                        const objectZLayer = object.zLayer;
                        const flipH = object.flipH;
                        const flipV = object.flipV;

                        const zLayer = objectZLayer ? objectZLayer : defaultZLayer;

                        const gameObj = GameObject.createWithKey(objectID);
                        gameObj.addToZLayer(zLayer);
                        if (x && y) gameObj.setPosition(x, y);
                        if (rotation) gameObj.setRotation(rotation);
                        if (flipH == true) gameObj.flipX();
                        if (flipV == true) gameObj.flipY();
                        gameObj.setVisible(false); // set node to be inactive by default
                        if (
                                objectDefaults.object_type == ObjectType.JUMP_RING_YELLOW ||
                                objectDefaults.object_type == ObjectType.JUMP_RING_PINK ||
                                objectDefaults.object_type == ObjectType.JUMP_RING_RED
                        ) gameObj.setScale(0.8, true);

                        // create collider and add to level sections
                        const isCircleHitbox = objectDefaults.hitbox.isCircle == true;
                        const colliderRotation = isCircleHitbox ? 0 : rotation;

                        const layer = LayerManager.getLayerByID(zLayer);
                        const colliderWidth = colliderRotation == 90 || colliderRotation == 270 ? objectDefaults.hitbox.size.height : objectDefaults.hitbox.size.width
                        const colliderHeight = colliderRotation == 90 || colliderRotation == 270 ? objectDefaults.hitbox.size.width : objectDefaults.hitbox.size.height

                        const collider = new CollisionRect(
                                objectDefaults.object_type,
                                x,
                                y,
                                colliderWidth,
                                colliderHeight,
                                colliderRotation,
                                layer,
                                gameObj
                        );

                        gameObj.collider = collider;
                        gameObj.baseColliderSize.width = colliderWidth;
                        gameObj.baseColliderSize.height = colliderHeight;

                        const extraGameObj = this.tryCreateExtraGameObject(objectID, zLayer, x, y, rotation, flipH, flipV);

                        const sectionIndex = Math.max(0, Math.floor(x / this.sectionWidth));
                        (this.levelSections[sectionIndex] ??= []).push(collider); // build hitbox buckets
                        (this.levelBuckets[sectionIndex] ??= []).push(gameObj); // build object buckets
                        if (extraGameObj) (this.levelBuckets[sectionIndex] ??= []).push(extraGameObj);

                        if (x > currentLength) currentLength = x; // update to get the final level length at the end
                };
                if (currentLength > 0) PlayLayer.instance.levelLength = currentLength;
                else PlayLayer.instance.levelLength = null;

                // -------- level color channels loading ----------------------------
                const levelColors = header.color;
                if (!levelColors || levelColors.length < 1) return;

                for (let i = 0; i < levelColors.length; i++) {
                        const c = levelColors[i];

                        const id = parseInt(c[6]);
                        if (this.immutableColorChannelIds.includes(id)) continue;
                        
                        const r = parseInt(c[1]);
                        const g = parseInt(c[2]);
                        const b = parseInt(c[3]);

                        //const copyID = c[9];
                        const blending = c[5] == "1";
                        const opacity = Math.round(parseFloat(c[7]) * 255);

                        ColorChannelManager.instance.setChannel(id, r, g, b, opacity, blending);
                        this.levelDefaultSettings.defaultChannelColors.push([id, r, g, b, opacity, blending]);
                }

                this.levelLoadingFinished = true;
                void PlayLayer.instance.prepareLevelMusic().then(() => {
                        PlayLayer.instance.startPlaying();
                });
        }

        /**
         * Helper for unlisted parts of game objects such as the ball on pulsing rods.
         */
        private static tryCreateExtraGameObject(
                objectID: number,
                zLayer: number,
                objX: number,
                objY: number,
                rotation: number = 0,
                flipX: boolean = false,
                flipY: boolean = false
        ): GameObject | null
        {
                if (!zLayer || !objectID) return null;

                let rodBallDist: number | null = null;

                switch(objectID) {
                        case 16: // medium pulsing rod
                                rodBallDist = 23.25;
                                break;
                        case 15: // tall pulsing rod
                                rodBallDist = 31.00;
                                break;
                        case 17: // short pulsing rod
                                rodBallDist = 16.25;
                                break;
                        default:
                                return null;
                }

                if (rodBallDist) {
                        const rodBallObj = GameObject.createWithKey(37);
                        rodBallObj.addToZLayer(zLayer);
                        rodBallObj.setScale(0.5); // default stationary scale
                        rodBallObj.setVisible(false);

                        let correctedRot = -rotation;
                        if (flipY) correctedRot += 180;

                        const x = objX + (-sinDeg(correctedRot) * rodBallDist);
                        const y = objY + (cosDeg(correctedRot) * rodBallDist);

                        rodBallObj.setPosition(x, y);
                        rodBallObj.setRotation(rotation);
                        return rodBallObj;
                }

                return null;
        }
        
        /**
         * Returns an array of all collidable bodies around the player.
         * @param playerX The player's current X position in world space.
         * @returns An array of `CollisionRect`s near the player.
         */
        public static getNearbySectionObjects(playerX: number): CollisionRect[] {
                const centerSec = Math.max(0, Math.floor(playerX / this.sectionWidth));
                const fromSec = Math.max(0, centerSec - 1);
                const toSec = Math.min(this.levelSections.length - 1, centerSec + 1);
                const buf = this.nearbyBuffer;
                buf.length = 0;
                for (let si = fromSec; si <= toSec; si++) {
                const section = this.levelSections[si];
                if (section) {
                        for (let object = 0; object < section.length; object++) {
                                        buf.push(section[object]);
                                }
                        }
                }
                return buf;
        }

        private static updateCulling(): void {
                if (!this.levelLoadingFinished) return;

                const cameraLeft = CameraController.getCameraLeft();
                const cameraRight = CameraController.getCameraRight();

                const minBucket = Math.floor(cameraLeft / this.sectionWidth);
                const maxBucket = Math.floor(cameraRight / this.sectionWidth);

                if (minBucket !== this.lastVisibleRange.min || maxBucket !== this.lastVisibleRange.max) {

                        for (let i = this.activeBucketsArray.length - 1; i >= 0; i--) {
                                const b = this.activeBucketsArray[i];
                                if (b < minBucket || b > maxBucket) {
                                        const bucket = this.levelBuckets[b];
                                        if (bucket) {
                                                for (let j = 0; j < bucket.length; j++) {
                                                        bucket[j].setVisible(false);
                                                }
                                        }
                                        this.activeBuckets.delete(b);
                                        this.activeBucketsArray[i] = this.activeBucketsArray[this.activeBucketsArray.length - 1];
                                        this.activeBucketsArray.pop();
                                }
                        }

                        for (let b = minBucket; b <= maxBucket; b++) {
                                if (!this.activeBuckets.has(b)) {
                                        const bucket = this.levelBuckets[b];
                                        if (bucket) {
                                                for (let j = 0; j < bucket.length; j++) {
                                                        bucket[j].setVisible(true);
                                                }
                                        }
                                        this.activeBuckets.add(b);
                                        this.activeBucketsArray.push(b);
                                }
                        }

                        this.lastVisibleRange.min = minBucket;
                        this.lastVisibleRange.max = maxBucket;
                }

                for (let i = 0; i < this.activeBucketsArray.length; i++) {
                        const bucket = this.levelBuckets[this.activeBucketsArray[i]];
                        if (bucket) {
                                for (let j = 0; j < bucket.length; j++) {
                                        EnterEffectManager.updateEnterEffects(bucket[j], cameraLeft, cameraRight);
                                }
                        }
                }
        }

        protected lateUpdate(dt: number): void {
                LevelManager.updateCulling();
        }
}
