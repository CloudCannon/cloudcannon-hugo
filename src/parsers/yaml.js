const yaml = require('js-yaml');

function parseYaml(data) {
	try {
		return yaml.load(data, { json: true });
	} catch (parseError) {
		console.error(parseError);
	}
}

module.exports = {
	parseYaml
};
