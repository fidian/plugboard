import { configChanges, getConfig } from './config';

let debugEnabled: boolean;
let infoEnabled: boolean;
let errorEnabled: boolean;
let warnEnabled: boolean;

function reloadConfig() {
    const loggerConfig = getConfig().logger;
    debugEnabled = loggerConfig.debugEnabled;
    errorEnabled = loggerConfig.errorEnabled;
    infoEnabled = loggerConfig.infoEnabled;
    warnEnabled = loggerConfig.warnEnabled;
}

configChanges.attach(reloadConfig);

export function debug(message: string): void {
    if (debugEnabled) {
        console.debug(message);
    }
}

export function error(message: string): void {
    if (errorEnabled) {
        console.error(message);
    }
}

export function info(message: string): void {
    if (infoEnabled) {
        console.log(message);
    }
}

export function warn(message: string): void {
    if (warnEnabled) {
        console.warn(message);
    }
}
