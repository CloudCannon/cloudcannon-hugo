import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import mock from 'mock-fs';
import pathHelper from '../../src/helpers/paths.js';
import { pathsByType, testFileStructure } from '../test-paths.js';

describe('pathHelper', () => {
	before(() => {
		mock(testFileStructure);
		pathHelper.generatePaths({});
	});

	describe('getDataPaths', () => {
		it('should retrieve data files', async () => {
			const paths = (await pathHelper.getDataPaths()).sort();
			assert.deepStrictEqual(paths, pathsByType.dataPaths);
		});
	});

	describe('getLayoutPaths', () => {
		it('should get all layout files', async () => {
			const paths = (await pathHelper.getLayoutPaths()).sort();
			assert.deepStrictEqual(paths, pathsByType.layoutPaths);
		});
	});

	describe('getLayoutTree', () => {
		before(() => {
			pathHelper.clearAllCachedItems();
		});

		it('should create a layout tree using layout file structure', async () => {
			const tree = await pathHelper.getLayoutTree();
			const expected = {
				index: 'index',
				_default: {
					list: '_default/list',
				},
				mytype: {
					list: 'mytype/list',
					mylayout: 'mytype/mylayout',
					single: 'mytype/single',
				},
				posts: {
					mylayout: 'posts/mylayout',
					single: 'posts/single',
				},
			};
			assert.deepStrictEqual(tree, expected);
		});
	});

	describe('getCollectionPaths', () => {
		it('should get all collections', async () => {
			const paths = await pathHelper.getCollectionPaths();
			assert.deepStrictEqual(paths, pathsByType.collectionPaths);
		});
	});

	after(() => {
		mock.restore();
	});
});
