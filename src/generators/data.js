const Path = require('path');
const chalk = require('chalk');
const helpers = require('../helpers/helpers');
const { parseDataFile } = require('../parsers/parser');
const pathHelper = require('../helpers/paths');
const { log } = require('../helpers/logger');

function getSectionName(path, rootDir = '') {
	path = path.replace(rootDir, '');
	const fileName = Path.basename(path);
	let dir = Path.dirname(path);

	if (fileName.search(/^index/ig) >= 0) {
		dir = Path.dirname(dir);
	}

	const leadingPathFilter = /.*\//g; // the unimportant part
	const leadingPath = dir.match(leadingPathFilter);
	return leadingPath ? dir.replace(leadingPath[0], '') : '';
}

async function getData(hugoConfig) {
	const dataConfig = hugoConfig?.cloudcannon?.data;
	if (!dataConfig) {
		return;
	}

	const allowedCollections = (typeof dataConfig === 'object') ? Object.keys(dataConfig) : null;
	const data = {};
	const { data: dataDir } = pathHelper.getPaths();
	const dataFiles = await pathHelper.getDataPaths();

	await Promise.all(dataFiles.map(async (path) => {
		const filename = Path.basename(path, Path.extname(path));
		const collectionName = getSectionName(path, dataDir);

		if (allowedCollections && !allowedCollections.includes(collectionName || filename)) {
			return;
		}

		const contents = await parseDataFile(path) ?? {};

		if (collectionName) {
			data[collectionName] = data[collectionName] ?? {};
			data[collectionName][filename] = contents;
		} else {
			data[filename] = contents;
		}
	}));

	const collectionNames = Object.keys(data);
	const numCollections = collectionNames.length;

	let logString = helpers.pluralize(numCollections, 'data set');
	logString = numCollections ? `${logString}:` : logString;

	log(`💾 Processed ${logString}`);
	collectionNames.forEach((name) => {
		const numItems = Object.keys(data[name]).length;
		log(`   ${chalk.bold(name)} with ${numItems} files`);
	});

	return data;
}

module.exports = {
	getData
};
