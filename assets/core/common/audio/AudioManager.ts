import { Component } from "cc";
import { oops } from "../../Oops";
import { PlayType } from "./AudioBase";
import { AudioEffect } from "./AudioEffect";
import { AudioMusic } from "./AudioMusic";

const LOCAL_STORE_KEY = "game_audio";

/** 
 * 音频管理
 * @example 
// 模块功能通过 oops.audio 调用
oops.audio.playMusic("audios/nocturne");
 */
export class AudioManager extends Component {
    private local_data: any = {};

    music!: AudioMusic;
    effect!: AudioEffect;

    showLog: boolean = false;
    
    private _maxConcurrent: number = 5;
    private _volumeAvoid: number = 0.3;
    private _volume_music: number = 1;
    private _volume_effect: number = 1;
    private _switch_music: boolean = true;
    private _switch_effect: boolean = true;
    private _mute_music: boolean = false;
    private _mute_effect: boolean = false;

    /**
     * 设置背景音乐播放完成回调
     * @param callback 背景音乐播放完成回调
     */
    setMusicComplete(callback: Function | null = null) {
        this.music.onComplete = callback;
    }

    /**
     * 播放背景音乐
     * @param url        资源地址
     * @param callback   音乐播放完成事件
     */
    playMusic(url: string, callback?: Function) {
        this.playMusicInternal(oops.res.defaultBundleName, url, 0, 0, false, callback);
    }

    playMusicByBundle(bundleName: string, url: string, callback?: Function) {
        this.playMusicInternal(bundleName, url, 0, 0, false, callback);
    }

    /** 
     * 循环播放背景音乐 
     * @param url       资源地址
     * @param loopStart 循环开始时间
     * @param loopEnd   循环结束时间
     */
    playMusicLoop(url: string, loopStart: number = 0, loopEnd: number = 0, callback?: Function) {
        this.playMusicInternal(oops.res.defaultBundleName, url, loopStart, loopEnd, true);
    }

    /**
     * 循环播放背景音乐
     * @param bundleName 资源包名
     * @param url        资源地址
     * @param loopStart  循环开始时间
     * @param loopEnd    循环结束时间
     * @example
     * ```typescript
     * oops.audio.playMusicLoopByBundle("audios", "nocturne", 15.580, 54.296);
     * ```
     * // 播放 audios 包中的 nocturne 音乐，循环区间从 15.580 秒开始，到 54.296 秒结束
     * // 之后背景音乐将在这个区间内循环播放
     * // 调用 unsetMusicLoopInterval() 取消循环播放区间，背景音乐将完整循环播放
     */
    playMusicLoopByBundle(bundleName: string, url: string, loopStart: number = 0, loopEnd: number = 0, callback?: Function) {
        this.playMusicInternal(bundleName, url, loopStart, loopEnd, true, callback);
    }

    private playMusicInternal(bundleName: string, url: string, loopStart: number = 0, loopEnd: number = 0, loop: boolean = false, callback?: Function) {
        if (this._switch_music){
            this.music.loop = loop;
            this.music.loopStart = loopStart;
            this.music.loopEnd = loopEnd;
            this.music.load(url, PlayType.MUSIC, bundleName, callback);
        }
    }

    /**
     * 设置背景音乐循环播放
     * @param loopStart 循环开始时间
     * @param loopEnd   循环结束时间
     * @example
     * ```typescript
     * oops.audio.setMusicLoopInterval(15.580, 54.296);
     * ```
     * // 设置背景音乐从 15.580 秒开始循环播放，到 54.296 秒结束
     * // 之后背景音乐将在这个区间内循环播放
     * // 调用 unsetMusicLoopInterval() 取消循环播放，背景音乐将完整循环播放
     */
    setMusicLoopInterval(loopStart: number, loopEnd: number) {
        this.music.loopStart = loopStart;
        this.music.loopEnd = loopEnd;
    }

    /**
     * 取消背景音乐循环播放
     */
    unsetMusicLoopInterval() {
        this.music.loopInterval = false;
    }

    /**
     * 设置背景音乐淡入淡出时间
     */
    setMusicFadetime(fadeTime: number) {
        this.music.fadeTime = fadeTime;
    }
    
    /** 停止背景音乐播放 */
    stopMusic() {
        if (this.music.playing) {
            this.music.stop();
        }
    }

    /**
     * 获取背景音乐播放进度
     */
    get progressMusic(): number {
        return this.music.progress;
    }
    /**
     * 设置背景乐播放进度
     * @param value     播放进度值
     */
    set progressMusic(value: number) {
        this.music.progress = value;
    }

    /**
     * 获取背景音乐音量
     */
    get volumeMusic(): number {
        return this._volume_music;
    }

    /** 
     * 设置避让音效音量
     * @param value     避让音效音量
     */
    set volumeAvoid(value: number) {
        this._volumeAvoid = value;
    }

    /**
     * 获取背景音乐音量
     */
    get volumeAvoid(): number {
        return this._volumeAvoid;
    }
    
    /** 
     * 设置背景音乐音量
     * @param value     音乐音量值
     */
    set volumeMusic(value: number) {
        this._volume_music = value;
        this.music.vol = this._volume_music;
    }

    /**
     * 设置背景音乐静音开关
     */
    set muteMusic(value: boolean) {
        if (this._mute_music === value) return;
        this._mute_music = value;
        this.music.mute = value;
    }

    /**
     * 获取背景音乐静音开关
     */
    get muteMusic(): boolean {
        return this._mute_music;
    }

    /**
     * 设置音效静音开关
     */
    set muteEffect(value: boolean) {
        if (this._mute_effect === value) return;
        this._mute_effect = value;
        this.effect.mute = value;
    }

    /**
     * 获取音效静音开关
     */
    get muteEffect(): boolean {
        return this._mute_effect;
    }

    /**
     * 设置音效池最大数量
     * @param value     音效池最大数量
     */
    set maxEffectPoolCount(value: number) {
        this.effect.maxEffectPoolCount = value;
    }

    /**
     * 设置同复音类型音效最大并发数量
     * @param value     同复音类型音效最大并发数量
     */
    set maxConcurrent(value: number) {
        this._maxConcurrent = value;
    }

    /**
     * 获取同复音类型音效最大并发数量
     */
    get maxConcurrent(): number {
        return this._maxConcurrent;
    }

    /** 
     * 获取背景音乐开关值 
     */
    get switchMusic(): boolean {
        return this._switch_music;
    }
    /** 
     * 设置背景音乐开关值
     * @param value     开关值
     */
    set switchMusic(value: boolean) {
        this._switch_music = value;

        if (value == false) this.music.stop();
    }

    /**
     * 播放音效
     * @param url        资源地址
     */
    playEffect(url: string) {
        if (this._switch_effect) {
            this.playEffectByBundleWithPriority(oops.res.defaultBundleName, url, PlayType.ONESHOT);
        }
    }

    /**
     * 播放音效
     * @param bundleName 资源包名
     * @param url        资源地址
     */
    playEffectByBundle(bundleName: string, url: string) {
        if (this._switch_effect) {
            this.playEffectByBundleWithPriority(bundleName, url, PlayType.ONESHOT);
        }
    }

    /**
     * 播放语音
     * @param url        资源地址
     */
    playVoice(url: string) {
        if (this._switch_effect) {
            this.playEffectByBundleWithPriority(oops.res.defaultBundleName, url, PlayType.MUSIC);
        }
    }

    /**
     * 播放语音
     * @param bundleName 资源包名
     * @param url        资源地址
     */
    playVoiceByBundle(bundleName: string, url: string) {
        if (this._switch_effect) {
            this.playEffectByBundleWithPriority(bundleName, url, PlayType.MUSIC);
        }
    }

    /**
     * 播放音效
     * @param bundleName    资源包名
     * @param url           资源地址
     * @param playType      播放类型
     * @param priorityType  优先级类型
     * @param polyphonyType 复音类型
     */
    playEffectByBundleWithPriority(bundleName: string, url: string, playType: PlayType = PlayType.MUSIC, priorityType: number = 0, polyphonyType: number = 0) {
        if (url == null || url == "") return;
        if (this._switch_effect) {
            this.effect.load(url, playType, priorityType, polyphonyType, bundleName);
        }
    }

    /**
     * 停止音效播放
     * @param url        资源地址
     */
    stopEffect(url: string) {
        if (this._switch_effect) {
            this.effect.release(url);
        }
    }

    /**
     * 停止语音播放
     * @param url        资源地址
     */
    stopVoice(url: string) {
        if (this._switch_effect) {
            this.effect.stopUrl(url);
        }
    }

    /** 
     * 获取音效音量 
     */
    get volumeEffect(): number {
        return this._volume_effect;
    }

    /**
     * 设置获取音效音量
     * @param value     音效音量值
     */
    set volumeEffect(value: number) {
        this._volume_effect = value;
        this.effect.setVolume();
    }

    /** 
     * 获取音效开关值 
     */
    get switchEffect(): boolean {
        return this._switch_effect;
    }
    /**
     * 设置音效开关值
     * @param value     音效开关值
     */
    set switchEffect(value: boolean) {
        this._switch_effect = value;
        if (value == false) this.effect.stopAll();
    }

    /** 恢复当前暂停的音乐与音效播放 */
    resumeAll() {
        if (this.music) {
            if (!this.music.playing && this.music.progress > 0) this.music.play();
            this.effect.resumeAll();
        }
    }

    /** 暂停当前音乐与音效的播放 */
    pauseAll() {
        if (this.music) {
            if (this.music.playing) this.music.pause();
            this.effect.pauseAll();
        }
    }

    /** 停止当前音乐与音效的播放 */
    stopAll() {
        if (this.music) {
            this.music.stop();
            this.effect.stopAll();
        }
    }

    /** 保存音乐音效的音量、开关配置数据到本地 */
    save() {
        this.local_data.volume_music = this._volume_music;
        this.local_data.volume_effect = this._volume_effect;
        this.local_data.switch_music = this._switch_music;
        this.local_data.switch_effect = this._switch_effect;
        this.local_data.mute_music = this._mute_music;
        this.local_data.mute_effect = this._mute_effect;

        oops.storage.set(LOCAL_STORE_KEY, this.local_data, false);
    }


    /** 本地加载音乐音效的音量、开关配置数据并设置到游戏中 */
    load() {
        this.music = this.getComponent(AudioMusic) || this.addComponent(AudioMusic)!;
        this.effect = this.getComponent(AudioEffect) || this.addComponent(AudioEffect)!;

        this.local_data = oops.storage.getJson(LOCAL_STORE_KEY, null, false);
        if (this.local_data) {
            try {
                this.setState();
            }
            catch (e) {
                this.setStateDefault();
            }
        }
        else {
            this.setStateDefault();
        }
    }

    private setState() {
        this._switch_music = this.local_data.switch_music;
        this._switch_effect = this.local_data.switch_effect;

        this.volumeMusic = this.local_data.volume_music;
        this.volumeEffect = this.local_data.volume_effect;
        this.muteMusic = this.local_data.mute_music;
        this.muteEffect = this.local_data.mute_effect;
    }

    private setStateDefault() {
        this.local_data = {};
        this.volumeMusic = 1;
        this.volumeEffect = 1;
        this._switch_music = true;
        this._switch_effect = true;
        this.muteMusic = false;
        this.muteEffect = false;
    }
}