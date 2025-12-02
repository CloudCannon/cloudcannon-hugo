import { relative } from 'node:path';
import chalk from 'chalk';
import { cosmiconfig } from 'cosmiconfig';
import { getUrlPathname } from './helpers/helpers.js';
import log from './helpers/logger.js';
import pathHelper from './helpers/paths.js';

function rewriteKey(object, oldKey, newKey) {
	const canRename = Object.hasOwn(object, oldKey) && !Object.hasOwn(object, newKey);

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
		_comments: hugoConfig._comments ?? params._comments,
		_options: hugoConfig._options ?? params._options,
		_inputs: hugoConfig._inputs,
		_editables: hugoConfig._editables,
		collection_groups:
			hugoConfig.collection_groups ?? hugoConfig._collection_groups ?? params._collection_groups,
		editor: hugoConfig.editor ?? hugoConfig._editor ?? params._editor,
		source_editor:
			hugoConfig.source_editor ??
			hugoConfig._source_editor ??
			params._source_editor ??
			params._sourceEditor,
		_enabled_editors: hugoConfig._enabled_editors ?? params._enabled_editors,
		_instance_values: hugoConfig._instance_values ?? params._instance_values,
		_structures: hugoConfig._structures,
		_array_structures:
			hugoConfig._array_structures ?? params._array_structures ?? params._arrayStructures,
		_select_data: hugoConfig._select_data ?? params._select_data ?? params._selectData,
	};
}

async function readFile(configPath) {
	const moduleName = 'cloudcannon';
	const explorer = cosmiconfig(moduleName, {
		searchPlaces: [
			`${moduleName}.config.json`,
			`${moduleName}.config.yaml`,
			`${moduleName}.config.yml`,
			`${moduleName}.config.js`,
			`${moduleName}.config.cjs`,
		],
	});

	try {
		const config = configPath ? await explorer.load(configPath) : await explorer.search();

		if (config) {
			const relativeConfigPath = relative(process.cwd(), config.filepath);
			log(`⚙️ Using config file at ${chalk.bold(relativeConfigPath)}`);
			return migrateLegacyKeys(config.config || {});
		}
	} catch (e) {
		if (e.code === 'ENOENT') {
			log(`⚠️ ${chalk.red('No config file found at')} ${chalk.red.bold(configPath)}`);
			return false;
		}

		log(`⚠️ ${chalk.red('Error reading config file')}`, 'error');
		throw e;
	}

	log('⚙️ No config file found');
	return false;
}

export async function getConfig(hugoConfig) {
	const paths = pathHelper.getPaths();
	const file = (await readFile(process.env.CLOUDCANNON_CONFIG_PATH)) || {};
	const legacy = getLegacyConfig(hugoConfig);
	const baseURL = file.base_url || getUrlPathname(hugoConfig.baseURL) || '';

	const config = {
		...legacy,
		...file,
		base_url: baseURL === '/' ? '' : baseURL,
		source: file.source || paths.source || '',
		multilingual: {
			languages: hugoConfig.languages || [],
			defaultContentLanguage: hugoConfig.defaultContentLanguage || '',
			defaultContentLanguageInSubdir: hugoConfig.defaultContentLanguageInSubdir || false,
			disableLanguages: hugoConfig.disableLanguages || [],
		},
		paths: {
			...paths,
			...file.paths,
		},
	};

	return migrateLegacyKeys(config);
}
