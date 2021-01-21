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
		if (path.indexOf('_index.md') >= 0) {
			return Path.basename(Path.dirname(path));
		}
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

		if (config.permalinks) {
			Object.keys(config.permalinks).forEach((collection) => {
				if (collections[collection]) {
					collections[collection]["permalink"] = config.permalinks[collection];
				}
			});
		}

		return collections;
	},

	generateConfig: async function (hugoConfig) {
		const paths = pathHelper.getPaths();
		const collections = await this.generateCollections(hugoConfig, paths);

		const hugoParams = hugoConfig.params || {};

		const date = new Date(Date.now()).toUTCString();

		const baseURL = helpers.getUrlPathname(hugoConfig.baseURL);

		return {
			'time': date, // get build time here
			'cloudcannon': cloudCannonMeta,
			'source': '', // don't think hugo has custom src - maybe get this from cloudcannon
			'include': hugoParams['include'] || [],
			'exclude': hugoParams['exclude'] || [],
			'base-url': baseURL,
			'collections': collections,
			'comments': hugoParams['comments'] || {},
			'input-options': hugoParams['input-options'] || {},
			'defaults': [], // Currently Unused
			'editor': hugoParams['editor'] || {},
			'source-editor': hugoParams['source-editor'] || {},
			'explore': hugoParams['explore'] || {},
			'paths': paths,
			'array-structures': hugoParams['_array_structures'] || {},
			'select-data': {}
		};
	}
};
