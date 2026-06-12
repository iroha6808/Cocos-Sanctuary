import EventCenter from "./EventCenter";
import { GameEvent } from "./Constants";

const { ccclass, property } = cc._decorator;

export enum SfxType {
    ATTACK = "attack",
    HIT = "hit",
    COLLECT = "collect",
    BUY = "buy",
    HEAL = "heal",
    SKILL = "skill"
}

export enum BgmTrack {
    LAND = "land",
    WATER = "water"
}

@ccclass
export default class AudioManager extends cc.Component {
    public static instance: AudioManager = null!;

    @property(cc.AudioClip)
    public sceneBgm: cc.AudioClip = null!;
    public menuBgm: cc.AudioClip = null;

    @property(cc.AudioClip)
    public gameOverBgm: cc.AudioClip = null;

    @property(cc.AudioClip)
    public sceneBgm: cc.AudioClip = null;

    @property(cc.AudioClip)
    public waterBgm: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public attackSfx: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public hitSfx: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public collectSfx: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public buySfx: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public healSfx: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public skillSfx: cc.AudioClip = null!;

    @property({ type: cc.Float, range: [0, 1, 0.05], slide: true })
    public musicVolume: number = 0.5;

    @property({ type: cc.Float, range: [0, 1, 0.05], slide: true })
    public sfxVolume: number = 0.8;

    @property(cc.Boolean)
    public playBgmOnStart: boolean = true;

    @property({ type: cc.Float, range: [0, 3, 0.05], slide: true })
    public bgmFadeDuration: number = 0.8;

    @property({ type: cc.Float, range: [0, 10, 0.5], slide: true })
    public waterRepeatDelay: number = 2.0;

    private muted: boolean = false;
    private currentBgmTrack: BgmTrack = BgmTrack.LAND;
    private sceneBgmAudioId: number = -1;
    private isPlayerInWater: boolean = false;
    private waterAmbientTimer: number = 0;

    onLoad(): void {
        AudioManager.instance = this;
        EventCenter.on(GameEvent.PLAYER_WATER_STATE_CHANGED, this.onWaterStateChanged, this);
    }

    start(): void {
        if (this.playBgmOnStart) {
            this.playBgm();
        }
    }

    update(dt: number): void {
        this.updateWaterAmbient(dt);
    }

    onDestroy(): void {
        if (AudioManager.instance === this) {
            AudioManager.instance = null!;
        }

        EventCenter.off(GameEvent.PLAYER_WATER_STATE_CHANGED, this.onWaterStateChanged, this);
        this.stopAllBgmChannels();
    }

    public static play(type: SfxType): void {
        if (AudioManager.instance) {
            AudioManager.instance.playSfx(type);
        }
    }

    public static toggleMute(): boolean {
        return AudioManager.instance ? AudioManager.instance.toggleMute() : false;
    }

    public playBgm(track: BgmTrack = BgmTrack.LAND): void {
        this.currentBgmTrack = BgmTrack.LAND;
        this.ensureSceneBgm();
    }

    public crossFadeToBgm(track: BgmTrack, duration: number = this.bgmFadeDuration): void {
        this.currentBgmTrack = BgmTrack.LAND;
        this.ensureSceneBgm();

        if (track === BgmTrack.WATER) {
            this.isPlayerInWater = true;
        } else {
            this.isPlayerInWater = false;
        }
    }

    public playSfx(type: SfxType): void {
        if (this.muted) {
            return;
        }

        const clip = this.getClip(type);
        if (!clip) {
            return;
        }

        cc.audioEngine.setEffectsVolume(this.sfxVolume);
        cc.audioEngine.playEffect(clip, false);
    }

    public toggleMute(): boolean {
        this.muted = !this.muted;

        if (this.muted) {
            this.pauseBgmChannels();
            cc.audioEngine.pauseAllEffects();
        } else {
            this.resumeBgmChannels();
            cc.audioEngine.resumeAllEffects();
            this.ensureSceneBgm();
        }

        return this.muted;
    }

    private onWaterStateChanged(isInWater: boolean): void {
        this.isPlayerInWater = isInWater;
    }

    private ensureSceneBgm(): void {
        if (this.muted || !this.sceneBgm) {
            return;
        }

        if (this.sceneBgmAudioId >= 0) {
            cc.audioEngine.setVolume(this.sceneBgmAudioId, this.musicVolume);
            return;
        }

        this.sceneBgmAudioId = cc.audioEngine.play(this.sceneBgm, true, this.musicVolume);
    }

    private updateWaterAmbient(dt: number): void {
        if (this.waterAmbientTimer > 0) {
            this.waterAmbientTimer -= dt;
        }

        if (this.muted || !this.isPlayerInWater || !this.waterBgm) {
            return;
        }

        if (this.waterAmbientTimer > 0) {
            return;
        }

        const audioId = cc.audioEngine.play(this.waterBgm, false, this.musicVolume);
        if (audioId >= 0) {
            cc.audioEngine.setVolume(audioId, this.musicVolume);
        }

        const duration = this.getClipDuration(this.waterBgm);
        this.waterAmbientTimer = duration + this.waterRepeatDelay;
    }

    private getClipDuration(clip: cc.AudioClip): number {
        const rawDuration = (clip as any).duration;
        if (typeof rawDuration === "number" && rawDuration > 0) {
            return rawDuration;
        }

        return 5;
    }

    private pauseBgmChannels(): void {
        if (this.sceneBgmAudioId >= 0) {
            cc.audioEngine.pause(this.sceneBgmAudioId);
        }
    }

    private resumeBgmChannels(): void {
        if (this.sceneBgmAudioId >= 0) {
            cc.audioEngine.resume(this.sceneBgmAudioId);
        }
    }

    private stopAllBgmChannels(): void {
        if (this.sceneBgmAudioId >= 0) {
            cc.audioEngine.stop(this.sceneBgmAudioId);
            this.sceneBgmAudioId = -1;
        }
    }

    private getClip(type: SfxType): cc.AudioClip {
        switch (type) {
            case SfxType.ATTACK:
                return this.attackSfx;
            case SfxType.HIT:
                return this.hitSfx;
            case SfxType.COLLECT:
                return this.collectSfx;
            case SfxType.BUY:
                return this.buySfx;
            case SfxType.HEAL:
                return this.healSfx;
            case SfxType.SKILL:
                return this.skillSfx;
            default:
                return null!;
        }
    }
    public playManualBgm(clip: cc.AudioClip): void {
            cc.log("🎵 嘗試播放音樂: ", clip ? clip.name : "null");
            this.stopAllBgmChannels();
            if (clip) {
                const id = cc.audioEngine.play(clip, true, this.musicVolume);
                cc.log("🎵 播放器 ID:", id); 
                this.bgmAudioIds['manual'] = id;
            }
    }
}

   
