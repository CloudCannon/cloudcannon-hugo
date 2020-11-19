/* eslint-disable prefer-arrow-callback */
/* eslint-disable quote-props */
const { expect } = require('chai');
const mock = require('mock-fs');

const pathHelper = require('../../helpers/paths');
const testPaths = require('../test-paths');

const testFileStructure = {};
Object.keys(testPaths).forEach((pathType) => {
	testPaths[pathType].forEach((path) => {
		if (!testFileStructure[path]) {
			testFileStructure[path] = 'file contents';
		}
	});
});

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
			expect(paths).to.deep.equal(testPaths.defaultPaths);
		});
	});

	describe('getDataPaths', function () {
		it('should retrieve data files', async function () {
			const paths = (await pathHelper.getDataPaths()).sort();
			expect(paths).to.deep.equal(testPaths.dataPaths);
		});
	});

	describe('getPagePaths', function () {
		it('should get all single pages', async function () {
			const paths = (await pathHelper.getPagePaths()).sort();
			expect(paths).to.deep.equal(testPaths.pagePaths);
		});
	});

	describe('getCollectionPaths', function () {
		it('should get all collections', async function () {
			const paths = await pathHelper.getCollectionPaths();
			expect(paths).to.deep.equal(testPaths.collectionPaths);
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
