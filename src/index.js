#!/usr/bin/env node

const fs = require('fs').promises;
const { join } = require('path');
const chalk = require('chalk');
const infoGenerator = require('./generators/build-info');
const hugoHelper = require('./helpers/hugo-config');
const pathHelper = require('./helpers/paths');
const { log } = require('./helpers/logger');

(async function main() {
	const args = process.argv;

	log(`⭐️ Starting ${chalk.blue('cloudcannon-hugo')}`);

	const hugoConfig = await hugoHelper.getHugoConfig(args);
	pathHelper.generatePaths(hugoConfig);

	const info = await infoGenerator.generateInfo(hugoConfig);
	const infoData = JSON.stringify(info, null, 4);

	const { source, publish } = pathHelper.getPaths();
	const outputDir = join(source, publish, '_cloudcannon');

	try {
		await fs.mkdir(`${outputDir}`, { recursive: true });
		await fs.writeFile(`${outputDir}/info.json`, infoData);
		log(`🏁 Generated ${chalk.bold('_cloudcannon/info.json')} ${chalk.green('successfully')}`);
	} catch (writeError) {
		log(`error writing to ${outputDir}/`, 'error');
	}
}());
