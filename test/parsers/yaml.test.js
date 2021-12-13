const { expect } = require('chai');
const { parseYaml } = require('../../src/parsers/yaml');

describe('yaml.js', function () {
	describe('parseYaml', function () {
		it('should parse correctly', function () {
			const yamlString = 'key: value';
			const parsedObject = parseYaml(yamlString);
			const expectedObject = {
				key: 'value'
			};
			expect(parsedObject).to.deep.equal(expectedObject);
		});

		it('should not parse', function () {
			const badYamlString = ',';
			const parsedObject = parseYaml(badYamlString);
			expect(parsedObject).to.deep.equal(undefined);
		});
	});
});
