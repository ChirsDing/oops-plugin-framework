/**
 * @file AudioEffectBase.ts
 * @path extensions\oops-plugin-framework\assets\core\common\audio\AudioEffectBase.ts
 * @author DBS
 * @date 2024-06-06
 * @description file description
 */

import { _decorator } from "cc";
import { oops } from "../../Oops";
import { AudioBase, EffectStatus, PlayType } from "./AudioBase";
const { ccclass, menu } = _decorator;

/** 音效基类 */
@ccclass("AudioEffectSource")
export class AudioEffectSource extends AudioBase {
    private _polyphonyType: number = 0;
    private _priorityType: number = 0;
    private _curTime: number = 0; // 当前播放时间,单位秒,用于记录oneShot类型播放进度
    private _resUrl: string = null!;

    onEnable() {
        this._status = EffectStatus.LOAD;
    }

    /**
     * 播放音效初始化
     */
    protected resetVolume(url?: string) {
        if (this.url === null && url === null) return;

        if (this._mute) {
            this.volume = 0;
            this._baseVolume = 0;
            return;
        }

        this.volume = this._vol * oops.audio.volumeEffect;
        this._baseVolume = this.volume;
        if (oops.audio.showLog) {
            console.info("resetVolume ", url, this.volume);
        }
    }

    // 获取当前音效状态
    get status() {
        return this._status;
    }

    // 设置当前音效状态
    set status(value: EffectStatus) {
        this._status = value;
    }

    // 获取音效资源地址
    get resUrl() {
        return this._resUrl;
    }

    // 设置音效资源地址
    set resUrl(value: string) {
        this._resUrl = value;
    }

    /**
     * 设置音效播放类型
     */
    set playType(value: PlayType) {
        this._playType = value;
    }

    /**
     * 获取音效播放类型
     */
    get playType(): PlayType {
        return this._playType;
    }

    /**
     * 设置音效复音类型，项目自行枚举定义
     */
    set polyphonyType(value: number) {
        this._polyphonyType = value;
    }

    /**
     * 获取音效复音类型
     */
    get polyphonyType(): number {
        return this._polyphonyType;
    }

    /**
     * 设置音效优先级类型，项目自行枚举定义,数值越大优先级越高
     */
    set priorityType(value: number) {
        this._priorityType = value;
    }

    /**
     * 获取音效优先级类型
     */
    get priorityType(): number {
        return this._priorityType;
    }

    /**
     * 音效开始播放
     */
    protected onPlay() {
        super.onPlay();

        this._status = EffectStatus.START;
    }

    private endCallback() {
        this._isPlay = false;
        if (this._status === EffectStatus.DESTROY) return;

        this._status = EffectStatus.COMPLETE;
        this.onComplete && this.onComplete(this);
    }

    update(dt: number) {
        if (this._playType === PlayType.ONESHOT) {
            if (this._status === EffectStatus.START) {
                this._curTime += dt;
                if (this._curTime >= this.duration) {
                    this.endCallback();
                }
            }
            return;
        }
        if (this._status === EffectStatus.START) {
            if (!this.playing) {
                this.endCallback();
            }
        } else if (this._status === EffectStatus.LOAD && this.playing) {
            this.onPlay();
        }
    }
}