/**
 * @author qiyuan
 * 时区数据
 */
abstract class TimeZoneData {
    /**当前时区 */
    public timeZone = 8;
    /**是否实行夏令时 */
    public hasDST = false;
    /**夏令时开始时间ms */
    public dstStartTS = 0;
    /**夏令时结束时间ms */
    public dstEndTS = 0;

    /**
     * 检测时间戳是否在夏令时时间范围内
     * @param ts
     * @returns
     */
    abstract checkDst(ts: number): boolean;
}

/**
 * @author qiyuan
 * 客户端时区数据
 */
export class ClientTimeZoneData extends TimeZoneData {
    /**
     * 检测时间戳是否在夏令时时间范围内
     * 客户端检测方法是拿ts时间所在的年的1月1日与ts进行时区差比较看是否存在差值
     * @param ts
     * @returns
     * */
    checkDst(ts: number): boolean {
        if (this.hasDST === false) return false;
        const _dt = new Date(ts);
        const _tempDt = new Date(_dt.getFullYear(), 0, 1);
        return _dt.getTimezoneOffset() !== _tempDt.getTimezoneOffset();
    }
}

/**
 * @author qiyuan
 * 服务器时区数据
 */
export class ServerTimeZoneData extends TimeZoneData {
    /**
     * 检测时间戳是否在夏令时时间范围内
     * 服务端检测方法是拿服务器的夏令时开启和结束的时间戳进行比较
     * @param ts
     * @returns
     * */
    checkDst(ts: number): boolean {
        if (this.hasDST === false) return false;
        if (this.dstStartTS <= ts && ts <= this.dstEndTS) {
            return true;
        }
        return false;
    }
}

/**
 * @author qiyuan
 * 时区差
 */
class TimeZoneDiff {
    /**时区差 服务器 减 客户端 */
    public timeZoneDiff = 0;
    /**时间戳差 毫秒 */
    public tsDiff = 0;
}

/**
 * @author qiyuan
 * 时区、夏令时、时间格式化处理
 * 注意：所有时间戳都是毫秒计算，需要初始化本地时间时区信息、服务器时区信息（如果存在夏令时还需要初始化当年夏令时起始时间）
 *      有个潜在的隐患，如果客户端一直开着，跨度到了第二年那么需要更新一下最新的服务器夏令时起始时间（当然出现概率不大）
 * @example
 * TimeZoneUtil.getInstance().log = true;
 * 初始化本地信息
 * TimeZoneUtil.getInstance().onLocalInit();
 * 初始化服务器信息(10秒后切换夏令时->冬令时) 1636275590000
 * TimeZoneUtil.getInstance().onServerInit(-8);
 * 如果服务器存在夏令时 更新夏令时起始时间（2021年美国洛杉矶夏令时起始时间）
 * TimeZoneUtil.getInstance().onUpdateServerCompareDST(1615658400000, 1636275600000);
 * ---------------------------------------------------------------------------------------------
 * console.log("本地时间转换 tf(2021-10-1 10:01:00)->ts:" + TimeZoneUtil.localTimeformat2Timestamp("2021-10-1 10:01:00"));
 * console.log("服务器时间转换 tf(2021-10-1 10:01:00)->ts:" + TimeZoneUtil.serverTimeformat2Timestamp("2021-10-1 10:01:00"));
 * console.log("本地时间转换 ts(2021-10-1 10:01:00)(1633053660000)->tf:" + TimeZoneUtil.localTimestamp2Timeformat(1633053660000));
 * console.log("服务器时间转换 ts(2021-10-1 10:01:00)(1633053660000)->tf:" + TimeZoneUtil.serverTimestamp2Timeformat(1633053660000));
 */
export class TimeZoneUtil {
    public getClassName(): string {
        return 'TimeZoneUtil';
    }

    /**本地时区数据 */
    private _localTimeZoneData?: ClientTimeZoneData;
    /**服务器时区数据 */
    private _serverTimeZoneData?: ServerTimeZoneData;
    /**时区差数据 */
    private _diffData: TimeZoneDiff = new TimeZoneDiff();
    /**是否初始化 */
    private _init = false;
    /**日志 */
    private _log = false;
    /**存储 00、01...09的字符串数组 */
    private static NumArray: string[];
    /**1分秒数 */
    private static MIN = 60;
    /**1小时秒数 */
    private static HOUR = 3600;
    /**1天秒数 */
    private static DAY = 86400;
    /**1秒的毫秒数 */
    private static MS_SEC = 1000;
    /**1小时的毫秒数 */
    private static MS_HOUR = TimeZoneUtil.HOUR * TimeZoneUtil.MS_SEC;

    private static _instance: TimeZoneUtil;
    public static get instance(): TimeZoneUtil {
        if (!this._instance) {
            this._instance = new TimeZoneUtil();
        }
        return this._instance;
    }

    /**获得当前差值，每次获取前都重新计算一下 */
    public get diffData(){
        this.onUpdateDiffData();
        return this._diffData;   
    }

    private static InitNumArr(): void {
        if (TimeZoneUtil.NumArray === undefined) {
            TimeZoneUtil.NumArray = new Array(10);
            for (let i = 0; i < 10; i++) {
                TimeZoneUtil.NumArray[i] = '0' + i;
            }
        }
    }

    /**
     * 日志开关
     */
    set log(value: boolean) {
        if (this._log !== value) {
            this._log = value;
        }
    }

    /**
     * 初始化本地时区信息
     * @param force 强制刷新
     */
    public initLocalZoneData(force = false): void {
        TimeZoneUtil.InitNumArr();
        if (this._localTimeZoneData === undefined || force) {
            const _date: Date = new Date();
            const _timeZone = -_date.getTimezoneOffset() / 60;
            this._localTimeZoneData = new ClientTimeZoneData();
            this._localTimeZoneData.timeZone = _timeZone;
            // 本地夏令时检查
            // 随便找一年比较1月1号和7月1号的时间
            const _start = new Date(2021, 0, 1);
            const _end = new Date(2021, 6, 1);
            this._localTimeZoneData.hasDST = _start.getTimezoneOffset() !== _end.getTimezoneOffset();
            this.onUpdateDiffData();
        }
    }

    /**
     * 重新计算服务器时区与本地的时区差
     * 当服务端切了令时 or 客户端切了令时 都要调用
     */
    public onUpdateDiffData(): void {
        const currentDate = new Date();
        if(this._localTimeZoneData){
            let _timeZone = -currentDate.getTimezoneOffset() / 60;
            if(this._localTimeZoneData.checkDst(currentDate.getTime())){
                _timeZone -= 1;
            }
            this._localTimeZoneData.timeZone = _timeZone
        }
        if (this._serverTimeZoneData !== undefined && this._localTimeZoneData !== undefined) {
            // 获取格林尼治时间
            if (this._log) {
                console.log('时间戳：' + currentDate.getTime());
                console.log('本地时间与格林尼治时间差(分): ' + currentDate.getTimezoneOffset());
                console.log('服务器夏令时:' + this._serverTimeZoneData.hasDST);
            }
            this._diffData.timeZoneDiff = this._serverTimeZoneData.timeZone - this._localTimeZoneData.timeZone;
            this._diffData.tsDiff = this._diffData.timeZoneDiff * TimeZoneUtil.MS_HOUR;
        }
    }


    /**
     * 获取客户端本地时区时间
     * @returns ClientTimeZoneData | undefined
     */
    public getLocalTimeZoneData(): ClientTimeZoneData | undefined {
        return this._localTimeZoneData;
    }

    /**
     * 获取服务端本地时区时间
     * @returns ServerTimeZoneData | undefined
     */
    public getServerTimeZoneData(): ServerTimeZoneData | undefined {
        return this._serverTimeZoneData;
    }

    /**
     * 初始化服务器时区信息
     * 服务器传递时候希望没有客户端的问题，比如太平洋是-8（不管是否为夏令时）
     * @param timeZone 时区 东为正（东八区+8） 西为负（西八区-8）
     * @param force 强制刷新
     */
    public onServerInit(timeZone: number, force = false): void {
        if (this._serverTimeZoneData === undefined || force) {
            this._serverTimeZoneData = new ServerTimeZoneData();
        }
        this._serverTimeZoneData.timeZone = timeZone;
        this.onUpdateDiffData();
    }

    /**
     * 更新服务器夏令时的比较时间
     * @param startTS 夏令时开始时间戳
     * @param endTS 夏令时结束时间戳
     */
    public onUpdateServerCompareDST(startTS: number, endTS: number): void {
        if (this._serverTimeZoneData !== undefined) {
            this._serverTimeZoneData.hasDST = true;
            this._serverTimeZoneData.dstStartTS = startTS;
            this._serverTimeZoneData.dstEndTS = endTS;
        }
    }

    /**
     * tf 转换成date
     * @param timeformat
     */
    public static Timeformat2Date(timeformat: string): Date | undefined {
        const a = timeformat.split(' ');
        if (a.length !== 2) return undefined;
        const b = a[0].split('-');
        if (b.length !== 3) return undefined;
        const c = a[1].split(':');
        if (c.length !== 3) return undefined;
        const dt = new Date();
        dt.setFullYear(Number(b[0]));
        dt.setMonth(Number(b[1]) - 1, Number(b[2]));
        // dt.setDate(Number(b[2]));

        dt.setHours(Number(c[0]));
        dt.setMinutes(Number(c[1]));
        dt.setSeconds(Number(c[2]));
        return dt;
    }

    /**
     * 本地时间戳 -> Date
     * @param timestamp
     */
    public static LocalTimestamp2Date(timestamp: number): Date | undefined {
        return this.Timeformat2Date(this.LocalTimestamp2Timeformat(timestamp));
    }

    /**
     * 服务器时间戳 -> Date
     * @param timestamp
     */
    public static ServerTimestamp2Date(timestamp: number): Date | undefined {
        return this.Timeformat2Date(this.ServerTimestamp2Timeformat(timestamp));
    }

    /**
     * 本地时间转换  YYYY-MM-DD hh:mm:ss -> 时间戳
     * @param timeformat 格式化时间 YYYY-MM-DD hh:mm:ss
     */
    public static LocalTimeformat2Timestamp(timeformat: string | undefined): number {
        if (timeformat === undefined) return 0;
        const dt = TimeZoneUtil.Timeformat2Date(timeformat);
        if (dt === undefined) return 0;
        let ts = dt.getTime();
        const serverIsDST = TimeZoneUtil.instance._serverTimeZoneData?.checkDst(ts);
        const clientIsDST = TimeZoneUtil.instance._localTimeZoneData?.checkDst(ts);
        // 夏令时处理
        if (clientIsDST && !serverIsDST) {
            ts += TimeZoneUtil.MS_HOUR;
        } else if (!clientIsDST && serverIsDST) {
            ts -= TimeZoneUtil.MS_HOUR;
        }
        return ts;
    }

    /**
     * 服务器时间转换  YYYY-MM-DD hh:mm:ss -> 时间戳
     * @param timeformat 格式化时间 YYYY-MM-DD hh:mm:ss
     */
    public static ServerTimeformat2Timestamp(timeformat: string): number {
        let ts = TimeZoneUtil.LocalTimeformat2Timestamp(timeformat);
        ts -= TimeZoneUtil.instance.diffData.tsDiff;
        return ts;
    }

    /**
     * 时间戳差值
     * @param ts
     */
    private static Timestamp2Timestamp(ts: number, toServer = false): number {
        //客户端是否在夏令时
        const clientIsDST = TimeZoneUtil.instance._localTimeZoneData?.checkDst(ts);
        const serverIsDST = TimeZoneUtil.instance._serverTimeZoneData?.checkDst(ts);
        let _ts = ts;
        if (toServer) {
            _ts += TimeZoneUtil.instance.diffData.tsDiff;
        }
        if (clientIsDST && !serverIsDST) {
            _ts -= TimeZoneUtil.MS_HOUR;
        } else if (!clientIsDST && serverIsDST) {
            _ts += TimeZoneUtil.MS_HOUR;
        }

        return _ts;
    }

    /**
     * 本地时间转换 时间戳 -> timeformat
     * @param ts 时间戳
     * @param format 格式化
     * @returns
     */
    public static LocalTimestamp2Timeformat(ts: number, format?: string | undefined): string {
        const _ts = TimeZoneUtil.Timestamp2Timestamp(ts);
        return TimeZoneUtil.TsTimeFormat2String(_ts, format);
    }

    /**
     * 服务器时间转换 时间戳 -> timeformat
     * @param ts 单位ms
     * @param format 格式化
     * @returns
     */
    public static ServerTimestamp2Timeformat(ts: number, format?: string | undefined): string {
        const _ts = TimeZoneUtil.Timestamp2Timestamp(ts, true);
        return TimeZoneUtil.TsTimeFormat2String(_ts, format);
    }

    /**
     * 时间格式化
     * 时间戳转格式化
     * @param ts 时间戳
     * @param format 格式化
     */
    private static TsTimeFormat2String(ts: number, format?: string | undefined): string {
        const dt = new Date(ts);
        return this.TimeFormat2String(dt, format);
    }

    /**
     * 时间格式化
     * date转格式化
     * @param date
     * @param format YY：年 MM：月 DD：日 hh：时 mm：分 ss：秒
     * @returns YY-MM-DD hh:mm:ss或者format（如有）
     */
    public static TimeFormat2String(date: Date, format: string | undefined): string {
        if (format === undefined) {
            format = 'YY-MM-DD hh:mm:ss';
        }
        const year = date.getFullYear(),
            month = date.getMonth() + 1, //月份是从0开始的
            day = date.getDate(),
            hour = date.getHours(),
            min = date.getMinutes(),
            sec = date.getSeconds();

        TimeZoneUtil.InitNumArr();
        let newTime = format;
        if (newTime.indexOf('YY') !== -1) {
            newTime = newTime.replace(/YY/g, year.toString());
        }
        if (newTime.indexOf('MM') !== -1) {
            newTime = newTime.replace(/MM/g, TimeZoneUtil.NumArray[month] || month.toString());
        }
        if (newTime.indexOf('DD') !== -1) {
            newTime = newTime.replace(/DD/g, TimeZoneUtil.NumArray[day] || day.toString());
        }
        if (newTime.indexOf('hh') !== -1) {
            newTime = newTime.replace(/hh/g, TimeZoneUtil.NumArray[hour] || hour.toString());
        }
        if (newTime.indexOf('mm') !== -1) {
            newTime = newTime.replace(/mm/g, TimeZoneUtil.NumArray[min] || min.toString());
        }
        if (newTime.indexOf('ss') !== -1) {
            newTime = newTime.replace(/ss/g, TimeZoneUtil.NumArray[sec] || sec.toString());
        }

        return newTime;
    }

    /**
     * 计算2个timeformat时间差 获取绝对时间戳（毫秒）
     * tf1 tf2不分先后
     * @param tf1
     * @param tf2
     * @returns
     * 返回绝对时间戳差 ms
     */
    public static CalcTimeFormatTS(tf1: string, tf2: string): number {
        const dt1 = TimeZoneUtil.Timeformat2Date(tf1);
        const dt2 = TimeZoneUtil.Timeformat2Date(tf2);
        if (dt1 === undefined || dt2 === undefined) return 0;
        return Math.abs(dt1.getTime() - dt2.getTime());
    }

    /**
     * 计算2个timeformat时间差 并格式化
     * tf1 tf2不分先后
     * @param tf1
     * @param tf2
     * @param timeformat 格式 DD：日 hh：时 mm：分 ss：秒 不填就不需要，自动下移
     * @returns DD hh:mm:ss
     * @example
     * console.log(TimeZoneUtil.CalcTimeFormatTS2TimeFormat("2021-10-01 12:00:01", "2021-10-03 12:00:00")); // 01 23:59:59
     * console.log(TimeZoneUtil.CalcTimeFormatTS2TimeFormat("2021-10-01 12:00:01", "2021-10-03 12:00:00", "hh|mm|ss")); // 47|59|59
     * console.log(TimeZoneUtil.CalcTimeFormatTS2TimeFormat("2021-10-01 12:00:01", "2021-10-03 12:00:00", "hh时mm分ss秒")); // 47时59分59秒
     * console.log(TimeZoneUtil.CalcTimeFormatTS2TimeFormat("2021-10-01 12:00:01", "2021-10-03 12:00:00", "hh哦ss啊")); // 47哦3599啊
     */
    public static CalcTimeFormatTS2TimeFormat(tf1: string, tf2: string, timeformat?: string): string {
        TimeZoneUtil.InitNumArr();
        if (timeformat === undefined) {
            timeformat = 'DD hh:mm:ss';
        }
        let ts = TimeZoneUtil.CalcTimeFormatTS(tf1, tf2) / TimeZoneUtil.MS_SEC;
        let day = 0,
            hour = 0,
            min = 0,
            sec = 0;
        // 日
        if (timeformat.indexOf('DD') !== -1) {
            day = ts / TimeZoneUtil.DAY;
            day = day | 0;
            if (day > 0) {
                ts -= day * TimeZoneUtil.DAY;
            }
        }
        // 时
        if (timeformat.indexOf('hh') !== -1) {
            hour = ts / TimeZoneUtil.HOUR;
            hour = hour | 0;
            if (hour > 0) {
                ts -= hour * TimeZoneUtil.HOUR;
            }
        }
        // 分
        if (timeformat.indexOf('mm') !== -1) {
            min = ts / TimeZoneUtil.MIN;
            min = min | 0;
            if (min > 0) {
                ts -= min * TimeZoneUtil.MIN;
            }
        }
        sec = ts | 0;

        let newTime = timeformat;
        if (newTime.indexOf('DD') !== -1) {
            newTime = newTime.replace(/DD/g, TimeZoneUtil.NumArray[day] || day.toString());
        }
        if (newTime.indexOf('hh') !== -1) {
            newTime = newTime.replace(/hh/g, TimeZoneUtil.NumArray[hour] || hour.toString());
        }
        if (newTime.indexOf('mm') !== -1) {
            newTime = newTime.replace(/mm/g, TimeZoneUtil.NumArray[min] || min.toString());
        }
        if (newTime.indexOf('ss') !== -1) {
            newTime = newTime.replace(/ss/g, TimeZoneUtil.NumArray[sec] || sec.toString());
        }

        return newTime;
    }

    public static isLeapYear(dt: Date): boolean {
        let year = dt.getFullYear();
        if ((year & 3) !== 0) return false;
        return year % 100 !== 0 || year % 400 === 0;
    }

    public static getDayOfYear(dt: Date): number {
        let dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let mn = dt.getMonth();
        let dn = dt.getDate();
        let dayOfYear = dayCount[mn] + dn;
        if (mn > 1 && this.isLeapYear(dt)) dayOfYear++;
        return dayOfYear;
    }

    public static getWeekofYear(dt: Date): number {
        let d = new Date(+dt);
        d.setHours(0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        let weekDate = new Date(d.getFullYear(), 0, 1);
        return Math.ceil(((d.valueOf() - weekDate.valueOf()) / 8.64e7 + 1) / 7);
    }
}
