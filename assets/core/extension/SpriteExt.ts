import { GameBundle } from "@game/common/config/GameBundle";
import { VMEnv } from "@oops/assets/libs/model-view/VMEnv";
import { GameComponent } from "@oops/assets/module/common/GameComponent";
import { js, Sprite, SpriteFrame } from "cc";
declare module "cc" {
    // 这里使用 interface 进行扩展，如果使用 class 则会与现有的 d.ts 有冲突
    export interface Sprite {
        setResID(gameComponent: GameComponent, path: string): void;
    }
}

if (!VMEnv.editor) {
    //@ts-ignore
    if (!Sprite.prototype["$__definedProperties__"]) {
        //@ts-ignore
        Sprite.prototype["$__definedProperties__"] = true;

        js.mixin(Sprite.prototype, {
            async setResID(gameComponent: GameComponent, path: string) {
                if (!path.endsWith('/spriteFrame')) {
                    path += 'spriteFrame';
                }
                let retSF = await gameComponent.loadAsync(GameBundle.Bundle, path, SpriteFrame);
                if (!this.isValid) {
                    return;
                }
                this.spriteFrame = retSF;
            }
        });
    }
}