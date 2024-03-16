/*
 * @Author: dgflash
 * @Date: 2021-07-03 16:13:17
 * @LastEditors: dgflash
 * @LastEditTime: 2023-07-24 17:14:57
 */

import { Node } from "cc";
import { UICallbacks, ViewParams } from "./Defines";
import { UIConfig } from "./LayerManager";
import { LayerPopUp } from "./LayerPopup";

/** 模式弹窗数据 */
type DialogParam = {
    config: UIConfig;
    params?: any;
    callbacks?: UICallbacks;
}

/*
 * 模式弹窗层，该层的窗口同时只能显示一个，删除以后会自动从队列当中取一个弹窗，直到队列为空
 */
export class LayerDialog extends LayerPopUp {
    /** 窗口调用参数队列 */
    private params: Array<DialogParam> = [];

    add(config: UIConfig, params?: any, callbacks?: UICallbacks) {
        // 控制同一时间只能显示一个模式窗口
        if (this.ui_nodes.size > 0) {
            this.params.push({
                config: config,
                params: params,
                callbacks: callbacks,
            });
            return;
        }

        this.black.enabled = true;
        this.show(config, params, callbacks);
    }

    /** 显示模式弹窗 */
    private show(config: UIConfig, params?: any, callbacks?: UICallbacks): string {
        var vp = this.ui_cache.get(config.prefab);
        if (vp == null) {
            vp = new ViewParams();
            vp.config = config
            vp.valid = true;
        }
        this.ui_nodes.set(vp.config.prefab, vp);

        vp.callbacks = callbacks ?? {};
        var onRemove_Source = vp.callbacks.onRemoved;
        vp.callbacks.onRemoved = (node: Node | null, params: any) => {
            if (onRemove_Source) {
                onRemove_Source(node, params);
            }
            setTimeout(this.next.bind(this), 0);
        };

        vp.params = params || {};
        this.load(vp, config.bundle);

        return config.prefab;
    }

    protected setBlackDisable() {
        if (this.params.length == 0) {
            this.black.enabled = false;
            this.closeVacancyRemove();
            this.closeMask()
        }
    }

    private next() {
        if (this.params.length > 0) {
            let param = this.params.shift()!;
            this.show(param.config, param.params, param.callbacks);
        }
    }
}