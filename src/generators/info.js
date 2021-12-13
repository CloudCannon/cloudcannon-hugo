const Papa = require('papaparse');
const Path = require('path');
const chalk = require('chalk');
const helpers = require('../helpers/helpers');
const { parseDataFile } = require('../parsers/parser');
const pathHelper = require('../helpers/paths');
const { version } = require('../helpers/metadata');
const { log } = require('../helpers/logger');
const { getGenerator } = require('./generator');
const { generateCollectionsInfo } = require('./collections');

function getHugoUrls() {
	log('⏳ Processing permalinks...');
	const { source } = pathHelper.getPaths();
	let cmdArgs = ['list', 'all'];
	cmdArgs = cmdArgs.concat(source ? ['--source', source] : []);
	const fileCsv = helpers.runProcess('hugo', cmdArgs);
	const fileList = Papa.parse(fileCsv, { header: true });

	return fileList.data.reduce((memo, file) => {
		memo[file.path] = helpers.getUrlPathname(file.permalink);
		return memo;
	}, {});
}

module.exports = {
	getSectionName: function (path, rootDir = '') {
		path = path.replace(rootDir, '');
		const fileName = Path.basename(path);
		let dir = Path.dirname(path);

		if (fileName.search(/^index/ig) >= 0) {
			dir = Path.dirname(dir);
		}

		const leadingPathFilter = /.*\//g; // the unimportant part
		const leadingPath = dir.match(leadingPathFilter);
		return leadingPath ? dir.replace(leadingPath[0], '') : '';
	},

	generateData: async function (hugoConfig) {
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
			const collectionName = this.getSectionName(path, dataDir);

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

		log(`💾 processed ${logString}`);
		collectionNames.forEach((name) => {
			const numItems = Object.keys(data[name]).length;
			log(`   ${chalk.bold(name)} with ${numItems} files`);
		});

		return data;
	},

	generateInfo: async function (hugoConfig, options) {
		const urlsPerPath = getHugoUrls();
		const paths = pathHelper.getPaths();

		// params key is case insensitive
		const paramsKey = Object.keys(hugoConfig).find((key) => key.toLowerCase() === 'params');
		const hugoParams = hugoConfig[paramsKey] ?? {};

		pathHelper.getSupportedLanguages(hugoConfig);

		const {
			collections,
			collectionsConfig
		} = await generateCollectionsInfo(hugoConfig, urlsPerPath);

		return {
			time: new Date().toISOString(),
			version: version,
			cloudcannon: {
				name: 'cloudcannon-hugo',
				version: options?.version || '0.0.0'
			},
			generator: getGenerator(hugoConfig),
			source: paths.source || '',
			'base-url': helpers.getUrlPathname(hugoConfig.baseURL),
			'collections-config': collectionsConfig,
			_comments: hugoConfig._comments ?? hugoParams._comments ?? {},
			_options: hugoConfig._options ?? hugoParams._options ?? {},
			_inputs: hugoConfig._inputs,
			_editables: hugoConfig._editables,
			_collection_groups: hugoConfig._collection_groups ?? hugoParams._collection_groups,
			_editor: hugoConfig._editor ?? hugoParams._editor ?? {},
			_source_editor: hugoConfig._source_editor
				?? hugoParams._source_editor
				?? hugoParams._sourceEditor
				?? {},
			_enabled_editors: hugoConfig._enabled_editors ?? hugoParams._enabled_editors,
			_instance_values: hugoConfig._instance_values ?? hugoParams._instance_values,
			_structures: hugoConfig._structures,
			_array_structures: hugoConfig._array_structures
				?? hugoParams._array_structures
				?? hugoParams._arrayStructures
				?? {},
			_select_data: hugoConfig._select_data
				?? hugoParams._select_data
				?? hugoParams._selectData
				?? {},
			paths: paths,
			collections: collections,
			data: await this.generateData(hugoConfig)
		};
	}
};
