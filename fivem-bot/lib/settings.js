const fs = require('fs');
const path = require('path');
const baseConfig = require('../config.json');

const settingsPath = path.join(__dirname, '..', 'settings.json');

const readSettingsFile = () => {
    try {
        if (!fs.existsSync(settingsPath)) return {};
        const raw = fs.readFileSync(settingsPath, 'utf8');
        return raw.trim() ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeSettingsFile = (obj) => {
    fs.writeFileSync(settingsPath, JSON.stringify(obj, null, 2));
};

const get = (key) => {
    if (process.env[key] && String(process.env[key]).trim()) return String(process.env[key]).trim();
    const runtime = readSettingsFile();
    if (runtime[key] != null && String(runtime[key]).trim()) return String(runtime[key]).trim();
    if (baseConfig[key] != null && String(baseConfig[key]).trim()) return String(baseConfig[key]).trim();
    return undefined;
};

const set = (key, value) => {
    const runtime = readSettingsFile();
    runtime[key] = value;
    writeSettingsFile(runtime);
    return runtime;
};

const all = () => {
    return { ...baseConfig, ...readSettingsFile() };
};

module.exports = {
    settingsPath,
    get,
    set,
    all,
};
