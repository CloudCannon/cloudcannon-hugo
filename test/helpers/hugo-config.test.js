/* eslint-disable prefer-arrow-callback */
/* eslint-disable quote-props */
/* eslint-disable no-underscore-dangle */
const { expect } = require('chai');

const hugoHelper = require('../../helpers/hugo-config');

describe('hugo-config', function () {
	describe('configSort', function () {
		it('should sort based on extension name', function () {
			const testArray = ['a.yaml', 'b.toml', 'c.json'];
			const sorted = hugoHelper._configSort(testArray);
			expect(sorted).to.deep.equal(['c.json', 'a.yaml', 'b.toml']);
		});
	});
});
