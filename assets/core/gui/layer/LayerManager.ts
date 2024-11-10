import { Camera, Layers, Node, Vec3, warn, Widget } from "cc";
import { GUI } from "../GUI";
import { UICallbacks, ViewParams } from "./Defines";
import { DelegateComponent } from "./DelegateComponent";
import { LayerDialog } from "./LayerDialog";
import { LayerNotify } from "./LayerNotify";
import { LayerPopUp } from "./LayerPopup";
import { LayerUI } from "./LayerUI";
import { UIMap } from "./UIMap";

/** 界面层类型 */
export enum LayerType {
    /** 二维游戏层 */
    Game = 0,
    /** 主界面层 */
    UI = 1,
    /** 弹窗层 */
    PopUp = 2,
    /** 模式窗口层 */
    Dialog = 3,
    /** 系统触发模式窗口层 */
    System = 4,
    /** 滚动消息提示层 */
    Notify = 5,
    /**游戏逻辑最高层（如顶部的Res资源） */
    LogicTop = 6,
    /** 新手引导层 */
    Guide = 7,
    /** 最顶层（处理loading等） */
    Top = 8,
    /** GM 界面层 */
    GM = 9,
}

/** 界面动画类型 */
export enum UIAnimationType {
    /** 无动画 */
    None = 0,
    /** 缩放 */
    Show_Scale = 1,
    /** 淡入淡出 */
    Show_Fade = 2,
    /** 从下往上 */
    Show_SlideUp = 3,
    /** 从上往下 */
    Show_SlideDown = 4,
    /** 从左往右 */
    Show_SlideRight = 5,
    /** 从右往左 */
    Show_SlideLeft = 6,

    /** 缩放 */
    Hide_Scale = 11,
    /** 淡入淡出 */
    Hide_Fade = 12,
    /** 从下往上 */
    Hide_SlideUp = 13,
    /** 从上往下 */
    Hide_SlideDown = 14,
    /** 从左往右 */
    Hide_SlideRight = 15,
    /** 从右往左 */
    Hide_SlideLeft = 16,
}

/** 
 * 界面配置结构体
 * @example
// 界面唯一标识
export enum UIID {
    Loading = 1,
    Window,
    Netinstable
}

// 打开界面方式的配置数据
export var UIConfigData: { [key: number]: UIConfig } = {
    [UIID.Loading]: { layer: LayerType.UI, prefab: "loading/prefab/loading", bundle: "resources" },
    [UIID.Netinstable]: { layer: LayerType.PopUp, prefab: "common/prefab/netinstable" },
    [UIID.Window]: { layer: LayerType.Dialog, prefab: "common/prefab/window" }
}
 */
export interface UIConfig {
    /** -----公共属性----- */
    /** 远程包名 */
    bundle?: string;
    /** 窗口层级 */
    layer: LayerType;
    /** 预制资源相对路径 */
    prefab: string;
    /** 是否自动施放 */
    destroy?: boolean;
    /** 显示动画类型 */
    showAnim?: UIAnimationType;
    /** 隐藏动画类型 */
    hideAnim?: UIAnimationType;

    /** -----弹窗属性----- */
    /** 是否触摸非窗口区域关闭 */
    vacancy?: boolean,
    /** 是否打开窗口后显示背景遮罩 */
    mask?: boolean;
}

/** 界面层级管理器 */
export class LayerManager {
    /** 界面根节点 */
    root!: Node;
    /** 界面摄像机 */
    camera!: Camera;
    /** 新手引导层 */
    guide!: Node;
    /** 界面地图 */
    uiMap!: UIMap;
    /**逻辑顶层 */
    logicTop!: LayerUI;
    /**UI的top层 */
    top!: LayerUI;

    /** 二维游戏层 */
    game!: LayerUI;
    /** 界面层 */
    private ui!: LayerUI;
    /** 弹窗层 */
    private popup!: LayerPopUp;
    /** 只能弹出一个的弹窗 */
    private dialog!: LayerDialog;
    /** 游戏系统提示弹窗  */
    private system!: LayerDialog;
    /** 消息提示控制器，请使用show方法来显示 */
    private notify!: LayerNotify;
    /** GM 界面层 */
    private gm!: LayerUI;

    /** UI配置 */
    private configs: { [key: number]: UIConfig } = {};
    /**从UIConfig映射到UIID */
    private config2UIIDMap = new Map<UIConfig, number>();

    /** 是否为竖屏显示 */
    get portrait() {
        return this.root.getComponent(GUI)!.portrait;
    }

    /**
     * 初始化所有UI的配置对象
     * @param configs 配置对象
     */
    init(configs: { [key: number]: UIConfig }): void {
        this.configs = configs;
        //从config映射到UIID
        for (let key in this.configs) {
            let config = this.configs[key];
            this.config2UIIDMap.set(config, Number(key))
        }
    }

    /**
     * 渐隐飘过提示
     * @param content 文本表示
     * @param useI18n 是否使用多语言
     * @example 
     * oops.gui.toast("提示内容");
     */
    toast(content: string, useI18n: boolean = false) {
        this.notify.toast(content, useI18n)
    }

    /** 打开等待提示 */
    waitOpen() {
        this.notify.waitOpen();
    }

    /** 关闭等待提示 */
    waitClose() {
        this.notify.waitClose();
    }

    /**
     * 设置界面配置
     * @param uiId   要设置的界面id
     * @param config 要设置的配置
     */
    setConfig(uiId: number, config: UIConfig): void {
        this.configs[uiId] = config;
    }

    /**根据uiConfig获得对应的UIID */
    getUIID(config:UIConfig):number{
        return this.config2UIIDMap.get(config) || -1;
    }

    /**
     * 设置界面地图配置
     * @param data 界面地图数据
     */
    setUIMap(data: any) {
        if (this.uiMap == null) {
            this.uiMap = new UIMap();
        }
        this.uiMap.init(this, data);
    }

    /**
     * 同步打开一个窗口
     * @param uiId          窗口唯一编号
     * @param uiArgs        窗口参数
     * @param callbacks     回调对象
     * @example
    var uic: UICallbacks = {
        onAdded: (node: Node, params: any) => {
            var comp = node.getComponent(LoadingViewComp) as ecs.Comp;
        }
        onRemoved:(node: Node | null, params: any) => {
                    
        }
    };
    oops.gui.open(UIID.Loading, null, uic);
     */
    open(uiId: number, uiArgs: any = null, callbacks?: UICallbacks, touchPos?:Vec3): void {
        var config = this.configs[uiId];
        if (config == null) {
            warn(`打开编号为【${uiId}】的界面失败，配置信息不存在`);
            return;
        }

        this.getLayerUI(config.layer).add(config, uiArgs, callbacks, touchPos);
    }

    /**
     * 异步打开一个窗口
     * @param uiId          窗口唯一编号
     * @param uiArgs        窗口参数
     * @example 
     * var node = await oops.gui.openAsync(UIID.Loading);
     */
    async openAsync(uiId: number, uiArgs: any = null): Promise<Node | null> {
        return new Promise<Node | null>((resolve, reject) => {
            var callbacks: UICallbacks = {
                onAdded: (node: Node, params: any) => {
                    resolve(node)
                }
            };
            this.open(uiId, uiArgs, callbacks);
        });
    }

    /**
     * 场景替换
     * @param removeUiId  移除场景编号
     * @param openUiId    新打开场景编号
     * @param uiArgs      新打开场景参数
     */
    replace(removeUiId: number, openUiId: number, uiArgs: any = null) {
        this.open(openUiId, uiArgs);
        this.remove(removeUiId);
    }

    /**
     * 异步场景替换
     * @param removeUiId  移除场景编号
     * @param openUiId    新打开场景编号
     * @param uiArgs      新打开场景参数
     */
    replaceAsync(removeUiId: number, openUiId: number, uiArgs: any = null): Promise<Node | null> {
        return new Promise<Node | null>(async (resolve, reject) => {
            var node = await this.openAsync(openUiId, uiArgs);
            this.remove(removeUiId);
            resolve(node);
        });
    }

    /**
     * 缓存中是否存在指定标识的窗口
     * @param uiId 窗口唯一标识
     * @example
     * oops.gui.has(UIID.Loading);
     */
    has(uiId: number): boolean {
        var config = this.configs[uiId];
        if (config == null) {
            warn(`编号为【${uiId}】的界面配置不存在，配置信息不存在`);
            return false;
        }

        var result = false;
        result = this.getLayerUI(config.layer).has(config.prefab);
        return result;
    }

    /**
     * 缓存中是否存在指定标识的窗口
     * @param uiId 窗口唯一标识
     * @example
     * oops.gui.has(UIID.Loading);
     */
    get(uiId: number): Node {
        var config = this.configs[uiId];
        if (config == null) {
            warn(`编号为【${uiId}】的界面配置不存在，配置信息不存在`);
            return null!;
        }

        var result: Node = null!;
        result = this.getLayerUI(config.layer).get(config.prefab);
        return result;
    }

    /**
     * 移除指定标识的窗口
     * @param uiId         窗口唯一标识
     * @param isDestroy    移除后是否释放
     * @example
     * oops.gui.remove(UIID.Loading);
     */
    remove(uiId: number, isDestroy?: boolean) {
        var config = this.configs[uiId];
        if (config == null) {
            warn(`删除编号为【${uiId}】的界面失败，配置信息不存在`);
            return;
        }
        if(config.layer == LayerType.GM){
            isDestroy = true;
        }
        this.getLayerUI(config.layer).remove(config.prefab, isDestroy);
    }

    /**
     * 删除一个通过this框架添加进来的节点
     * @param node          窗口节点
     * @param isDestroy     移除后是否释放资源
     * @example
     * oops.gui.removeByNode(cc.Node);
     */
    removeByNode(node: Node, isDestroy?: boolean) {
        if (node instanceof Node) {
            let comp = node.getComponent(DelegateComponent);
            if (comp && comp.vp) {
                // 释放显示的界面
                if (node.parent) {
                    (node.parent as LayerUI).remove(comp.vp.config.prefab, isDestroy);
                }
                // 释放缓存中的界面
                else if (isDestroy) {
                    // @ts-ignore 注：不对外使用
                    this.getLayerUI(comp.vp.config.layer).removeCache(comp.vp.config.prefab);
                }
            }
            else {
                warn(`当前删除的node不是通过界面管理器添加到舞台上`);
                node.destroy();
            }
        }
    }

    /**
     * 清除所有窗口
     * @param isDestroy 移除后是否释放
     * @example
     * oops.gui.clear();
     */
    clear(isDestroy: boolean = false) {
        this.ui.clear(isDestroy);
        this.popup.clear(isDestroy);
        this.dialog.clear(isDestroy);
        this.system.clear(isDestroy);
        this.gm.clear(isDestroy);
    }

    /**
     * 根据传入的 LayerType 枚举清除对应节点下的窗口
     * @param layer 对应的 LayerType 枚举
     * @param isDestroy 移除后是否释放
     */
    clearByLayerType(layer: LayerType, isDestroy: boolean = false) {
        this.getLayerUI(layer).clear(isDestroy);
    }

    /**根据LayerType 获得层级对象 */
    getLayerUI(layer: LayerType): LayerUI {
        switch (layer) {
            case LayerType.Game:
                return this.game;
            case LayerType.UI:
                return this.ui;
            case LayerType.PopUp:
                return this.popup;
            case LayerType.Dialog:
                return this.dialog;
            case LayerType.System:
                return this.system;
            case LayerType.LogicTop:
                return this.logicTop;
            case LayerType.Top:
                return this.top;
            case LayerType.GM:
                return this.gm;
            default:
                console.error(`未知的LayerType类型：${layer}`);
                return this.popup;
        }
    }

    getValidVPListByType(layer: LayerType): ViewParams[] {
        return this.getLayerUI(layer).curValidVPList;
    }

    /**
     * 构造函数
     * @param root  界面根节点
     */
    constructor(root: Node) {
        this.root = root;
        this.camera = this.root.getComponentInChildren(Camera)!;

        // this.game = this.create_node(`Layer${LayerType[LayerType.Game]}`);

        this.game = new LayerUI(`Layer${LayerType[LayerType.Game]}`);
        this.ui = new LayerUI(`Layer${LayerType[LayerType.UI]}`);
        this.popup = new LayerPopUp(`Layer${LayerType[LayerType.PopUp]}`);
        this.dialog = new LayerDialog(`Layer${LayerType[LayerType.Dialog]}`);
        this.system = new LayerDialog(`Layer${LayerType[LayerType.System]}`);
        this.notify = new LayerNotify(`Layer${LayerType[LayerType.Notify]}`);
        this.guide = this.create_node(`Layer${LayerType[LayerType.Guide]}`);
        this.logicTop = new LayerUI(`Layer${LayerType[LayerType.LogicTop]}`);
        this.top = new LayerUI(`Layer${LayerType[LayerType.Top]}`);
        this.gm = new LayerUI(`Layer${LayerType[LayerType.GM]}`);

        root.addChild(this.game);
        root.addChild(this.ui);
        root.addChild(this.popup);
        root.addChild(this.dialog);
        root.addChild(this.system);
        root.addChild(this.notify);
        root.addChild(this.logicTop);
        root.addChild(this.guide);
        root.addChild(this.top);
        root.addChild(this.gm);
    }

    private create_node(name: string) {
        var node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        var w: Widget = node.addComponent(Widget);
        w.isAlignLeft = w.isAlignRight = w.isAlignTop = w.isAlignBottom = true;
        w.left = w.right = w.top = w.bottom = 0;
        w.alignMode = 2;
        w.enabled = true;
        return node;
    }
}