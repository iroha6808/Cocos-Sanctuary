const { ccclass, property } = cc._decorator;

export enum SfxType {
    ATTACK = "attack",
    HIT = "hit",
    COLLECT = "collect",
    BUY = "buy",
    HEAL = "heal",
    SKILL = "skill"
}

@ccclass
export default class AudioManager extends cc.Component {
    public static instance: AudioManager = null;

    @property(cc.AudioClip)
    public sceneBgm: cc.AudioClip = null;

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

    private muted: boolean = false;

    onLoad(): void {
        AudioManager.instance = this;
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

    public playBgm(): void {
        if (!this.sceneBgm || this.muted) {
            return;
        }
        cc.audioEngine.playMusic(this.sceneBgm, true);
        cc.audioEngine.setMusicVolume(this.musicVolume);
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
            cc.audioEngine.pauseAllEffects();
        } else {
            cc.audioEngine.resumeMusic();
            cc.audioEngine.resumeAllEffects();
            this.playBgm();
        }
        return this.muted;
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
