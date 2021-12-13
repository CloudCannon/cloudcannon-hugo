const toml = require('toml');
const { log } = require('../helpers/logger');

function parseToml(data) {
	try {
		return toml.parse(data);
	} catch (e) {
		log(`Parsing error on line ${e.line}, column ${e.column}: ${e.message}`, 'error');
	}
}

module.exports = {
	parseToml
};
