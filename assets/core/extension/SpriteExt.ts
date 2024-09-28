import { VMEnv } from "@oops/assets/libs/model-view/VMEnv";
import { js, Sprite, SpriteFrame } from "cc";
import { oops } from "../Oops";
import { NodeEventType } from "cc";
import { EDITOR } from "cc/env";

declare module "cc" {
    // 这里使用 interface 进行扩展，如果使用 class 则会与现有的 d.ts 有冲突
    export interface Sprite {
        setResID(path: string, bundle?:String): void;
    }
}

if (!VMEnv.editor) {
    //@ts-ignore
    if (!Sprite.prototype["$__definedProperties__"]) {
        //@ts-ignore
        Sprite.prototype["$__definedProperties__"] = true;

        js.mixin(Sprite.prototype, {
            resId: "",
            bundle: "",
            resLoading: "",
            bundleLoading: "",

            start() {
                if ( this.resId.endsWith("/spriteFrame") && this.bundle && this.spriteFrame !== null) {
                    this.spriteFrame.addRef();
                }
            },

            async setResID(path: string, bundle?:string) {
                bundle = bundle ?? "bundle";
                if (this.resLoading === path && this.bundleLoading === bundle) {
                    return;
                }
                this.resLoading = path;
                this.bundleLoading = bundle;

                let setRes = async (pathLoading:string, bundleLoading: string) => {
                    let retSF = oops.res.get(pathLoading, SpriteFrame, bundleLoading);
                    retSF = retSF ?? await oops.res.loadAsync(this.bundle, path, SpriteFrame);
                    if (!retSF) {
                        if (pathLoading === this.resLoading && bundleLoading === this.bundleLoading) {
                            this.spriteFrame = null;
                            this.resLoading = "";
                            this.bundleLoading = "";
                        }
                        return;
                    }
                    
                    retSF.addRef();
                    
                    if (!this.isValid || this.resLoading !== pathLoading || this.bundleLoading !== bundleLoading) {
                        // 如果在加载过程中，资源已经被释放了，就不再设置了
                        retSF.decRef();
                        return;
                    }

                    this.spriteFrame = retSF;
                    this.releaseRes(this.resId, this.bundle);
                    this.resId = pathLoading;
                    this.bundle = bundleLoading;
                };

                setRes(this.resLoading, this.bundleLoading);

            },
            
            releaseRes(path: string, bundle:string) {
                if (path.endsWith("/spriteFrame")) {
                    let retSF = oops.res.get(path, SpriteFrame, bundle);
                    if (retSF) {
                        retSF.decRef();
                    }
                }
            },

            onDestroy() {
                if (EDITOR) {
                    this.node.off(NodeEventType.SIZE_CHANGED, this._resized, this);
                }
                
                if (this.resId && this.bundle) {
                    //this.spriteFrame = null;
                    this.releaseRes(this.resId, this.bundle);
                    this.resId = "";
                    this.bundle = "";
                }

                this._renderEntity.setNode(null);
                if (this.node._uiProps.uiComp === this) {
                    this.node._uiProps.uiComp = null;
                }
                this.destroyRenderData();
                if (this._materialInstances) {
                    for (let i = 0; i < this._materialInstances.length; i++) {
                        const instance = this._materialInstances[i];
                        if (instance) { instance.destroy(); }
                    }
                }
            },
        });
    }
}