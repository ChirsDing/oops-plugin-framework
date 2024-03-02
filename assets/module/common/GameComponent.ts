/*
 * @Author: dgflash
 * @Date: 2022-04-14 17:08:01
 * @LastEditors: dgflash
 * @LastEditTime: 2022-12-13 11:36:00
 */
import { Asset, Component, EventKeyboard, EventTouch, Input, Node, __private, _decorator, input } from "cc";
import { oops } from "../../core/Oops";
import { EventDispatcher } from "../../core/common/event/EventDispatcher";
import { EventMessage, ListenerFunc } from "../../core/common/event/EventMessage";
import { AssetType, CompleteCallback, ProgressCallback } from "../../core/common/loader/ResLoader";
import { ViewUtil } from "../../core/utils/ViewUtil";

const { ccclass } = _decorator;

/** 
 * 游戏显示对象组件模板
 * 1、当前对象加载的资源，会在对象释放时，自动释放引用的资源
 * 2、当前对象支持启动游戏引擎提供的各种常用逻辑事件
 */
@ccclass("GameComponent")
export class GameComponent extends Component {
    //#region 全局事件管理
    private _event: EventDispatcher | null = null;
    /** 全局事件管理器 */
    private get event(): EventDispatcher {
        if (this._event == null) this._event = new EventDispatcher();
        return this._event;
    }

    /**
     * 注册全局事件
     * @param event       事件名
     * @param listener    处理事件的侦听器函数
     * @param object      侦听函数绑定的this对象
     */
    on(event: string, listener: ListenerFunc, object: any) {
        this.event.on(event, listener, object);
    }

    /**
     * 移除全局事件
     * @param event      事件名
     */
    off(event: string) {
        this.event.off(event);
    }

    /** 
     * 触发全局事件 
     * @param event      事件名
     * @param args       事件参数
     */
    dispatchEvent(event: string, args: any = null) {
        this.event.dispatchEvent(event, args);
    }
    //#endregion

    //#region 预制节点管理
    /** 摊平的节点集合（不能重名） */
    private nodes: Map<string, Node> = new Map();

    /** 通过节点名获取预制上的节点，整个预制不能有重名节点 */
    getNode(name: string): Node | undefined {
        return this.nodes.get(name);
    }

    /** 平摊所有节点存到Map<string, Node>中通过get(name: string)方法获取 */
    nodeTreeInfoLite() {
        ViewUtil.nodeTreeInfoLite(this.node, this.nodes);
    }
    //#endregion

    //#region 资源加载管理
    /** 资源路径 */
    private resPaths: Map<string, string> = new Map();
    private resPathsDir: Map<string, string> = new Map();

    /**
     * 获取资源
     * @param path          资源路径
     * @param type          资源类型
     * @param bundleName    远程资源包名
     */
    getRes<T extends Asset>(path: string, type?: __private._types_globals__Constructor<T> | null, bundleName?: string): T | null {
        return oops.res.get(path, type, bundleName);
    }

    /** 异步加载资源 */
    loadAsync<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    loadAsync<T extends Asset>(bundleName: string, paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    loadAsync<T extends Asset>(bundleName: string, paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    loadAsync<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    loadAsync<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    loadAsync<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    loadAsync<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    loadAsync<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    loadAsync<T extends Asset>(
        bundleName: string,
        paths?: string | string[] | AssetType<T> | ProgressCallback | CompleteCallback | null,
        type?: AssetType<T> | ProgressCallback | CompleteCallback | null,
    ) {
        if (paths instanceof Array) {
            paths.forEach(path => {
                this.resPaths.set(path, oops.res.defaultBundleName);
            });
        }
        else {
            this.resPaths.set(bundleName, oops.res.defaultBundleName);
        }
        return oops.res.loadAsync(bundleName, paths, type);
    }

    /** 加载资源 */
    load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    load<T extends Asset>(bundleName: string, paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    load<T extends Asset>(bundleName: string, paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    load<T extends Asset>(bundleName: string, paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    load<T extends Asset>(paths: string | string[], onProgress: ProgressCallback | null, onComplete: CompleteCallback<T> | null): void;
    load<T extends Asset>(paths: string | string[], onComplete?: CompleteCallback<T> | null): void;
    load<T extends Asset>(paths: string | string[], type: AssetType<T> | null, onComplete?: CompleteCallback<T> | null): void;
    load<T extends Asset>(
        bundleName: string,
        paths?: string | string[] | AssetType<T> | ProgressCallback | CompleteCallback | null,
        type?: AssetType<T> | ProgressCallback | CompleteCallback | null,
        onProgress?: ProgressCallback | CompleteCallback | null,
        onComplete?: CompleteCallback | null,
    ) {
        if (paths instanceof Array) {
            paths.forEach(path => {
                this.resPaths.set(path, oops.res.defaultBundleName);
            });
        }
        else {
            this.resPaths.set(bundleName, oops.res.defaultBundleName);
        }
        oops.res.load(bundleName, paths, type, onProgress, onComplete);
    }

    /** 加载文件名中资源 */
    loadDir<T extends Asset>(bundleName: string, dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(bundleName: string, dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(bundleName: string, dir: string, onComplete?: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(bundleName: string, dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(dir: string, onProgress: ProgressCallback | null, onComplete: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(dir: string, onComplete?: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(dir: string, type: AssetType<T> | null, onComplete?: CompleteCallback<T[]> | null): void;
    loadDir<T extends Asset>(
        bundleName: string,
        dir?: string | AssetType<T> | ProgressCallback | CompleteCallback | null,
        type?: AssetType<T> | ProgressCallback | CompleteCallback | null,
        onProgress?: ProgressCallback | CompleteCallback | null,
        onComplete?: CompleteCallback | null,
    ) {
        if (typeof dir === "string") {
            this.resPathsDir.set(dir, oops.res.defaultBundleName);
        }
        else {
            this.resPathsDir.set(bundleName, oops.res.defaultBundleName);
        }
        oops.res.loadDir(bundleName, dir, type, onProgress, onComplete);
    }

    /** 释放一个资源 */
    release() {
        this.resPaths.forEach((value: string, key: string) => {
            oops.res.release(key, value);
        });
        this.resPaths.clear();
        this.resPaths = null!;
    }

    /** 释放一个文件夹的资源 */
    releaseDir() {
        this.resPathsDir.forEach((value: string, key: string) => {
            oops.res.releaseDir(key, value);
        });
        this.resPathsDir.clear();
        this.resPathsDir = null!;
    }
    //#endregion

    //#region 音频播放管理
    /**
     * 播放背景音乐
     * @param url       资源地址
     */
    playMusic(url: string) {
        this.resPaths.set(url, oops.res.defaultBundleName);
        oops.audio.playMusic(url);
    }

    /**
     * 循环播放背景音乐
     * @param url        资源地址
     */
    playMusicLoop(url: string) {
        this.resPaths.set(url, oops.res.defaultBundleName);
        oops.audio.playMusicLoop(url);
    }

    /**
    * 播放音效
    * @param url        资源地址
    */
    playEffect(url: string) {
        this.resPaths.set(url, oops.res.defaultBundleName);
        oops.audio.playEffect(url);
    }
    //#endregion

    //#region 游戏逻辑事件
    /** 监听游戏从后台进入事件 */
    protected setEventShow(callback: ListenerFunc) {
        this.on(EventMessage.GAME_ENTER, callback, this);
    }

    /** 监听游戏切到后台事件 */
    protected setEventHide(callback: ListenerFunc) {
        this.on(EventMessage.GAME_EXIT, callback, this);
    }

    /** 监听游戏画笔尺寸变化事件 */
    protected setWindowResize(callback: ListenerFunc) {
        this.on(EventMessage.GAME_RESIZE, callback, this);
    }

    /** 监听游戏全屏事件 */
    protected setFullscreenChange(callback: ListenerFunc) {
        this.on(EventMessage.GAME_FULL_SCREEN, callback, this);
    }

    /** 监听游戏旋转屏幕事件 */
    protected setOrientationChange(callback: ListenerFunc) {
        this.on(EventMessage.GAME_ORIENTATION, callback, this);
    }

    /** 
     * 批量设置当前界面按钮事件 
     * @example
     * this.setButton("Label1", "Label2");
     * 
     * Label1(event: EventTouch) { console.log(event.target.name); }
     * Label2(event: EventTouch) { console.log(event.target.name); }
     */
    protected setButton(...args: string[]) {
        this.node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            var self: any = this;
            var func = self[event.target.name];
            if (func)
                func(event);
            else
                console.error(`名为【${event.target.name}】的按钮事件方法不存在`);
        }, this);
    }

    /** 
     * 批量设置全局事件 
     * @example
     *  this.setEvent("onGlobal");
     *  this.dispatchEvent("onGlobal", "全局事件");
     * 
     *  onGlobal(event: string, args: any) { console.log(args) };
     */
    protected setEvent(...args: string[]) {
        var self: any = this;
        for (const name of args) {
            var func = self[name];
            if (func)
                this.on(name, self[name], this);
            else
                console.error(`名为【${name}】的全局事方法不存在`);
        }
    }

    /**
     * 键盘事件开关
     * @param on 打开键盘事件为true
     */
    setKeyboard(on: boolean) {
        if (on) {
            input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
            input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
            input.on(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
        }
        else {
            input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
            input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
            input.off(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
        }
    }

    /** 键按下 */
    protected onKeyDown(event: EventKeyboard) { }

    /** 键放开 */
    protected onKeyUp(event: EventKeyboard) { }

    /** 键长按 */
    protected onKeyPressing(event: EventKeyboard) { }
    //#endregion

    protected onDestroy() {
        // 释放消息对象
        if (this._event) {
            this._event.destroy();
            this._event = null;
        }

        // 节点引用数据清除
        this.nodes.clear();

        // 自动释放资源
        this.release();
        this.releaseDir();
    }
}