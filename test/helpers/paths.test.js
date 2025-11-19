import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
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
			assert.deepStrictEqual(paths, pathsByType.dataPaths);
		});
	});

	describe('getLayoutPaths', function () {
		it('should get all layout files', async function () {
			const paths = (await pathHelper.getLayoutPaths()).sort();
			assert.deepStrictEqual(paths, pathsByType.layoutPaths);
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
					mylayout: 'mytype/mylayout',
					single: 'mytype/single'
				},
				posts: {
					mylayout: 'posts/mylayout',
					single: 'posts/single'
				}
			};
			assert.deepStrictEqual(tree, expected);
		});
	});

	describe('getCollectionPaths', function () {
		it('should get all collections', async function () {
			const paths = await pathHelper.getCollectionPaths();
			assert.deepStrictEqual(paths, pathsByType.collectionPaths);
		});
	});

	after(function () {
		mock.restore();
	});
});
