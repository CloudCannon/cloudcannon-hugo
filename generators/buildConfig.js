/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const Path = require('path');

const helpers = require('../helpers/helpers');
const pathHelper = require('../helpers/paths');
const { cloudCannonMeta } = require('../helpers/metadata');

function renameKey(object, key, newKey) {
	if (Object.prototype.hasOwnProperty.call(object, key)) {
		object[newKey] = object[key];
		delete object[key];
	}
}

module.exports = {
	getCollectionName: function (path, contentDir, archetypePath) {
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
			path = path.replace(`${contentDir}/`, '');
			const parts = path.split('/');
			return parts[0];
		}
	},

	generateCollections: async function (config, paths) {
		const contentDir = paths.content;
		const collections = {};

		const collectionPaths = await pathHelper.getCollectionPaths();

		await Promise.all(collectionPaths.map(async (collectionPath) => {
			const collectionName = this.getCollectionName(collectionPath, contentDir, paths.archetypes);
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
					collections[collection].permalink = config.permalinks[collection];
				}
			});
		}

		return collections;
	},

	generateConfig: async function (hugoConfig) {
		const paths = pathHelper.getPaths();
		const collections = await this.generateCollections(hugoConfig, paths);

		// params key is case insensitive
		const paramsKey = Object.keys(hugoConfig).find((key) => key.toLowerCase() === 'params');
		const hugoParams = hugoConfig[paramsKey] || {};

		const date = new Date(Date.now()).toUTCString();

		const baseURL = helpers.getUrlPathname(hugoConfig.baseURL);

		const editor = hugoParams['_editor'] || {};
		renameKey(editor, 'default_path', 'default-path');

		const sourceEditor = hugoParams['_sourceEditor'] || {};
		renameKey(sourceEditor, 'tab_size', 'tab-size');
		renameKey(sourceEditor, 'show_gutter', 'show-gutter');

		return {
			'time': date, // get build time here
			'cloudcannon': cloudCannonMeta,
			'source': '', // don't think hugo has custom src - maybe get this from cloudcannon
			'include': hugoParams['include'] || [],
			'exclude': hugoParams['exclude'] || [],
			'base-url': baseURL,
			'collections': collections,
			'comments': hugoParams['_comments'] || {},
			'input-options': hugoParams['_options'] || {},
			'defaults': [], // Currently Unused
			'editor': editor,
			'source-editor': sourceEditor,
			'explore': hugoParams['_explore'] || {},
			'paths': paths,
			'array-structures': hugoParams['_array_structures'] || {},
			'select-data': hugoParams['_selectData'] || {}
		};
	}
};
