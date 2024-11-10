/*
 * @Date: 2021-11-24 16:08:36
 * @LastEditors: dgflash
 * @LastEditTime: 2022-09-02 13:44:28
 */

import { BlockInputEvents, Button, EventTouch, Layers, Node } from "cc";
import { ViewUtil } from "../../utils/ViewUtil";
import { ViewParams } from "./Defines";
import { UIConfig } from "./LayerManager";
import { LayerUI } from "./LayerUI";

const Mask: string = 'common/prefab/mask';

/* 弹窗层，允许同时弹出多个窗口 */
export class LayerPopUp extends LayerUI {
    /** 触摸事件阻挡 */
    protected black!: BlockInputEvents;
    /** 半透明遮罩资源 */
    protected mask!: Node;
    protected closeTip!: Node | null;

    constructor(name: string) {
        super(name);
        this.init();
    }

    private init() {
        this.layer = Layers.Enum.UI_2D;
        this.black = this.addComponent(BlockInputEvents);
        this.black.enabled = false;
    }

    protected showUi(vp: ViewParams) {
        super.showUi(vp);

        // 界面加载完成显示时，启动触摸非窗口区域关闭
        this.openVacancyRemove(vp.config);

        // 界面加载完成显示时，层级事件阻挡
        this.black.enabled = true;
    }

    protected onHide(vp: ViewParams) {
        super.onHide(vp);

        // 界面关闭后，关闭触摸事件阻挡、关闭触摸非窗口区域关闭、关闭遮罩
        this.setBlackDisable();
    }

    /** 设置触摸事件阻挡 */
    protected setBlackDisable() {
        // 所有弹窗关闭后，关闭事件阻挡功能
        if (this.ui_nodes.size == 0) {
            this.black.enabled = false;
        }
        this.closeVacancyRemove();
        this.closeMask();
    }

    /** 关闭遮罩 */
    protected closeMask() {
        var flag = true;
        for (var value of this.ui_nodes.values()) {
            if (value.config.mask) {
                flag = false;
                break;
            }
        }

        if (flag) {
            this.mask.parent = null;
            if (flag && this.mask.hasEventListener(Button.EventType.CLICK, this.onTouchEnd, this)) {
                this.mask.off(Button.EventType.CLICK, this.onTouchEnd, this);
            }
        }else{
            this.resetMaskSiblingIndex();
        }
    }

    /** 启动触摸非窗口区域关闭 */
    protected openVacancyRemove(config: UIConfig) {
        if (!this.hasEventListener(Node.EventType.TOUCH_END, this.onTouchEnd, this)) {
            this.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        }

        // 背景半透明遮罩
        if (this.mask == null) {
            this.mask = ViewUtil.createPrefabNode(Mask);
            if (this.mask) {
                this.closeTip = this.mask.getChildByName('lbCloseTip');
            }
        }
        if (config.mask) {
            this.mask.parent = this;
            if (!this.mask.hasEventListener(Button.EventType.CLICK, this.onTouchEnd, this)) {
                this.mask.on(Button.EventType.CLICK, this.onTouchEnd, this);
            }
            this.resetMaskSiblingIndex();

            if (this.closeTip) {
                this.closeTip.active = config.vacancy?true:false;
            }
        }
    }

    protected resetMaskSiblingIndex(){
        let idx = 0;
        let popList = Array.from(this.ui_nodes.values());
        for(let i = popList.length-1; i > 0; i--){
            const vp = popList[i];
            if(vp.config.mask){
                idx = i;
                break;
            }
        }
        this.mask.setSiblingIndex(idx);
    }

    /** 关闭触摸非窗口区域关闭 */
    protected closeVacancyRemove() {
        var flag = true;
        for (var value of this.ui_nodes.values()) {
            if (value.config.vacancy) {
                flag = false;
                break;
            }
        }

        if (flag && this.hasEventListener(Node.EventType.TOUCH_END, this.onTouchEnd, this)) {
            this.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        }
    }

    private onTouchEnd(event: EventTouch) {
        if (event.target === this || event.target === this.mask) {
            event.propagationStopped = true;
            //每次只关一个界面
            let popList = Array.from(this.ui_nodes.values());
            let vp = popList[popList.length - 1];
            if (vp.config.vacancy) {
                this.remove(vp.config.prefab, true);
            }
            // for (let index = popList.length -1; index >= 0; index--) {
            //     const vp = popList[index];
            //     // 关闭已显示的界面
            //     if (vp.valid && vp.config.vacancy) {
            //         this.remove(vp.config.prefab, true);
            //         break;
            //     }
            //     if (vp.config.mask) {
            //         break;
            //     }
            // }
        }
    }

    clear(isDestroy: boolean) {
        super.clear(isDestroy)
        this.black.enabled = false;
        // 处理 active 为 false 之后不再设置为 true 问题，分析下来没有必要设置为 false
        // this.active = false;
        this.closeVacancyRemove();
        this.closeMask();
    }
}