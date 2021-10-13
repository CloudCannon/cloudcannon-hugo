#!/usr/bin/env node

const fs = require('fs').promises;
const { join } = require('path');
const infoGenerator = require('./generators/build-info');
const hugoHelper = require('./helpers/hugo-config');
const pathHelper = require('./helpers/paths');

(async function main() {
	const args = process.argv;

	const hugoConfig = await hugoHelper.getHugoConfig(args);
	pathHelper.generatePaths(hugoConfig);

	const info = await infoGenerator.generateInfo(hugoConfig);
	const infoData = JSON.stringify(info, null, 4);

	const { source, publish } = pathHelper.getPaths();
	const outputDir = join(source, publish, '_cloudcannon');

	console.log('writing...');
	try {
		await fs.mkdir(`${outputDir}`, { recursive: true });
		await fs.writeFile(`${outputDir}/info.json`, infoData);
	} catch (writeError) {
		console.error(`error writing to ${outputDir}/`);
	}
}());
