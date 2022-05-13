import { join, extname, basename } from 'path';
import chalk from 'chalk';
import { getGlob } from './globs.js';
import { exists, mergeDeep } from './helpers.js';
import { parseDataFile } from '../parsers/parser.js';
import log from './logger.js';

const EXTENSION_ORDER = [
	'.toml',
	'.yaml',
	'.json'
];

export function configSort(fileArray) {
	return fileArray.sort((a, b) => {
		const configRegex = /config\.(toml|yaml|json)$/i;

		if (a.match(configRegex)) {
			return EXTENSION_ORDER.length + 1; // always less important
		}
		if (b.match(configRegex)) {
			return -1 - EXTENSION_ORDER.length;
		}

		return EXTENSION_ORDER.indexOf(extname(a)) - EXTENSION_ORDER.indexOf(extname(b));
	});
}

export async function getConfigPaths(flags = {}) {
	const sourceDir = flags.source || '';
	const environment = flags.environment || 'production'; // or just use root

	const configDir = flags.configDir || 'config';
	const configDirEnvironment = join(sourceDir, configDir, environment);
	const configDirDefault = join(sourceDir, configDir, '_default/');

	let configFileList = [];
	if (await exists(configDirEnvironment)) {
		const files = await getGlob(`${configDirEnvironment}/**.**`);
		configFileList = configFileList.concat(configSort(files));
	}

	if (await exists(configDirDefault)) {
		const files = await getGlob(join(configDirDefault, '**.**'));
		configFileList = configFileList.concat(configSort(files));
	}

	let passedConfigFiles = flags.config || '';

	if (passedConfigFiles) {
		passedConfigFiles = passedConfigFiles.trim().split(',');
		configFileList = configFileList.concat(passedConfigFiles.reverse());
	} else if (await exists(join(sourceDir, 'config.toml'))) {
		configFileList.push(join(sourceDir, 'config.toml'));
	} else if (await exists(join(sourceDir, 'config.yaml'))) {
		configFileList.push(join(sourceDir, 'config.yaml'));
	} else if (await exists(join(sourceDir, 'config.json'))) {
		configFileList.push(join(sourceDir, 'config.json'));
	}

	return configFileList;
}

export async function getConfigContents(configFileList, passedConfigFiles = '') {
	const contentList = await Promise.all(configFileList.map(async (configPath) => {
		configPath = configPath.replace('//', '/');

		const parsedData = await parseDataFile(configPath);
		if (!parsedData) {
			return;
		}

		const filename = basename(configPath, extname(configPath));
		if (filename !== 'config' && passedConfigFiles.indexOf(configPath) < 0) {
			return { [filename]: parsedData };
		}

		return parsedData;
	}));

	return contentList.filter((item) => item); // remove empties
}

export async function generateConfigObject(flags = {}, options) {
	const configFileList = await getConfigPaths(flags);

	if (!options?.silent) {
		configFileList.forEach((configFilePath) => {
			log(`🔧 Reading Hugo config file at ${chalk.bold(configFilePath)}`);
		});

		if (configFileList.length === 0) {
			log(chalk.yellow('🔧 No Hugo config file found'));
		}
	}

	const configContents = await getConfigContents(configFileList, flags.config);
	configContents.reverse(); // reversing because deep merge places priority on the second object

	const configObject = mergeDeep({}, ...configContents);

	if (configObject.staticDir) {
		configObject.staticDir = Array.isArray(configObject.staticDir)
			? configObject.staticDir[0]
			: configObject.staticDir;
	}

	return configObject;
}

export async function getHugoConfig(flags = {}) {
	const configObject = await generateConfigObject(flags);
	configObject.baseURL = flags.baseUrl || configObject.baseURL || '/';

	if (flags.source) {
		configObject.source = flags.source;
	}

	if (flags.destination) {
		configObject.destination = flags.destination;
	}

	if (flags.configDir) {
		configObject.configDir = flags.configDir;
	}

	if (flags.contentDir) {
		configObject.contentDir = flags.contentDir;
	}

	if (flags.layoutDir) {
		configObject.layoutDir = flags.layoutDir;
	}

	return configObject;
}
