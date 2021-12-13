const fs = require('fs').promises;
const { extname } = require('path');
const { parseToml } = require('./toml');
const { parseYaml } = require('./yaml');
const { parseJsonUnstrict } = require('./json');
const { log } = require('../helpers/logger');

async function parseDataFile(path) {
	const type = extname(path).toLowerCase();

	try {
		const contents = await fs.readFile(path, 'utf-8');
		switch (type) {
		case '.yml':
		case '.yaml':
			return parseYaml(contents);
		case '.toml':
			return parseToml(contents);
		case '.json':
			return JSON.parse(contents);
		default:
			break;
		}
	} catch (parseError) {
		log(`Failed to read file: ${path}`, 'warn');
	}
}

function parseFrontMatter(data) {
	if (!data) {
		return {};
	}

	const normalised = data
		.replace(/{{.*}}/g, '') // remove Hugo code
		.replace(/(?:\r\n|\r|\n)/g, '\n');

	const identifyingChar = normalised.charAt(0);
	let start;
	let end;

	switch (identifyingChar) {
	case '-':
		start = normalised.search(/^---\s*\n/);
		end = normalised.indexOf('\n---', start + 1);
		if (start === 0 && end > start) {
			const trimmed = normalised.substring(start + 3, end);
			return parseYaml(trimmed);
		}
		break;
	case '+':
		start = normalised.search(/^\+\+\+\s*\n/);
		end = normalised.indexOf('\n+++', start + 1);
		if (start === 0 && end > start) {
			const trimmed = normalised.substring(start + 3, end);
			return parseToml(trimmed);
		}
		break;
	case '{':
		return parseJsonUnstrict(data);
	default:
		break;
	}

	return {};
}

module.exports = {
	parseDataFile,
	parseFrontMatter
};
