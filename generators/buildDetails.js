/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const csvParse = require('csv-parse/lib/sync');
const Path = require('path');

const helpers = require('../helpers/helpers');

const { cloudCannonMeta, markdownMeta } = require('../helpers/metadata');

module.exports = {

	getMarkdownMetadata: async function (config) {
		if (config.markup) {
			return config.markup;
		}
		return markdownMeta;
	},

	getGeneratorDetails: async function (config) {
		const hugoVersion = await helpers.runProcess('hugo', ['version']);
		const versionNumber = hugoVersion.match(/[0-9]+\.[0-9]+\.[0-9]+/g);

		const markdownDetails = await this.getMarkdownMetadata(config);

		const generator = {
			"name": "hugo",
			"version": versionNumber ? versionNumber[0] : "0.0.0",
			"metadata": markdownDetails
		};

		return Promise.resolve(generator);
	},

	getCollectionName: function (path) {
		const fileName = Path.basename(path);
		let dir = Path.dirname(path);
		if (fileName.search(/^(_?)index/g) >= 0) {
			dir = Path.dirname(dir);
		}
		const nameFilter = /.*\//g; // the unimportant part
		const extraPart = dir.match(nameFilter);

		return extraPart ? dir.replace(extraPart[0], '') : '';
	},

	getCollectionPaths: async function (paths) {
		const archetypeGlob = `**/${paths.archetypes}/**/**.md`;
		const archetypePaths = await helpers.getGlob(archetypeGlob, { ignore: '**/default.md' });

		const contentGlob = `**/${paths.content}/*/**`;
		const contentPaths = await helpers.getGlob(contentGlob);

		const collectionPaths = archetypePaths.concat(contentPaths);

		// remove empty string and duplicates
		return Array.from(new Set(collectionPaths.filter((item) => item)));
	},

	getPageUrl: function (path, hugoUrls, contentDir) {
		if (hugoUrls[path]) {
			return hugoUrls[path].replace('//', '/');
		}
		if (path.indexOf('index') >= 0) {
			return path
				.replace(`${contentDir || ''}/`, '/')
				.replace(/\/_?index\.md/, '/')
				.replace('//', '/');
		}
		return '';
	},

	getHugoUrls: async function (baseurl) {
		const fileCsv = await helpers.runProcess('hugo', ['list', 'all']);
		const fileList = csvParse(fileCsv, {
			columns: true,
			skipEmptyLines: true
		});

		const urlsPerPath = {};
		fileList.forEach((file) => {
			const { path, permalink } = file;
			const url = `/${permalink.replace(baseurl, '')}`;

			urlsPerPath[path] = url;
		});

		return Promise.resolve(urlsPerPath);
	},

	getDataFiles: async function (dataPath) {
		const data = [];
		const dataFiles = await helpers.getGlob(dataPath) || [];
		dataFiles.forEach(async (path) => {
			const collectionItem = {
				"url": '',
				"path": path.replace(`${dataPath}/`, ''),
				collection: 'data',
				output: false
			};
			const itemDetails = await helpers.getItemDetails(path);
			Object.assign(collectionItem, itemDetails);

			data.push(collectionItem);
		});
		return Promise.resolve(data);
	},

	getCollections: async function (config, urlsPerPath) {
		const collections = {};
		const paths = helpers.getPaths(config);
		const collectionPaths = await this.getCollectionPaths(paths);

		collectionPaths.forEach(async (path) => {
			const collectionName = this.getCollectionName(path);
			if (collectionName) {
				const url = this.getPageUrl(path, urlsPerPath, paths.content);
				const collectionItem = {
					"url": url || '',
					"path": path.replace(`${paths.content}/`, ''),
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
		});

		collections.data = await this.getDataFiles(paths.data);

		return Promise.resolve(collections);
	},

	getPages: async function (config, urlsPerPath) {
		const paths = helpers.getPaths(config);
		const contentFiles = await helpers.getGlob(`**/${paths.content}/**/*.md`, { ignore: `**/${paths.content}/*/*.md` });
		const indexFiles = await helpers.getGlob(`**/${paths.content}/**/*index.md`);

		// concat and remove duplicates
		const files = Array.from(new Set(contentFiles.concat(indexFiles)));

		const pages = Promise.all(files.map(async (path) => {
			const itemDetails = await helpers.getItemDetails(path);
			const url = this.getPageUrl(path, urlsPerPath, paths.content);
			const item = {
				name: Path.basename(path),
				path: path.replace(`${paths.content}/`, ''),
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
			return Promise.resolve(item);
		}));

		return pages;
	},

	generateDetails: async function (hugoConfig) {
		const urlsPerPath = await this.getHugoUrls(hugoConfig.baseURL);
		const collections = await this.getCollections(hugoConfig, urlsPerPath);
		const pages = await this.getPages(hugoConfig, urlsPerPath);
		const generator = await this.getGeneratorDetails(hugoConfig);

		return {
			"time": "",
			"cloudcannon": cloudCannonMeta,
			"generator": generator,
			"collections": collections,
			"pages": pages,
			"baseurl": hugoConfig["baseURL"] || ""
		};
	}
};
