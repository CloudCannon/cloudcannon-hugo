import Papa from 'papaparse';
import { runProcess, getUrlPathname } from '../helpers/helpers.js';
import pathHelper from '../helpers/paths.js';
import chalk from 'chalk';
import log from '../helpers/logger.js';
import { getGenerator } from './generator.js';
import { getData } from './data.js';
import { getConfig } from '../config.js';
import { getCollectionsAndConfig } from './collections.js';

async function getHugoUrls(hugoConfig) {
	log('⏳ Listing files from Hugo...');

	const { source } = pathHelper.getPaths();
	const { environment } = hugoConfig;
	const cmdArgs = ['list', 'all', '--environment', environment || 'production'];
	cmdArgs.push(...(source ? ['--source', source] : []));

	const raw = await runProcess('hugo', cmdArgs);
	const startIndex = raw.search(/^path,/m); // hugo logs warnings before this point
	if (startIndex < 0) {
		log(`⚠️ ${chalk.red('No output listing files')}`, 'error');
	}

	const fileCsv = raw.substring(startIndex).trim();
	const fileList = Papa.parse(fileCsv, { header: true });

	return fileList.data.reduce((memo, file) => {
		memo[file.path] = getUrlPathname(file.permalink);
		return memo;
	}, {});
}

export async function getInfo(hugoConfig, options) {
	const config = await getConfig(hugoConfig);
	const hugoUrls = await getHugoUrls(hugoConfig);

	pathHelper.getSupportedLanguages(hugoConfig);

	const { collections, collectionsConfig } = await getCollectionsAndConfig(config, hugoUrls);
	const data = await getData(config);
	const generator = await getGenerator(hugoConfig);

	// multlingual not needed in info.json
	delete config.multilingual;

	return {
		...config,
		time: new Date().toISOString(),
		version: '0.0.3',
		cloudcannon: {
			name: 'cloudcannon-hugo',
			version: options?.version || '0.0.0'
		},
		generator,
		collections_config: collectionsConfig,
		collections,
		data
	};
}
