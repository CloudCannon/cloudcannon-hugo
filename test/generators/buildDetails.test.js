/* eslint-disable prefer-arrow-callback */
const { expect } = require('chai');
const mock = require('mock-fs');

const buildDetails = require('../../generators/buildDetails');

const { testFileStructure } = require('../test-paths');

describe('buildDetails', function () {
	before(function () {
		mock(testFileStructure);
	});

	describe('getCollectionName()', function () {
		const tests = [
			{ input: 'content/authors/jane-doe.md', expected: 'authors', context: 'input: data file' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = buildDetails.getCollectionName(test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});

	describe('getPageUrl()', function () {
		const tests = [
			{ input: ['content/authors/_index.md', {}, 'content'], expected: '/authors/', context: 'input: _index file' },
			{ input: ['content/about/index.md', {}, 'content'], expected: '/about/', context: 'input: index file' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = buildDetails.getPageUrl(...test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});

	describe('getDataFiles()', function () {
		it('should work', async function () {
			const dataObjects = await buildDetails.getDataFiles('data');
			const expected = [{
				url: '',
				path: 'info.yml',
				collection: 'data',
				output: false
			}];
			expect(dataObjects).to.deep.equal(expected);
		});
	});

	after(function () {
		mock.restore();
	});
});
