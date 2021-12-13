const { join, extname, basename } = require('path');
const { getGlob } = require('./globs');
const helpers = require('./helpers');
const { parseDataFile } = require('../parsers/parser');

const configSort = function (fileArray) {
	const extensionOrder = ['.toml', '.yaml', '.json'];

	const sorted = fileArray.sort((a, b) => {
		const configRegex = /config\.(toml|yaml|json)$/i;
		if (a.match(configRegex)) return extensionOrder.length + 1; // always less important
		if (b.match(configRegex)) return -1 - extensionOrder.length;

		const aExt = extname(a);
		const bExt = extname(b);
		return extensionOrder.indexOf(aExt) - extensionOrder.indexOf(bExt);
	});

	return sorted;
};

module.exports = {
	// 'Private' functions
	_configSort: configSort,

	getConfigPaths: async function (flags = {}) {
		const sourceDir = flags.source || '';
		const environment = flags.environment || 'production'; // or just use root
		const configDir = flags.configDir || 'config';

		const configEnvDir = join(sourceDir, configDir, environment);
		const configDefaultDir = join(sourceDir, configDir, '_default/');

		let configFileList = [];
		if (await helpers.exists(configEnvDir)) {
			const files = await getGlob(`${configEnvDir}/**.**`);
			configFileList = configFileList.concat(configSort(files));
		}

		if (await helpers.exists(configDefaultDir)) {
			const files = await getGlob(`${configDefaultDir}/**.**`);
			configFileList = configFileList.concat(configSort(files));
		}

		let passedConfigFiles = flags.config || '';

		if (passedConfigFiles) {
			passedConfigFiles = passedConfigFiles.trim().split(',');
			configFileList = configFileList.concat(passedConfigFiles.reverse());
		} else if (await helpers.exists(join(sourceDir, 'config.toml'))) {
			configFileList.push(join(sourceDir, 'config.toml'));
		} else if (await helpers.exists(join(sourceDir, 'config.yaml'))) {
			configFileList.push(join(sourceDir, 'config.yaml'));
		} else if (await helpers.exists(join(sourceDir, 'config.json'))) {
			configFileList.push(join(sourceDir, 'config.json'));
		}

		return configFileList;
	},

	getConfigContents: async function (configFileList, passedConfigFiles = '') {
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
	},

	getHugoConfig: async function (flags = {}) {
		const configFileList = await this.getConfigPaths(flags);

		console.log('⚙️ using config files:');
		console.log(configFileList);

		const configContents = await this.getConfigContents(configFileList, flags.config);
		configContents.reverse(); // reversing because deep merge places priority on the second object

		const configObject = helpers.mergeDeep({}, ...configContents);

		configObject.baseURL = flags.baseUrl || configObject.baseURL || '/';
		if (flags.source) configObject.source = flags.source;
		if (flags.destination) configObject.destination = flags.destination;
		if (flags.configDir) configObject.configDir = flags.configDir;
		if (flags.contentDir) configObject.contentDir = flags.contentDir;
		if (flags.layoutDir) configObject.layoutDir = flags.layoutDir;

		return configObject;
	}
};
