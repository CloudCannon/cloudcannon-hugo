const cp = require('child_process');
const fs = require('fs').promises;
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
		'-c': 'contentDir',
		'-l': 'layoutDir',
		'--layoutDir': 'layoutDir'
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

// Attempts to parse JSON from a string that may have content after it
const unstrictJsonParse = function (data) {
	let parseData = data;
	let lastBracketIndex = parseData.lastIndexOf('}');

	while (parseData) {
		try {
			const parsed = parseData ? JSON.parse(parseData) : parseData;
			return parsed;
		} catch {
			lastBracketIndex = parseData.lastIndexOf('}', parseData.length - 2);
			parseData = parseData.substring(0, lastBracketIndex + 1); // Add one to include the bracket
		}
	}

	return {};
};

module.exports = {

	/**
	 * Deep merge objects.
	 * Adapted from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
	 * @param target
	 * @param ...sources
	 */
	mergeDeep: function (target, ...sources) {
		if (!sources.length) {
			return target;
		}

		const source = sources.shift();

		if (isObject(target) && isObject(source)) {
			Object.keys(source).forEach((key) => {
				if (isObject(source[key])) {
					if (!target[key]) {
						Object.assign(target, { [key]: {} });
					}

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
			await fs.access(path);
			return true;
		} catch (err) {
			return false;
		}
	},

	getItemDetails: async function (path) {
		try {
			let frontMatterObject = await this.parseDataFile(path);
			if (frontMatterObject) {
				return frontMatterObject;
			}
			const data = await fs.readFile(path, 'utf-8');
			frontMatterObject = this.parseFrontMatter(data);
			return frontMatterObject || {};
		} catch (parseError) {
			return {};
		}
	},

	parseDataFile: async function (path) {
		const type = Path.extname(path).toLowerCase();

		try {
			const contents = await fs.readFile(path, 'utf-8');
			switch (type) {
			case '.yml':
			case '.yaml':
				return this.parseYaml(contents);
			case '.toml':
				return this.parseToml(contents);
			case '.json':
				return JSON.parse(contents);
			default:
				break;
			}
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
			return unstrictJsonParse(data);
		default:
			break;
		}

		return {};
	},

	parseYaml: function (data) {
		try {
			return yaml.load(data, { json: true });
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

		// Second item contains the actual response
		return childProcess.output?.[1]?.toString().trim() ?? '';
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
