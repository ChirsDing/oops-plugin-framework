/**
 * @file AudioMusic.ts
 * @path extensions\oops-plugin-framework\assets\core\common\audio\AudioMusic.ts
 * @author DBS
 * @date 2024-06-06
 * @description file description
 */

import { _decorator, warn } from 'cc';
import { oops } from '../../Oops';
import { AudioBase } from './AudioBase';

const { ccclass, menu } = _decorator;

/** 背景音乐 */
@ccclass('AudioMusic')
export class AudioMusic extends AudioBase {

    private _loopStart: number = 0;
    private _loopEnd: number = 0;
    private _loopInterval: boolean = false;

    /** 
     * 设置音乐循环播放区间开始
     */
    set loopStart(value: number) {
        if (this._loopStart != value)
        {
            this._loopInterval = value > 0;
            this._loopStart = value;
        }
    }

    /** 
     * 设置音乐循环播放区间截止
     */
    set loopEnd(value: number) {
        if (this._loopEnd != value)
        {
            if (value < this._loopStart )
            {
                warn("loopEnd must be greater than loopStart", this._loopStart, value);
                this.loopInterval = false;
                return;
            }

            this._loopInterval = value > 0;
            this._loopEnd = value;
        }
    }

    set loopInterval(value: boolean) {
        if (this._loopInterval != value)
        {
            if (value === false)
            {
                this._loopStart = 0;
                this._loopEnd = 0;
            }
            this._loopInterval = value;
        }        
    }

    /** cc.Component 生命周期方法，验证背景音乐播放完成逻辑，建议不要主动调用 */
    update(dt: number) {
        if (this.currentTime > 0) {
            this._isPlay = true;
        }

        if (!this.playing) {
            return;
        }

        if (this._loopInterval && this.currentTime >= this._loopEnd) {
            this.currentTime = this._loopStart;
        }
    }

    /** 释放当前背景音乐资源 */
    release() {
        if (this._url) {
            this.clip = null;
            oops.res.release(this._url);
            this._url = null!;
        }
    }
}
