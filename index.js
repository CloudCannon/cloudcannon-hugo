#!/usr/bin/env node
/* eslint-disable no-tabs */
/* eslint-disable dot-notation */
/* eslint-disable quote-props */
const { promises: fsProm } = require('fs');

const configGenerator = require('./generators/buildConfig');
const detailsGenerator = require('./generators/buildDetails');
const helpers = require('./helpers/helpers');

(async function main() {
	const args = process.argv;

	const hugoConfig = await helpers.getHugoConfig(args);

	const config = await configGenerator.generateConfig(hugoConfig);
	const configData = JSON.stringify(config, null, 4);

	const details = await detailsGenerator.generateDetails(hugoConfig);
	const detailsData = JSON.stringify(details, null, 4);

	const { publish } = helpers.getPaths(hugoConfig);

	console.log('writing...');
	try {
		await fsProm.mkdir(`${publish}/_cloudcannon`, { recursive: true });

		await Promise.all([
			fsProm.writeFile(`${publish}/_cloudcannon/config.json`, configData),
			fsProm.writeFile(`${publish}/_cloudcannon/details.json`, detailsData)
		]);
	} catch (writeError) {
		console.error(`error writing to ${publish}/_cloudcannon/`);
	}
}());
