
import { Component, js } from "cc";
import { DEV, EDITOR } from "cc/env";

/** 节点拖拽功能 */
if (!EDITOR) {
    //@ts-ignore
    if (!Component.prototype["__$cc-component-speed-extension$__"]) {
        //@ts-ignore
        Component.prototype["__$cc-component-speed-extension$__"] = true;

        //----------------   Component 添加 speed属性 ----------------

        js.mixin(Component.prototype, {
            _timescale: 1,

            get internalUpdate(): ((dt: number) => void) | undefined {
                if (this.update != null ) {
                    let oldUpdate = this.update;
                    this.update = function (dt: number) {
                        dt = dt * this._timescale;
                        oldUpdate.call(this, dt);
                    }
                    return this.update;
                }
            },

            get internalLateUpdate(): ((dt: number) => void) | undefined {
                if (this.lateUpdate != null ) {
                    let oldLateUpdate = this.lateUpdate;
                    this.lateUpdate = function (dt: number) {
                        dt = dt * this._timescale;
                        oldLateUpdate.call(this, dt);
                    }
                    return this.lateUpdate;
                }
            },
        });

        Object.defineProperty(Component.prototype, "timeScale", {
            get: function () {
                return this._timescale;
            },
            set: function (value: number) {
                this._timescale = value;
                this.node.children.forEach((child) => {
                    if (child) {
                        child.components.forEach((component) => {
                            if (component) {
                                component.timeScale = value;
                            }
                        });
                    }
                });
            }
        });
    }
}

declare module "cc" {
    // 这里使用 interface 进行扩展，如果使用 class 则会与现有的 d.ts 有冲突
    export interface Component {
        /** 倍速缩放 */
        timeScale: number;
    }
}