import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import mock from 'mock-fs';
import {
	getCollectionKey,
	getPageUrlFromPath,
	getLayout,
	getCollectionsAndConfig
} from '../../src/generators/collections.js';
import pathHelper from '../../src/helpers/paths.js';
import { collectionFiles, testFileStructure } from '../test-paths.js';

describe('collections generator', function () {
	describe('getCollectionKey', function () {
		it('without configuration', function () {
			const collectionsConfig = {};

			assert.strictEqual(getCollectionKey('content/staff/_index.md', collectionsConfig), 'pages');
			assert.strictEqual(getCollectionKey('content/staff/jim.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/staff/jane/index.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/staff/nested/again/jane.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/_index.md', collectionsConfig), 'pages');
			assert.strictEqual(getCollectionKey('content/about/index.md', collectionsConfig), 'pages');
			assert.strictEqual(getCollectionKey('data/offices/dunedin.md', collectionsConfig), null);
		});

		it('with configuration', function () {
			const collectionsConfig = {
				other: {
					path: 'content/elsewhere'
				},
				staff: {
					parse_branch_index: true
				},
				offices: {
					path: 'data/offices'
				}
			};

			assert.strictEqual(getCollectionKey('content/elsewhere/thing.md', collectionsConfig), 'other');
			assert.strictEqual(getCollectionKey('content/staff/_index.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/staff/jim.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/staff/jane/index.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/staff/nested/again/jane.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/_index.md', collectionsConfig), 'pages');
			assert.strictEqual(getCollectionKey('content/about/index.md', collectionsConfig), 'pages');
			assert.strictEqual(getCollectionKey('data/offices/dunedin.md', collectionsConfig), 'offices');
		});

		it('with redefined default configuration', function () {
			const collectionsConfig = {
				pages: {
					path: 'content',
					parse_branch_index: true
				},
				staff: {
					path: 'content/staff'
				}
			};

			// This is pages rather than elsewhere as the pages config has an explicit path
			assert.strictEqual(getCollectionKey('content/elsewhere/thing.md', collectionsConfig), 'pages');
			assert.strictEqual(getCollectionKey('content/staff/_index.md', collectionsConfig), 'pages');
			assert.strictEqual(getCollectionKey('content/staff/jim.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/staff/jane/index.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/staff/nested/again/jane.md', collectionsConfig), 'staff');
			assert.strictEqual(getCollectionKey('content/_index.md', collectionsConfig), 'pages');
			assert.strictEqual(getCollectionKey('content/about/index.md', collectionsConfig), 'pages');
			assert.strictEqual(getCollectionKey('data/offices/dunedin.md', collectionsConfig), null);
		});

		it('with custom pages configuration', function () {
			const collectionsConfig = {
				custom: {
					path: 'content',
					parse_branch_index: true
				}
			};

			assert.strictEqual(getCollectionKey('content/staff/_index.md', collectionsConfig), 'custom');
			assert.strictEqual(getCollectionKey('content/staff/jim.md', collectionsConfig), 'custom');
			assert.strictEqual(getCollectionKey('content/staff/jane/index.md', collectionsConfig), 'custom');
			assert.strictEqual(getCollectionKey('content/_index.md', collectionsConfig), 'custom');
			assert.strictEqual(getCollectionKey('data/offices/dunedin.md', collectionsConfig), null);
		});
	});

	describe('getPageUrlFromPath', function () {
		it('_index file', function () {
			const result = getPageUrlFromPath('content/authors/_index.md', 'content');
			assert.strictEqual(result, '/authors/');
		});

		it('index file', function () {
			const result = getPageUrlFromPath('content/about/index.md', 'content');
			assert.strictEqual(result, '/about/');
		});
	});

	describe('getLayout', function () {
		before(function () {
			pathHelper.clearAllCachedItems();
			mock(testFileStructure);
			pathHelper.getSupportedLanguages({ languages: { en: {} } });
		});

		it('Home page', async function () {
			const result = await getLayout('content/_index.md', {});
			assert.strictEqual(result, 'index');
		});

		it('Home page with type set', async function () {
			const result = await getLayout('content/_index.md', { type: 'mytype' });
			assert.strictEqual(result, 'mytype/list');
		});

		it('Home page with layout set', async function () {
			const result = await getLayout('content/_index.md', { layout: 'mylayout' });
			assert.strictEqual(result, 'index');
		});

		it('single post', async function () {
			const result = await getLayout('content/posts/post.md', {});
			assert.strictEqual(result, 'posts/single');
		});

		it('single leaf bundle post', async function () {
			const result = await getLayout('content/posts/item/index.md', {});
			assert.strictEqual(result, 'posts/single');
		});

		it('single leaf bundle post in a language code', async function () {
			const result = await getLayout('content/en/posts/item/index.md', {});
			assert.strictEqual(result, 'posts/single');
		});

		it('single post with layout set', async function () {
			const result = await getLayout('content/posts/post.md', { layout: 'mylayout' });
			assert.strictEqual(result, 'posts/mylayout');
		});

		it('single post with type set', async function () {
			const result = await getLayout('content/posts/post.md', { type: 'mytype' });
			assert.strictEqual(result, 'mytype/single');
		});

		it('single post with a non-existent type set', async function () {
			const result = await getLayout('content/posts/post.md', { type: 'invalidType' });
			assert.strictEqual(result, 'posts/single');
		});

		it('list page for posts', async function () {
			const result = await getLayout('content/posts/_index.md', {});
			assert.strictEqual(result, '_default/list');
		});

		it('list page using an _index.html file', async function () {
			const result = await getLayout('content/collectionName/_index.html', {});
			assert.strictEqual(result, '_default/list');
		});

		it('list page for mytype', async function () {
			const result = await getLayout('content/mytype/_index.md', {});
			assert.strictEqual(result, 'mytype/list');
		});

		it('list page for posts with type mytype', async function () {
			const result = await getLayout('content/posts/_index.md', { type: 'mytype' });
			assert.strictEqual(result, 'mytype/list');
		});

		it('list page for posts with layout set', async function () {
			const result = await getLayout('content/posts/_index.md', { layout: 'mylayout' });
			assert.strictEqual(result, 'posts/mylayout');
		});

		it('list page for posts with type and layout set', async function () {
			const result = await getLayout('content/posts/_index.md', { type: 'mytype', layout: 'mylayout' });
			assert.strictEqual(result, 'mytype/mylayout');
		});

		after(function () {
			mock.restore();
			pathHelper.clearAllCachedItems();
		});
	});

	describe('getCollectionsAndConfig', function () {
		before(function () {
			const fileStructure = {
				...collectionFiles,
				'data/staff_members': { 'anna.yml': '' }
			};
			pathHelper.clearAllCachedItems();
			mock(fileStructure);
		});

		it('should retrieve collections', async function () {
			const hugoUrls = {
				'content/_index.md': '/',
				'content/coll1/item1.md': '/coll1/item1/',
				'content/coll1/item2.md': '/coll1/item2/',
				'content/posts/post1.md': '/posts/post1/'
			};

			const config = {
				collections_config: {
					coll1: {
						parse_branch_index: true
					},
					data: {
						image_key: 'thumbnail'
					},
					posts: {
						image_key: 'author_image',
						image_size: 'cover'
					},
					staff_members: {
						path: 'data/staff_members'
					}
				}
			};

			const { collections, collectionsConfig } = await getCollectionsAndConfig(config, hugoUrls);

			const expectedCollections = {
				pages: [
					{
						collection: 'pages',
						path: 'content/posts/_index.md',
						content_path: 'posts/_index.md',
						url: '/posts/'
					},
				],
				coll1: [
					{
						collection: 'coll1',
						path: 'content/coll1/_index.md',
						content_path: 'coll1/_index.md',
						url: '/coll1/'
					},
					{
						collection: 'coll1',
						path: 'content/coll1/item1.md',
						content_path: 'coll1/item1.md',
						url: '/coll1/item1/'
					},
					{
						collection: 'coll1',
						headless: true,
						output: false,
						path: 'content/coll1/item2.md',
						content_path: 'coll1/item2.md',
						url: '/coll1/item2/'
					}
				],
				posts: [
					{
						collection: 'posts',
						draft: true,
						published: false,
						path: 'content/posts/post1.md',
						content_path: 'posts/post1.md',
						url: '/posts/post1/'
					}
				],
				staff_members: [
					{
						collection: 'staff_members',
						output: false,
						path: 'data/staff_members/anna.yml',
						url: ''
					}
				],
				data: []
			};

			const expectedCollectionsConfig = {
				pages: {
					path: 'content',
					output: true,
					filter: 'strict',
					parse_branch_index: true,
					auto_discovered: true
				},
				coll1: {
					path: 'content/coll1',
					output: true,
					parse_branch_index: true
				},
				posts: {
					path: 'content/posts',
					output: true,
					image_key: 'author_image',
					image_size: 'cover'
				},
				data: {
					auto_discovered: false,
					path: 'data',
					output: false,
					image_key: 'thumbnail'
				},
				staff_members: {
					path: 'data/staff_members',
					output: false
				}
			};

			assert.deepStrictEqual(collections, expectedCollections);
			assert.deepStrictEqual(collectionsConfig, expectedCollectionsConfig);
		});

		after(function () {
			mock.restore();
			pathHelper.clearAllCachedItems();
		});
	});
});
