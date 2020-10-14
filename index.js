#!/usr/bin/env node
/* eslint-disable no-tabs */
/* eslint-disable dot-notation */
/* eslint-disable quote-props */
const { Validator } = require('jsonschema');
const { promisify } = require('util');
const fs = require('fs');
const Path = require('path');
const glob = require('glob');

const toml = require('toml');
const yaml = require('js-yaml');

const packageJson = require('./package.json');

const readFile = promisify(fs.readFile);
const globPromise = promisify(glob);

const schema = require('./schema.json');

const detailsTest = require('./details.json');
const detailsSchema = require('./details-schema.json');

const extensions = {
	'.yml': 'yaml',
	'.yaml': 'yaml',
	'.toml': 'toml',
	'.json': 'json'
};

const cloudCannonMeta = {
	name: packageJson.name,
	version: packageJson.version
};

function parseYaml(data) {
	try {
		const yamlData = yaml.safeLoad(data, { json: true });
		return Promise.resolve(yamlData);
	} catch (parseError) {
		console.error(parseError);
	}
	return Promise.reject();
}

function parseToml(data) {
	try {
		const tomlData = toml.parse(data);
		return Promise.resolve(tomlData);
	} catch (e) {
		console.error(`Parsing error on line ${e.line}, column ${e.column}: ${e.message}`);
	}
	return Promise.reject();
}

async function getHugoConfig() {
	const configGlob = '**/config.???*';
	let configFiles;

	try {
		configFiles = await globPromise(configGlob, { ignore: '**/exampleSite/**' });
	} catch (globErr) {
		console.err(globErr);
	}

	console.log('found config files:');
	console.log(configFiles);

	const configPath = configFiles[0];
	// const configDir = Path.dirname(configPath);
	const extension = Path.extname(configPath).toLowerCase();
	const fileType = extensions[extension];

	let configContents;
	try {
		configContents = await readFile(configPath, 'utf-8');
	} catch (readFileError) {
		console.warn(readFileError);
		return;
	}

	switch (fileType) {
	case 'toml':
		return parseToml(configContents);
	case 'yaml':
		return parseYaml(configContents);
	case 'json':
		return configContents;
	default:
		console.warn('could not parse config file');
	}
}

function getPaths(config) {
	return {
		'archetypes': config['archetypeDir'] || 'archetypes',
		'assets': config['assetDir'] || 'assets',
		'content': config['contentDir'] || 'content',
		'data': config['dataDir'] || 'data',
		'layouts': config['layoutDir'] || 'layouts',
		'publish': config['publishDir'] || 'public',
		'static': config['staticDir'] || 'static',
		'themes': config['themesDir'] || 'themes'
	};
}

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

/*
async function parseFrontMatter(data) {
	const normalised = data.replace(/(?:\r\n|\r|\n)/g, '\n');
	const identifyingChar = normalised.charAt(0);
	let start;
	let end;
	switch (identifyingChar) {
	case '-':
		start = normalised.search(/^---\s*\n/);
		end = normalised.indexOf('\n---', start + 1);
		if (start === 0 && end > start) {
			const trimmed = normalised.substring(start + 3, end);
			const parsed = await parseYaml(trimmed);
			return Promise.resolve(parsed);
		}
		break;
	case '+':
		start = normalised.search(/^\+\+\+\s*\n/);
		end = normalised.indexOf('\n+++', start + 1);
		if (start === 0 && end > start) {
			const trimmed = normalised.substring(start + 3, end);
			const parsed = await parseToml(trimmed);
			return Promise.resolve(parsed);
		}
		break;
	case '{':
		console.warn('JSON Frontmatter not yet supported');
		break;
	default:
		console.err('unsupported frontmatter');
		break;
	}
	return Promise.reject(Error('couldnt parse'));
}
*/

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

async function generateConfig(hugoConfig) {
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

function runValidation(config) {
	const v = new Validator();

	const results = v.validate(config, schema);

	if (results.errors.length) {
		console.warn('Config validation errored');
		console.warn(results.errors);
	} else {
		console.log('Config succusfully validated');
	}

	const resultsDetails = v.validate(detailsTest, detailsSchema);
	if (resultsDetails.errors.length) {
		console.warn('Details validation errored');
		console.warn(resultsDetails.errors);
	} else {
		console.log('Details succusfully validated');
	}
}

// function fromPiped() {
// 	process.stdin.resume();
// 	process.stdin.setEncoding('utf8');
// 	process.stdin.on('data', function (data) {
// 		this.parseConfig(data);
// 	});
// }

(async function main() {
	const hugoConfig = await getHugoConfig();

	const config = await generateConfig(hugoConfig);
	const data = JSON.stringify(config, null, 4);
	fs.writeFileSync('build-config.json', data);

	runValidation(config);
}());
