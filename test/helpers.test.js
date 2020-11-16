/* eslint-disable prefer-arrow-callback */
const { expect } = require('chai');

const helpers = require('../helpers/helpers');

describe('globs', function () {
	describe('getGlobString', function () {
		const tests = [
			{ input: ['glob1', 'glob2', 'glob3'], expected: '{glob1,glob2,glob3}', context: 'input: an array of glob patterns' },
			{ input: ['glob1'], expected: 'glob1', context: 'input: an array containing one glob pattern' },
			{ input: [], expected: '', context: 'input: empty array' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const outputPattern = helpers.getGlobString(test.input);
				expect(outputPattern).to.equal(test.expected);
			});
		});
	});
});
