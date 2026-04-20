import { _decorator, Color, Component, director, EPhysics2DDrawFlags, find, game, Graphics, PhysicsSystem2D, ProgressBar, ResolutionPolicy, view } from 'cc';
import { preloadAtlasesInDir, preloadJsonInDir, preloadMaterialsInDir, preloadMp3InDir, preloadPlistsInDir, preloadSpriteFramesInDir } from './utils';
const { ccclass } = _decorator;

@ccclass('LaunchLayer')
export class LaunchLayer extends Component {
    public worldHeight: number = 320;
    public worldWidth: number = 569;

    public maxFrameRate: number = 120;

    async start() {
        const visibleSize = view.getVisibleSize();

        //PhysicsSystem2D.instance.enable = true;
        //PhysicsSystem2D.instance.gravity = { x: 0, y: 0 };

        // calculate window width
        const aspectRatio = view.getVisibleSizeInPixel().width / view.getVisibleSizeInPixel().height;
        this.worldWidth = this.worldHeight * aspectRatio;
        view.setDesignResolutionSize(
            this.worldWidth,
            this.worldHeight,
            ResolutionPolicy.FIXED_HEIGHT
        )

        // scale background
        const backgroundNode = find('Canvas/launch-background')!;
        const backgroundScaleFactor = this.worldWidth / 569;
        const clampedScale = Math.max(1, backgroundScaleFactor);
        backgroundNode.setScale(
            backgroundNode.scale.x * clampedScale,
            backgroundNode.scale.y * clampedScale,
            backgroundNode.scale.z
        );

        game.frameRate = this.maxFrameRate;

        // loading bar
        const progressBar = find('Canvas/progress-bar')?.getComponent(ProgressBar) ?? null;
        const progress = {
            atlases: 0,
            json: 0,
            plists: 0,
            materials: 0,
            spriteFrames: 0,
        };

        const updateProgress = () => {
            if (!progressBar) return;
            progressBar.progress = (progress.atlases + progress.json + progress.plists + progress.materials + progress.spriteFrames) / 5;
        };

        // load selected images and spritesheets
        await Promise.all([
            preloadAtlasesInDir('', (completed, total) => {
                progress.atlases = total > 0 ? completed / total : 1;
                updateProgress();
            }),
            preloadAtlasesInDir('icons', (completed, total) => {
                progress.atlases = total > 0 ? completed / total : 1;
                updateProgress();
            }),






            preloadJsonInDir('', (completed, total) => {
                progress.json = total > 0 ? completed / total : 1;
                updateProgress();
            }),

            preloadJsonInDir('levels', (completed, total) => {
                progress.json = total > 0 ? completed / total : 1;
                updateProgress();
            }),



            preloadPlistsInDir('', (completed, total) => {
                progress.plists = total > 0 ? completed / total : 1;
                updateProgress();
            }),

            preloadMaterialsInDir('', (completed, total) => {
                progress.materials = total > 0 ? completed / total : 1;
                updateProgress();
            }),






            preloadSpriteFramesInDir('', (completed, total) => {
                progress.spriteFrames = total > 0 ? completed / total : 1;
                updateProgress();
            }),
            preloadSpriteFramesInDir('grounds', (completed, total) => {
                progress.spriteFrames = total > 0 ? completed / total : 1;
                updateProgress();
            }),
            preloadSpriteFramesInDir('backgrounds', (completed, total) => {
                progress.spriteFrames = total > 0 ? completed / total : 1;
                updateProgress();
            }),
            preloadSpriteFramesInDir('middlegrounds', (completed, total) => {
                progress.spriteFrames = total > 0 ? completed / total : 1;
                updateProgress();
            }),


            preloadMp3InDir('', (completed, total) => {
                progress.spriteFrames = total > 0 ? completed / total : 1;
                updateProgress();
            }),
        ]);

        if (progressBar) {
            progressBar.progress = 1;
        }

        director.preloadScene('play-layer', (error) => {
            if (error) {
                throw error;
            }

            director.loadScene('play-layer');
        });
    } 
}
