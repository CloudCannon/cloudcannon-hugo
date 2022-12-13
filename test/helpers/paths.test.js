import { expect } from 'chai';
import mock from 'mock-fs';
import pathHelper from '../../src/helpers/paths.js';
import { pathsByType, testFileStructure } from '../test-paths.js';

describe('pathHelper', function () {
	before(function () {
		mock(testFileStructure);
		pathHelper.generatePaths({});
	});

	describe('getDataPaths', function () {
		it('should retrieve data files', async function () {
			const paths = (await pathHelper.getDataPaths()).sort();
			expect(paths).to.deep.equal(pathsByType.dataPaths);
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
			pathHelper.clearAllCachedItems();
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
