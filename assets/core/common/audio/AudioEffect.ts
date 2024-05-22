/*
 * @Author: dgflash
 * @Date: 2022-09-01 18:00:28
 * @LastEditors: dgflash
 * @LastEditTime: 2022-09-02 10:22:36
 */
import { AudioClip, AudioSource, _decorator, error } from 'cc';
import { oops } from '../../Oops';
import { AudioMusic } from './AudioMusic';
const { ccclass, menu } = _decorator;

/**
 * 注：用playOneShot播放的音乐效果，在播放期间暂时没办法即时关闭音乐
 */

/** 游戏音效 */
@ccclass('AudioEffect')
export class AudioEffect extends AudioSource {
    private effects: Map<string, AudioClip> = new Map<string, AudioClip>();
    private voices: Map<string, AudioMusic> = new Map<string, AudioMusic>();

    private _progress: number = 0;
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
     * 加载音效并播放
     * @param bundle        资源包名
     * @param url           音效资源地址
     * @param callback      资源加载完成并开始播放回调
     */
    loadEffect(bundle: string, url: string, callback?: Function) {
        oops.res.load(bundle, url, AudioClip, (err: Error | null, data: AudioClip) => {
            if (err) {
                error(err);
            }

            this.effects.set(url, data);
            this.playOneShot(data, this.volume);
            callback && callback();
        });
    }

    /**
     * 加载语音音效并播放
     * @param bundle        资源包名
     * @param url           音效资源地址
     * @param callback      资源加载完成并开始播放回调
     */
    loadVoice(bundle: string, url: string, callback?: Function) {
        let voice = this.node.addComponent(AudioMusic);
        this.voices.set(url, voice);
        voice.onComplete = () => {
            this.voices.delete(url);
            voice.release();
            voice.destroy();
        }
        voice.load(bundle, url, callback);
    }

    /**
     * 停止播放指定地址语音音效资源
     * @param url           音效资源地址
     */
    stopVoice(url: string) {
        if (this.voices.has(url)) {
            this.voices.get(url)!.stop();
        }
    }

    /** 释放所有已使用过的音效资源 */
    releaseAll() {
        for (let key in this.effects) {
            oops.res.release(key);
        }
        for (let key in this.voices) {
            this.voices.get(key)!.stop();
        }
        this.effects.clear();
        this.voices.clear();
    }

    /**
     * 释放指定地址音效资源
     * @param url           音效资源地址
     */
    release(url: string) {
        if (this.effects.has(url)) {
            this.effects.delete(url);
            oops.res.release(url);
        }
        if (this.voices.has(url)) {
            this.voices.get(url)!.stop();
        }
    }
}
