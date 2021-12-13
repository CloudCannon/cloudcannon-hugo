const Path = require('path');
const chalk = require('chalk');
const helpers = require('../helpers/helpers');
const pathHelper = require('../helpers/paths');
const { log } = require('../helpers/logger');

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

function getCollectionNameConfig(path, contentDir, archetypePath) {
	if (path.indexOf(archetypePath) >= 0) {
		if (path.indexOf('default.md') >= 0) {
			return;
		}

		if (path.indexOf('index.md') >= 0) {
			return Path.basename(Path.dirname(path));
		}

		return Path.basename(path, Path.extname(path)); // e.g. archetypes/type.md
	}

	return path.replace(`${contentDir}/`, '').split('/')[0];
}

function getPageUrl(path, hugoUrls = {}, contentDir) {
	if (hugoUrls[path]) {
		return hugoUrls[path];
	}

	if (path.indexOf('index') >= 0) {
		return path
			.replace(`${contentDir || ''}/`, '/')
			.replace(/\/_?index\.md/, '/')
			.replace('//', '/');
	}

	return '';
}

async function getLayout(path, details) {
	const typeFolders = [];
	const layoutFiles = [];
	const { content } = pathHelper.getPaths();
	const isHome = path.indexOf(`${content}/_index.md`) >= 0;
	const basename = Path.basename(path);
	const isSingle = basename.indexOf('_index.md') < 0;
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

async function generateCollectionItem(itemPath, itemDetails, collectionName, urlsPerPath) {
	const { archetypes, content } = pathHelper.getPaths();
	const isArchetype = itemPath.indexOf(archetypes) >= 0;

	let item;
	if (!isArchetype) {
		const url = getPageUrl(itemPath, urlsPerPath, content);
		const layout = await getLayout(itemPath, itemDetails);

		item = {
			url: url || '',
			path: itemPath,
			collection: collectionName,
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
	}
	return item;
}

async function generateCollectionConfigItem(itemPath, itemDetails, collectionName, config) {
	const { data, content } = pathHelper.getPaths();
	let isOutput = true;
	if (itemPath.startsWith(data)) {
		isOutput = false;
	} else {
		isOutput = !itemDetails.headless;
	}
	return {
		path: `${content}/${collectionName}`,
		output: isOutput,
		...config[collectionName]
	};
}

async function generateCollectionsInfo(config, urlsPerPath) {
	const paths = pathHelper.getPaths();
	const cloudcannonCollections = config?.cloudcannon?.collections || {};

	const definedCollections = {};
	Object.keys(cloudcannonCollections).forEach((collectionName) => {
		if (cloudcannonCollections[collectionName].path) {
			definedCollections[cloudcannonCollections[collectionName].path] = collectionName;
		}
	});

	const collectionItemPaths = await pathHelper
		.getCollectionPaths(Object.keys(definedCollections));
	const pagePaths = await pathHelper.getPagePaths();

	const collections = {};
	const collectionsConfig = {
		data: {
			path: paths.data,
			output: false,
			...cloudcannonCollections.data
		}
	};

	const partitionSize = 10;
	// Run these in partitions to prevent memory issues

	const numPartitions = Math.ceil(collectionItemPaths.length / partitionSize);
	log('⏳ processing collection items...');

	/* eslint-disable no-await-in-loop */
	for (let i = 0; i < numPartitions; i += 1) {
		const slice = collectionItemPaths.slice(i * partitionSize, ((i + 1) * partitionSize));

		await Promise.all(slice.map(async (itemPath) => {
			const collectionName = definedCollections[Path.dirname(itemPath)]
				|| getCollectionNameConfig(
					itemPath,
					paths.content,
					paths.archetypes
				);

			if (collectionName) {
				const itemDetails = await helpers.getItemDetails(itemPath);

				const collectionConfigItem = await generateCollectionConfigItem(
					itemPath, itemDetails, collectionName, cloudcannonCollections
				);
				collectionConfigItem.output = collectionConfigItem.output
					|| (collectionsConfig[collectionName]?.output ?? false); // true if any output: true;
				collectionsConfig[collectionName] = collectionConfigItem;

				const collectionItem = await generateCollectionItem(
					itemPath, itemDetails, collectionName, urlsPerPath
				);
				if (collections[collectionName]) {
					collections[collectionName].push(collectionItem);
				} else {
					collections[collectionName] = collectionItem ? [collectionItem] : [];
				}
			}
		}));
	}

	if (!collectionsConfig.pages && pagePaths.length) {
		collectionsConfig.pages = {
			path: paths.content,
			output: true,
			filter: 'strict',
			...cloudcannonCollections.pages
		};
		collections.pages = [];

		const numPartitionsPages = Math.ceil(pagePaths.length / partitionSize);

		for (let i = 0; i < numPartitionsPages; i += 1) {
			const slice = pagePaths.slice(i * partitionSize, ((i + 1) * partitionSize));
			await Promise.all(slice.map(async (itemPath) => {
				const itemDetails = await helpers.getItemDetails(itemPath);

				const collectionItem = await generateCollectionItem(
					itemPath, itemDetails, 'pages', urlsPerPath
				);
				collections.pages.push(collectionItem);
			}));
		}
	}
	/* eslint-enable no-await-in-loop */

	const collectionNames = Object.keys(collections);
	const numCollections = collectionNames.length;

	let logString = helpers.pluralize(numCollections, 'collection');
	logString = numCollections ? `${logString}:` : logString;

	log(`📁 processed ${logString}`);
	collectionNames.forEach((name) => {
		const numItems = Object.keys(collections[name]).length;
		log(`   ${chalk.bold(name)} with ${numItems} files`);
	});

	return {
		collectionsConfig: collectionsConfig,
		collections: collections
	};
}

module.exports = {
	getTopSectionName,
	getCollectionNameConfig,
	getPageUrl,
	getLayout,
	generateCollectionItem,
	generateCollectionsInfo,
	generateCollectionConfigItem
};
