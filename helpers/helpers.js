const cp = require('child_process');
const { promises: fsProm } = require('fs');
const Path = require('path');

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

/**
 * Simple object check, returning false for arrays and null objects.
 * @param item the object
 * @returns {boolean}
 */
const isObject = function (item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
};

module.exports = {

	/**
	 * Deep merge objects.
	 * Adapted from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
	 * @param target
	 * @param ...sources
	 */
	mergeDeep: function (target, ...sources) {
		if (!sources.length) return target;
		const source = sources.shift();

		if (isObject(target) && isObject(source)) {
			Object.keys(source).forEach((key) => {
				if (isObject(source[key])) {
					if (!target[key]) Object.assign(target, { [key]: {} });
					this.mergeDeep(target[key], source[key]);
				} else {
					Object.assign(target, { [key]: source[key] });
				}
			});
		}

		return this.mergeDeep(target, ...sources);
	},

	exists: async function (path) {
		try {
			await fsProm.access(path);
			return true;
		} catch (err) {
			return false;
		}
	},

	getItemDetails: async function (path) {
		try {
			const data = await fsProm.readFile(path, 'utf-8');
			const frontMatterObject = this.parseFrontMatter(data);
			return frontMatterObject || {};
		} catch (parseError) {
			return {};
		}
	},

	parseDataFile: async function (path) {
		const type = Path.extname(path).toLowerCase();
		try {
			let parsedData;
			const contents = await fsProm.readFile(path, 'utf-8');
			switch (type) {
			case '.yml':
			case '.yaml':
				parsedData = this.parseYaml(contents);
				break;
			case '.toml':
				parsedData = this.parseToml(contents);
				break;
			case '.json':
				parsedData = JSON.parse(contents);
				break;
			default:
				break;
			}
			return parsedData;
		} catch (parseError) {
			console.warn('Failed to read file:', path);
		}
	},

	parseFrontMatter: function (data) {
		if (!data) {
			return {};
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
		return {};
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

	getUrlPathname: function (url = '/') {
		try {
			return new URL(url).pathname;
		} catch (urlError) {
			return url;
		}
	},

	runProcess: function (command, args) {
		const childProcess = cp.spawnSync(command, args, {
			cwd: process.cwd(),
			env: process.env,
			stdio: 'pipe',
			encoding: 'utf-8'
		});
		return childProcess.output ? childProcess.output[1].toString().trim() : ''; // second item contains the actual response
	},

	processArgs: function (args = []) {
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
	}
};
