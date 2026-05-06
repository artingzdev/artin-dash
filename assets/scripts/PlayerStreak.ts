import { _decorator, Color, Component, MotionStreak, Node } from 'cc';
import { PlayLayer } from './PlayLayer';
import { ColorChannelManager } from './ColorChannelManager';
import { cosDeg, sinDeg } from './utils';
const { ccclass, property } = _decorator;

@ccclass('PlayerStreak')
export class PlayerStreak extends Component {

        @property(MotionStreak)
        streak: MotionStreak = null!;

        private static _instance: PlayerStreak = null;

        private attached: boolean = false;
        private unbind: (() => void) | null = null;
        public offsetY: number = 0;
        public offsetX: number = 0;

        protected onLoad(): void {
                PlayerStreak._instance = this;
        }

        public static get instance(): PlayerStreak {
                return this._instance;
        }
        
        protected start(): void {
                this.unbind = this.bindToChannel(ColorChannelManager.P2);
        }

        public setAttached(attached: boolean, reset: boolean = false): void {
                if (reset) this.streak.reset();
                this.attached = attached
        }

        protected bindToChannel(id: number): () => void {
            return ColorChannelManager.instance.bindTo(id, (color) => {
                    this.changeColor(color);
            });
        }

        protected changeColor(color: Color) {
                this.streak.color = ColorChannelManager.getColor(
                        color.r,
                        color.g,
                        color.b,
                        255
                )
        }

        private updateStreak(): void {
                if (this.attached) {
                        const playerPos = PlayLayer.player1.getPosition();
                        const shouldApplyRotation = this.offsetX != 0 && this.offsetY != 0;

                        let newOffsetX = this.offsetX;
                        let newOffsetY = this.offsetY;

                        if (shouldApplyRotation) {
                                const a = -PlayLayer.player1.playerRotation;
                                newOffsetX = this.offsetX * cosDeg(a) - this.offsetY * sinDeg(a)
                                newOffsetY = this.offsetX * sinDeg(a) + this.offsetY * cosDeg(a)
                        }
                        
                        this.node.setPosition(
                                playerPos.x + newOffsetX,
                                playerPos.y + newOffsetY,
                                playerPos.z
                        );
                }
        }

        protected lateUpdate(dt: number): void {
                this.updateStreak();
        }

        protected onDestroy(): void {
                this.unbind?.();
        }
        }
