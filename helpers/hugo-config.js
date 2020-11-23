const Path = require('path');
const { promises: fsProm } = require('fs');
const globHelper = require('./globs');
const helpers = require('./helpers');

const fileTypeByExtension = {
	'.yml': 'yaml',
	'.yaml': 'yaml',
	'.toml': 'toml',
	'.json': 'json'
};

/**
 * Simple object check, returning false for arrays and null objects.
 * @param item the object
 * @returns {boolean}
 */
const isObject = function (item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * Deep merge objects.
 * Adapted from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
 * @param target
 * @param ...sources
 */
const mergeDeep = function (target, ...sources) {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach((key) => {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} });
				mergeDeep(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		});
	}

	return mergeDeep(target, ...sources);
};

const configSort = function (fileArray) {
	const extensionOrder = ['.toml', '.yaml', '.json'];

	const sorted = fileArray.sort((a, b) => {
		const configRegex = /config\.(toml|yaml|json)$/i;
		if (a.match(configRegex)) return extensionOrder.length + 1; // always less important
		if (b.match(configRegex)) return -1 - extensionOrder.length;

		const aExt = Path.extname(a);
		const bExt = Path.extname(b);
		return extensionOrder.indexOf(aExt) - extensionOrder.indexOf(bExt);
	});

	return sorted;
};

module.exports = {
	// 'Private' functions
	_configSort: configSort,

	getConfigPaths: async function (buildArguments) {
		const environment = buildArguments.environment || 'production'; // or just use root
		const configDir = buildArguments.configDir || 'config';
		// ^ maybe default to 'development' if the site is specifically a staging branch

		const configEnvDir = `${configDir}/${environment}/`;
		const configDefaultDir = `${configDir}/_default/`;

		let configFileList = [];
		if (await helpers.exists(configEnvDir)) {
			const files = await globHelper.getGlob(`${configEnvDir}/**.**`);
			configFileList = configFileList.concat(configSort(files));
		}

		if (await helpers.exists(configDefaultDir)) {
			const files = await globHelper.getGlob(`${configDefaultDir}/**.**`);
			configFileList = configFileList.concat(configSort(files));
		}

		if (await helpers.exists('config.toml')) {
			configFileList.push('config.toml');
		} else if (await helpers.exists('config.yaml')) {
			configFileList.push('config.yaml');
		} else if (await helpers.exists('config.json')) {
			configFileList.push('config.json');
		}

		let passedConfigFiles = buildArguments.config || '';

		if (passedConfigFiles) {
			passedConfigFiles = passedConfigFiles.trim().split(',');
			configFileList = configFileList.concat(passedConfigFiles.reverse());
		}

		return configFileList;
	},

	getConfigContents: async function (configFileList, passedConfigFiles) {
		return Promise.all(configFileList.map(async (configPath) => {
			configPath = configPath.replace('//', '/');
			const extension = Path.extname(configPath).toLowerCase();
			const fileType = fileTypeByExtension[extension];
			if (!fileType) {
				return;
			}

			let parsedData = {};
			try {
				const contents = await fsProm.readFile(configPath, 'utf-8');
				switch (fileType) {
				case 'toml':
					parsedData = helpers.parseToml(contents);
					break;
				case 'yaml':
					parsedData = helpers.parseYaml(contents);
					break;
				case 'json':
					parsedData = JSON.parse(contents);
					break;
				default:
					console.warn('unsupported config filetype:', fileType);
					break;
				}
			} catch (readFileError) {
				console.warn(readFileError);
			}

			const filename = Path.basename(configPath, extension);
			if (filename !== 'config' && passedConfigFiles.indexOf(configPath) < 0) {
				return { [filename]: parsedData };
			}
			return parsedData;
		}));
	},

	getHugoConfig: async function (args) {
		const buildArguments = helpers.processArgs(args);
		const configFileList = await this.getConfigPaths(buildArguments);

		console.log('found config files:');
		console.log(configFileList);

		const configContents = await this.getConfigContents(configFileList, buildArguments.config || '');
		configContents.reverse(); // reversing because deep merge places priority on the second object

		const configObject = mergeDeep({}, ...configContents);

		const url = buildArguments.baseURL || configObject.baseURL || '/';
		try {
			configObject.baseURL = new URL(url).pathname;
		} catch (urlError) {
			configObject.baseURL = url;
		}

		return configObject;
	}
};
