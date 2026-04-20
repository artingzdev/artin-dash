import { _decorator, Color, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export interface ColorChannel {
    r: number;
    g: number;
    b: number;
    a: number;
    blending: boolean;
    copyChannelID: number | null;
}

type ChannelListener = (resolved: Color) => void;

@ccclass('ColorChannelManager')
export class ColorChannelManager extends Component {

    private static channelInstance: ColorChannelManager;
    static get instance(): ColorChannelManager {
        if (!this.channelInstance) this.channelInstance = new ColorChannelManager();
        this.channelInstance.ensureInitialized();
        return this.channelInstance;
    }

    public static scratchColor: Color = new Color();
    private channels = new Map<number, ColorChannel>();
    private listeners = new Map<number, Set<ChannelListener>>();
    private initialized = false;

    // reserved color channel ID's
    static readonly BG = 1000;
    static readonly G1 = 1001;
    static readonly LINE = 1002;
    static readonly _3DL = 1003;
    static readonly OBJ = 1004;
    static readonly P1 = 1005;
    static readonly P2 = 1006;
    static readonly LBG = 1007;
    static readonly G2 = 1009;
    static readonly BLACK = 1010;
    static readonly WHITE = 1011;
    static readonly LIGHTER = 1012;
    static readonly MG1 = 1013;
    static readonly MG2 = 1014;
    static readonly PGLOW = 10000; // custom-made player glow channel

    // setup
    start() {
        this.ensureInitialized();
    }

    private ensureInitialized() {
        if (this.initialized) return;

        this.initialized = true;
        this.setChannel(ColorChannelManager.BG, 40, 125, 255, 255, false);
        this.setChannel(ColorChannelManager.G1, 0, 102, 255, 255, false);
        this.setChannel(ColorChannelManager.LINE, 255, 255, 255, 255, true);
        this.setChannel(ColorChannelManager._3DL, 255, 255, 255, 255, false);
        this.setChannel(ColorChannelManager.OBJ, 255, 255, 255, 255, false);
        this.setChannel(ColorChannelManager.P1, 0, 255, 255, 255, true);
        this.setChannel(ColorChannelManager.P2, 255, 255, 0, 255, true);
        // LBG not supported currently
        this.setChannel(ColorChannelManager.G2, 0, 102, 255, 255, false);
        this.setChannel(ColorChannelManager.BLACK, 0, 0, 0, 255, false);
        this.setChannel(ColorChannelManager.WHITE, 255, 255, 255, 255, false);
        // lighter also not supported
        this.setChannel(ColorChannelManager.MG1, 40, 125, 255, 255, false);
        this.setChannel(ColorChannelManager.MG2, 40, 125, 255, 255, false);
        this.setChannel(ColorChannelManager.PGLOW, 255, 255, 255, 255, false);
    }

    // loadFromArray(channels: ColorChannel[]) {
    //     this.channels.clear();
    //     for (const ch of channels) {
    //         this.channels.set(ch.id, { ...ch });
    //     }
    // }

    // write
    /**
     * Sets a color channel with the specified RGBA values and blending mode.
     * @param id - The unique identifier for the color channel
     * @param r - Red channel value (0-255)
     * @param g - Green channel value (0-255)
     * @param b - Blue channel value (0-255)
     * @param a - Alpha channel value (0-255), defaults to 255
     * @param blending - Whether blending is enabled for this channel, defaults to false
     */
    setChannel(id: number, r: number, g: number, b: number, a: number = 255, blending: boolean = false) {
        const ch = this.getOrCreate(id);
        ch.r = r; ch.g = g; ch.b = b; ch.a = a; ch.blending = blending;
        this.notify(id);
        this.notifyCopiers(id);
    }

    public static getColor(r: number, g: number, b: number, a: number = 255): Color {
        const scratchColor = ColorChannelManager.scratchColor;
        scratchColor.r = r;
        scratchColor.g = g;
        scratchColor.b = b;
        scratchColor.a = a;
        return scratchColor;
    }

    setCopy(id: number, copyChannelID: number | null) {
        this.getOrCreate(id).copyChannelID = copyChannelID;
        this.notify(id);
    }

    // read
    resolve(id: number, depth = 0): Color {
        if (depth > 8) return ColorChannelManager.getColor(255, 255, 255, 255);
        const ch = this.channels.get(id);
        if (!ch) return ColorChannelManager.getColor(255, 255, 255, 255);
        if (ch.copyChannelID != null) return this.resolve(ch.copyChannelID, depth + 1);
        return ColorChannelManager.getColor(ch.r, ch.g, ch.b, ch.a);
    }
    getChannel(id: number): ColorChannel | undefined {
        return this.channels.get(id);
    }

    bindTo(id: number, listener: ChannelListener): () => void {
        if (!this.listeners.has(id)) this.listeners.set(id, new Set());
        this.listeners.get(id)!.add(listener);
        listener(this.resolve(id));
        return () => this.listeners.get(id)?.delete(listener);
    }

    // internal stuff
    private getOrCreate(id: number): ColorChannel {
        if (!this.channels.has(id))
            this.channels.set(id, { r: 255, g: 255, b: 255, a: 255, blending: false, copyChannelID: null });
        return this.channels.get(id)!;
    }

    private notify(id: number) { 
        const color = this.resolve(id);
        const set = this.listeners.get(id);

        if (!set) return;

        const arr = Array.from(set);
        for (let i = 0; i < arr.length; i++) {
            arr[i](color);
        }
    }

    private notifyCopiers(sourceId: number) {
        for (const [id, ch] of this.channels)
            if (ch.copyChannelID === sourceId) this.notify(id);
    }
}


