import { _decorator, Component, Game, Node, UITransform, view } from 'cc';
const { ccclass } = _decorator;

export enum GameLayer {
    BG, MG,
    B5, B4, B3, B2, B1,
    P,
    PB, // portal back
    T1, T2, T3, T4,
    G,
    UI, MAX
}

@ccclass('LayerManager')
export class LayerManager extends Component {

    private static layers: Map<GameLayer, Node> = new Map();
    private static renderContainers: Map<GameLayer, Node> = new Map();
    private static renderBuckets: Map<string, { node: Node; layer: GameLayer; z: number; firstSeen: number }> = new Map();
    private static nextBucketOrder = 0;

    onLoad() {
        LayerManager.init(this.node);
    }

    static init(root: Node) {
        this.layers.clear();
        this.renderContainers.clear();
        this.renderBuckets.clear();
        this.nextBucketOrder = 0;

        const names = Object.keys(GameLayer).filter(k => isNaN(Number(k)));

        // root.setPosition(
        //     -view.getVisibleSize().width / 2,
        //     -view.getVisibleSize().height / 2
        // );

        root.getComponent(UITransform).setAnchorPoint(0, 0);

        for (const name of names) {

            const layerEnum = GameLayer[name as keyof typeof GameLayer];
            const node = root.getChildByName(name);

            if (!node) {
                console.warn(`Layer node "${name}" not found under ${root.name}`);
                continue;
            }

            this.layers.set(layerEnum, node);
        }

        // UI draws later siblings on top; scene had P before PB, so portal backs drew in front of the player.
        const pNode = this.layers.get(GameLayer.P);
        const pbNode = this.layers.get(GameLayer.PB);
        if (pNode && pbNode && pNode.parent === pbNode.parent && pbNode.getSiblingIndex() > pNode.getSiblingIndex()) {
            pbNode.setSiblingIndex(pNode.getSiblingIndex());
        }
    }

    static addToLayer(node: Node, layer: GameLayer) {
        const parent = this.layers.get(layer);

        if (!parent) {
            console.warn(`Layer ${GameLayer[layer]} not initialized`);
            return;
        }

        parent.addChild(node);
    }

    static getLayerByID(layerID: number): GameLayer {
        let layer: GameLayer | null = null;

        switch(layerID) {
            case -5:
                    layer = GameLayer.B5; break;
            case -3:
                    layer = GameLayer.B4; break;
            case -1:
                    layer = GameLayer.B3; break;
            case 1:
                    layer = GameLayer.B2; break;
            case 3:
                    layer = GameLayer.B1; break;
            case 5:
                    layer = GameLayer.T1; break;
            case 7:
                    layer = GameLayer.T2; break;
            case 9:
                    layer = GameLayer.T3; break;
            case 11:
                    layer = GameLayer.T4; break;
            case 100:
                    layer = GameLayer.PB; break;
        }

        return layer;
    }

    static getOrCreateRenderBucket(layer: GameLayer, z: number, stateKey: string): Node {
        const parent = this.layers.get(layer);
        if (!parent) {
            throw new Error(`Layer ${GameLayer[layer]} not initialized`);
        }

        const bucketKey = `${layer}:${z}:${stateKey}`;
        const existing = this.renderBuckets.get(bucketKey);
        if (existing) {
            return existing.node;
        }

        let renderContainer = this.renderContainers.get(layer);
        if (!renderContainer) {
            renderContainer = new Node('__batched-render');
            parent.addChild(renderContainer);
            this.renderContainers.set(layer, renderContainer);
        }

        const bucket = new Node(`bucket:${z}:${stateKey}`);
        renderContainer.addChild(bucket);

        this.renderBuckets.set(bucketKey, {
            node: bucket,
            layer,
            z,
            firstSeen: this.nextBucketOrder++,
        });

        this.sortRenderBuckets(layer);

        return bucket;
    }

    private static sortRenderBuckets(layer: GameLayer) {
        const renderContainer = this.renderContainers.get(layer);
        if (!renderContainer) {
            return;
        }

        const orderedBuckets = [...this.renderBuckets.values()]
            .filter((bucket) => bucket.layer === layer)
            .sort((a, b) => a.z - b.z || a.firstSeen - b.firstSeen);

        orderedBuckets.forEach((bucket, index) => {
            bucket.node.setSiblingIndex(index);
        });
    }

    static getLayer(layer: GameLayer): Node | undefined {
        return this.layers.get(layer);
    }
}
