/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const Path = require('path');

const { getGlob, getPaths } = require('../helpers/helpers');
const { cloudCannonMeta } = require('../helpers/metadata');

module.exports = {
	getDefaultsPaths: function (paths) {
		const indexPaths = `**/${paths.content}/**/_index.md`;
		const archetypes = `**/${paths.archetypes}/**/**.md`;

		const defaultsGlob = `{${indexPaths},${archetypes}}`;
		return getGlob(defaultsGlob);
	},

	getCollectionName: function (path, isArchetype) {
		if (path.indexOf('index.md') >= 0) {
			// need to remove content/index.md
			return Path.basename(Path.dirname(path));
		}

		if (isArchetype) {
			if (path.indexOf('default.md') >= 0) {
				return;
			}

			return Path.basename(path, Path.extname(path)); // e.g. archetypes/type.md
		}
	},

	getCollectionPaths: async function (paths) {
		const archetypeGlob = `**/${paths.archetypes}/**/**.md`;
		const archetypePaths = await getGlob(archetypeGlob, { ignore: '**/default.md' });
		const archetypeArray = archetypePaths.map((item) => this.getCollectionName(item, true));

		const contentGlob = `**/${paths.content}/*/**`;
		const contentPaths = await getGlob(contentGlob);
		const contentArray = contentPaths.map((item) => this.getCollectionName(item));

		const collectionArray = archetypeArray.concat(contentArray);

		// remove empty string and duplicates
		return Array.from(new Set(collectionArray.filter((item) => item)));
	},

	generateCollections: async function (config, paths) {
		const contentDir = paths.content;
		const collections = {};

		const collectionPaths = await this.getCollectionPaths(paths);

		collectionPaths.forEach((collectionName) => {
			if (collectionName) {
				collections[collectionName] = {
					_path: `${contentDir}/${collectionName}`
				};
			}
		});
		if (config.permalinks) { // replace with a getConfig() call
			Object.keys(config.permalinks).forEach((collection) => {
				collections[collection]["permalink"] = config.permalinks[collection];
			});
		}

		return collections;
	},

	generateDefault: async function (path) {
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
		scope.type = type;

		const defaultData = {
			'scope': scope
		};

		return Promise.resolve(defaultData);
	},

	generateConfig: async function (hugoConfig) {
		const paths = getPaths(hugoConfig);
		const defaultsPaths = await this.getDefaultsPaths(paths);

		const defaults = [];
		await Promise.all(defaultsPaths.map(async (path) => {
			const defaultData = await this.generateDefault(path);
			defaults.push(defaultData);
		}));

		const collections = await this.generateCollections(hugoConfig, paths);
		// console.log(await helpers.getParams());

		const cloudCannonSpecific = hugoConfig.params ? hugoConfig.params.cloudcannon : null;
		const baseURL = new URL(hugoConfig['baseURL'] || '');

		return {
			'time': '2020-09-16T22:50:17+00:00', // get build time here
			'cloudcannon': cloudCannonMeta,
			'source': '', // don't think hugo has custom src / mabe get this from cloudcannon
			'include': cloudCannonSpecific ? cloudCannonSpecific['include'] : {},
			'exclude': cloudCannonSpecific ? cloudCannonSpecific['exclude'] : {},
			'base-url': baseURL.pathname,
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
