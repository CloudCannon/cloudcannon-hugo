/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const csvParse = require('csv-parse/lib/sync');
const Path = require('path');

const helpers = require('../helpers/helpers');
const pathHelper = require('../helpers/paths');

const { cloudCannonMeta, markdownMeta } = require('../helpers/metadata');

module.exports = {

	getMarkdownMetadata: function (config) {
		const markup = config.markup || {};

		const markdownHandler = markup.defaultMarkdownHandler || 'goldmark';
		const defaultMeta = markdownMeta[markdownHandler] || {};

		const markdownConfig = helpers.mergeDeep(defaultMeta, markup[markdownHandler]);

		const meta = {
			markdown: markdownHandler,
			[markdownHandler]: markdownConfig
		};

		return meta;
	},

	getGeneratorDetails: function (config) {
		const hugoVersion = helpers.runProcess('hugo', ['version']);
		const versionNumber = hugoVersion.match(/[0-9]+\.[0-9]+\.[0-9]+/g);

		const markdownDetails = this.getMarkdownMetadata(config);

		const generator = {
			"name": "hugo",
			"version": versionNumber ? versionNumber[0] : "0.0.0",
			"metadata": markdownDetails
		};

		return generator;
	},

	getCollectionName: function (path, rootDir = '') {
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
		const fileList = csvParse(fileCsv, {
			columns: true,
			skipEmptyLines: true
		});

		const urlsPerPath = {};
		fileList.forEach((file) => {
			const { path, permalink } = file;
			urlsPerPath[path] = helpers.getUrlPathname(permalink);
		});

		return urlsPerPath;
	},

	getDataFiles: async function (allowedCollections) {
		const data = {};
		const { data: dataDir } = pathHelper.getPaths();
		const dataFiles = await pathHelper.getDataPaths();

		await Promise.all(dataFiles.map(async (path) => {
			const filename = Path.basename(path, Path.extname(path));
			const collectionName = this.getCollectionName(path, dataDir);

			if (allowedCollections && !allowedCollections.includes(collectionName || filename)) {
				return;
			}

			const contents = await helpers.parseDataFile(path) || {};

			if (collectionName) {
				if (!data[collectionName]) {
					data[collectionName] = {};
				}
				data[collectionName][filename] = contents;
			} else {
				data[filename] = contents;
			}

			return Promise.resolve();
		}));
		return data;
	},

	getCollections: async function (urlsPerPath) {
		const collections = {};
		const { content } = pathHelper.getPaths();
		const collectionPaths = await pathHelper.getCollectionPaths();

		await Promise.all(collectionPaths.map(async (path) => {
			const collectionName = this.getCollectionName(path, content);
			if (collectionName) {
				const url = this.getPageUrl(path, urlsPerPath, content);
				const collectionItem = {
					url: url || '',
					path: path,
					collection: collectionName
				};
				const itemDetails = await helpers.getItemDetails(path);
				Object.assign(collectionItem, itemDetails);

				const layout = await this.getLayout(path, itemDetails);
				collectionItem.layout = layout || '';

				if (collectionItem.draft) {
					delete collectionItem.draft;
					collectionItem.published = false;
				}

				if (collectionItem.headless || (!url && path.indexOf('index') < 0)) {
					delete collectionItem.headless;
					collectionItem.output = false;
				}

				if (collections[collectionName]) {
					collections[collectionName].push(collectionItem);
				} else {
					collections[collectionName] = [collectionItem];
				}
			}
			return Promise.resolve();
		}));

		return collections;
	},

	getLayout: async function (path, details) {
		const typeFolders = [];
		const layoutFiles = [];
		const { content } = pathHelper.getPaths();
		const isHome = path.indexOf(`${content}/_index.md`) >= 0;

		const basename = Path.basename(path);
		const isSingle = basename.indexOf('_index.md') < 0;

		const { layout, type } = details;
		const section = this.getCollectionName(path);

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

	getPages: async function (urlsPerPath) {
		const { content } = pathHelper.getPaths();
		const pagePaths = await pathHelper.getPagePaths();

		const pages = Promise.all(pagePaths.map(async (path) => {
			const itemDetails = await helpers.getItemDetails(path);
			const url = this.getPageUrl(path, urlsPerPath, content);
			const layout = await this.getLayout(path, itemDetails);

			const item = {
				name: Path.basename(path),
				path: path,
				url: url || '',
				title: Path.basename(path),
				layout: layout || ''
			};
			Object.assign(item, itemDetails);
			if (item.draft) {
				delete item.draft;
				item.published = false;
			}

			if (item.headless) {
				delete item.headless;
				item.output = false;
			}
			return item;
		}));

		return pages;
	},

	generateDetails: async function (hugoConfig) {
		const urlsPerPath = this.getHugoUrls();
		const collections = await this.getCollections(urlsPerPath);
		const pages = await this.getPages(urlsPerPath);
		const generator = this.getGeneratorDetails(hugoConfig);

		const details = {
			"time": "",
			"cloudcannon": cloudCannonMeta,
			"generator": generator,
			"collections": collections,
			"pages": pages
		};

		if (hugoConfig.cloudcannon && hugoConfig.cloudcannon.data) {
			const dataConfig = hugoConfig.cloudcannon.data;
			let dataCollections;
			if (typeof dataConfig === 'object') {
				dataCollections = Object.keys(dataConfig);
			}
			const data = await this.getDataFiles(dataCollections);
			details.data = data;
		}

		return details;
	}
};
