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
    public static instance: AudioManager = null;

    @property(cc.AudioClip)
    public sceneBgm: cc.AudioClip = null;

    @property(cc.AudioClip)
    public waterBgm: cc.AudioClip = null;

    @property(cc.AudioClip)
    public attackSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    public hitSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    public collectSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    public buySfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    public healSfx: cc.AudioClip = null;

    @property(cc.AudioClip)
    public skillSfx: cc.AudioClip = null;

    @property({ type: cc.Float, range: [0, 1, 0.05], slide: true })
    public musicVolume: number = 0.5;

    @property({ type: cc.Float, range: [0, 1, 0.05], slide: true })
    public sfxVolume: number = 0.8;

    @property(cc.Boolean)
    public playBgmOnStart: boolean = true;

    @property({ type: cc.Float, range: [0, 3, 0.05], slide: true })
    public bgmFadeDuration: number = 0.8;

    private muted: boolean = false;
    private currentBgmTrack: BgmTrack = BgmTrack.LAND;
    private bgmAudioIds: { [track: string]: number } = {};
    private bgmFadeTimer: number = 0;
    private bgmFadeDurationInternal: number = 0;
    private bgmFadeFromTrack: BgmTrack = BgmTrack.LAND;
    private bgmFadeToTrack: BgmTrack = BgmTrack.LAND;
    private bgmFadeFromVolume: number = 0;

    onLoad(): void {
        AudioManager.instance = this;
        EventCenter.on(GameEvent.PLAYER_WATER_STATE_CHANGED, this.onWaterStateChanged, this);
    }

    onDestroy(): void {
        if (AudioManager.instance === this) {
            AudioManager.instance = null;
        }
        EventCenter.off(GameEvent.PLAYER_WATER_STATE_CHANGED, this.onWaterStateChanged, this);
        this.stopAllBgmChannels();
    }

    start(): void {
        if (this.playBgmOnStart) {
            this.playBgm();
        }
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
        this.crossFadeToBgm(track, 0);
    }

    public crossFadeToBgm(track: BgmTrack, duration: number = this.bgmFadeDuration): void {
        const targetTrack = this.getAvailableTrack(track);
        this.currentBgmTrack = targetTrack;

        if (this.muted) {
            return;
        }

        const targetId = this.ensureBgmChannel(targetTrack, targetTrack === this.bgmFadeToTrack ? undefined : 0);
        if (targetId < 0) {
            return;
        }

        if (duration <= 0) {
            this.unschedule(this.updateBgmFade);
            this.setBgmVolume(targetTrack, this.musicVolume);
            this.stopOtherBgmChannels(targetTrack);
            return;
        }

        if (this.bgmFadeToTrack === targetTrack && this.bgmFadeTimer < this.bgmFadeDurationInternal) {
            return;
        }

        const fromTrack = this.getCurrentPlayingTrack(targetTrack);
        this.bgmFadeFromTrack = fromTrack;
        this.bgmFadeToTrack = targetTrack;
        this.bgmFadeTimer = 0;
        this.bgmFadeDurationInternal = duration;
        this.bgmFadeFromVolume = fromTrack ? this.getBgmVolume(fromTrack) : 0;
        this.setBgmVolume(targetTrack, 0);
        this.unschedule(this.updateBgmFade);
        this.schedule(this.updateBgmFade, 0);
    }

    public playSfx(type: SfxType): void {
        if (this.muted) {
            return;
        }

        const clip = this.getClip(type);
        if (clip) {
            cc.audioEngine.playEffect(clip, false);
            cc.audioEngine.setEffectsVolume(this.sfxVolume);
        }
    }

    public toggleMute(): boolean {
        this.muted = !this.muted;
        if (this.muted) {
            cc.audioEngine.pauseMusic();
            this.pauseBgmChannels();
            cc.audioEngine.pauseAllEffects();
        } else {
            cc.audioEngine.resumeMusic();
            this.resumeBgmChannels();
            cc.audioEngine.resumeAllEffects();
            this.playBgm(this.currentBgmTrack);
        }
        return this.muted;
    }

    private onWaterStateChanged(isInWater: boolean): void {
        this.crossFadeToBgm(isInWater ? BgmTrack.WATER : BgmTrack.LAND, this.bgmFadeDuration);
    }

    private updateBgmFade = (dt: number): void => {
        if (this.bgmFadeDurationInternal <= 0) {
            return;
        }

        this.bgmFadeTimer += dt;
        const ratio = Math.min(1, this.bgmFadeTimer / this.bgmFadeDurationInternal);
        const eased = ratio * ratio * (3 - 2 * ratio);

        if (this.bgmFadeFromTrack) {
            this.setBgmVolume(this.bgmFadeFromTrack, this.bgmFadeFromVolume * (1 - eased));
        }
        this.setBgmVolume(this.bgmFadeToTrack, this.musicVolume * eased);

        if (ratio >= 1) {
            this.unschedule(this.updateBgmFade);
            this.setBgmVolume(this.bgmFadeToTrack, this.musicVolume);
            this.stopOtherBgmChannels(this.bgmFadeToTrack);
        }
    };

    private getAvailableTrack(track: BgmTrack): BgmTrack {
        if (track === BgmTrack.WATER && this.waterBgm) {
            return BgmTrack.WATER;
        }
        return BgmTrack.LAND;
    }

    private getClipForTrack(track: BgmTrack): cc.AudioClip {
        if (track === BgmTrack.WATER) {
            return this.waterBgm || this.sceneBgm;
        }
        return this.sceneBgm;
    }

    private ensureBgmChannel(track: BgmTrack, volume: number = this.musicVolume): number {
        const existingId = this.bgmAudioIds[track];
        if (existingId !== undefined && existingId >= 0) {
            return existingId;
        }

        const clip = this.getClipForTrack(track);
        if (!clip) {
            return -1;
        }

        cc.audioEngine.stopMusic();
        const audioId = cc.audioEngine.play(clip, true, volume);
        this.bgmAudioIds[track] = audioId;
        return audioId;
    }

    private getCurrentPlayingTrack(fallback: BgmTrack): BgmTrack {
        const tracks = [BgmTrack.LAND, BgmTrack.WATER];
        for (const track of tracks) {
            const id = this.bgmAudioIds[track];
            if (id !== undefined && id >= 0 && track !== fallback) {
                return track;
            }
        }
        return null;
    }

    private setBgmVolume(track: BgmTrack, volume: number): void {
        const id = this.bgmAudioIds[track];
        if (id !== undefined && id >= 0) {
            cc.audioEngine.setVolume(id, Math.max(0, Math.min(1, volume)));
        }
    }

    private getBgmVolume(track: BgmTrack): number {
        const id = this.bgmAudioIds[track];
        if (id !== undefined && id >= 0 && (cc.audioEngine as any).getVolume) {
            return (cc.audioEngine as any).getVolume(id);
        }
        return this.musicVolume;
    }

    private stopOtherBgmChannels(activeTrack: BgmTrack): void {
        const tracks = [BgmTrack.LAND, BgmTrack.WATER];
        for (const track of tracks) {
            if (track === activeTrack) {
                continue;
            }
            const id = this.bgmAudioIds[track];
            if (id !== undefined && id >= 0) {
                cc.audioEngine.stop(id);
                delete this.bgmAudioIds[track];
            }
        }
    }

    private pauseBgmChannels(): void {
        Object.keys(this.bgmAudioIds).forEach(track => {
            const id = this.bgmAudioIds[track];
            if (id !== undefined && id >= 0) {
                cc.audioEngine.pause(id);
            }
        });
    }

    private resumeBgmChannels(): void {
        Object.keys(this.bgmAudioIds).forEach(track => {
            const id = this.bgmAudioIds[track];
            if (id !== undefined && id >= 0) {
                cc.audioEngine.resume(id);
            }
        });
    }

    private stopAllBgmChannels(): void {
        Object.keys(this.bgmAudioIds).forEach(track => {
            const id = this.bgmAudioIds[track];
            if (id !== undefined && id >= 0) {
                cc.audioEngine.stop(id);
            }
        });
        this.bgmAudioIds = {};
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
                return null;
        }
    }
}
