/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const csvParse = require('csv-parse/lib/sync');
const Path = require('path');
const { promises: fsProm } = require('fs');
const { getGlob, runProcess, getPaths } = require('../helpers/helpers');

const { cloudCannonMeta, markdownMeta } = require('../helpers/metadata');
const helpers = require('../helpers/helpers');

module.exports = {

	getMarkdownMetadata: async function (config) {
		if (config.markup) {
			return config.markup;
		}
		return markdownMeta;
	},

	getGeneratorDetails: async function (config) {
		const hugoVersion = await runProcess('hugo', ['version']);
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

	getItemDetails: async function (path) {
		try {
			const data = await fsProm.readFile(path, 'utf-8');
			const frontMatterObject = await helpers.parseFrontMatter(data);
			return frontMatterObject;
		} catch (parseError) {
			return {};
		}
	},

	getCollectionPaths: async function (paths) {
		const archetypeGlob = `**/${paths.archetypes}/**/**.md`;
		const archetypePaths = await getGlob(archetypeGlob, { ignore: '**/default.md' });

		const contentGlob = `**/${paths.content}/*/**`;
		const contentPaths = await getGlob(contentGlob);

		const collectionPaths = archetypePaths.concat(contentPaths);

		// remove empty string and duplicates
		return Array.from(new Set(collectionPaths.filter((item) => item)));
	},

	getFileUrlsPerPath: async function (baseurl) {
		const fileCsv = await runProcess('hugo', ['list', 'all']);
		const fileList = csvParse(fileCsv, {
			columns: true,
			skipEmptyLines: true
		});

		const urlsPerPath = {};
		fileList.forEach(async (file) => {
			const { path } = file;
			let { permalink: url } = file;
			url = `/${url.replace(baseurl, '')}`;

			urlsPerPath[path] = url;
		});

		return Promise.resolve(urlsPerPath);
	},

	getDataFiles: async function (dataPath) {
		const data = [];
		const dataFiles = await getGlob(dataPath) || [];
		dataFiles.forEach(async (path) => {
			const collectionItem = {
				"url": `/${path}`,
				"path": path.replace(`${dataPath}/`, ''),
				collection: 'data',
				output: false
			};
			const itemDetails = await this.getItemDetails(path);
			Object.assign(collectionItem, itemDetails);

			data.push(collectionItem);
		});
		return Promise.resolve(data);
	},

	getCollections: async function (config) {
		const collections = {};
		const paths = getPaths(config);
		const collectionPaths = await this.getCollectionPaths(paths);
		const urlsPerPath = await this.getFileUrlsPerPath(config.baseURL);

		collectionPaths.forEach(async (path) => {
			const collectionName = this.getCollectionName(path);
			if (collectionName) {
				const url = urlsPerPath[path];
				const collectionItem = {
					"url": url || path.replace(`${paths.content}/`, ''),
					"path": path.replace(`${paths.content}/`, ''),
					collection: collectionName
				};
				const itemDetails = await this.getItemDetails(path);
				Object.assign(collectionItem, itemDetails);

				if (collectionItem.draft) {
					delete collectionItem.draft;
					collectionItem.published = false;
				}

				if (collectionItem.headless) {
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

	getPages: async function (config) {
		const paths = getPaths(config);
		const contentFiles = await getGlob(`**/${paths.content}/**/*.md`, { ignore: `**/${paths.content}/*/*.md` });
		const indexFiles = await getGlob(`**/${paths.content}/**/*index.md`);

		// remove duplicates
		const files = Array.from(new Set(contentFiles.concat(indexFiles)));

		const pages = Promise.all(files.map(async (page) => {
			const itemDetails = await this.getItemDetails(page);
			const item = {
				name: Path.basename(page),
				path: page.replace(`${paths.content}/`, ''),
				url: `/${page}`,
				title: Path.basename(page)
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
		// const baseurl = hugoConfig["baseURL"] || "";
		const collections = await this.getCollections(hugoConfig);
		const generator = await this.getGeneratorDetails(hugoConfig);
		const pages = await this.getPages(hugoConfig);

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
