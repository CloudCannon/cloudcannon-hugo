const { basename, dirname, extname } = require('path');
const chalk = require('chalk');
const { pluralize } = require('../helpers/helpers');
const { parseDataFile } = require('../parsers/parser');
const pathHelper = require('../helpers/paths');
const { log } = require('../helpers/logger');

function getSectionName(path, rootDir = '') {
	path = path.replace(rootDir, '');
	const fileName = basename(path);
	let dir = dirname(path);

	if (fileName.search(/^index/ig) >= 0) {
		dir = dirname(dir);
	}

	const leadingPathFilter = /.*\//g; // the unimportant part
	const leadingPath = dir.match(leadingPathFilter);
	return leadingPath ? dir.replace(leadingPath[0], '') : '';
}

async function getData(hugoConfig) {
	const dataConfig = hugoConfig?.cloudcannon?.data;
	let data;

	if (dataConfig) {
		data = {};
		const allowedCollections = (typeof dataConfig === 'object') ? Object.keys(dataConfig) : null;
		const paths = pathHelper.getPaths();
		const dataFiles = await pathHelper.getDataPaths();

		await Promise.all(dataFiles.map(async (path) => {
			const filename = basename(path, extname(path));
			const dataKey = getSectionName(path, paths.data);

			if (allowedCollections && !allowedCollections.includes(dataKey || filename)) {
				return;
			}

			const contents = await parseDataFile(path) ?? {};

			if (dataKey) {
				data[dataKey] = data[dataKey] ?? {};
				data[dataKey][filename] = contents;
			} else {
				data[filename] = contents;
			}
		}));
	}

	const dataKeys = Object.keys(data || {});

	log(`💾 Processed ${pluralize(dataKeys.length, 'data set', { nonZeroSuffix: ':' })}`);

	dataKeys.forEach((name) => {
		const numItems = Object.keys(data?.[name]).length;
		log(`   ${chalk.bold(name)} with ${numItems} files`);
	});

	return data;
}

module.exports = {
	getData
};
