import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseToml } from '../../src/parsers/toml.js';

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
			assert.deepEqual(parsedObject, expectedObject);
		});

		it('should not parse', function () {
			const tomlString = `
			key: "value"
			`;
			const parsedObject = parseToml(tomlString);
			assert.deepStrictEqual(parsedObject, undefined);
		});
	});
});
