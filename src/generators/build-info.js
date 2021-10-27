const csvParse = require('csv-parse/lib/sync');
const Path = require('path');
const chalk = require('chalk');
const helpers = require('../helpers/helpers');
const pathHelper = require('../helpers/paths');
const { cloudCannonMeta, markdownMeta } = require('../helpers/metadata');
const { log } = require('../helpers/logger');

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

	getCollectionNameConfig: function (path, contentDir, archetypePath) {
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
	},

	getPageUrl: function (path, hugoUrls = {}, contentDir) {
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
	},

	getHugoUrls: function () {
		const { source } = pathHelper.getPaths();
		const fileCsv = helpers.runProcess('hugo', ['list', 'all', '--source', source]);
		const fileList = csvParse(fileCsv, { columns: true, skipEmptyLines: true });

		return fileList.reduce((memo, file) => {
			memo[file.path] = helpers.getUrlPathname(file.permalink);
			return memo;
		}, {});
	},

	getLayout: async function (path, details) {
		const typeFolders = [];
		const layoutFiles = [];
		const { content } = pathHelper.getPaths();
		const isHome = path.indexOf(`${content}/_index.md`) >= 0;
		const basename = Path.basename(path);
		const isSingle = basename.indexOf('_index.md') < 0;
		const { layout, type } = details;
		const section = this.getSectionName(path);

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
	},

	generateMarkdownMetadata: function (hugoConfig) {
		const markup = hugoConfig.markup ?? {};
		const markdownHandler = markup.defaultMarkdownHandler ?? 'goldmark';
		const defaultMeta = markdownMeta[markdownHandler] ?? {};

		return {
			markdown: markdownHandler,
			[markdownHandler]: helpers.mergeDeep(defaultMeta, markup[markdownHandler])
		};
	},

	generateGenerator: function (hugoConfig) {
		const hugoVersion = helpers.runProcess('hugo', ['version']);

		return {
			name: 'hugo',
			version: hugoVersion.match(/[0-9]+\.[0-9]+\.[0-9]+/g)?.[0] ?? '0.0.0',
			metadata: this.generateMarkdownMetadata(hugoConfig)
		};
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

			const contents = await helpers.parseDataFile(path) ?? {};

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

	generateCollectionItem: async function (itemPath, itemDetails, collectionName, urlsPerPath) {
		const { archetypes, content } = pathHelper.getPaths();
		const isArchetype = itemPath.indexOf(archetypes) >= 0;

		let item;
		if (!isArchetype) {
			const url = this.getPageUrl(itemPath, urlsPerPath, content);
			const layout = await this.getLayout(itemPath, itemDetails);

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
	},

	generateCollectionConfigItem: async function (itemPath, itemDetails, collectionName, config) {
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
	},

	generateCollectionsInfo: async function (config, urlsPerPath) {
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

		await Promise.all(collectionItemPaths.map(async (itemPath) => {
			const collectionName = definedCollections[Path.dirname(itemPath)]
				|| this.getCollectionNameConfig(
					itemPath,
					paths.content,
					paths.archetypes
				);

			if (collectionName) {
				const itemDetails = await helpers.getItemDetails(itemPath);

				const collectionConfigItem = await this.generateCollectionConfigItem(
					itemPath, itemDetails, collectionName, cloudcannonCollections
				);
				collectionConfigItem.output = collectionConfigItem.output
					|| (collectionsConfig[collectionName]?.output ?? false); // true if any output: true;
				collectionsConfig[collectionName] = collectionConfigItem;

				const collectionItem = await this.generateCollectionItem(
					itemPath, itemDetails, collectionName, urlsPerPath
				);
				if (collections[collectionName]) {
					collections[collectionName].push(collectionItem);
				} else {
					collections[collectionName] = collectionItem ? [collectionItem] : [];
				}
			}
		}));

		if (!collectionsConfig.pages && pagePaths.length) {
			collectionsConfig.pages = {
				path: paths.content,
				output: true,
				filter: 'strict',
				...cloudcannonCollections.pages
			};
			collections.pages = [];

			await Promise.all(pagePaths.map(async (itemPath) => {
				const itemDetails = await helpers.getItemDetails(itemPath);

				const collectionItem = await this.generateCollectionItem(
					itemPath, itemDetails, 'pages', urlsPerPath
				);
				collections.pages.push(collectionItem);
			}));
		}

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
	},

	generatePages: async function (urlsPerPath) {
		const { content } = pathHelper.getPaths();
		const pagePaths = await pathHelper.getPagePaths();

		const pages = Promise.all(pagePaths.map(async (path) => {
			const itemDetails = await helpers.getItemDetails(path);
			const url = this.getPageUrl(path, urlsPerPath, content);
			const layout = await this.getLayout(path, itemDetails);
			const basename = Path.basename(path);

			const item = {
				name: basename,
				title: basename,
				url: url,
				path: path,
				...itemDetails
			};

			if (layout) {
				item.layout = layout;
			}

			if (item.draft) {
				item.published = false;
			}

			if (item.headless) {
				item.output = false;
			}

			return item;
		}));

		return pages;
	},

	generateInfo: async function (hugoConfig) {
		const urlsPerPath = this.getHugoUrls();
		const paths = pathHelper.getPaths();

		// params key is case insensitive
		const paramsKey = Object.keys(hugoConfig).find((key) => key.toLowerCase() === 'params');
		const hugoParams = hugoConfig[paramsKey] ?? {};

		const {
			collections,
			collectionsConfig
		} = await this.generateCollectionsInfo(hugoConfig, urlsPerPath);

		return {
			time: new Date().toISOString(),
			cloudcannon: cloudCannonMeta,
			generator: this.generateGenerator(hugoConfig),
			source: paths.source || '',
			'base-url': helpers.getUrlPathname(hugoConfig.baseURL),
			'collections-config': collectionsConfig,
			_comments: hugoConfig._comments ?? hugoParams._comments ?? {},
			_options: hugoConfig._options ?? hugoParams._options ?? {},
			_collection_groups: hugoConfig._collection_groups ?? hugoParams._collection_groups,
			_editor: hugoConfig._editor ?? hugoParams._editor ?? {},
			_source_editor: hugoConfig._source_editor
				?? hugoParams._source_editor
				?? hugoParams._sourceEditor
				?? {},
			_enabled_editors: hugoConfig._enabled_editors ?? hugoParams._enabled_editors,
			_instance_values: hugoConfig._instance_values ?? hugoParams._instance_values,
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
