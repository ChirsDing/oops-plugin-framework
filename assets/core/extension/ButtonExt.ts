import { Button, EventTouch, EventHandler, js } from "cc";
import { EDITOR } from "cc/env";

// ========= 扩展 cc 提示声明 =========

if (!EDITOR) {
    //@ts-ignore
    if (!Node.prototype["$__cc-button-extension__"]) {
        //@ts-ignore
        Node.prototype["$__cc-button-extension__"] = true;

        /** Button拓展 */
        js.mixin(Button.prototype, {
            _onTouchEnded (event?: EventTouch): void {
                if (!this._interactable || !this.enabledInHierarchy) {
                    return;
                }
        
                if (this._pressed) {
                    try {
                        EventHandler.emitEvents(this.clickEvents, event);
                        this.node.emit('click', this);
                    } catch (error) {
                        console.error(error);
                    }
                }
                this._pressed = false;
                this._updateState();
        
                if (event) {
                    event.propagationStopped = true;
                }
            }
        });
        
    }
}