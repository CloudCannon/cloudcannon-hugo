const Papa = require('papaparse');
const helpers = require('../helpers/helpers');
const pathHelper = require('../helpers/paths');
const { version } = require('../helpers/metadata');
const { log } = require('../helpers/logger');
const { getGenerator } = require('./generator');
const { getData } = require('./data');
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

async function getInfo(hugoConfig, options) {
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
		data: await getData(hugoConfig)
	};
}

module.exports = {
	getInfo
};
