/* eslint-disable prefer-arrow-callback */
/* eslint-disable quote-props */
const { expect } = require('chai');
const mock = require('mock-fs');

const pathHelper = require('../../helpers/paths');

const testFileStructure = {
	'archetypes': {
		'default.md': 'content'
	},
	'data': {
		'authors': {
			'jane-doe.md': 'content',
			'john-smith.md': 'content'
		}
	},
	'content': {
		'collectionName': {
			'index.md': 'content'
		},
		'emptyCollection': {}
	},
	'theme/exampleSite': {
		'index.html': 'content'
	}
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
			expect(paths).to.deep.equal(['archetypes/default.md']);
		});
	});

	describe('getDataPaths', function () {
		it('should retrieve data files', async function () {
			const paths = await pathHelper.getDataPaths();
			expect(paths).to.deep.equal(['data/authors/jane-doe.md', 'data/authors/john-smith.md']);
		});

		// it('no files', async function () {
		// const paths = await pathHelper.getDataPaths();
		// expect(paths).to.deep.equal([]);
		// });
	});

	describe('getPagePaths', function () {
		it.skip('should get all single pages', async function () {
			const paths = await pathHelper.getPagePaths();
			expect(paths).to.deep.equal([]);
		});
	});

	describe('getCollectionPaths', function () {
		it.skip('should get all collections', async function () {
			const paths = await pathHelper.getCollectionPaths();
			expect(paths).to.deep.equal([]);
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
