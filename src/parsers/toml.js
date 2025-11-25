import toml from 'toml';
import log from '../helpers/logger.js';

export function parseToml(data) {
	try {
		return toml.parse(data);
	} catch (e) {
		log(`Parsing error on line ${e.line}, column ${e.column}: ${e.message}`, 'error');
	}
}
