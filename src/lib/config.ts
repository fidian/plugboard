import { SyncEvent } from 'ts-events';
import fs from 'fs';

export interface ConfigSettings {
    logger: {
        debugEnabled: boolean;
        errorEnabled: boolean;
        infoEnabled: boolean;
        warnEnabled: boolean;
    };
    ui: {
        port: number;
    };
}

const defaultConfigSettings: ConfigSettings = {
    logger: {
        debugEnabled: process.env['DEBUG'] ? true : false,
        errorEnabled: true,
        infoEnabled: true,
        warnEnabled: true
    },
    ui: {
        port: 8765
    }
};

function cloneDefault() {
    return JSON.parse(JSON.stringify(defaultConfigSettings));
}

let configSettings = cloneDefault();
let overrides: any = {};
let configLocation = 'config.json';

export const configChanges = new SyncEvent<void>();

export function setConfigLocation(location: string) {
    configLocation = location;
}

type anyObject = {
    [key: string]: any;
};

function mergeConfig(dest: anyObject, override: anyObject) {
    if (typeof override !== 'object' || !override) {
        return;
    }

    for (const [key, value] of Object.entries(dest)) {
        if (key in override && typeof value === typeof override.value) {
            if (typeof override.value === 'object') {
                mergeConfig(dest[key], override[key]);
            } else {
                dest[key] = override[key];
            }
        }
    }
}

export function loadConfig(allowFileNotFound?: boolean): Promise<boolean> {
    return new Promise<Buffer>((resolve, reject) => {
        fs.readFile(configLocation, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
        .then((data: Buffer) => {
            return JSON.parse(data.toString()) as any;
        })
        .then(
            newOverrides => {
                configSettings = cloneDefault();
                overrides = newOverrides;
                mergeConfig(configSettings, overrides);
                configChanges.post();

                return true;
            },
            err => {
                if (err.code === 'ENOENT' && allowFileNotFound) {
                    configChanges.post();
                    return false;
                }

                throw err;
            }
        );
}

export function getConfig(): ConfigSettings {
    return configSettings;
}

export function getConfigLocation(): string {
    return configLocation;
}

export function saveConfig(): Promise<void> {
    return new Promise((resolve, reject) => {
        return fs.writeFile(
            configLocation,
            JSON.stringify(overrides, null, 4),
            err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}
