/*
 * @Author: dgflash
 * @Date: 2022-09-01 18:00:28
 * @LastEditors: dgflash
 * @LastEditTime: 2022-09-02 10:22:36
 */
import { Component, _decorator } from 'cc';
import { oops } from '../../Oops';
import { EffectStatus, PlayType } from './AudioBase';
import { AudioEffectSource } from './AudioEffectSource';
const { ccclass, menu } = _decorator;


/** 游戏音效 */
@ccclass('AudioEffect')
export class AudioEffect extends Component {
    private _maxEffectPoolCount: number = 10;

    private _effectsPlaying: AudioEffectSource[] = []; // 正在播放的音效
    private _effectsPool: AudioEffectSource[] = []; // 音效池
    private _mapPolyphonyCount: Map<number, number> = new Map(); // 同复音类型音效当前并发数量

    private _mapPolyphony: Map<number, AudioEffectSource> = new Map(); // 同复音类型音效待播放队列
    private _maxPriorityType: number = 0; // 当前最大优先级

    private _removeing: boolean = false; // 是否正在移除音效池

    /**
     * 设置音效池最大数量
     * @param value         音效池最大数量
     */
    set maxEffectPoolCount(value: number) {
        this._maxEffectPoolCount = value;
    }

    /**
     * 设置音效音量
     */
    setVolume() {
        for (let i = 0; i < this._effectsPlaying.length; i++) {
            this._effectsPlaying[i].vol = this._effectsPlaying[i].vol;
        }
    }

    /**
     * 设置音效静音
     */
    set mute(value: boolean) {
        for (let i = 0; i < this._effectsPlaying.length; i++) {
            this._effectsPlaying[i].mute = value;
        }
    }

    /**
     * cc.Component 生命周期方法，处理音效回收及销毁逻辑，建议不要主动调用
     */
    lateUpdate() {
        for (let i = this._effectsPlaying.length - 1; i >= 0; i--) {
            let comp = this._effectsPlaying[i];
            if (comp.status === EffectStatus.COMPLETE || comp.status === EffectStatus.DESTROY) {
                this._effectsPlaying.splice(i, 1);
                if(comp.status === EffectStatus.COMPLETE) {
                    comp.status = EffectStatus.LOAD;
                    this._effectsPool.push(comp);
                }else{
                    comp.release();
                    comp.destroy();
                }
            }
        }

        for (let i = this._effectsPool.length - 1; i >= 0; i--) {
            let comp = this._effectsPool[i];
            if (comp.status === EffectStatus.DESTROY) {
                this._effectsPool.splice(i, 1);
                comp.release();
                comp.destroy();
            }
        }

        this.removeAudioEffectPool();
    }

    /**
     * 加载音效并播放
     * @param url           音效资源地址
     * @param playType      播放类型
     * @param priorityType  优先级类型
     * @param polyphonyType 复音类型 
     * @param bundle        资源包名
     * @param callback      资源加载完成并开始播放回调
     */
    load(url: string, playType = PlayType.ONESHOT, priorityType = 0, polyphonyType = 0, bundle?: string, callback?: Function) {
        let comp : AudioEffectSource = this.getAudioEffectSource(url);
        
        comp.onComplete = this.onCompComplete.bind(this);
        comp.polyphonyType = polyphonyType;
        comp.priorityType = priorityType;
        comp.playType = playType;
        comp.resUrl = url;
        comp.fadeTime = 0;
        comp.mute = oops.audio.muteEffect;

        this._effectsPlaying.push(comp);
        
        if (!this.addPolyphonyCount(comp))
        {
            if (!this._mapPolyphony.has(polyphonyType)) {
                this._mapPolyphony.set(polyphonyType, comp);
            }else{
                comp.status = EffectStatus.DESTROY;
                comp.release();
                comp.destroy();
            }
            return;
        }
        comp.load(url, playType, bundle, () => {
            if(comp.status === EffectStatus.ABORT){
                comp.status = EffectStatus.DESTROY;
                comp.release();
                comp.destroy();
            }
            this.playPriority(comp);
            callback && callback();
        });
    }

    /**
     * 获取url对应的音效组件
     * @param url           音效资源地址
     */
    private getAudioEffectSource(url: string) : AudioEffectSource {
        let comp : AudioEffectSource = null!;
        if (!this._removeing) {
            for (let i = 0; i < this._effectsPool.length; i++) {
                if (this._effectsPool[i].url === url) {
                    comp = this._effectsPool[i];
                    this._effectsPool.splice(i, 1);
                    break;
                }
            }
        }
        if (!comp) {
            comp = this.node.addComponent(AudioEffectSource);
        }
        return comp;
    }

    /**
     * 移除音效池
     */
    private removeAudioEffectPool() {
        while (this._effectsPool.length > this._maxEffectPoolCount) {
            let comp = this._effectsPool[0];
            this._effectsPool.shift();
            comp.release();
            comp.destroy();
        }
    }

    /**
     * 音效播放完成回调
     * @param comp          音效组件
     */
    private onCompComplete(comp: AudioEffectSource, recycle = true) {
        comp.onComplete = null;
        this.reducePolyphonyCount(comp);
        this.stopPriority(comp);
        if (this._mapPolyphony.has(comp.polyphonyType)) {
            let tempComp = this._mapPolyphony.get(comp.polyphonyType)!;
            this._mapPolyphony.delete(comp.polyphonyType);
            this.load(tempComp.resUrl, tempComp.playType, tempComp.priorityType, tempComp.polyphonyType);
        }
        if (!recycle){
            comp.status = EffectStatus.DESTROY;
        }
        
    }

    /**
     * 添加复音类型音效并发数量(默认0不做处理)
     * @param comp 当前播放音效组件
     * @returns 
     */
    private addPolyphonyCount(comp: AudioEffectSource) : boolean {
        if (comp.polyphonyType <= 0) return true;
        let count = this._mapPolyphonyCount.get(comp.polyphonyType) || 0;
        count++;
        

        if (count > oops.audio.maxConcurrent) {
            return false;
        }
        this._mapPolyphonyCount.set(comp.polyphonyType, count);
        return true;
    }

    /**
     * 减少复音类型音效并发数量(默认0不做处理)
     * @param comp 当前播放音效组件
     * @returns 
     */
    private reducePolyphonyCount(comp: AudioEffectSource) {
        if (comp.polyphonyType <= 0) return;
        let count = this._mapPolyphonyCount.get(comp.polyphonyType) || 0;
        count--;
        this._mapPolyphonyCount.set(comp.polyphonyType, count);
    }

    /**
     * 音效播放时优先级处理
     */
    private playPriority(comp: AudioEffectSource) {
        if (comp.priorityType <= 0 && this._maxPriorityType <= 0) return;

        if (comp.priorityType > this._maxPriorityType) {
            this._maxPriorityType = comp.priorityType;
            for (let i = this._effectsPlaying.length - 1; i >= 0; i--) {
                
                if (this._effectsPlaying[i] && this._effectsPlaying[i] !== comp) {
                    this._effectsPlaying[i].vol = oops.audio.volumeAvoid;
                }
            }
        }else if (comp.priorityType < this._maxPriorityType){
            comp.vol = oops.audio.volumeAvoid;
        }
    }

    /**
     * 音效停止时优先级处理
     */
    private stopPriority(comp: AudioEffectSource) {
        if (comp.priorityType <= 0 || comp.priorityType < this._maxPriorityType){
            comp.vol = 1;    
            return;
        }
        
        let tempPriorityType = 0;
        let tempComps: AudioEffectSource[] = null!;
        for (let i = this._effectsPlaying.length - 1; i >= 0; i--) {
            let tempComp = this._effectsPlaying[i];
            if(!tempComp || tempComp.status === EffectStatus.COMPLETE || tempComp.status === EffectStatus.DESTROY ) continue;

            if (tempComp.priorityType > tempPriorityType) {
                tempPriorityType = tempComp.priorityType;
                if(tempPriorityType === this._maxPriorityType) break;

                tempComps = [tempComp];
            }else if (tempComp.priorityType === tempPriorityType) {
                if(!tempComps){
                    tempComps = [tempComp];
                }else{
                    tempComps.push(tempComp);
                }
            }
        }

        if (tempPriorityType < this._maxPriorityType) {
            this._maxPriorityType = tempPriorityType;
            if(!tempComps) {
                this._maxPriorityType = 0;
                return;
            }

            for (let i = tempComps.length - 1; i >= 0; i--) {
                tempComps[i].vol = 1;
            }
        }
    }

    /**
     * 暂停所有音效
     */
    pauseAll() {
        for (let i = this._effectsPlaying.length - 1; i >= 0 ; i--) {
            let comp = this._effectsPlaying[i];
            comp.pause();
        }
    }

    /**
     * 恢复所有音效
     */
    resumeAll() {
        for (let i = this._effectsPlaying.length - 1; i >= 0 ; i--) {
            let comp = this._effectsPlaying[i];
            comp.resume();
        }
    }

    /**
     * 停止指定地址音效
     * @param url           音效资源地址
     */
    stopUrl(url: string) {
        for (let i = this._effectsPlaying.length - 1; i >= 0 ; i--) {
            let comp = this._effectsPlaying[i];
            if (comp.url === url) {
                comp.stop();
            }
        }
    }

    /**
     * 停止所有音效
     */
    stopAll() {
        for (let i = this._effectsPlaying.length - 1; i >= 0 ; i--) {
            let comp = this._effectsPlaying[i];
            comp.stop();
        }
    }

    /** 释放所有已使用过的音效资源 */
    releaseAll() {
        this._removeing = true;
        for (let i = this._effectsPlaying.length - 1; i >= 0 ; i--) {
            let comp = this._effectsPlaying[i];
            comp.onComplete = null;
            comp.release();
            comp.destroy();
        }
        this._effectsPlaying = [];

        for (let i = this._effectsPool.length - 1; i >= 0 ; i--) {
            let comp = this._effectsPool[i];
            comp.release();
            comp.destroy();
        }
        this._effectsPool = [];
        this._mapPolyphonyCount.clear();
        this._maxPriorityType = 0;
        this._removeing = false;
    }

    /**
     * 释放指定地址音效资源
     * @param url           音效资源地址
     */
    release(url: string) {
        this._removeing = true;
        for (let i = this._effectsPlaying.length - 1; i >= 0 ; i--) {
            let comp = this._effectsPlaying[i];
            this.onCompComplete(comp, false);
            comp.release();
            comp.destroy();
        }

        for (let i = this._effectsPool.length - 1; i >= 0 ; i--) {
            let comp = this._effectsPool[i];
            this._effectsPool.splice(i, 1);
            comp.release();
            comp.destroy();
        }

        this._removeing = false;
    }
}
