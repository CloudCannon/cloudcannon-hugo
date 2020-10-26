const cp = require('child_process');
const Path = require('path');
const { promises: fsProm } = require('fs');
const glob = require('glob');
const { promisify } = require('util');

const globPromise = promisify(glob);

const toml = require('toml');
const yaml = require('js-yaml');

const exists = async function (path) {
	try {
		const accessible = await fsProm.access(path);
		return accessible;
	} catch (err) {
		return false;
	}
};

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
const isObject = function (item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
const mergeDeep = function (target, ...sources) {
	if (!sources.length) return target;
	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
			if (!target[key]) Object.assign(target, { [key]: {} });
			mergeDeep(target[key], source[key]);
			} else {
			Object.assign(target, { [key]: source[key] });
			}
		}
	}

	return mergeDeep(target, ...sources);
}

const configSort = async function (fileArray) {
	const extensionOrder = ['toml', 'yaml', 'json'];

	const sorted = fileArray.sort((a, b) => {
		const aExt = Path.extname(a);
		const bExt = Path.extname(b);
		if (a.match(/config\.(toml|yaml|json)$/)) {
			return -99;
		}
		return extensionOrder.indexOf(aExt) - extensionOrder.indexOf(bExt);
	});

	return sorted;
};

function parseYaml(data) {
	try {
		const yamlData = yaml.safeLoad(data, { json: true });
		return Promise.resolve(yamlData);
	} catch (parseError) {
		console.error(parseError);
	}
	return Promise.reject();
}

function parseToml(data) {
	try {
		const tomlData = toml.parse(data);
		return Promise.resolve(tomlData);
	} catch (e) {
		console.error(`Parsing error on line ${e.line}, column ${e.column}: ${e.message}`);
	}
	return Promise.reject();
}

module.exports = {
	runProcess: async function (command, args) {
		try {
			const childProcess = await cp.spawnSync(command, args, {
				cwd: process.cwd(),
				env: process.env,
				stdio: 'pipe',
				encoding: 'utf-8'
			});
			return Promise.resolve(childProcess.output[1]); // second item contains the actual response
		} catch (processError) {
			return Promise.reject(processError);
		}
	},

	getHugoConfig: async function (configDir, environment) {
		environment = environment || 'production'; // or just use root
		configDir = configDir || 'config';
		// ^ maybe use 'development' if the site is specifically a staging branch

		// TODO sanitize slashes
		const configEnvDir = `${configDir}/${environment}/`;
		const configDefaultDir = `${configDir}/_default/`;

		let configFileList = [];

		if (exists(configEnvDir)) {
			const files = await globPromise(`${configEnvDir}/**.**`);
			configFileList = configFileList.concat(await configSort(files));
		}

		if (exists(configDefaultDir)) {
			const files = await globPromise(`${configDefaultDir}/**.**`);
			configFileList = configFileList.concat(await configSort(files));
		}

		console.log('found config files:');
		console.log(configFileList);

		// TODO get base config.xxx
		// TODO read --config files in reverse order (ignoring extension)

		const extensions = {
			'.yml': 'yaml',
			'.yaml': 'yaml',
			'.toml': 'toml',
			'.json': 'json'
		};

		const configPromises = configFileList.map(async (configPath) => {
			let configContents;
			const extension = Path.extname(configPath).toLowerCase();
			const filename = Path.basename(configPath, extension);
			const fileType = extensions[extension];
			let parsedData = {};
			try {
				configContents = await fsProm.readFile(configPath, 'utf-8');
				switch (fileType) {
				case 'toml':
					parsedData = await parseToml(configContents);
					break;
				case 'yaml':
					parsedData = await parseYaml(configContents);
					break;
				case 'json':
					parsedData = await JSON.parse(configContents);
					break;
				default:
					console.warn('could not parse config file');
					break;
				}
			} catch (readFileError) {
				console.warn(readFileError);
			}

			if (filename !== 'config') {
				return { [filename]: parsedData };
			}
			return parsedData;
		});

		const contents = await Promise.all(configPromises);

		let configObject = {};
		contents.forEach((configContent) => {
			// TODO Object.assign is not deep
			configObject = mergeDeep(configObject, configContent);
		});

		return configObject;
	}
};
