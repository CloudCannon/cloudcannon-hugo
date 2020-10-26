#!/usr/bin/env node
/* eslint-disable no-tabs */
/* eslint-disable dot-notation */
/* eslint-disable quote-props */
const { Validator } = require('jsonschema');
const fs = require('fs');

const schema = require('./schema.json');
const { generateConfig } = require('./generators/buildConfig');
const { generateDetails } = require('./generators/buildDetails');
const helpers = require('./helpers/helpers');

const detailsTest = require('./details.json');
const detailsSchema = require('./details-schema.json');

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
	const hugoConfig = await helpers.getHugoConfig('config');
	const hugoData = JSON.stringify(hugoConfig, null, 4);

	const config = await generateConfig(hugoConfig);
	const configData = JSON.stringify(config, null, 4);

	const details = await generateDetails(hugoConfig);
	const detailsData = JSON.stringify(details, null, 4);

	fs.writeFileSync('build-config.json', configData);
	fs.writeFileSync('build-details.json', detailsData);
	fs.writeFileSync('hugoConfig.json', hugoData);

	runValidation(config);
}());
