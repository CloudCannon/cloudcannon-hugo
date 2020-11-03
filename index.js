#!/usr/bin/env node
/* eslint-disable no-tabs */
/* eslint-disable dot-notation */
/* eslint-disable quote-props */
// const { Validator } = require('jsonschema');
const fs = require('fs');

const { generateConfig } = require('./generators/buildConfig');
const { generateDetails } = require('./generators/buildDetails');
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
	const hugoConfig = await helpers.getHugoConfig();
	const hugoData = JSON.stringify(hugoConfig, null, 4);

	const config = await generateConfig(hugoConfig);
	const configData = JSON.stringify(config, null, 4);

	const details = await generateDetails(hugoConfig);
	const detailsData = JSON.stringify(details, null, 4);

	// TODO change public to configured PublishDir
	fs.mkdirSync('public/_cloudcannon', { recursive: true });

	console.log('writing...');

	fs.writeFileSync('public/_cloudcannon/config.json', configData);
	fs.writeFileSync('public/_cloudcannon/details.json', detailsData);
	fs.writeFileSync('hugoConfig.json', hugoData);

	// runValidation(config);
}());
