const cp = require('child_process');
const Path = require('path');
const { promises: fsProm } = require('fs');
const glob = require('glob');
const { promisify } = require('util');

const globPromise = promisify(glob);

const toml = require('toml');
const yaml = require('js-yaml');

const getValidOptionName = function (option) {
	const relevantOptions = {
		'--environment': 'environment',
		'-e': 'environment',
		'--source': 'source',
		'-s': 'source',
		'--baseURL': 'baseURL',
		'-b': 'baseURL',
		'--config': 'config',
		'--configDir': 'configDir',
		'--contentDir': 'contentDir',
		'-c': 'contentDir'
	};

	if (relevantOptions[option]) {
		return relevantOptions[option];
	}
};

const configSort = function (fileArray) {
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

module.exports = {
	getPaths: function (config) {
		return {
			archetypes: config.archetypeDir || 'archetypes',
			assets: config.assetDir || 'assets',
			content: config.contentDir || 'content',
			pages: config.contentDir || 'content',
			data: config.dataDir || 'data',
			layouts: config.layoutDir || 'layouts',
			publish: config.publishDir || 'public',
			uploads: `${config.staticDir}/uploads` || 'static/uploads',
			themes: config.themesDir || 'themes',
			config: config.configDir || ''
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
		options.nodir = true;

		try {
			const paths = await globPromise(globPattern, options);
			return paths;
		} catch (globErr) {
			console.err(globErr);
		}
	},

	exists: async function (path) {
		try {
			await fsProm.access(path);
			return Promise.resolve(true);
		} catch (err) {
			return Promise.resolve(false);
		}
	},

	getItemDetails: async function (path) {
		try {
			const data = await fsProm.readFile(path, 'utf-8');
			const frontMatterObject = this.parseFrontMatter(data);
			return frontMatterObject;
		} catch (parseError) {
			return {};
		}
	},

	parseFrontMatter: function (data) {
		if (!data) {
			return Error('File is empty');
		}
		const normalised = data
			.replace(/{{.*}}/g, '') // remove Hugo code
			.replace(/(?:\r\n|\r|\n)/g, '\n');

		const identifyingChar = normalised.charAt(0);
		let start;
		let end;
		switch (identifyingChar) {
		case '-':
			start = normalised.search(/^---\s*\n/);
			end = normalised.indexOf('\n---', start + 1);
			if (start === 0 && end > start) {
				const trimmed = normalised.substring(start + 3, end);
				return this.parseYaml(trimmed);
			}
			break;
		case '+':
			start = normalised.search(/^\+\+\+\s*\n/);
			end = normalised.indexOf('\n+++', start + 1);
			if (start === 0 && end > start) {
				const trimmed = normalised.substring(start + 3, end);
				return this.parseToml(trimmed);
			}
			break;
		case '{':
			console.warn('JSON Frontmatter not yet supported');
			break;
		default:
			break;
		}
		return Promise.reject(Error('couldnt parse'));
	},

	parseYaml: function (data) {
		try {
			return yaml.safeLoad(data, { json: true });
		} catch (parseError) {
			console.error(parseError);
		}
	},

	parseToml: function (data) {
		try {
			return toml.parse(data);
		} catch (e) {
			console.error(`Parsing error on line ${e.line}, column ${e.column}: ${e.message}`);
		}
	},

	runProcess: function (command, args) {
		try {
			const childProcess = cp.spawnSync(command, args, {
				cwd: process.cwd(),
				env: process.env,
				stdio: 'pipe',
				encoding: 'utf-8'
			});
			return childProcess.output[1]; // second item contains the actual response
		} catch (processError) {
			console.error(processError);
		}
	},

	processArgs: function (args) {
		const flagtest = /^(-.$)|(--\w*$)/i;
		const argObject = {};
		args.forEach((argument, index) => {
			if (flagtest.test(argument)) {
				const item = getValidOptionName(argument);
				if (item) {
					argObject[item] = args[index + 1];
				}
			}
		});
		return argObject;
	},

	getHugoConfig: async function (args) {
		const buildArguments = this.processArgs(args);
		const environment = buildArguments.environment || 'production'; // or just use root
		const configDir = buildArguments.configDir || 'config';
		// ^ maybe default to 'development' if the site is specifically a staging branch

		const configEnvDir = `${configDir}/${environment}/`;
		const configDefaultDir = `${configDir}/_default/`;

		let configFileList = [];

		if (await this.exists(configEnvDir)) {
			const files = await this.getGlob(`${configEnvDir}/**.**`);
			configFileList = configFileList.concat(configSort(files));
		}

		if (await this.exists(configDefaultDir)) {
			const files = await this.getGlob(`${configDefaultDir}/**.**`);
			configFileList = configFileList.concat(configSort(files));
		}

		if (await this.exists('config.toml')) {
			configFileList.push('config.toml');
		} else if (await this.exists('config.yaml')) {
			configFileList.push('config.yaml');
		} else if (await this.exists('config.json')) {
			configFileList.push('config.json');
		}

		let passedConfigFiles = buildArguments.config || '';

		if (passedConfigFiles) {
			passedConfigFiles = passedConfigFiles.trim().split(',');
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
			configPath = configPath.replace('//', '/');
			const extension = Path.extname(configPath).toLowerCase();
			const fileType = fileTypeByExtension[extension];
			if (!fileType) {
				return Promise.resolve();
			}

			let parsedData = {};
			try {
				const configContents = await fsProm.readFile(configPath, 'utf-8');
				switch (fileType) {
				case 'toml':
					parsedData = this.parseToml(configContents);
					break;
				case 'yaml':
					parsedData = this.parseYaml(configContents);
					break;
				case 'json':
					parsedData = JSON.parse(configContents);
					break;
				default:
					console.warn('could not parse config file');
					break;
				}
			} catch (readFileError) {
				console.warn(readFileError);
			}

			const filename = Path.basename(configPath, extension);
			if (filename !== 'config' && passedConfigFiles.indexOf(configPath) < 0) {
				return Promise.resolve({ [filename]: parsedData });
			}
			return Promise.resolve(parsedData);
		});

		const configContents = await Promise.all(configPromises);
		configContents.reverse(); // reversing because deep merge places priority on the second object

		const configObject = mergeDeep({}, ...configContents);

		if (buildArguments.baseurl) {
			configObject.baseurl = buildArguments.baseurl;
		}
		return Promise.resolve(configObject);
	}
};
