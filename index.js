#!/usr/bin/env node
const { Validator } = require('jsonschema');
const { promisify } = require('util');
const fs = require('fs');
const Path = require('path');
const util = require('util');
const glob = require('glob');

const toml = require('toml');
const yaml = require('js-yaml');

const readFile = promisify(fs.readFile);
const globPromise = promisify(glob);

const schema = require('./schema.json');

const extensions = {
	'.yml': 'yaml',
	'.yaml': 'yaml',
	'.toml': 'toml',
	'.json': 'json'
}

const cloudCannonMeta = {
	name: "cloudcannon-hugo",
	version: "1.0.0"
};

function parseYaml (data) {
	try {
		const yamlData = yaml.safeLoad(data, {json: true});
		return Promise.resolve(yamlData);
	} catch (parseError) {
		console.error(parseError);
	}
	return Promise.reject();
}

function parseToml (data) {
	try {
		const tomlData = toml.parse(data);
		return Promise.resolve(tomlData);
	} catch (e) {
		console.error("Parsing error on line " + e.line + ", column " + e.column +
		  ": " + e.message);
	}
	return Promise.reject();
}

async function getHugoConfig (configPath) {

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
			return;
	}
}

function getPaths (config) {
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

async function getDefaultsPaths (paths) {
	const indexPaths = `**/${paths.content}/**/_index.md`;
	const archetypes = `**/${paths.archetypes}/**.md`;

	const defaultsGlobPath = '{'+indexPaths + ',' + archetypes+'}';
	try {
		const defaultsGlob = await globPromise(defaultsGlobPath, {nounique: true});
		return defaultsGlob;
	} catch (globErr) {
		console.err(globErr);
	}
	return;
}

async function getCollectionsPaths (paths) {
	const archetypes = `**/${paths.archetypes}/**.**`;
	const options = {
		nounique: true,
		ignore: '**/default.**'
	}

	let defaultsGlob = [];
	try {
		defaultsGlob = await globPromise(archetypes, options);
	} catch (globErr) {
		console.err(globErr);
	}

	const collectionsArray = defaultsGlob.map(item => {
		return Path.basename(item, Path.extname(item))
	});

	let collections = {};
	collectionsArray.forEach(collection => {
		collections[collection] = {};
	})
	return collections;
}

async function parseFrontMatter (data) {
	const normalised = data.replace(/(?:\r\n|\r|\n)/g, "\n");
	const identifyingChar = normalised.charAt(0);
	let start, end;
	switch (identifyingChar) {
		case '-':
			start = normalised.search(/^---\s*\n/);
			end  = normalised.indexOf("\n---", start + 1);
			if (start === 0 && end > start) {
				const trimmed = normalised.substring(start+3, end);
				const parsed = await parseYaml(trimmed);
				return Promise.resolve(parsed);
			}
			break;
		case '+':
			start = normalised.search(/^\+\+\+\s*\n/);
			end  = normalised.indexOf("\n\+\+\+", start + 1);
			if (start === 0 && end > start) {
				const trimmed = normalised.substring(start+3, end);
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
	return Promise.reject('couldnt parse');
}

async function generateDefault (path) {
	let content;
	try {
		content = await readFile(path, 'utf-8');
	} catch (readErr) {
		console.error(readErr);
	}

	const frontMatter = content? await parseFrontMatter(content) : {};

	let defaultData = {
		"scope": {
			"path": Path.dirname(path)
		},
		"values": frontMatter
	}

	return Promise.resolve(defaultData);
}

async function generateConfig (config) {
	const paths = getPaths(config);
	const defaultsPaths = await getDefaultsPaths(paths);

	let defaults = [];
	await Promise.all(defaultsPaths.map(async (path) => {
		const defaultData = await generateDefault(path);
		defaults.push(defaultData);
	}));

	let collections = await getCollectionsPaths(paths);

	const cloudCannonSpecific = config.cloudcannon;

	return {
		"time": "2020-09-16T22:50:17+00:00", // get build time here
		"cloudcannon": cloudCannonMeta,
		"source": "", // don't think hugo has custom src / mabe get this from cloudcannon
		"timezone": null, // hugo has no timezones yet
		"include": [], // not supported in hugo
		"exclude": [], // not supported in hugo
		"base-url": config["baseURL"] || "",
		"collections": collections, // perhaps taxonomies?
		"comments": cloudCannonSpecific? cloudCannonSpecific["comments"] : {},
		"input-options": {},
		"defaults": [], // difficult in hugo as defaults are dynamic
		"editor": cloudCannonSpecific? cloudCannonSpecific["editor"] : {},
		"source-editor": cloudCannonSpecific? cloudCannonSpecific["source-editor"] : {},
		"explore": cloudCannonSpecific? cloudCannonSpecific["explore"] : {},
		"paths": paths,
		"array-structures": config["_array_structures"],
		"select-data": {},
	}
}

function runValidation (config) {
	let v = new Validator();

	const results = v.validate(config, schema);

	if (results.errors.length) {
		console.warn("Config validation errored");
		console.warn(results.errors);
	} else {
		console.log("Config succusfully validated")
	}
}

// function main () {
// 	process.stdin.resume();
// 	process.stdin.setEncoding('utf8');
// 	process.stdin.on('data', function(data) {
// 		parseConfig(data);
// 	});
// }

async function main () {
	const path = 'config.toml';
	const hugoConfig = await getHugoConfig(path);

	const config = await generateConfig(hugoConfig);

	runValidation(config);
}

main ();
