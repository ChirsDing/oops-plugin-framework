/*
 * @Author: dgflash
 * @Date: 2021-07-03 16:13:17
 * @LastEditors: dgflash
 * @LastEditTime: 2023-08-22 16:34:28
 */
import { CLabel } from "@game/ccomp/CLabel";
import { Asset, director, error } from "cc";
import { EDITOR } from "cc/env";
import { Logger } from "../../../core/common/log/Logger";
import { oops } from "../../../core/Oops";
import { JsonUtil } from "../../../core/utils/JsonUtil";
import { LanguageData } from "./LanguageData";
import { LanguageLabel } from "./LanguageLabel";
import { LanguageSpine } from "./LanguageSpine";
import { LanguageSprite } from "./LanguageSprite";

export class LanguagePack {
    /** JSON资源目录 */
    json: string = "language/json";
    /** font资源目录 */
    font: string = "language/font";
    /** 纹理资源目录 */
    texture: string = "language/texture";
    /** SPINE资源目录 */
    spine: string = "language/spine";

    /**
     * 刷新语言文字
     * @param lang 
     */
    updateLanguage(lang: string) {
        let rootNodes = director.getScene()!.children;
        for (let i = 0; i < rootNodes.length; ++i) {
            // 更新所有的CLabel节点
            let clabels = rootNodes[i].getComponentsInChildren(CLabel);
            for (let j = 0; j < clabels.length; j++) {
                clabels[j].updateLabel();
            }

            // 更新所有的LanguageLabel节点
            let labels = rootNodes[i].getComponentsInChildren(LanguageLabel);
            for (let j = 0; j < labels.length; j++) {
                labels[j].language();
            }

            // 更新所有的LanguageSprite节点
            let sprites = rootNodes[i].getComponentsInChildren(LanguageSprite);
            for (let j = 0; j < sprites.length; j++) {
                sprites[j].language();
            }

            // 更新所有的LanguageSpine节点
            let spines = rootNodes[i].getComponentsInChildren(LanguageSpine);
            for (let j = 0; j < spines.length; j++) {
                spines[j].language();
            }
        }
    }

    /**
     * 下载对应语言包资源
     * @param lang 语言标识
     * @param callback 下载完成回调
     */
    async loadLanguageAssets(lang: string, callback: Function) {
        await this.loadLanguageBaseAssets(lang);
        // await this.loadTexture(lang);
        // await this.loadSpine(lang);
        // await this.loadTable(lang);

        callback(lang);
    }

    /** 多语言Excel配置表数据 */
    private loadTable(lang: string) {
        return new Promise(async (resolve, reject) => {
            LanguageData.excel = await JsonUtil.loadAsync("Language");
            if (LanguageData.excel) {
                Logger.logConfig("config/game/Language", "下载语言包 table 资源");
            }
            resolve(null);
        });
    }

    /** 纹理多语言资源 */
    private loadTexture(lang: string) {
        return new Promise((resolve, reject) => {
            let path = `${this.texture}/${lang}`;
            oops.res.loadDir(path, (err: any, assets: any) => {
                if (err) {
                    error(err);
                    resolve(null);
                    return;
                }
                Logger.logConfig(path, "下载语言包 textures 资源");
                resolve(null);
            })
        });
    }

    /** Json格式多语言资源 */
    private loadLanguageBaseAssets(lang: string) {
        return new Promise((resolve, reject) => {
            let path = `${this.json}/${lang}`;
            
            if (EDITOR) {
                const fs = require('fs');
                const file = `${Editor.Project.path}/assets/bundle/${path}.json`;
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    LanguageData.json = JSON.parse(content);
                    // console.log(`编辑器下多语言内容读取: ${path}.json`);
                    resolve(null);
                } else {
                    console.warn(`[LanguagePack] file not found: `, file);
                    resolve(null);
                }
                return;
            } else {
                oops.res.load(
                    'bundle', 
                    [
                        path,
                        `${this.font}/${lang}`
                    ], 
                    Asset, 
                    (err: Error | null, asste: Asset) => {
                        if (err) {
                            error(err);
                            resolve(null);
                            return;
                        }
                        //@ts-ignore
                        LanguageData.json = asste[0].json;
                        resolve(null);
                    })
            }

        });
    }

    /** SPINE动画多语言资源 */
    private loadSpine(lang: string) {
        return new Promise((resolve, reject) => {
            let path = `${this.spine}/${lang}`;
            oops.res.loadDir(path, (err: any, assets: any) => {
                if (err) {
                    error(err);
                    resolve(null);
                    return;
                }
                Logger.logConfig(path, "下载语言包 spine 资源");
                resolve(null);
            })
        });
    }

    /**
     * 释放某个语言的语言包资源包括json
     * @param lang 
     */
    releaseLanguageAssets(lang: string) {
        let langTexture = `${this.texture}/${lang}`;
        oops.res.releaseDir(langTexture);
        Logger.logView(langTexture, "释放语言 texture 资源");

        let langJson = `${this.json}/${lang}`;
        oops.res.release(langJson);
        Logger.logView(langJson, "释放语言文字资源");

        let langSpine = `${this.spine}/${lang}`;
        oops.res.release(langSpine);
        Logger.logView(langSpine, "释放语言 spine 资源");
    }
}