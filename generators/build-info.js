const csvParse = require('csv-parse/lib/sync');
const Path = require('path');
const helpers = require('../helpers/helpers');
const pathHelper = require('../helpers/paths');
const { cloudCannonMeta, markdownMeta } = require('../helpers/metadata');

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

	getCollectionName: function (path, rootDir = '') {
		if (path.indexOf(rootDir) !== 0) {
			return '';
		}

		const parts = path.replace(`${rootDir}/`, '').split('/');
		return parts.length > 1 ? parts[0] : '';
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

		if (path.indexOf('_index.md') >= 0) {
			return path.replace(`${contentDir}/`, '').split('/')[0];
		}
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
		const fileCsv = helpers.runProcess('hugo', ['list', 'all']);
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

	generateData: async function (hugoParams) {
		const dataConfig = hugoParams?.cloudcannon?.data;
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

		return data;
	},

	generateCollectionsConfig: async function (hugoConfig, hugoParams, paths) {
		const collectionPaths = await pathHelper.getCollectionPaths();
		const collections = {
			data: {
				path: paths.data,
				output: false,
				...hugoParams?.cloudcannon?.collections?.data
			}
		};

		await Promise.all(collectionPaths.map(async (collectionPath) => {
			const collectionName = this.getCollectionNameConfig(
				collectionPath,
				paths.content,
				paths.archetypes
			);

			if (collectionName && !collections[collectionName]) {
				const itemDetails = await helpers.getItemDetails(collectionPath);

				collections[collectionName] = {
					path: `${paths.content}/${collectionName}`,
					output: !itemDetails.headless,
					...hugoParams?.cloudcannon?.collections?.[collectionName]
				};
			}
		}));

		return collections;
	},

	generateCollections: async function (urlsPerPath) {
		const collections = {};
		const { content } = pathHelper.getPaths();
		const collectionPaths = await pathHelper.getCollectionPaths();

		await Promise.all(collectionPaths.map(async (path) => {
			const collectionName = this.getCollectionName(path, content);
			if (collectionName) {
				const url = this.getPageUrl(path, urlsPerPath, content);
				const itemDetails = await helpers.getItemDetails(path);
				const layout = await this.getLayout(path, itemDetails);

				const item = {
					url: url || '',
					path: path,
					collection: collectionName,
					...itemDetails
				};

				if (layout) {
					item.layout = layout;
				}

				if (item.draft) {
					item.published = false;
				}

				if (item.headless || (!url && path.indexOf('index') < 0)) {
					item.output = false;
				}

				if (collections[collectionName]) {
					collections[collectionName].push(item);
				} else {
					collections[collectionName] = [item];
				}
			}
		}));

		return collections;
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

		return {
			time: new Date().toISOString(),
			cloudcannon: cloudCannonMeta,
			generator: this.generateGenerator(hugoConfig),
			source: '', // TODO
			'base-url': helpers.getUrlPathname(hugoConfig.baseURL),
			'collections-config': await this.generateCollectionsConfig(hugoConfig, hugoParams, paths),
			_comments: hugoParams._comments ?? {},
			_options: hugoParams._options ?? {},
			_collection_groups: hugoParams._collection_groups,
			_editor: hugoParams._editor ?? {},
			_source_editor: hugoParams._source_editor ?? hugoParams._sourceEditor ?? {},
			_enabled_editors: hugoParams._enabled_editors,
			_array_structures: hugoParams._array_structures ?? hugoParams._arrayStructures ?? {},
			_select_data: hugoParams._select_data ?? hugoParams._selectData ?? {},
			paths: paths,
			collections: await this.generateCollections(urlsPerPath),
			pages: await this.generatePages(urlsPerPath),
			data: await this.generateData(hugoParams)
		};
	}
};
