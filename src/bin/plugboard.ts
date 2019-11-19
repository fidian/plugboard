#!/usr/bin/env node

const neodoc = require('neodoc');
import {
    configChanges,
    getConfigLocation,
    loadConfig,
    saveConfig,
    setConfigLocation
} from '../lib/config';
import { debug, info } from '../lib/log';
import fs from 'fs';

function usage() {
    return `Plugboard - TCP, HTTP, HTTPS proxy

Usage:
    plugboard [options]

Options:
    --help, -h, -?
            Shows this help message.
    --config=FILE, -c=FILE
            Loads a config file. If reconfigured, the new config will be
            written back to this file. File format is JSON. If the file does
            not exist, an empty configuration will be written to the file.
            Defaults to "config.json".
`;
}

function main() {
    const args = neodoc.run(usage(), {
        laxPlacement: true
    });
    let allowMissingFile = false;

    if (args['--config']) {
        setConfigLocation(args['config']);
    } else {
        allowMissingFile = true;
    }

    loadConfig(allowMissingFile).then(loaded => {
        if (loaded) {
            info(`Config file loaded: ${getConfigLocation()}`);
            watchConfig();
        } else {
            info(
                `Config file not found - future saves will write to file: ${getConfigLocation()}`
            );
        }
    });
}

let watcher: ReturnType<typeof fs['watch']> | null = null;
let isDuringConfigReload = false;

function watchConfig() {
    unwatchConfig();
    debug(`Watching config: ${getConfigLocation()}`);
    watcher = fs.watch(getConfigLocation(), () => {
        debug('Config file change detected');
        isDuringConfigReload = true;
        loadConfig();
        isDuringConfigReload = false;
        info(`Detected change and reloaded config: ${getConfigLocation()}`);
    });
}

function unwatchConfig() {
    if (watcher) {
        debug(`Unwatching config: ${getConfigLocation()}`);
        watcher.close();
        watcher = null;
    }
}

function configChanged() {
    if (!isDuringConfigReload) {
        debug('Config settings changed');
        unwatchConfig();
        saveConfig();
        watchConfig();
    }
}

configChanges.attach(configChanged);

main();
