import Papa from 'papaparse';
import { runProcess, getUrlPathname } from '../helpers/helpers.js';
import pathHelper from '../helpers/paths.js';
import log from '../helpers/logger.js';
import { getGenerator } from './generator.js';
import { getData } from './data.js';
import { getConfig } from '../config.js';
import { getCollectionsAndConfig } from './collections.js';

function getHugoUrls() {
	log('⏳ Processing permalinks...');
	const { source } = pathHelper.getPaths();
	let cmdArgs = ['list', 'all'];
	cmdArgs = cmdArgs.concat(source ? ['--source', source] : []);
	const fileCsv = runProcess('hugo', cmdArgs);
	const fileList = Papa.parse(fileCsv, { header: true });

	return fileList.data.reduce((memo, file) => {
		memo[file.path] = getUrlPathname(file.permalink);
		return memo;
	}, {});
}

export async function getInfo(hugoConfig, options) {
	const config = getConfig(hugoConfig);
	const urlsPerPath = getHugoUrls();

	pathHelper.getSupportedLanguages(hugoConfig);

	const { collections, collectionsConfig } = await getCollectionsAndConfig(config, urlsPerPath);
	const data = await getData(config);

	return {
		...config,
		time: new Date().toISOString(),
		version: '0.0.3',
		cloudcannon: {
			name: 'cloudcannon-hugo',
			version: options?.version || '0.0.0'
		},
		generator: getGenerator(hugoConfig),
		collections_config: collectionsConfig,
		collections,
		data
	};
}
