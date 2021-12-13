const cp = require('child_process');
const fs = require('fs').promises;
const { parseDataFile, parseFrontMatter } = require('../parsers/parser');

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

	pluralize: function (amount, str) {
		const amountStr = amount === 0 ? 'no' : amount;
		return `${amountStr} ${str}${amount === 1 ? '' : 's'}`;
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
			let frontMatterObject = await parseDataFile(path);
			if (frontMatterObject) {
				return frontMatterObject;
			}
			const data = await fs.readFile(path, 'utf-8');
			frontMatterObject = parseFrontMatter(data);
			return frontMatterObject || {};
		} catch (parseError) {
			return {};
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
	}
};
