/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const Path = require('path');

const helpers = require('../helpers/helpers');
const pathHelper = require('../helpers/paths');
const { cloudCannonMeta } = require('../helpers/metadata');

module.exports = {
	getCollectionName: function (path, archetypePath) {
		if (path.indexOf(archetypePath) >= 0) {
			if (path.indexOf('default.md') >= 0) {
				return;
			}
			if (path.indexOf('index.md') >= 0) {
				return Path.basename(Path.dirname(path));
			}

			return Path.basename(path, Path.extname(path)); // e.g. archetypes/type.md
		}
		return Path.basename(Path.dirname(path));
	},

	generateCollections: async function (config, paths) {
		const contentDir = paths.content;
		const collections = {};

		const collectionPaths = await pathHelper.getCollectionPaths();

		await Promise.all(collectionPaths.map(async (collectionPath) => {
			const collectionName = this.getCollectionName(collectionPath, paths.archetypes);
			if (collectionName) {
				const path = `${contentDir}/${collectionName}`;
				const collection = {
					_path: path,
					output: true
				};

				const itemDetails = await helpers.getItemDetails(collectionPath);
				if (itemDetails.headless) {
					collection.output = false;
				}

				collections[collectionName] = collection;
			}
			return Promise.resolve();
		}));

		collections.data = {
			_path: paths.data,
			output: false
		};

		if (config.permalinks) { // replace with a getConfig() call
			Object.keys(config.permalinks).forEach((collection) => {
				collections[collection]["permalink"] = config.permalinks[collection];
			});
		}

		return collections;
	},

	generateDefault: async function (path) {
		// const frontMatter = await helpers.getItemDetails(path);
		const scope = {};
		scope.path = Path.dirname(path).replace('archetypes', '');

		const type = Path.basename(path, Path.extname(path));
		scope.type = type;

		const defaultData = {
			'scope': scope
		};

		return defaultData;
	},

	generateConfig: async function (hugoConfig) {
		const paths = pathHelper.getPaths();
		const defaultsPaths = await pathHelper.getDefaultsPaths();

		const defaults = [];
		await Promise.all(defaultsPaths.map(async (path) => {
			const defaultData = await this.generateDefault(path);
			defaults.push(defaultData);
			return Promise.resolve();
		}));

		const collections = await this.generateCollections(hugoConfig, paths);

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
