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
		if (config.markup) {
			return config.markup;
		}
		return markdownMeta;
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
		if (fileName.search(/^(_?)index/g) >= 0) {
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

	getPages: async function (urlsPerPath) {
		const { content } = pathHelper.getPaths();
		const pagePaths = await pathHelper.getPagePaths();

		const pages = Promise.all(pagePaths.map(async (path) => {
			const itemDetails = await helpers.getItemDetails(path);
			const url = this.getPageUrl(path, urlsPerPath, content);
			const item = {
				name: Path.basename(path),
				path: path,
				url: url || '',
				title: Path.basename(path)
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
