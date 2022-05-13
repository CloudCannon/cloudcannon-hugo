import { basename, dirname, extname } from 'path';
import chalk from 'chalk';
import { parseDataFile } from '../parsers/parser.js';
import pathHelper from '../helpers/paths.js';
import log from '../helpers/logger.js';

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

export async function getData(config) {
	const dataConfig = config.data_config;
	let data;

	if (dataConfig) {
		data = {};

		const paths = pathHelper.getPaths();
		const dataFiles = await pathHelper.getDataPaths();

		await Promise.all(dataFiles.map(async (path) => {
			const filenameWithoutExtension = basename(path, extname(path));
			const dataKey = getSectionName(path, paths.data);

			if (dataConfig === true || dataConfig[dataKey || filenameWithoutExtension] === true) {
				const contents = await parseDataFile(path) ?? {};

				if (dataKey) {
					data[dataKey] = data[dataKey] || {};
					data[dataKey][filenameWithoutExtension] = contents;
				} else {
					data[filenameWithoutExtension] = contents;
				}
			}
		}));
	}

	const dataKeys = Object.keys(data || {});

	dataKeys.forEach((key) => {
		log(`💾 Processed ${chalk.bold(key)} data set`);
	});

	return data;
}
