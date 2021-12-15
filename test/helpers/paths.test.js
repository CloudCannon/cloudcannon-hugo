import { expect } from 'chai';
import mock from 'mock-fs';
import pathHelper from '../../src/helpers/paths.js';
import { pathsByType, testFileStructure } from '../test-paths.js';

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
			expect(paths).to.deep.equal(pathsByType.defaultPaths);
		});
	});

	describe('getDataPaths', function () {
		it('should retrieve data files', async function () {
			const paths = (await pathHelper.getDataPaths()).sort();
			expect(paths).to.deep.equal(pathsByType.dataPaths);
		});
	});

	describe('getPagePaths', function () {
		it('should get all single pages', async function () {
			const paths = (await pathHelper.getPagePaths()).sort();
			expect(paths).to.deep.equal(pathsByType.pagePaths);
		});
	});

	describe('getLayoutPaths', function () {
		it('should get all layout files', async function () {
			const paths = (await pathHelper.getLayoutPaths()).sort();
			expect(paths).to.deep.equal(pathsByType.layoutPaths);
		});
	});

	describe('getLayoutTree', function () {
		before(function () {
			pathHelper.clearCachedLayouts();
		});

		it('should create a layout tree using layout file structure', async function () {
			const tree = await pathHelper.getLayoutTree();
			const expected = {
				index: 'index',
				_default: {
					list: '_default/list'
				},
				mytype: {
					list: 'mytype/list',
					mylayout: 'mytype/mylayout'
				},
				posts: {
					mylayout: 'posts/mylayout',
					single: 'posts/single'
				}
			};
			expect(tree).to.deep.equal(expected);
		});
	});

	describe('getCollectionPaths', function () {
		it('should get all collections', async function () {
			const paths = await pathHelper.getCollectionPaths();
			expect(paths).to.deep.equal(pathsByType.collectionPaths);
		});
	});

	after(function () {
		mock.restore();
	});
});
