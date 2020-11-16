#!/usr/bin/env node
/* eslint-disable no-tabs */
/* eslint-disable dot-notation */
/* eslint-disable quote-props */
// const { Validator } = require('jsonschema');
const fs = require('fs');

const configGen = require('./generators/buildConfig');
const detailsGen = require('./generators/buildDetails');
const helpers = require('./helpers/helpers');

/*
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
*/

(async function main() {
	const args = process.argv;

	const hugoConfig = await helpers.getHugoConfig(args);
	const hugoData = JSON.stringify(hugoConfig, null, 4);

	const config = await configGen.generateConfig(hugoConfig);
	const configData = JSON.stringify(config, null, 4);

	const details = await detailsGen.generateDetails(hugoConfig);
	const detailsData = JSON.stringify(details, null, 4);

	const { publish } = helpers.getPaths(hugoConfig);

	console.log('writing...');

	fs.mkdirSync(`${publish}/_cloudcannon`, { recursive: true });

	fs.writeFileSync(`${publish}/_cloudcannon/config.json`, configData);
	fs.writeFileSync(`${publish}/_cloudcannon/details.json`, detailsData);
	fs.writeFileSync('hugoConfig.json', hugoData);

	// runValidation(config);
}());
