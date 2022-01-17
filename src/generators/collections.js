import { basename, dirname, extname } from 'path';
import chalk from 'chalk';
import { pluralize } from '../helpers/helpers.js';
import pathHelper from '../helpers/paths.js';
import log from '../helpers/logger.js';
import { parseFile } from '../parsers/parser.js';

function getTopSectionName(path, options = {}) {
	const rootDir = options.rootDir || '';
	const supportedLanguages = pathHelper.getSupportedLanguages() || [];

	path = path.replace(rootDir, '').replace(/^\//i, '');

	if (options.removeLangaugeCodes) {
		for (let i = 0; i < supportedLanguages.length; i += 1) {
			const languageCode = supportedLanguages[i];
			if (path.startsWith(languageCode)) {
				path = path.replace(languageCode, '').replace(/^\//i, '');
				break;
			}
		}
	}

	const leadingPath = path.split('/');
	return leadingPath?.[0] ? leadingPath[0].replace(/\//g, '') : '';
}

export function getCollectionKey(path, contentDir, archetypePath) {
	if (path.indexOf(archetypePath) >= 0) {
		if (path.indexOf('default.md') >= 0) {
			return;
		}

		if (path.indexOf('index.md') >= 0) {
			return basename(dirname(path));
		}

		return basename(path, extname(path)); // e.g. archetypes/type.md
	}

	return path.replace(`${contentDir}/`, '').split('/')[0];
}

export function getPageUrl(path, hugoUrls = {}, contentDir) {
	if (hugoUrls[path]) {
		return hugoUrls[path];
	}

	if (path.indexOf('index') >= 0) {
		return path
			.replace(`${contentDir || ''}/`, '/')
			.replace(/\/_?index\.(md|html?)/, '/')
			.replace('//', '/');
	}

	return '';
}

export async function getLayout(path, details) {
	const typeFolders = [];
	const layoutFiles = [];
	const { content } = pathHelper.getPaths();
	const isHome = path.indexOf(`${content}/_index.md`) >= 0;
	const isSingle = !(/^_index\.(md|html?)$/i.test(basename(path)));
	const { layout, type } = details;
	const section = getTopSectionName(path, {
		rootDir: content,
		removeLangaugeCodes: true
	});

	if (isHome) {
		typeFolders.push(type, '/', '_default'); // '/' signifies to use root folder
		layoutFiles.push(layout, 'index', 'home', 'list');
	} else if (isSingle) {
		typeFolders.push(section, '_default');
		layoutFiles.push(layout, 'single');
	} else {
		typeFolders.push(type, section, 'section', '_default');
		layoutFiles.push(layout, section, 'section', 'list');
	}

	const tree = await pathHelper.getLayoutTree();

	for (let t = 0; t < typeFolders.length; t += 1) {
		for (let l = 0; l < layoutFiles.length; l += 1) {
			const typeFolder = typeFolders[t];
			const layoutFile = layoutFiles[l];
			if (typeFolder === '/' && typeof tree[layoutFile] === 'string') {
				return tree[layoutFile];
			}

			if (tree[typeFolder] && typeof tree[typeFolder][layoutFile] === 'string') {
				return tree[typeFolder][layoutFile];
			}
		}
	}
}

async function processCollectionItem(itemPath, itemDetails, collectionKey, urlsPerPath) {
	const paths = pathHelper.getPaths();
	const isArchetype = itemPath.indexOf(paths.archetypes) >= 0;

	if (isArchetype) {
		return;
	}

	const url = getPageUrl(itemPath, urlsPerPath, paths.content);
	const layout = await getLayout(itemPath, itemDetails);

	const item = {
		url: url || '',
		path: itemPath,
		collection: collectionKey,
		...itemDetails
	};

	if (item.headless || (!url && itemPath.indexOf('index') < 0)) {
		item.output = false;
	}

	if (layout && item.url) {
		item.layout = layout;
	}

	if (item.draft) {
		item.published = false;
	}

	return item;
}

async function processCollectionConfig(itemPath, itemDetails, collectionKey, initialCollectionsConfig) {
	const paths = pathHelper.getPaths();
	const isOutput = itemPath.startsWith(paths.data) ? false : !itemDetails.headless;

	return {
		path: `${paths.content}/${collectionKey}`,
		output: isOutput,
		...initialCollectionsConfig[collectionKey]
	};
}

export async function getCollectionsAndConfig(config, urlsPerPath) {
	const paths = pathHelper.getPaths();
	const override = config.collections_config_override === true;
	const initialCollectionsConfig = config.collections_config || {};
	const definedCollections = {};

	const isAllowedCollectionKey = (key) => !override || initialCollectionsConfig[key];

	Object.keys(initialCollectionsConfig).forEach((collectionKey) => {
		if (initialCollectionsConfig[collectionKey].path) {
			definedCollections[initialCollectionsConfig[collectionKey].path] = collectionKey;
		}
	});

	const definedCollectionKeys = Object.keys(definedCollections);
	const collectionItemPaths = await pathHelper.getCollectionPaths(definedCollectionKeys);
	const pagePaths = await pathHelper.getPagePaths();
	const collections = {};
	const collectionsConfig = {};

	if (!override) {
		collectionsConfig.data = {
			path: paths.data,
			output: false,
			...initialCollectionsConfig.data
		};
	}

	// Run these in partitions to prevent memory issues
	const partitionSize = 10;
	const numPartitions = Math.ceil(collectionItemPaths.length / partitionSize);

	log('⏳ Processing collections...');

	for (let i = 0; i < numPartitions; i += 1) {
		const slice = collectionItemPaths.slice(i * partitionSize, ((i + 1) * partitionSize));

		await Promise.all(slice.map(async (itemPath) => {
			const collectionKey = definedCollections[dirname(itemPath)]
				|| getCollectionKey(itemPath, paths.content, paths.archetypes);

			if (!isAllowedCollectionKey(collectionKey)) {
				return;
			}

			if (collectionKey) {
				const itemDetails = await parseFile(itemPath);

				const collectionConfig = await processCollectionConfig(
					itemPath,
					itemDetails,
					collectionKey,
					initialCollectionsConfig
				);

				collectionConfig.output = collectionConfig.output
					|| (collectionsConfig[collectionKey]?.output ?? false); // true if any output: true;

				collectionsConfig[collectionKey] = collectionConfig;

				const collectionItem = await processCollectionItem(
					itemPath,
					itemDetails,
					collectionKey,
					urlsPerPath
				);

				collections[collectionKey] = collections[collectionKey] || [];

				if (collectionItem) {
					collections[collectionKey].push(collectionItem);
				}
			}
		}));
	}

	if (isAllowedCollectionKey('pages') && !collectionsConfig.pages && pagePaths.length) {
		collectionsConfig.pages = {
			path: paths.content,
			output: true,
			filter: 'strict',
			...initialCollectionsConfig.pages
		};

		collections.pages = [];

		const numPartitionsPages = Math.ceil(pagePaths.length / partitionSize);

		for (let i = 0; i < numPartitionsPages; i += 1) {
			const slice = pagePaths.slice(i * partitionSize, ((i + 1) * partitionSize));

			await Promise.all(slice.map(async (itemPath) => {
				const itemDetails = await parseFile(itemPath);

				const collectionItem = await processCollectionItem(
					itemPath,
					itemDetails,
					'pages',
					urlsPerPath
				);

				collections.pages.push(collectionItem);
			}));
		}
	}

	const collectionKeys = Object.keys(collections);

	log(`📁 Processed ${pluralize(collectionKeys.length, 'collection', { nonZeroSuffix: ':' })}`);

	collectionKeys.forEach((name) => {
		const numItems = Object.keys(collections[name]).length;
		log(`   ${chalk.bold(name)} with ${numItems} files`);
	});

	return {
		collectionsConfig,
		collections
	};
}
