import { CLayoutIgnore } from "@game/ccomp/CLayoutIgnore";
import { js, Layout } from "cc";


//@ts-ignore
if (!Layout.prototype["$__definedProperties__"]) {
    //@ts-ignore
    Layout.prototype["$__definedProperties__"] = true;

    js.mixin(Layout.prototype, {
        _checkUsefulObj (): void {
            this._usefulLayoutObj.length = 0;
            const children = this.node.children;
            for (let i = 0; i < children.length; ++i) {
                const child = children[i];
                const uiTrans = child._uiProps.uiTransformComp;
                const layoutIgnore = child.getComponent(CLayoutIgnore);
                if (layoutIgnore && layoutIgnore.enabled && layoutIgnore.ignore) {
                } else if (child.activeInHierarchy && uiTrans) {
                    this._usefulLayoutObj.push(uiTrans);
                }
            }
        }
    });   
}