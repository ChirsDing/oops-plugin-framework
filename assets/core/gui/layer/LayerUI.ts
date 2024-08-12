import { error, instantiate, Node, Prefab, warn, Widget } from "cc";
import { oops } from "../../Oops";
import { AnimationUtil } from "../../utils/AnimationUtil";
import { UICallbacks, ViewParams } from "./Defines";
import { DelegateComponent } from "./DelegateComponent";
import { UIAnimationType, UIConfig } from "./LayerManager";

/** 界面层对象 */
export class LayerUI extends Node {
    /** 显示界面节点集合 */
    protected ui_nodes = new Map<string, ViewParams>();
    /** 被移除的界面缓存数据 */
    protected ui_cache = new Map<string, ViewParams>();

    /**
     * UI基础层，允许添加多个预制件节点
     * @param name 该层名
     * @param container 容器Node
     */
    constructor(name: string) {
        super(name);

        var widget: Widget = this.addComponent(Widget);
        widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
        widget.left = widget.right = widget.top = widget.bottom = 0;
        widget.alignMode = 2;
        widget.enabled = true;
    }

    /**
     * 添加一个预制件节点到层容器中，该方法将返回一个唯一`uuid`来标识该操作节点
     * @param prefabPath 预制件路径
     * @param params     自定义参数
     * @param callbacks  回调函数对象，可选
     * @returns ture为成功,false为失败
     */
    add(config: UIConfig, params?: any, callbacks?: UICallbacks) {
        if (this.ui_nodes.has(config.prefab)) {
            warn(`路径为【${config.prefab}】的预制重复加载`);
            return;
        }

        // 检查缓存中是否存界面
        var vp = this.ui_cache.get(config.prefab);
        if (vp == null) {
            vp = new ViewParams();
            vp.config = config;
        }
        this.ui_nodes.set(config.prefab, vp);

        vp.params = params ?? {};
        vp.callbacks = callbacks ?? {};
        vp.valid = true;

        this.load(vp, config.bundle)
    }

    /**
     * 加载界面资源
     * @param vp         显示参数
     * @param bundle     远程资源包名，如果为空就是默认本地资源包
     */
    protected load(vp: ViewParams, bundle?: string) {
        if (vp && vp.node) {
            this.showUi(vp);
        }
        else {
            // 优先加载配置的指定资源包中资源，如果没配置则加载默认资源包资源
            bundle = bundle || oops.res.defaultBundleName;
            oops.res.load(bundle, vp.config.prefab, (err: Error | null, res: Prefab) => {
                if (err) {
                    this.ui_nodes.delete(vp.config.prefab);
                    error(`路径为【${vp.config.prefab}】的预制加载失败`);
                    return;
                }

                let childNode: Node = instantiate(res);
                vp.node = childNode;

                let comp = childNode.addComponent(DelegateComponent);
                comp.vp = vp;
                comp.onHide = this.onHide.bind(this);
                comp.onShow = this.onShow.bind(this);

                this.showUi(vp);
                this.showAnim(vp);
                this.setHideAnim(vp);
            });
        }
    }

    /**
     * 显示界面 - 该方法会在界面动画播放完调用
     * @param vp  视图参数
     */
    protected onShow() {
        // 触发窗口显示事件
    }

    /**
     * 隐藏界面 - 该方法会在界面动画播放完调用
     * @param vp  视图参数
     */
    protected onHide(vp: ViewParams) {
        this.ui_nodes.delete(vp.config.prefab);
    }

    /**
     * 创建界面节点
     * @param vp  视图参数
     */
    protected showUi(vp: ViewParams) {
        // 触发窗口添加事件
        let comp = vp.node.getComponent(DelegateComponent)!;
        comp.add();
        vp.node.parent = this;

        // 标记界面为使用状态
        vp.valid = true;
    }

    /**
     * 显示界面动画
     * @param vp  视图参数
     */
    protected async showAnim(vp: ViewParams) {
        let duration = 0.5;
        if ( vp.config.showAnim && vp.config.showAnim > UIAnimationType.None) 
        {
            switch (vp.config.showAnim) {
                case UIAnimationType.Show_Fade:
                    await AnimationUtil.fadeIn(vp.node, duration);
                    break;
                case UIAnimationType.Show_SlideDown:
                    await AnimationUtil.moveFromTop(vp.node, screen.height, duration);
                    break;
                case UIAnimationType.Show_Scale:
                    await AnimationUtil.scaleShow(vp.node, 1, duration);
                    break;
                case UIAnimationType.Show_SlideUp:
                    await AnimationUtil.moveFromBottom(vp.node, screen.height, duration);
                    break;
                case UIAnimationType.Show_SlideLeft:
                    await AnimationUtil.moveFromRight(vp.node, screen.width, duration);
                    break;
                case UIAnimationType.Show_SlideRight:
                    await AnimationUtil.moveFromLeft(vp.node, screen.width, duration);
                    break;
                default:
                    console.warn(`未知的界面动画类型：${vp.config.showAnim}`);
                    break;
            }
        }
        // 触发窗口显示动画事件
        let comp = vp.node.getComponent(DelegateComponent)!;
        comp.showAnimEnd();
    }

    /**
     * 设置界面隐藏动画回调
     * @param vp  视图参数
     */
    protected setHideAnim(vp: ViewParams) {
        // 设置界面隐藏动画回调
        if (vp.config.hideAnim && vp.config.hideAnim > UIAnimationType.None) {
            let onBeforeRemove = vp.callbacks.onBeforeRemove;
            vp.callbacks.onBeforeRemove = async (node: Node, callback: Function) => {
                await this.hideAnim(vp);
                
                onBeforeRemove ? onBeforeRemove(node, callback) : callback();
            }
        }
    }

    /**
     * 隐藏界面动画
     * @param vp  视图参数
     */
    protected async hideAnim(vp: ViewParams) {
        let duration = 0.3;
        if (vp.config.hideAnim && vp.config.hideAnim > UIAnimationType.None) {
            switch (vp.config.hideAnim) {
                case UIAnimationType.Hide_Fade:
                    await AnimationUtil.fadeOut(vp.node, duration);
                    break;
                case UIAnimationType.Hide_SlideDown:
                    await AnimationUtil.moveToTop(vp.node, screen.height, duration);
                    break;
                case UIAnimationType.Hide_Scale:
                    await AnimationUtil.scaleHide(vp.node, 0, duration);
                    break;
                case UIAnimationType.Hide_SlideUp:
                    await AnimationUtil.moveToBottom(vp.node, screen.height, duration);
                    break;
                case UIAnimationType.Hide_SlideLeft:
                    await AnimationUtil.moveToRight(vp.node, screen.width, duration);
                    break;
                case UIAnimationType.Hide_SlideRight:
                    await AnimationUtil.moveToLeft(vp.node, screen.width, duration);
                    break;
                default:
                    console.warn(`未知的界面动画类型：${vp.config.hideAnim}`);
                    break;
            }
        }
    }

    /**
     * 根据预制件路径删除，预制件如在队列中也会被删除，如果该预制件存在多个也会一起删除
     * @param prefabPath   预制路径
     * @param isDestroy    移除后是否释放
     */
    remove(prefabPath: string, isDestroy?: boolean): void {
        var release = undefined;
        if (isDestroy !== undefined) release = isDestroy;

        // 界面移出舞台
        var vp = this.ui_nodes.get(prefabPath);
        if (vp) {
            // 优先使用参数中控制的释放条件，如果未传递参数则用配置中的释放条件，默认不缓存关闭的界面
            if (release === undefined) {
                release = vp.config.destroy !== undefined ? vp.config.destroy : true;
            }

            // 不释放界面，缓存起来待下次使用
            if (release === false) {
                this.ui_cache.set(vp.config.prefab, vp);
            }

            var childNode = vp.node;
            var comp = childNode.getComponent(DelegateComponent)!;
            comp.remove(release);
        }

        // 验证是否删除后台缓存界面
        if (release === true) this.removeCache(prefabPath);
    }

    /** 删除缓存的界面，当缓存界面被移除舞台时，可通过此方法删除缓存界面 */
    private removeCache(prefabPath: string) {
        let vp = this.ui_cache.get(prefabPath);
        if (vp) {
            this.ui_nodes.delete(vp.config.prefab);
            this.ui_cache.delete(prefabPath);
            var childNode = vp.node;
            childNode.destroy();
        }
    }

    /**
     * 根据预制路径获取已打开界面的节点对象
     * @param prefabPath  预制路径
     */
    get(prefabPath: string): Node {
        var vp = this.ui_nodes.get(prefabPath);
        if (vp)
            return vp.node;
        return null!;
    }

    /**
     * 判断当前层是否包含 uuid或预制件路径对应的Node节点
     * @param prefabPath 预制件路径或者UUID
     */
    has(prefabPath: string): boolean {
        return this.ui_nodes.has(prefabPath);
    }

    /**
     * 清除所有节点，队列当中的也删除
     * @param isDestroy  移除后是否释放
     */
    clear(isDestroy: boolean): void {
        // 清除所有显示的界面
        this.ui_nodes.forEach((value: ViewParams, key: string) => {
            this.remove(value.config.prefab, isDestroy);
            value.valid = false;
        });
        this.ui_nodes.clear();

        // 清除缓存中的界面
        if (isDestroy) {
            this.ui_cache.forEach((value: ViewParams, prefabPath: string) => {
                this.removeCache(prefabPath);
            });
        }
    }
}