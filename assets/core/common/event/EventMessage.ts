/*
 * @Author: dgflash
 * @Date: 2021-07-03 16:13:17
 * @LastEditors: dgflash
 * @LastEditTime: 2022-09-02 11:03:08
 */

/**
 * 全局事件监听方法
 * @param event      事件名
 * @param args       事件参数
 */
export type ListenerFunc = (event: string, ...args: any) => void

/** 框架内部全局事件  */
export enum EventMessage {
    /** 游戏从后台进入事件 */
    GAME_SHOW = "GAME_ENTER",
    /** 游戏切到后台事件 */
    GAME_HIDE = "GAME_EXIT",
    /** 游戏画笔尺寸变化事件 */
    GAME_RESIZE = "GAME_RESIZE",
    /** 游戏全屏事件 */
    GAME_FULL_SCREEN = "GAME_FULL_SCREEN",
    /** 游戏旋转屏幕事件 */
    GAME_ORIENTATION = "GAME_ORIENTATION",
    /** GUI尺寸发生变化 */
    GUI_RESIZE = "GUI_RESIZE",

    /** 游戏服务器socket连接成功 */
    GameServerConnected = "GameServerConnected",
    /** 登陆成功 */
    LoginSuccess = "LoginSuccess",
    /** 重连失败 */
    ReconnectFail = "ReconnectFail",
    /** 弱网状态变更 */
    NetLoadingStateChange = "NetLoadingStateChange",
    /**lateUpdate */
    TIME_TICK_LATEUPDATE = "TIME_TICK_LATEUPDATE",
    /**ui控制器显示 */
    UI_CONTROLLER_SHOW = "UI_CONTROLLER_SHOW",
    /**ui控制器隐藏 */
    UI_CONTROLLER_HIDE = "UI_CONTROLLER_HIDE",
    /**ui控制器销毁 */
    UI_CONTROLLER_DESTROY = "UI_CONTROLLER_DESTROY",
    /**ui控制器假隐藏 */
    UI_CONTROLLER_OPENTEMPHIDE = "UI_CONTROLLER_OPENTEMPHIDE",
    /**ui控制器取消假隐藏 */
    UI_CONTROLLER_CANCELTEMPHIDE = "UI_CONTROLLER_CANCELTEMPHIDE",
}
