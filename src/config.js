import { getUrlPathname } from './helpers/helpers.js';
import pathHelper from './helpers/paths.js';

function rewriteKey(object, oldKey, newKey) {
	const canRename = Object.prototype.hasOwnProperty.call(object, oldKey)
		&& !Object.prototype.hasOwnProperty.call(object, newKey);

	if (canRename) {
		object[newKey] = object[oldKey];
		delete object[oldKey];
	}
}

function migrateLegacyKeys(config) {
	rewriteKey(config, '_collection_groups', 'collection_groups');
	rewriteKey(config, '_editor', 'editor');
	rewriteKey(config, '_source_editor', 'source_editor');

	Object.keys(config.collections_config || {}).forEach((key) => {
		rewriteKey(config.collections_config[key], '_sort_key', 'sort_key');
		rewriteKey(config.collections_config[key], '_subtext_key', 'subtext_key');
		rewriteKey(config.collections_config[key], '_image_key', 'image_key');
		rewriteKey(config.collections_config[key], '_image_size', 'image_size');
		rewriteKey(config.collections_config[key], '_singular_name', 'singular_name');
		rewriteKey(config.collections_config[key], '_singular_key', 'singular_key');
		rewriteKey(config.collections_config[key], '_disable_add', 'disable_add');
		rewriteKey(config.collections_config[key], '_icon', 'icon');
		rewriteKey(config.collections_config[key], '_add_options', 'add_options');
	}, {});

	return config;
}

function getLegacyConfig(hugoConfig) {
	// params key is case insensitive
	const paramsKey = Object.keys(hugoConfig).find((key) => key.toLowerCase() === 'params');
	const params = hugoConfig[paramsKey] || {};

	return {
		data_config: hugoConfig.cloudcannon?.data,
		collections_config: hugoConfig.cloudcannon?.collections,
		_comments: hugoConfig._comments
			?? params._comments,
		_options: hugoConfig._options
			?? params._options,
		_inputs: hugoConfig._inputs,
		_editables: hugoConfig._editables,
		collection_groups: hugoConfig.collection_groups
			?? hugoConfig._collection_groups
			?? params._collection_groups,
		editor: hugoConfig.editor
			?? hugoConfig._editor
			?? params._editor,
		source_editor: hugoConfig.source_editor
			?? hugoConfig._source_editor
			?? params._source_editor
			?? params._sourceEditor,
		_enabled_editors: hugoConfig._enabled_editors
			?? params._enabled_editors,
		_instance_values: hugoConfig._instance_values
			?? params._instance_values,
		_structures: hugoConfig._structures,
		_array_structures: hugoConfig._array_structures
			?? params._array_structures
			?? params._arrayStructures,
		_select_data: hugoConfig._select_data
			?? params._select_data
			?? params._selectData
	};
}

export function getConfig(hugoConfig) {
	const paths = pathHelper.getPaths();
	const baseUrl = getUrlPathname(hugoConfig.baseURL);

	return migrateLegacyKeys({
		...getLegacyConfig(hugoConfig),
		source: paths.source || '',
		base_url: baseUrl === '/' ? '' : baseUrl,
		paths: paths
	});
}
