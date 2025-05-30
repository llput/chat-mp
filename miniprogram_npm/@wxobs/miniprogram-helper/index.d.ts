declare enum PxStatus {
    NotSetup = "NotSetup",
    SettingUp = "SettingUp",
    WaitingForFirstReport = "WaitingForFirstReport",
    Collecting = "Collecting",
    TearingDown = "TearingDown"
}
interface ISetupRet {
    sessionId?: string;
    errMsg?: string;
}
interface IGetFeatureFlagsOptions {
    flags: string[];
    latest?: boolean;
}
interface IFeatureFlagInfo {
    key: string;
    type: number;
    value: any;
}
export interface IObsParam {
    maskMode?: 'all-mask' | 'no-mask';
    isWhitelistMaskMode?: boolean;
    captureDataAttrs?: boolean;
    shouldCapturePage?: (page: string, query: Record<string, string>) => boolean;
    errorCallback?: (param: {
        type: number;
        errMsg: string;
        extra?: string;
    }) => void;
    newSessionCallback?: (param: {
        sessionId: string;
    }) => void;
    autoSplitSession?: boolean;
    onReport?: (param: {
        timestamp: number;
        from: 'appservice' | 'webview';
    }) => void;
    canvas?: boolean;
    canvasCollectInterval?: number;
}
export declare function setup(param: IObsParam | undefined): Promise<ISetupRet>;
export declare function teardown(): Promise<void>;
export declare function setAttrs(attrs: Record<string, string>): Promise<void>;
export declare function event(eventName: string, eventProperties?: Record<string, string | number>): boolean;
export declare function setCustomId(uid: string): boolean;
export declare function setCustomProperties(props: Record<string, string | number>): boolean;
export declare function getStatus(): PxStatus;
export declare function getFeatureFlags(options: IGetFeatureFlagsOptions): Promise<Record<string, IFeatureFlagInfo>>;
export declare function getFeatureFlagsSync(): Record<string, IFeatureFlagInfo>;
export {};
