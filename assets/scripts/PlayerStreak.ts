import { _decorator, Color, Component, MotionStreak, Node } from 'cc';
import { PlayLayer } from './PlayLayer';
import { ColorChannelManager } from './ColorChannelManager';
const { ccclass, property } = _decorator;

@ccclass('PlayerStreak')
export class PlayerStreak extends Component {

        @property(MotionStreak)
        streak: MotionStreak = null!;

        private static instance: PlayerStreak = null;

        private attached: boolean = false;
        private unbind: (() => void) | null = null;

        protected onLoad(): void {
                PlayerStreak.instance = this;
        }

        public static get(): PlayerStreak {
                return this.instance;
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
                        this.node.setPosition(playerPos);                        
                }
        }

        protected lateUpdate(dt: number): void {
                this.updateStreak();
        }

        protected onDestroy(): void {
                this.unbind?.();
        }
        }
