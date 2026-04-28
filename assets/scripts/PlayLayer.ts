import { _decorator, AudioSource, clamp, Component, Label, view } from 'cc';
import { ADGroundLayer } from './ADGroundLayer';
import { getCachedMp3, settings } from './utils';
import { ADBackgroundLayer } from './ADBackgroundLayer';
import { ADMGLayer } from './ADMGLayer';
import { LevelManager } from './LevelManager';
import { PlayerObject } from './PlayerObject';
const { ccclass, property } = _decorator;

// play layer main script
@ccclass('PlayLayer')
export class PlayLayer extends Component {

    @property(AudioSource)
    musicSource: AudioSource = null!;

    @property(AudioSource)
    deathAudioSource: AudioSource = null!;

    @property(Label)
    percentageLabel: Label = null!;

    private static instance: PlayLayer = null;

    public static player1: PlayerObject = null;
    public levelName: string = 'polargeistEdit';
    public levelMusicName: string = 'CantLetGo';

    private musicEnabled: boolean = false;
    private sfxEnabled: boolean = false;

    private levelStartDelay: number = 0;
    private preparedMusicName: string | null = null;
    public levelLength: number | null = null;

    public static percentage: number = 0;

    protected onLoad(): void {
        PlayLayer.instance = this;
    }

    public static get(): PlayLayer {
        return PlayLayer.instance;
    }

    async start() {
        const visibleSize = view.getVisibleSize();

        // create the grounds, background, and middleground
        const groundLayer = ADGroundLayer.create(1, false, 1);
        const ceilingLayer = ADGroundLayer.create(1, true, 1);
        ceilingLayer.setPosition(0, visibleSize.height - settings.defaultCameraOffsetY);
        ceilingLayer.setVisible(false);
        const backgroundLayer = ADBackgroundLayer.create(1);
        const mgLayer = ADMGLayer.create(0);

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

    protected lateUpdate(dt: number): void {
        this.updatePercentage();
    }
}
