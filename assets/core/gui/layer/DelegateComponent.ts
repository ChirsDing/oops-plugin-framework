/*
 * @Author: dgflash
 * @Date: 2022-09-01 18:00:28
 * @LastEditors: dgflash
 * @LastEditTime: 2023-01-09 11:55:03
 */
import { Component, Director, Node, _decorator, director } from "cc";
import { EDITOR } from "cc/env";
import { oops } from "../../Oops";
import { EventMessage } from "../../common/event/EventMessage";
import { ViewParams } from "./Defines";

const { ccclass } = _decorator;

/** 窗口事件触发组件 */
@ccclass("DelegateComponent")
export class DelegateComponent extends Component {
    /** 视图参数 */
    vp: ViewParams = null!;
    /** 界面显示回调 - 包括界面动画播放完 */
    onShow: Function = null!;
    /** 界面关闭回调 - 包括关闭动画播放完 */
    onHide: Function = null!;

    /** 窗口添加 */
    add() {
        // 触发窗口组件上添加到父节点后的事件
        this.applyComponentsFunction(this.node, "onAdded", this.vp.params);
        if (typeof this.vp.callbacks.onAdded === "function") {
            this.vp.callbacks.onAdded(this.node, this.vp.params);
        }
    }

    showAnimEnd() {
        // 触发窗口组件上显示动画事件
        this.applyComponentsFunction(this.node, "onShow", this.vp.params);
        // 界面显示舞台事件
        this.onShow && this.onShow();

        if (EDITOR) {
            console.log(`【界面管理】打开界面【${this.vp.config.prefab}】`);
        }
        oops.message.dispatchEvent(EventMessage.UI_CONTROLLER_SHOW, oops.gui.getUIID(this.vp.config), this.vp.config.prefab);
    }

    /** 删除节点，该方法只能调用一次，将会触发onBeforeRemoved回调 */
    remove(isDestroy?: boolean) {
        if (this.vp.valid) {
            // 触发窗口移除舞台之前事件
            this.applyComponentsFunction(this.node, "onBeforeRemove", this.vp.params);

            //  通知外部对象窗口组件上移除之前的事件（关闭窗口前的关闭动画处理）
            if (typeof this.vp.callbacks.onBeforeRemove === "function") {
                this.vp.callbacks.onBeforeRemove(this.node, () => {
                    this.removed(this.vp, isDestroy);
                });
            } else {
                this.removed(this.vp, isDestroy);
            }
        }
    }

    /** 窗口组件中触发移除事件与释放窗口对象 */
    private removed(vp: ViewParams, isDestroy?: boolean) {
        vp.valid = false;

        if (typeof vp.callbacks.onRemoved === "function") {
            vp.callbacks!.onRemoved(this.node, vp.params);
        }

        // 界面移除舞台事件
        this.onHide && this.onHide(vp);
        oops.message.dispatchEvent(EventMessage.UI_CONTROLLER_HIDE, oops.gui.getUIID(this.vp.config));

        if (isDestroy) {
            // let uiID = oops.gui.getUIID(this.vp.config);
            oops.message.dispatchEvent(EventMessage.UI_CONTROLLER_DESTROY, this);
            // 释放界面显示对象
            this.node.destroy();
            // 释放界面相关资源
            director.once(Director.EVENT_AFTER_UPDATE, () => {
                oops.res.release(vp.config.prefab);
            });
        }
        else {
            this.node.removeFromParent();
        }
    }

    onDestroy() {
        // 触发窗口组件上窗口移除之后的事件
        this.applyComponentsFunction(this.node, "onRemoved", this.vp.params);
        this.vp = null!;
    }

    protected applyComponentsFunction(node: Node, funName: string, params: any) {
        for (let i = 0; i < node.components.length; i++) {
            let component: any = node.components[i];
            let func = component[funName];
            if (func) {
                func.call(component, params);
            }
        }
    }
}