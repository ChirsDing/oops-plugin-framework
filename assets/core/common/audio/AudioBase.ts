/**
 * @file AudioBase.ts
 * @path extensions\oops-plugin-framework\assets\core\common\audio\AudioBase.ts
 * @author DBS
 * @date 2024-06-06
 * @description file description
 */



import { AudioClip, AudioSource, _decorator, tween, error } from "cc";
import { oops } from "../../Oops";
const { ccclass, menu } = _decorator;

export enum PlayType {
    MUSIC = 1,
    ONESHOT = 2
}

export enum EffectStatus {
    LOAD = 0,       // 加载中
    START = 1,      // 播放中
    COMPLETE = 2,   // 播放完成
    ABORT = 3,      // 中断
    DESTROY = 9,    // 待销毁
}

/**
 * 注：用playOneShot播放的音乐效果，在播放期间暂时没办法即时关闭音乐
 */

/** 音频基类 */
@ccclass('AudioBase')
export class AudioBase extends AudioSource {
    /** 音效播放完成回调 */
    onComplete: Function | null = null;

    protected _url: string = null!;
    protected _progress: number = 0;
    protected _isPlay: boolean = false;
    protected _playType: PlayType = PlayType.MUSIC;
    protected _fadeTime: number = 1.0;

    protected _vol : number = 1;
    protected _mute: boolean = false;
    protected _baseVolume: number = 1;
    protected _status : EffectStatus = EffectStatus.LOAD;

    /** 获取音乐播放进度 */
    get progress(): number {
        if (this.duration > 0)
            this._progress = this.currentTime / this.duration;
        return this._progress;
    }

    /**
     * 设置音乐当前播放进度
     * @param value     进度百分比0到1之间
     */
    set progress(value: number) {
        this._progress = value;
        this.currentTime = value * this.duration;
    }

    /**
     * 设置音乐淡入淡出时间
     */
    set fadeTime(value: number) {
        this._fadeTime = value;
    }

    /**
     * 设置音效音量
     * @param value     音量大小
     */
    set vol(value: number) {
        if (value < 0 || value > 1) {
            error("音量大小范围为0到1之间");
            return;
        }
        if (this._vol === value) return;
        this._vol = value;
        this.resetVolume();
    }

    /**
     * 获取音效音量
     */
    get vol(): number {
        return this._vol;
    }

    set mute(value: boolean) {
        if (this._mute === value) return;
        this._mute = value;
        this.resetVolume();
    }

    /**
     * 获取音效resource地址
     */
    get url(): string {
        return this._url;
    }

    /**
     * 播放音效初始化
     */
    protected resetVolume(url?: string) {
        if (this._mute) {
            this.volume = 0;
            this._baseVolume = this.volume;
            return;
        }

        if (this._url === null || url === null) return;

        this.volume = this._vol * oops.audio.volumeMusic;
        this._baseVolume = this.volume;
    }

    /**
     * 加载音效并播放
     */
    load(url: string, audioType = PlayType.MUSIC, bundle?: string, callback?: Function) {
        if (this._url === null || this._url !== url || this.clip === null || this.clip._nativeAsset === null) {
            this._playType = audioType;
            let bundleName = bundle || oops.res.defaultBundleName;
            oops.res.load(bundleName, url, AudioClip, (err: Error | null, data: AudioClip) => {
                if (err) {
                    this.release();
                    this.destroy();
                    error(err);
                    return;
                }
                if (this._status !== EffectStatus.ABORT) {
                    this.resetVolume(url);
                    this.playStart(url, data);
                }
                callback && callback();
            });
        }else{
            this.resetVolume();
            console.info("load ", this.url, this.volume);
            this.playStart(this._url, this.clip!);
            callback && callback();
        }
    }

    /**
     * 音效淡出并停止
     */
    private fadeOutStop() : Promise<void> {
        if (this._fadeTime > 0){
            return new Promise<void>(resolve => {
                //@ts-ignore
                tween(this).to(this._fadeTime / 2, { volume: 0 }).call(() => {
                    this.stop();
                    resolve();
                }).start();
            });
        }else{
            this.stop();
            return Promise.resolve();
        }
    }

    /**
     * 音效淡入并播放
     */
    private fadeInPlay() : Promise<void> {
        if (this._fadeTime > 0) {
            return new Promise<void>(resolve => {
                this.volume = 0;
                this.play();
                //@ts-ignore
                tween(this).to(this._fadeTime, { volume: this._baseVolume }).call(() => {
                    resolve();
                }).start();
            });
        }else{
            this.play();
            return Promise.resolve();
        }
    }

    protected onPlay() {
        this._isPlay = true;
    }

    /**
     * 播放音效
     */
    protected async playStart(url: string, clip?: AudioClip) {
        if (!clip || this._url === url && this._isPlay) {
            // error("音效已经在播放中");
            return
        }

        if (this._playType === PlayType.ONESHOT) {
            this.enabled = true;
            this._url = url;
            this.clip = clip;
            //this.onPlay();
            this.playOneShot(clip, this.volume);
        }else{
            if (this.playing) {
                await this.fadeOutStop();
            }

            if (this._url) {
                this.release();
            }

            this.enabled = true;

            this._url = url;
            this.clip = clip;
            //this.onPlay();

            await this.fadeInPlay();
        }
    }

    /**
     * 停止音效
     */
    stop() {
        if (this._isPlay) {
            super.stop();
            this._isPlay = false;
        } else {
            this._status = EffectStatus.ABORT;
        }
    }

    /**
     * 暂停音效
     */
    pause() {
        super.pause();
        this._isPlay = false;
    }

    /**
     * 恢复音效
     */
    resume() {
        this.play();
    }

    /**
     * 释放音效
     */
    release() {
        if (this.clip) {
            this.stop();
            this.clip = null;
            oops.res.release(this._url);
            this._url = null!;
        }
    }

    /**
     * 销毁音效
     */
    onDestroy() {
        this.release();
    }
}