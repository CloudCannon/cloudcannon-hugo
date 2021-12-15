const { join, extname, basename } = require('path');
const chalk = require('chalk');
const { getGlob } = require('./globs');
const { exists, mergeDeep, pluralize } = require('./helpers');
const { parseDataFile } = require('../parsers/parser');
const { log } = require('./logger');

const EXTENSION_ORDER = [
	'.toml',
	'.yaml',
	'.json'
];

function configSort(fileArray) {
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

async function getConfigPaths(flags = {}) {
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
		const files = await getGlob(`${configDirDefault}/**.**`);
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

async function getConfigContents(configFileList, passedConfigFiles = '') {
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

async function getHugoConfig(flags = {}) {
	const configFileList = await getConfigPaths(flags);

	log(`🔧 Found ${pluralize(configFileList.length, 'Hugo config file', { nonZeroSuffix: ':' })}`);
	configFileList.forEach((configFilePath) => log(`   ${chalk.bold(configFilePath)}`));

	const configContents = await getConfigContents(configFileList, flags.config);
	configContents.reverse(); // reversing because deep merge places priority on the second object

	const configObject = mergeDeep({}, ...configContents);

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

module.exports = {
	configSort,
	getConfigPaths,
	getConfigContents,
	getHugoConfig
};
