const cp = require('child_process');
const Path = require('path');
const { promises: fsProm } = require('fs');
const glob = require('glob');
const { promisify } = require('util');

const globPromise = promisify(glob);

const toml = require('toml');
const yaml = require('js-yaml');

const configSort = async function (fileArray) {
	const extensionOrder = ['.toml', '.yaml', '.json'];

	const sorted = fileArray.sort((a, b) => {
		const aExt = Path.extname(a);
		const bExt = Path.extname(b);
		if (a.match(/config\.(toml|yaml|json)$/ig)) {
			return extensionOrder.length + 1; // always less important
		}
		return extensionOrder.indexOf(bExt) - extensionOrder.indexOf(aExt);
	});

	return sorted;
};

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
const isObject = function (item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
};

/** TODO make this eslint compatable
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
};

module.exports = {
	getPaths: function (config) {
		return {
			archetypes: config.archetypeDir || 'archetypes',
			assets: config.assetDir || 'assets',
			content: config.contentDir || 'content',
			data: config.dataDir || 'data',
			layouts: config.layoutDir || 'layouts',
			publish: config.publishDir || 'public',
			static: config.staticDir || 'static',
			themes: config.themesDir || 'themes',
			config: config.configDir || '' // can get configDir from CC itself (frontend)
		};
	},

	getGlob: async function (globPattern, options) {
		options = options || {};
		if (!options.ignore) {
			options.ignore = [];
		}
		if (typeof options.ignore === 'string') {
			options.ignore = [options.ignore];
		}
		options.ignore.push('**/exampleSite/**');

		try {
			const paths = await globPromise(globPattern, options);
			return paths;
		} catch (globErr) {
			console.err(globErr);
		}
	},

	exists: async function (path) {
		try {
			const accessible = await fsProm.access(path);
			return accessible;
		} catch (err) {
			return false;
		}
	},

	parseFrontMatter: async function (data) {
		const normalised = data.replace(/(?:\r\n|\r|\n)/g, '\n');
		const identifyingChar = normalised.charAt(0);
		let start;
		let end;
		switch (identifyingChar) {
		case '-':
			start = normalised.search(/^---\s*\n/);
			end = normalised.indexOf('\n---', start + 1);
			if (start === 0 && end > start) {
				const trimmed = normalised.substring(start + 3, end);
				const parsed = await this.parseYaml(trimmed);
				return Promise.resolve(parsed);
			}
			break;
		case '+':
			start = normalised.search(/^\+\+\+\s*\n/);
			end = normalised.indexOf('\n+++', start + 1);
			if (start === 0 && end > start) {
				const trimmed = normalised.substring(start + 3, end);
				const parsed = await this.parseToml(trimmed);
				return Promise.resolve(parsed);
			}
			break;
		case '{':
			console.warn('JSON Frontmatter not yet supported');
			break;
		default:
			console.err('unsupported frontmatter');
			break;
		}
		return Promise.reject(Error('couldnt parse'));
	},

	parseYaml: function (data) {
		try {
			const yamlData = yaml.safeLoad(data, { json: true });
			return Promise.resolve(yamlData);
		} catch (parseError) {
			console.error(parseError);
		}
		return Promise.reject();
	},

	parseToml: function (data) {
		try {
			const tomlData = toml.parse(data);
			return Promise.resolve(tomlData);
		} catch (e) {
			console.error(`Parsing error on line ${e.line}, column ${e.column}: ${e.message}`);
		}
		return Promise.reject();
	},

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

	getHugoConfig: async function (configDir, environment, passedConfigFiles) {
		environment = environment || 'production'; // or just use root
		configDir = configDir || 'config';
		// ^ maybe use 'development' if the site is specifically a staging branch

		// TODO sanitize slashes
		const configEnvDir = `${configDir}/${environment}/`;
		const configDefaultDir = `${configDir}/_default/`;

		let configFileList = [];

		if (this.exists(configEnvDir)) {
			const files = await this.getGlob(`${configEnvDir}/**.**`);
			configFileList = configFileList.concat(await configSort(files));
		}

		if (this.exists(configDefaultDir)) {
			const files = await this.getGlob(`${configDefaultDir}/**.**`);
			configFileList = configFileList.concat(await configSort(files));
		}

		// TODO make this more exhaustive
		configFileList.push('config.toml');

		if (passedConfigFiles) {
			configFileList = configFileList.concat(passedConfigFiles.reverse());
		}

		console.log('found config files:');
		console.log(configFileList);

		const fileTypeByExtension = {
			'.yml': 'yaml',
			'.yaml': 'yaml',
			'.toml': 'toml',
			'.json': 'json'
		};

		const configPromises = configFileList.map(async (configPath) => {
			const extension = Path.extname(configPath).toLowerCase();
			const fileType = fileTypeByExtension[extension];
			const filename = Path.basename(configPath, extension);

			let parsedData = {};
			try {
				const configContents = await fsProm.readFile(configPath, 'utf-8');
				switch (fileType) {
				case 'toml':
					parsedData = await this.parseToml(configContents);
					break;
				case 'yaml':
					parsedData = await this.parseYaml(configContents);
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
				return Promise.resolve({ [filename]: parsedData });
			}
			return Promise.resolve(parsedData);
		});

		const configContents = await Promise.all(configPromises);
		configContents.reverse(); // reversing because deep merge places priority on the second object

		let configObject = {};
		configContents.forEach((configContent) => {
			configObject = mergeDeep(configObject, configContent);
		});

		return configObject;
	}
};
