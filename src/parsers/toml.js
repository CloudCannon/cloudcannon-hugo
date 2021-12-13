const toml = require('toml');

function parseToml(data) {
	try {
		return toml.parse(data);
	} catch (e) {
		console.error(`Parsing error on line ${e.line}, column ${e.column}: ${e.message}`);
	}
}

module.exports = {
	parseToml
};
