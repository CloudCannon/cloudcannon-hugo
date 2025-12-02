#!/usr/bin/env node

import fs from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';
import meow from 'meow';
import { getInfo } from './generators/info.js';
import { getHugoConfig } from './helpers/hugo-config.js';
import log, { setLogOptions } from './helpers/logger.js';
import pathHelper from './helpers/paths.js';

const cli = meow(
	`
  Usage
    $ cloudcannon-hugo [options]

  Options
    --version          Print the current version
    --output, -o       Write to a different location than .
    --quiet, -q        Disable logging
    --verbose, -v      Log more details (unless --quiet is enabled)

    --environment, -e  environment
		--source, -s       source
		--baseURL, -b      baseURL
		--config           config
		--configDir        configDir
		--contentDir, -c   contentDir
		--layoutDir, -l    layoutDir
		--destination, -d  destination

  Environment
    CLOUDCANNON_CONFIG_PATH  Use a specific configuration file

  Examples
    $ cloudcannon-hugo --output "public"
    $ CLOUDCANNON_CONFIG_PATH=src/cloudcannon.config.json cloudcannon-hugo
`,
	{
		importMeta: import.meta,
		flags: {
			output: {
				type: 'string',
				alias: 'o',
			},
			quiet: {
				type: 'boolean',
				alias: 'q',
			},
			verbose: {
				type: 'boolean',
				alias: 'v',
			},
			environment: {
				type: 'string',
				alias: 'e',
			},
			source: {
				type: 'string',
				alias: 's',
			},
			baseURL: {
				type: 'string',
				alias: 'b',
			},
			config: {
				type: 'string',
			},
			configDir: {
				type: 'string',
			},
			contentDir: {
				type: 'string',
				alias: 'c',
			},
			layoutDir: {
				type: 'string',
				alias: 'l',
			},
			destination: {
				type: 'string',
				alias: 'd',
			},
		},
	}
);

setLogOptions({
	enabled: !cli.flags.quiet,
	verbose: !!cli.flags.verbose,
});

async function main({ flags, pkg }) {
	log(`⭐️ Starting ${chalk.blue('cloudcannon-hugo')} ${pkg.version}`);

	const hugoConfig = await getHugoConfig(flags);
	pathHelper.generatePaths(hugoConfig);

	const info = await getInfo(hugoConfig, pkg);
	const infoData = JSON.stringify(info, null, '\t');

	const { source, publish } = pathHelper.getPaths();
	const outputDir = join(source, publish, '_cloudcannon');

	try {
		await fs.mkdir(`${outputDir}`, { recursive: true });
		await fs.writeFile(`${outputDir}/info.json`, infoData);
		log(`🏁 Generated ${chalk.bold('_cloudcannon/info.json')} ${chalk.green('successfully')}`);
	} catch (_writeError) {
		log(`error writing to ${outputDir}/`, 'error');
	}
}

main(cli);
