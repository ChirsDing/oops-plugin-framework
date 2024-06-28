/**
 * @file AnimationUtil.ts
 * @path extensions\oops-plugin-framework\assets\core\utils\AnimationUtil.ts
 * @author DBS
 * @date 2024-06-22
 * @description file description
 */

import { Node, tween } from "cc";

export class AnimationUtil {
    /**
     * 淡入
     * @param node 
     * @param duration 
     */
    static fadeIn(node: Node, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            node.opacity = 0;
            node.active = true;
            tween(node).to(duration, { opacity: 255 }).call(() => {
                resolve();
            }).start();
        });
    }

    /**
     * 淡出
     * @param node 
     * @param duration 
     */
    static fadeOut(node: Node, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            node.opacity = 255;
            tween(node).to(duration, { opacity: 0 }).call(() => {
                node.active = false;
                resolve();
            }).start();
        });
    }

    /**
     * 缩放显示
     * @param node 
     * @param scale 
     * @param duration 
     */
    static scaleShow(node: Node, scale: number, duration: number = 0.3 ) : Promise<void> {
        return new Promise((resolve) => {
            console.info("scaleShow", node.scale_x, node.scale_y);
            node.scale_x = 0;
            node.scale_y = 0;
            
            node.active = true;
            tween(node).to(duration, { scale_x: scale, scale_y: scale }, { easing: 'elasticOut' }).call(() => {
                console.info("scaleShow", node.scale_x, node.scale_y);
                resolve();
            }).start();
        });
    }

    /**
     * 缩放隐藏
     * @param node
     * @param scale
     * @param duration
     */
    static scaleHide(node: Node, scale: number, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            node.scale_x = scale;
            node.scale_y = scale;
            tween(node).to(duration, { scale_x: 0, scale_y: 0 }).call(() => {
                node.active = false;
                resolve();
            }).start();
        });
    }
    

    /**
     * 由上至下移动显示
     * @param node
     * @param distance
     * @param duration
     */
    static moveFromTop(node: Node, distance: number, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            let oldY = node.y;
            node.y = oldY + distance;
            node.active = true;
            tween(node).to(duration, { y: oldY }, { easing: 'elasticOut' }).call(() => {
                resolve();
            }).start();
        });
    }

    /**
     * 由下至上移动隐藏
     * @param node
     * @param distance
     * @param duration
     */
    static moveToTop(node: Node, distance: number, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            node.active = true;
            tween(node).to(duration, { y: node.y + distance }).call(() => {
                resolve();
            }).start();
        });
    }

    /**
     * 由下至上移动显示
     * @param node
     * @param distance
     * @param duration
     */
    static moveFromBottom(node: Node, distance: number, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            let oldY = node.y;
            node.y = oldY - distance;
            node.active = true;
            tween(node).to(duration, { y: oldY }, { easing: 'elasticOut' }).call(() => {
                resolve();
            }).start();
        });
    }

    /**
     * 由上至下移动隐藏
     * @param node
     * @param distance
     * @param duration
     */
    static moveToBottom(node: Node, distance: number, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            node.active = true;
            tween(node).to(duration, { y: node.y - distance }).call(() => {
                resolve();
            }).start();
        });
    }

    /**
     * 由左至右移动显示
     * @param node
     * @param distance
     * @param duration
     */
    static moveFromLeft(node: Node, distance: number, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            let oldX = node.x;
            node.x = oldX - distance;
            node.active = true;
            tween(node).to(duration, { x: oldX }, { easing: 'elasticOut' }).call(() => {
                resolve();
            }).start();
        });
    }

    /**
     * 由右至左移动隐藏
     * @param node
     * @param distance
     * @param duration
     */
    static moveToLeft(node: Node, distance: number, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            node.active = true;
            tween(node).to(duration, { x: node.x - distance }).call(() => {
                resolve();
            }).start();
        });
    }


    /**
     * 由右至左移动显示
     * @param node
     * @param distance
     * @param duration
     */
    static moveFromRight(node: Node, distance: number, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            let oldX = node.x;
            node.x = oldX + distance;
            node.active = true;
            tween(node).to(duration, { x: oldX }, { easing: 'elasticOut' }).call(() => {
                resolve();
            }).start();
        });
    }

    /**
     * 由左至右移动隐藏
     * @param node
     * @param distance
     * @param duration
     */
    static moveToRight(node: Node, distance: number, duration: number = 0.3) : Promise<void> {
        return new Promise((resolve) => {
            node.active = true;
            tween(node).to(duration, { x: node.x + distance }).call(() => {
                resolve();
            }).start();
        });
    }
}