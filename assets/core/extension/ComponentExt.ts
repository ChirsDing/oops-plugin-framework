
import { Component, AnimationComponent, sp, js } from "cc";
import { DEV, EDITOR } from "cc/env";

/** 节点拖拽功能 */
if (!EDITOR) {
    //@ts-ignore
    if (!Component.prototype["__$cc-component-speed-extension$__"]) {
        //@ts-ignore
        Component.prototype["__$cc-component-speed-extension$__"] = true;

        //----------------   Component 添加 speed属性 ----------------

        js.mixin(Component.prototype, {
            _speedScale: 1,

            get internalUpdate(): ((dt: number) => void) | undefined {
                if (this.update != null ) {
                    let oldUpdate = this.update;
                    this.update = function (dt: number) {
                        dt = dt * this._speedScale;
                        oldUpdate.call(this, dt);
                    }
                    return this.update;
                }
            },

            get internalLateUpdate(): ((dt: number) => void) | undefined {
                if (this.lateUpdate != null ) {
                    let oldLateUpdate = this.lateUpdate;
                    this.lateUpdate = function (dt: number) {
                        dt = dt * this._speedScale;
                        oldLateUpdate.call(this, dt);
                    }
                    return this.lateUpdate;
                }
            },
        });

        Object.defineProperty(Component.prototype, "speedScale", {
            get: function () {
                return this._speedScale;
            },
            set: function (value: number) {
                if (value === this._speedScale) return;
                this._speedScale = value;
                this.node.timeScale = value;
                if (this instanceof AnimationComponent) {
                    if (this.speed !== value) {
                        if (this.speed === 0 ) {
                            this.resume();
                        }
                        this.speed = value;
                        if (this.speed === 0) {
                            this.pause();
                        }
                    }
                }
                else if(this instanceof sp.Skeleton) {
                    this.timeScale = value;
                }

                this.node.speedScale = value;
            }
        });
    }
}

declare module "cc" {
    // 这里使用 interface 进行扩展，如果使用 class 则会与现有的 d.ts 有冲突
    export interface Component {
        /** 倍速缩放 */
        speedScale: number;
    }
}