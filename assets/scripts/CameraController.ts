import { _decorator, Camera, Component, find, Node, Tween, tween, view } from 'cc';
import { settings } from './utils';
import { PlayLayer } from './PlayLayer';
const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component {

    private static _instance: CameraController;

    public static readonly LOOK_AHEAD: number = 75;
    public static readonly DZ_TOP: number = 70; // cube/robot top dead zone
    public static readonly DZ_BOTTOM: number = 40; // cube/robot bottom dead zone
    public static readonly SMOOTH_Y: number = 10; // camera Y smooth factor

    public static isFollowingPlayer: boolean = false;

    private static cameraNode: Node | null = null;

    public static rawTargetY: number = settings.defaultCameraOffsetY;

    public static shakeStrength: number = 0;
    public static shakeInterval: number = 0;
    private static shakeTimer: number = 0;
    private static shakeOffsetX: number = 0;
    private static shakeOffsetY: number = 0;

    public static logicalY: number = 0
    
    private lastCameraY: number = 0;
    public deltaY: number = 0;

    public isStatic: boolean = false;
    public staticEaseTween: Tween = null;

    onLoad() {
        CameraController.cameraNode = this.node;
        CameraController._instance = this;

        const defaultY = view.getVisibleSize().height * 0.5 - settings.defaultCameraOffsetY;
        CameraController.logicalY = defaultY;
        this.lastCameraY = this.node.position.y;
    }

    private static resolveCamera(): Node | null {
        const cached = this.cameraNode;
        if (cached && cached.isValid) {
            return cached;
        }
        const found = find('Camera');
        this.cameraNode = found ?? null;
        return this.cameraNode;
    }

    start() {
        this.node.setPosition(
            view.getVisibleSize().width / 2 + settings.defaultCameraX,
            view.getVisibleSize().height / 2 - settings.defaultCameraOffsetY,
            this.node.position.z
        )
    }

    static get instance(): CameraController {
        return CameraController._instance;
    }

    static getPositionX(): number {
        const camera = this.resolveCamera();
        if (!camera) {
            return;
        }
        return camera.position.x;
    }

    static getPositionY(): number {
        const camera = this.resolveCamera();
        if (!camera) {
            return;
        }
        return camera.position.y;
    }

    static getHalfWidth(): number {
        return view.getVisibleSize().width / 2;
    }

    static getHalfHeight(): number {
        return view.getVisibleSize().height / 2;
    }

    static getCameraRight(): number {
        const cameraPosX = this.getPositionX();
        const halfWidth = this.getHalfWidth();

        return cameraPosX + halfWidth;
    }

    static getCameraLeft(): number {
        const cameraPosX = this.getPositionX();
        const halfWidth = this.getHalfWidth();

        return cameraPosX - halfWidth;
    }

    static getCameraBottom(): number {
        const cameraPosY = this.getPositionY();
        const halfHeight = this.getHalfHeight();

        return cameraPosY - halfHeight;
    }

    static getCameraTop(): number {
        const cameraPosY = this.getPositionY();
        const halfHeight = this.getHalfHeight();

        return cameraPosY + halfHeight;
    }

    static setPosition(x: number, y: number): void {
        const camera = this.resolveCamera();
        if (!camera) return;
        camera.setPosition(x, y);
    }

    static setPositionX(x: number): void {
        const camera = this.resolveCamera();
        if (!camera) return;
        camera.setPosition(x, this.getPositionY());
    }

    static setPositionY(y: number): void {
        const camera = this.resolveCamera();
        if (!camera) return;
        camera.setPosition(this.getPositionX(), y);
    }

    static moveBy(x: number, y: number): void {
        const camera = this.resolveCamera();
        if (!camera) return;
        camera.setPosition(camera.position.x + x, camera.position.y + y);
    }

    static moveByX(x: number): void {
        const camera = this.resolveCamera();
        if (!camera) return;
        camera.setPosition(camera.position.x + x, camera.position.y);
    }

    static moveByY(y: number): void {
        const camera = this.resolveCamera();
        if (!camera) return;
        camera.setPosition(camera.position.x, camera.position.y + y);
    }

    private stopShakeAfter(seconds: number): void {
        this.scheduleOnce(() => {
            this.stopShake();
        }, seconds)
    }

    public shakeCamera(duration: number, strength: number, interval: number): void {
        if (duration < 0 || strength < 0 || interval < 0) return;

        CameraController.shakeStrength  = strength;
        CameraController.shakeInterval  = interval;
        CameraController.shakeTimer     = interval; // fire immediately on first frame

        this.stopShakeAfter(duration);
    }

    private stopShake() {
        CameraController.shakeStrength = 0;
        CameraController.shakeOffsetX  = 0;
        CameraController.shakeOffsetY  = 0;
    }

    public enterStaticY(y: number, durationSeconds: number, instant: boolean = false): void {
        this.isStatic = true;
        const startY = CameraController.getPositionY();

        if (instant || durationSeconds <= 0)
        {
            CameraController.setPositionY(y);
            CameraController.logicalY = y;
            return;
        }

        let state = { yPos: startY };

        this.staticEaseTween = tween(state)
            .to(durationSeconds, { yPos: y },{
                easing: 'quadInOut',
                onUpdate: () => {
                    CameraController.setPositionY(state.yPos);
                    CameraController.logicalY = CameraController.getPositionY();
                }
                
            })
            .start()
    }

    public exitStatic(): void {
        const currentY = CameraController.getPositionY();
        CameraController.logicalY = currentY;
        CameraController.rawTargetY = currentY - CameraController.getHalfHeight();
        this.isStatic = false;
    }

    protected lateUpdate(dt: number): void {
        if (PlayLayer.player1.isRespawning) return;

        const frameDt = dt * 60;
        let moveAmountY = 0;

        if (!this.isStatic)
        {
            const visibleSize = view.getVisibleSize();
            const halfHeight = visibleSize.height * 0.5;
            const p1Y = PlayLayer.player1.getPositionY();
            //const player1IsUpsideDown = PlayLayer.player1.isUpsideDown;
            const p1IsFixedMode = PlayLayer.player1.isFixedMode;

            const screenCenterY = CameraController.logicalY;
            // const dzTopEdge     = screenCenterY + (player1IsUpsideDown ? CameraController.DZ_BOTTOM : CameraController.DZ_TOP);
            // const dzBottomEdge  = screenCenterY - (player1IsUpsideDown ? CameraController.DZ_TOP    : CameraController.DZ_BOTTOM);
            const dzTopEdge     = screenCenterY + CameraController.DZ_TOP;
            const dzBottomEdge  = screenCenterY - CameraController.DZ_BOTTOM;

            if (p1IsFixedMode) {
                CameraController.rawTargetY = p1Y - halfHeight;
            } else {
                if (p1Y > dzTopEdge) {
                    CameraController.rawTargetY = p1Y - halfHeight - CameraController.DZ_TOP;
                } else if (p1Y < dzBottomEdge) {
                    CameraController.rawTargetY = p1Y - halfHeight + CameraController.DZ_BOTTOM;
                }
            }

            const minY = -settings.defaultCameraOffsetY;
            const clampedTargetY = Math.max(CameraController.rawTargetY, minY);

            const lerpFactor = Math.min(1, frameDt / CameraController.SMOOTH_Y);
            moveAmountY = (clampedTargetY - (CameraController.logicalY - halfHeight)) * lerpFactor;            
        }

        const newX = CameraController.isFollowingPlayer
            ? PlayLayer.player1.getPositionX() + CameraController.LOOK_AHEAD
            : CameraController.getPositionX();
        const newY = CameraController.logicalY + moveAmountY;

        CameraController.logicalY = newY;

        let finalX = newX;
        let finalY = newY;

        // camera shake logic
        if (CameraController.shakeStrength > 0) {
            CameraController.shakeTimer += dt;
            if (CameraController.shakeTimer >= CameraController.shakeInterval) {
                CameraController.shakeTimer = 0;
                const sx = (Math.random() + Math.random()) - 1.0;
                const sy = (Math.random() + Math.random()) - 1.0;
                CameraController.shakeOffsetX = CameraController.shakeStrength * sx;
                CameraController.shakeOffsetY = CameraController.shakeStrength * sy;
            }
            finalX += CameraController.shakeOffsetX;
            finalY += CameraController.shakeOffsetY;
        }

        CameraController.setPosition(finalX, finalY);

        // compute delta position
        const currentY = this.node.position.y;
        this.deltaY = currentY - this.lastCameraY;
        this.lastCameraY = currentY;
    }
}
