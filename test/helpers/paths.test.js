/* eslint-disable prefer-arrow-callback */
/* eslint-disable quote-props */
const { expect } = require('chai');
const mock = require('mock-fs');

const pathHelper = require('../../helpers/paths');

const testFileStructure = {
	'archetypes/default.md': 'content',
	'archetypes/notes.md': 'content',
	'data/authors/jane-doe.md': 'content',
	'data/authors/john-smith.md': 'content',
	'content/collectionName/_index.md': 'content',
	'content/about/index.md': 'content',
	'content/index.md': 'content',
	'content/posts/_index.md': 'content',
	'content/posts/firstPost.md': 'content',
	'content/emptyCollection': {},
	'theme/exampleSite/index.html': 'content'
};

describe('pathHelper', function () {
	before(function () {
		mock(testFileStructure);
		pathHelper.generatePaths({});
	});

	describe('generatePaths', function () {

	});

	describe('getDefaultsPaths', function () {
		it('should get all defaults files (archetypes)', async function () {
			const paths = await pathHelper.getDefaultsPaths();
			expect(paths).to.deep.equal(['archetypes/default.md', 'archetypes/notes.md']);
		});
	});

	describe('getDataPaths', function () {
		it('should retrieve data files', async function () {
			const paths = (await pathHelper.getDataPaths()).sort();
			expect(paths).to.deep.equal(['data/authors/jane-doe.md', 'data/authors/john-smith.md']);
		});
	});

	describe('getPagePaths', function () {
		it('should get all single pages', async function () {
			const paths = (await pathHelper.getPagePaths()).sort();
			expect(paths).to.deep.equal(['content/about/index.md', 'content/collectionName/_index.md', 'content/index.md', 'content/posts/_index.md']);
		});
	});

	describe('getCollectionPaths', function () {
		it('should get all collections', async function () {
			const paths = await pathHelper.getCollectionPaths();
			expect(paths).to.deep.equal(['archetypes/notes.md', 'content/collectionName/_index.md', 'content/posts/_index.md', 'content/posts/firstPost.md']);
		});
	});

	after(function () {
		mock.restore();
	});
});

/*
tests.forEach((test) => {
	it(test.context, async function () {
		// run function
		expect(test.input).to.equal(test.expected);
	});
});
*/
