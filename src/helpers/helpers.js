const cp = require('child_process');
const fs = require('fs').promises;

const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);

// Adapted from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
function mergeDeep(target, ...sources) {
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

				mergeDeep(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		});
	}

	return mergeDeep(target, ...sources);
}

module.exports = {
	mergeDeep,

	pluralize: function (amount, str, options = {}) {
		const amountStr = amount === 0 ? 'no' : amount;
		const plural = amount === 1 ? '' : 's';
		const suffix = amount > 0 ? options.nonZeroSuffix || '' : '';
		return `${amountStr} ${str}${plural}${suffix}`;
	},

	exists: async function (path) {
		try {
			await fs.access(path);
			return true;
		} catch (err) {
			return false;
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
