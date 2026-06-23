import { load, YAML11_SCHEMA } from 'js-yaml';
import log from '../helpers/logger.js';

export function parseYaml(data) {
	try {
		return load(data, { json: true, schema: YAML11_SCHEMA });
	} catch (parseError) {
		log(parseError, 'error');
	}
}
