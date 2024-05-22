import { GameComponent } from "../../module/common/GameComponent";
import { AnimationComponent, sp, Node, js } from "cc";
import { EDITOR } from "cc/env";

// ========= 扩展 cc 提示声明 =========

/** 扩展节点属性 */
declare module "cc" {
    interface Node {

        /** 速度缩放 */
        speedScale: number;
    }
}

if (!EDITOR) {
    //@ts-ignore
    if (!Node.prototype["$__cc-node-speed-extension__"]) {
        //@ts-ignore
        Node.prototype["$__cc-node-speed-extension__"] = true;

        /** 获取，设置节点速度缩放 */
        js.mixin(Node.prototype, {
            _speedScale: 1,

            addChild(child: Node, zOrder?: number, tag?: number) {
                if (this._speedScale !== 1)
                    child.speedScale = this._speedScale;
                child.setParent(this);
            },

            insertChild(child: Node, siblingIndex: number) {
                if (this._speedScale !== 1)
                    child.speedScale = this._speedScale;
                child.setParent(this);
                child.setSiblingIndex(siblingIndex);
            },

            get speedScale() {
                return this._speedScale;
            },
            set speedScale(value: number) {
                if (value === this._speedScale) return;
                this._speedScale = value;
                this.components.forEach(component => {
                    if (component) {
                        component.speedScale = value;
                    }
                });

                this.children.forEach(child => {
                    child.speedScale = value;
                });
            }
        });
        
    }
}