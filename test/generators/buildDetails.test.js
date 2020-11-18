/* eslint-disable prefer-arrow-callback */
const { expect } = require('chai');
const buildDetails = require('../../generators/buildDetails');

const testFileStructure = {
	'archetypes/default.md': 'content',
	'archetypes/notes.md': 'content',
	'content/authors/jane-doe.md': 'content',
	'content/authors/john-smith.md': 'content',
	'data/info.yml': 'content',
	'content/collectionName/_index.md': 'content',
	'content/about/index.md': 'content',
	'content/index.md': 'content',
	'content/posts/_index.md': 'content',
	'content/posts/firstPost.md': 'content',
	'content/emptyCollection': {},
	'theme/exampleSite/index.html': 'content'
};

describe('buildDetails', function () {
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
});
