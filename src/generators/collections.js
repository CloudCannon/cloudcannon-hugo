import { basename, join } from 'path';
import chalk from 'chalk';
import { cheapPlural, runInChunks } from '../helpers/helpers.js';
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

export async function getLayout(path, details) {
	const typeFolders = [];
	const layoutFiles = [];
	const { content } = pathHelper.getPaths();
	const isHome = path.endsWith(`${content}/_index.md`);
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

			if (typeof tree[typeFolder]?.[layoutFile] === 'string') {
				return tree[typeFolder][layoutFile];
			}
		}
	}
}

export function getCollectionKey(path, collectionsConfig) {
	const paths = pathHelper.getPaths();
	const pathIsBranchIndex = isBranchIndex(path);
	const normalised = path.replace(/\/index\.(md|html?)$/, '');
	const parts = normalised.split('/');

	// Find collection from config based on explicit path
	for (let i = parts.length - 1; i >= 0; i--) {
		const collectionPath = parts.slice(0, i).join('/');

		const configKey = Object.keys(collectionsConfig || {}).find((key) => {
			return collectionsConfig[key]
				&& collectionsConfig[key].path === collectionPath
				&& (!pathIsBranchIndex || collectionsConfig[key].parse_branch_index);
		});

		if (configKey) {
			return configKey;
		}
	}

	const contentPrefix = `${paths.content}/`;
	if (!path.startsWith(contentPrefix)) {
		return null; // Not in content path
	}

	// Fall back to using top-level folder inside content path
	const normalisedContentPath = normalised.replace(contentPrefix, '');
	const [folderKey, ...contentParts] = normalisedContentPath.split('/');
	const isCollection = contentParts.length > 0
		&& (!pathIsBranchIndex || collectionsConfig?.[folderKey]?.parse_branch_index);

	if (isCollection) {
		return folderKey; // Valid subfolder in content path
	}

	// Either directly inside the content path, or a branch index file.
	return 'pages';
}

function isBranchIndex(path) {
	return !!path.match(/\/_index\.(md|html?)$/);
}

function isIndex(path) {
	return !!path.match(/\/_?index\.(md|html?)$/);
}

export function getPageUrlFromPath(path, contentDir) {
	if (!isIndex(path)) {
		return;
	}

	return path
		.replace(`${contentDir || ''}/`, '/')
		.replace(/\/_?index\.(md|html?)/, '/')
		.replace(/\/+/g, '/');
}

async function processItem(path, collectionKey, hugoUrls) {
	const paths = pathHelper.getPaths();
	const parsed = await parseFile(join(paths.source, path));

	const item = {
		url: hugoUrls[path] || getPageUrlFromPath(path, paths.content) || '',
		path,
		collection: collectionKey,
		...parsed
	};

	const contentPrefix = `${paths.content}/`;
	if (path.startsWith(contentPrefix) && !item.content_path) {
		item.content_path = path.replace(contentPrefix, '');
	}

	if (item.headless || !item.url) {
		item.output = false;
	}

	const layout = await getLayout(path, parsed);
	if (layout && item.url) {
		item.layout = layout;
	}

	if (item.draft) {
		item.published = false;
	}

	return item;
}

export async function getCollectionsAndConfig(config, hugoUrls) {
	const paths = pathHelper.getPaths();
	const override = config.collections_config_override === true;
	const rawCollectionsConfig = config.collections_config || {};
	const dataPath = pathHelper.normalisePath(rawCollectionsConfig.data?.path) || paths.data;
	const pagesPath = pathHelper.normalisePath(rawCollectionsConfig.pages?.path) || paths.content;
	const skippedCollections = {};
	const collections = {};

	const extraPaths = Object.keys(rawCollectionsConfig).reduce((memo, collectionKey) => {
		const path = pathHelper.normalisePath(rawCollectionsConfig[collectionKey].path);
		return (path && !path.startsWith(paths.content)) ? [path, ...memo] : memo;
	}, []);

	const filePaths = await pathHelper.getCollectionPaths(extraPaths);
	const collectionsConfig = { ...rawCollectionsConfig };

	log('⏳ Processing collections...');

	await runInChunks(filePaths, async (path) => { // Runs in chunks to avoid memory issues
		const collectionKey = getCollectionKey(path, collectionsConfig);
		if (!collectionKey) {
			log(`No collection for ${chalk.yellow(path)}`, 'debug');
			return;
		}

		// Skipped if not defined in global config with collections_config_override enabled
		if (override && !rawCollectionsConfig[collectionKey]) {
			log(`Skipping ${chalk.bold(collectionKey)} collection for ${chalk.yellow(path)}`, 'debug');
			skippedCollections[collectionKey] = (skippedCollections[collectionKey] || 0) + 1;
			return;
		}

		log(`Parsing ${chalk.green(path)} into ${chalk.bold(collectionKey)} collection`, 'debug');
		const item = await processItem(path, collectionKey, hugoUrls);
		collections[collectionKey] = collections[collectionKey] || [];
		collections[collectionKey].push(item);

		// Sets config as output if any file inside it is output
		const output = collectionsConfig[collectionKey]?.output
			|| (path.startsWith(paths.data) ? false : !item.headless);

		collectionsConfig[collectionKey] = {
			path: `${paths.content}/${collectionKey}`,
			...collectionsConfig[collectionKey],
			output
		};
	});

	if (!override) {
		const hasData = Object.prototype.hasOwnProperty.call(rawCollectionsConfig, 'data')
			|| (await pathHelper.getDataPaths()).length > 0;

		collectionsConfig.data = {
			output: false,
			auto_discovered: !hasData,
			...collectionsConfig.data,
			path: dataPath,
		};

		// Set after processing files to avoid auto-discovered collections using this containing path
		collectionsConfig.pages = {
			output: true,
			filter: 'strict',
			parse_branch_index: true,
			auto_discovered: !Object.prototype.hasOwnProperty.call(rawCollectionsConfig, 'pages'),
			...collectionsConfig.pages,
			path: pagesPath,
		};
	}

	const processedCollections = Object.keys(collectionsConfig).reduce((memo, collectionKey) => {
		const collection = collections[collectionKey] || [];

		// This is unset if a collection has not files and a configuration without path
		collectionsConfig[collectionKey].path = collectionsConfig[collectionKey].path
			|| `${paths.content}/${collectionKey}`;

		if (collection.length === 0 && collectionsConfig[collectionKey]?.auto_discovered) {
			log(`📂 ${chalk.yellow('Ignored')} ${chalk.bold(collectionKey)} collection`);
			delete collectionsConfig[collectionKey];
			return memo;
		}

		memo[collectionKey] = collection || [];
		const filesCount = cheapPlural(collection.length, 'file');
		log(`📁 Processed ${chalk.bold(collectionKey)} collection with ${filesCount}`);
		return memo;
	}, {});

	Object.keys(skippedCollections).forEach((collectionKey) => {
		const filesCount = cheapPlural(skippedCollections[collectionKey], 'file');
		log(`📂 ${chalk.yellow('Skipped')} ${chalk.bold(collectionKey)} collection with ${filesCount}`);
	});

	return {
		collectionsConfig,
		collections: processedCollections
	};
}
