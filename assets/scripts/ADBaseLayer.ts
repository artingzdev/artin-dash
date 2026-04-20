import { _decorator, Component, Node, Sprite, UIOpacity, Vec2 } from 'cc';
import { LayerManager, GameLayer } from './LayerManager';
const { ccclass } = _decorator;

@ccclass('ADBaseLayer')
export class ADBaseLayer extends Component {

    protected initialized: boolean = false;

    // default values
    private params: any[] = [];

    setup(...params: any[]): void {
        this.params = params;
    }

    start(): void {
        if (this.initialized) {
            return;
        }

        this.initInternal();
        this.initialized = true;
    }

    protected initInternal(): void {
        //
    }

    static create<T extends ADBaseLayer>(
        this: (new () => T) & typeof ADBaseLayer,
        ...params: any[]
    ): T {
        const node = new Node(this.name);
        const obj = node.addComponent(this) as T;
        obj.setup(...params);
        LayerManager.addToLayer(node, this.getLayer());
        return obj;
    }

    static getLayer(): GameLayer {
        return GameLayer.T1;
    }

    setPosition(x: number, y: number): void {
        this.node.setPosition(x, y);
    }

    getPosition(): Vec2 {
        return new Vec2(this.node.position.x, this.node.position.y);
    }

    setVisible(visible: boolean): void {
        const node = this.node;
        if (!node) return;

        const uiOpacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
        uiOpacity.opacity = visible
            ? 255
            : 0;
    }

    // protected update(dt: number): void {
    //     if (!this._initialized) {
    //         return;
    //     }

    //     //
    // }
}
