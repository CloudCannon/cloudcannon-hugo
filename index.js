#!/usr/bin/env node

const fs = require('fs').promises;
const infoGenerator = require('./generators/build-info');
const hugoHelper = require('./helpers/hugo-config');
const pathHelper = require('./helpers/paths');

(async function main() {
	const args = process.argv;

	const hugoConfig = await hugoHelper.getHugoConfig(args);
	pathHelper.generatePaths(hugoConfig);

	const info = await infoGenerator.generateInfo(hugoConfig);
	const infoData = JSON.stringify(info, null, 4);

	const { publish } = pathHelper.getPaths();

	console.log('writing...');
	try {
		await fs.mkdir(`${publish}/_cloudcannon`, { recursive: true });
		await fs.writeFile(`${publish}/_cloudcannon/info.json`, infoData);
	} catch (writeError) {
		console.error(`error writing to ${publish}/_cloudcannon/`);
	}
}());
