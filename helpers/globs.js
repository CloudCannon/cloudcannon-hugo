const { promisify } = require('util');
const glob = require('glob');

const globPromise = promisify(glob);

module.exports = {
	getGlobString: function (globPatterns) {
		if (globPatterns.length === 0) return '';
		if (globPatterns.length === 1) return globPatterns[0];

		let globString = '{';
		globPatterns.forEach((globPattern, index) => {
			globString += index > 0 ? ',' : '';
			globString += globPattern;
		});
		globString += '}';
		return globString;
	},

	getGlob: async function (globPattern, options) {
		if (Array.isArray(globPattern)) {
			globPattern = this.getGlobString(globPattern);
		}

		options = options || {};
		const defaultOptions = {
			nodir: true,
			noUnique: true
		};
		options = Object.assign(defaultOptions, options);

		options.ignore = options.ignore || [];
		if (typeof options.ignore === 'string') {
			options.ignore = [options.ignore];
		}
		options.ignore.push('**/exampleSite/**');

		try {
			return await globPromise(globPattern, options);
		} catch (globErr) {
			console.err(globErr);
		}
	}
};
