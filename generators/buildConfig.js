/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const Path = require('path');
const glob = require('glob');

const { promisify } = require('util');

const globPromise = promisify(glob);

const { cloudCannonMeta } = require('../helpers/metadata');

async function getDefaultsPaths(paths) {
	const indexPaths = `**/${paths.content}/**/_index.md`;
	const archetypes = `**/${paths.archetypes}/**.md`;

	const defaultsGlob = `{${indexPaths},${archetypes}}`;
	try {
		const defaultsPaths = await globPromise(defaultsGlob, {
			nounique: true,
			ignore: '**/exampleSite/**'
		});
		return defaultsPaths;
	} catch (globErr) {
		console.err(globErr);
	}
}

async function getCollectionsPaths(paths) {
	const archetypes = `**/${paths.archetypes}/**.**`;
	const options = {
		nounique: true,
		ignore: '**/default.**'
	};

	let defaultsGlob = [];
	try {
		defaultsGlob = await globPromise(archetypes, options);
	} catch (globErr) {
		console.err(globErr);
	}

	const collectionsArray = defaultsGlob.map((item) => Path.basename(item, Path.extname(item)));

	const collections = {};
	collectionsArray.forEach((collection) => {
		collections[collection] = {};
	});
	return collections;
}

async function generateDefault(path) {
	// let content;
	// try {
	// content = await readFile(path, 'utf-8');
	// } catch (readErr) {
	// console.error(readErr);
	// }

	// const frontMatter = content? await parseFrontMatter(content) : {};
	const scope = {};
	scope.path = Path.dirname(path).replace('archetypes', '');

	const type = Path.basename(path, Path.extname(path));
	if (type !== 'default') {
		scope.type = type;
	}

	const defaultData = {
		'scope': scope
	};

	return Promise.resolve(defaultData);
}

function getPaths(config) {
	return {
		"archetypes": config["archetypeDir"] || "archetypes",
		"assets": config["assetDir"] || "assets",
		"content": config["contentDir"] || "content",
		"data": config["dataDir"] || "data",
		"layouts": config["layoutDir"] || "layouts",
		"publish": config["publishDir"] || "public",
		"static": config["staticDir"] || "static",
		"themes": config["themesDir"] || "themes"
	};
}

module.exports = {
	generateConfig: async function (hugoConfig) {
		// let configOutput = await runProcess('hugo', ['config']);
		// configOutput = configOutput.split('\n');
		// console.log(configOutput);

		const paths = getPaths(hugoConfig);
		const defaultsPaths = await getDefaultsPaths(paths);

		const defaults = [];
		await Promise.all(defaultsPaths.map(async (path) => {
			const defaultData = await generateDefault(path);
			defaults.push(defaultData);
		}));

		const collections = await getCollectionsPaths(paths);

		const cloudCannonSpecific = hugoConfig.params ? hugoConfig.params.cloudcannon : null;

		return {
			'time': '2020-09-16T22:50:17+00:00', // get build time here
			'cloudcannon': cloudCannonMeta,
			'source': '', // don't think hugo has custom src / mabe get this from cloudcannon
			'timezone': null, // hugo has no timezones - get this from cloudcannon
			'include': cloudCannonSpecific ? cloudCannonSpecific['include'] : {},
			'exclude': cloudCannonSpecific ? cloudCannonSpecific['exclude'] : {},
			'base-url': hugoConfig['baseURL'] || '',
			'collections': collections, // perhaps taxonomies?
			'comments': cloudCannonSpecific ? cloudCannonSpecific['comments'] : {},
			'input-options': cloudCannonSpecific ? cloudCannonSpecific['input-options'] : {},
			'defaults': defaults, // difficult in hugo as defaults are dynamic -
			'editor': cloudCannonSpecific ? cloudCannonSpecific['editor'] : {},
			'source-editor': cloudCannonSpecific ? cloudCannonSpecific['source-editor'] : {},
			'explore': cloudCannonSpecific ? cloudCannonSpecific['explore'] : {},
			'paths': paths,
			'array-structures': cloudCannonSpecific ? cloudCannonSpecific['_array_structures'] : {},
			'select-data': {}
		};
	}
};
