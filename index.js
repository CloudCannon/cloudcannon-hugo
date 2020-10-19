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

const readFile = promisify(fs.readFile);
const globPromise = promisify(glob);

const schema = require('./schema.json');
const { generateConfig } = require('./generators/buildConfig');
const { generateDetails } = require('./generators/buildDetails');

const detailsTest = require('./details.json');
const detailsSchema = require('./details-schema.json');

const extensions = {
	'.yml': 'yaml',
	'.yaml': 'yaml',
	'.toml': 'toml',
	'.json': 'json'
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
	const configData = JSON.stringify(config, null, 4);

	const details = await generateDetails(hugoConfig);
	const detailsData = JSON.stringify(details, null, 4);

	fs.writeFileSync('build-config.json', configData);
	fs.writeFileSync('build-details.json', detailsData);

	runValidation(config);
}());
