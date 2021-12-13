const yaml = require('js-yaml');
const { log } = require('../helpers/logger');

function parseYaml(data) {
	try {
		return yaml.load(data, { json: true });
	} catch (parseError) {
		log(parseError, 'error');
	}
}

module.exports = {
	parseYaml
};
