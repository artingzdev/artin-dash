import { _decorator, AudioSource, clamp, Component, Label, view, Node, ParticleSystem, ParticleSystem2D, Color } from 'cc';
import { ADGroundLayer } from './ADGroundLayer';
import { getCachedMp3, settings } from './utils';
import { ADBackgroundLayer } from './ADBackgroundLayer';
import { ADMGLayer } from './ADMGLayer';
import { LevelManager } from './LevelManager';
import { PlayerObject } from './PlayerObject';
import { CameraController } from './CameraController';
import { ColorChannelManager } from './ColorChannelManager';
const { ccclass, property } = _decorator;

// play layer main script
@ccclass('PlayLayer')
export class PlayLayer extends Component {

    private unbindGlitter: (() => void) | null = null;

    @property(AudioSource)
    musicSource: AudioSource = null!;

    @property(AudioSource)
    deathAudioSource: AudioSource = null!;

    @property(Label)
    percentageLabel: Label = null!;

    @property(ParticleSystem2D)
    glitterEffect: ParticleSystem2D = null!;

    @property(Node)
    backgroundEffectlayer: Node = null!;

    private static _instance: PlayLayer = null;

    public static player1: PlayerObject = null;
    public levelName: string = 'backOnTrackNoCoins';
    public levelMusicName: string = 'CantLetGo';

    private musicEnabled: boolean = false;
    private sfxEnabled: boolean = false;

    private levelStartDelay: number = 0;
    private preparedMusicName: string | null = null;
    public levelLength: number | null = null;

    public static percentage: number = 0;

    public groundLayer: ADGroundLayer = null!;
    public ceilingLayer: ADGroundLayer = null!;
    public backgroundLayer: ADBackgroundLayer = null!;
    public middlegroundLayer: ADMGLayer = null!;

    protected onLoad(): void {
        PlayLayer._instance = this;
        this.unbindGlitter = this.bindToChannelGlitter(ColorChannelManager.P1);
    }

    public static get instance(): PlayLayer {
        return PlayLayer._instance;
    }

    async start() {
        const visibleSize = view.getVisibleSize();

        // create the grounds, background, and middleground
        this.groundLayer = ADGroundLayer.create(1, false, 1);
        this.ceilingLayer = ADGroundLayer.create(1, true, 1);
        this.ceilingLayer.setPosition(0, visibleSize.height - settings.defaultCameraOffsetY);
        this.ceilingLayer.setVisible(false);
        this.ceilingLayer.setScreenY(view.getVisibleSize().height);
        this.backgroundLayer = ADBackgroundLayer.create(1);
        this.middlegroundLayer = ADMGLayer.create(0);

        // add the player
        PlayLayer.player1 = PlayerObject.create();
        PlayLayer.player1.setPosition(0, 15);

        // load the level
        LevelManager.loadLevelFromJson(this.levelName);
    }

    public startPlaying() {
        this.initMusic(() => {
            this.scheduleOnce(() => {
                this.musicSource.play();
                PlayerObject.instance.canStartPlaying = true;
            }, this.levelStartDelay);
        });
        PlayLayer.player1.updateTimeMod();
    }

    public async prepareLevelMusic(): Promise<void> {
        if (!this.musicSource || this.preparedMusicName === this.levelMusicName || !this.musicEnabled) {
            return;
        }

        const audioClip = getCachedMp3(this.levelMusicName);
        this.musicSource.clip = audioClip;

        const originalVolume = this.musicSource.volume;
        this.musicSource.volume = 0;
        this.musicSource.play();

        await new Promise<void>((resolve) => {
            this.scheduleOnce(() => resolve(), 0);
        });

        this.musicSource.pause();
        this.musicSource.currentTime = 0;
        this.musicSource.volume = originalVolume;
        this.preparedMusicName = this.levelMusicName;
    }

    private initMusic(onComplete?: () => void) {
        if (!this.musicSource || !this.musicEnabled) {
            onComplete?.();
            return;
        }

        const audioClip = getCachedMp3(this.levelMusicName);
        this.musicSource.clip = audioClip;
        this.musicSource.currentTime = 0;
        this.preparedMusicName = this.levelMusicName;
        onComplete?.();
    }

    public stopMusic() {
        this.musicSource.stop();
    }

    public playMusic() {
        this.musicSource.play();
    }

    public playDeathSound() {
        if (!this.deathAudioSource || !this.sfxEnabled) {
            return;
        }

        this.deathAudioSource.currentTime = 0;
        this.deathAudioSource.play();
    }

    private updatePercentage() {
        const pX = PlayLayer.player1.getPositionX();
        const len = this.levelLength;

        if (pX == null || len == null || len <= 0 || !this.percentageLabel) return;

        const percentage = Math.floor(100 / len * pX);
        const clampedPercentage = clamp(percentage, 0, 100);

        if (PlayLayer.percentage != clampedPercentage) { // only update progress bar if needed
            this.percentageLabel.string = `${clampedPercentage}%`;
            PlayLayer.percentage = clampedPercentage;
        }
    }

    protected bindToChannelGlitter(id: number): () => void {
                return ColorChannelManager.instance.bindTo(id, (color) => {
                        this.changeGlitterEffectColor(color);
                });
    }

    protected changeGlitterEffectColor(color: Color): void {
        this.glitterEffect.color.set(color.r, color.g, color.b, color.a);
    }

    public activateGlitterEffect(): void {
        const posVarX = view.getVisibleSize().width * 0.5;
        this.glitterEffect.posVar.set(
            posVarX,
            this.glitterEffect.posVar.y
        )

        this.glitterEffect.resetSystem();
    }

    public deactivateGlitterEffect(): void {
        this.glitterEffect.stopSystem();
    }

    private updateBackgroundEffectPosition(): void {
        const camX = CameraController.getPositionX();
        const camY = CameraController.getPositionY();
        this.backgroundEffectlayer.setPosition(camX, camY);
    }

    protected lateUpdate(dt: number): void {
        this.updatePercentage();
        this.updateBackgroundEffectPosition();
    }

    protected onDestroy(): void {
        this.unbindGlitter?.();
    }
}
