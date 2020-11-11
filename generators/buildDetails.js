/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
// const csvParse = require('csv-parse/lib/sync');
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
		const data = await fsProm.readFile(path, 'utf-8');
		try {
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

	getCollections: async function (paths) {
		const collections = {};
		const collectionPaths = await this.getCollectionPaths(paths);
		collectionPaths.forEach(async (path) => {
			const collectionName = this.getCollectionName(path);
			if (collectionName) {
				const collectionItem = {
					"url": `/${path}`,
					"path": path,
					collection: collectionName
				};
				const itemDetails = await this.getItemDetails(path);
				Object.assign(collectionItem, itemDetails);

				if (collections[collectionName]) {
					collections[collectionName].push(collectionItem);
				} else {
					collections[collectionName] = [collectionItem];
				}
			}
		});

		/*
		gets all publishable files in content/
		const fileCsv = await runProcess('hugo', ['list', 'all']);
		const fileList = csvParse(fileCsv, {
			columns: true,
			skipEmptyLines: true
		});

		fileList.forEach(async (file) => {
			const { path } = file;
			const collectionName = this.getCollectionName(path);
			if (collectionName) {
				let { permalink: url } = file;
				url = `/${url.replace(baseurl, "")}`;
				const itemDetails = await this.getItemDetails(path);

				Object.assign(collectionItem, itemDetails); // add itemDetails to collectionItem

				if (collections[collectionName]) {
					collections[collectionName].push(collectionItem);
				} else {
					collections[collectionName] = [collectionItem];
				}
			}
		});
		*/
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
				dir: `/${Path.dirname(page)}/`, // not needed
				name: Path.basename(page),
				path: page,
				url: `/${page}`,
				title: Path.basename(page)
			};
			Object.assign(item, itemDetails);
			return Promise.resolve(item);
		}));

		return pages;
	},

	generateDetails: async function (hugoConfig) {
		const baseurl = hugoConfig["baseURL"] || "";
		const paths = getPaths(hugoConfig);
		const collections = await this.getCollections(paths, baseurl);
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
