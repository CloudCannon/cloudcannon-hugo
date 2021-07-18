const { join, extname, basename } = require('path');
const { getGlob } = require('./globs');
const helpers = require('./helpers');

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

	getConfigPaths: async function (buildArguments = {}) {
		const sourceDir = buildArguments.source || '';
		const environment = buildArguments.environment || 'production'; // or just use root
		const configDir = buildArguments.configDir || 'config';

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

		if (await helpers.exists(join(sourceDir, 'config.toml'))) {
			configFileList.push(join(sourceDir, 'config.toml'));
		} else if (await helpers.exists(join(sourceDir, 'config.yaml'))) {
			configFileList.push(join(sourceDir, 'config.yaml'));
		} else if (await helpers.exists(join(sourceDir, 'config.json'))) {
			configFileList.push(join(sourceDir, 'config.json'));
		}

		let passedConfigFiles = buildArguments.config || '';

		if (passedConfigFiles) {
			passedConfigFiles = passedConfigFiles.trim().split(',');
			configFileList = configFileList.concat(passedConfigFiles.reverse());
		}

		return configFileList;
	},

	getConfigContents: async function (configFileList, passedConfigFiles = '') {
		const contentList = await Promise.all(configFileList.map(async (configPath) => {
			configPath = configPath.replace('//', '/');

			const parsedData = await helpers.parseDataFile(configPath);
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

	getHugoConfig: async function (args) {
		const buildArguments = helpers.processArgs(args);
		const configFileList = await this.getConfigPaths(buildArguments);

		console.log('using config files:');
		console.log(configFileList);

		const configContents = await this.getConfigContents(configFileList, buildArguments.config);
		configContents.reverse(); // reversing because deep merge places priority on the second object

		const configObject = helpers.mergeDeep({}, ...configContents);

		configObject.baseURL = buildArguments.baseURL || configObject.baseURL || '/';

		return configObject;
	}
};
