/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const csvParse = require('csv-parse/lib/sync');
const Path = require('path');
const { promises: fsProm } = require('fs');
const { getGlob, runProcess, getPaths } = require('../helpers/helpers');

const { cloudCannonMeta, markdownMeta } = require('../helpers/metadata');
const helpers = require('../helpers/helpers');

async function getMarkdownMetadata(config) {
	if (config.markup) {
		return config.markup;
	}
	return markdownMeta;
}

async function getGeneratorDetails(config) {
	const hugoVersion = await runProcess('hugo', ['version']);
	const versionNumber = hugoVersion.match(/[0-9]+\.[0-9]+\.[0-9]+/g);

	const markdownDetails = await getMarkdownMetadata(config);

	const generator = {
		"name": "hugo",
		"version": versionNumber ? versionNumber[0] : "0.0.0",
		"metadata": markdownDetails
	};

	return Promise.resolve(generator);
}

function getCollectionName(path) {
	const fileName = Path.basename(path);
	let dir = Path.dirname(path);
	if (fileName.search(/^(_?)index/g) >= 0) {
		dir = Path.dirname(dir);
	}
	const nameFilter = /.*\//g; // the unimportant part
	const extraPart = dir.match(nameFilter);

	return extraPart ? dir.replace(extraPart[0], '') : '';
}

async function getItemDetails(path) {
	const data = await fsProm.readFile(path, 'utf-8');
	try {
		const frontMatterObject = await helpers.parseFrontMatter(data);
		return frontMatterObject;
	} catch (parseError) {
		return {};
	}
}

async function getCollections(baseurl) {
	// gets all publishable files in content/
	const fileCsv = await runProcess('hugo', ['list', 'all']);
	const fileList = csvParse(fileCsv, {
		columns: true,
		skipEmptyLines: true
	});

	const collections = {};
	fileList.forEach(async (file) => {
		const { path } = file;
		let { permalink: url } = file;
		url = `/${url.replace(baseurl, "")}`;
		const collectionName = getCollectionName(path);
		if (collectionName) {
			const collectionItem = {
				"path": path,
				"url": url,
				collection: collectionName
			};
			const itemDetails = await getItemDetails(path);

			Object.assign(collectionItem, itemDetails); // add itemDetails to collectionItem

			if (collections[collectionName]) {
				collections[collectionName].push(collectionItem);
			} else {
				collections[collectionName] = [collectionItem];
			}
		}
	});
	return Promise.resolve(collections);
}

async function getPages(config) {
	const paths = getPaths(config);
	const indexFiles = await getGlob('**/index.md', { ignore: `**/${paths.archetypes}/**/**.md` });
	const allPages = indexFiles.concat(['layouts/index.html', 'layouts/404.html']);
	const pages = allPages.map((page) => ({
		dir: `/${Path.dirname(page)}/`,
		name: Path.basename(page),
		path: page,
		url: `/${page}`,
		title: Path.basename(page)
	}));
	return pages;
}

module.exports = {
	generateDetails: async function (hugoConfig) {
		const baseurl = hugoConfig["baseURL"] || "";
		const collections = await getCollections(baseurl);
		const generator = await getGeneratorDetails(hugoConfig);
		const pages = await getPages(hugoConfig);

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
