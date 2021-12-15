import fs from 'fs/promises';
import { extname } from 'path';
import { parseToml } from './toml.js';
import { parseYaml } from './yaml.js';
import { parseJsonUnstrict } from './json.js';
import log from '../helpers/logger.js';

export async function parseFile(path) {
	try {
		let frontMatterObject = await parseDataFile(path);
		if (frontMatterObject) {
			return frontMatterObject;
		}
		const data = await fs.readFile(path, 'utf-8');
		frontMatterObject = parseFrontMatter(data);
		return frontMatterObject || {};
	} catch (parseError) {
		return {};
	}
}

export async function parseDataFile(path) {
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

export function parseFrontMatter(data) {
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
