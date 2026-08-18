import { parse } from 'yaml';
import log from '../helpers/logger.js';

export function parseYaml(data) {
	try {
		return parse(data, { version: '1.1', uniqueKeys: false });
	} catch (parseError) {
		log(parseError, 'error');
	}
}
