const { promisify } = require('util');
const glob = require('glob');
const { log } = require('./logger');

const globPromise = promisify(glob);

function getGlobString(globPatterns) {
	if (globPatterns.length < 2) {
		return globPatterns[0] ?? '';
	}

	const globString = globPatterns.reduce((memo, globPattern, index) => {
		const separator = index > 0 ? ',' : '';
		return memo + separator + globPattern;
	}, '');

	return `{${globString}}`;
}

async function getGlob(globPattern, options = {}) {
	if (Array.isArray(globPattern)) {
		globPattern = getGlobString(globPattern);
	}

	options = {
		nodir: true,
		ignore: [],
		...options
	};

	if (typeof options.ignore === 'string') {
		options.ignore = [options.ignore];
	}

	options.ignore.push('**/exampleSite/**');

	try {
		return await globPromise(globPattern, options);
	} catch (globErr) {
		log(globErr, 'error');
	}
}

module.exports = {
	getGlobString: getGlobString,
	getGlob: getGlob
};
