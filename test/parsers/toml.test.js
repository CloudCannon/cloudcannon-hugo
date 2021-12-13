const { expect } = require('chai');
const { parseToml } = require('../../src/parsers/toml');

describe('toml.js', function () {
	describe('parseToml', function () {
		it('should parse correctly', function () {
			const tomlString = `
			key = "value"
			`;
			const parsedObject = parseToml(tomlString);
			const expectedObject = {
				key: 'value'
			};
			expect(parsedObject).to.deep.equal(expectedObject);
		});

		it('should not parse', function () {
			const tomlString = `
			key: "value"
			`;
			const parsedObject = parseToml(tomlString);
			expect(parsedObject).to.deep.equal(undefined);
		});
	});
});
