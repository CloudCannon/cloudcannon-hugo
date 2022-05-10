import { expect } from 'chai';
import mock from 'mock-fs';
import {
	getCollectionKeyFromMap,
	getCollectionKeyFromPath,
	getPageUrl,
	getLayout,
	getCollectionsAndConfig
} from '../../src/generators/collections.js';
import pathHelper from '../../src/helpers/paths.js';
import { collectionFiles, testFileStructure } from '../test-paths.js';

describe('collections generator', function () {

	describe('getCollectionKeyFromMap', function () {
		const collectionPathsMap = {
			'content/posts': 'posts',
			'content/group': 'renamed',
			'content/nested/inner': 'nestedRename'
		};

		it('post in collection', function () {
			const result = getCollectionKeyFromMap('content/posts/item.md', collectionPathsMap);
			expect(result).to.equal('posts');
		});

		it('about page', function () {
			const result = getCollectionKeyFromMap('content/about/_index.md', collectionPathsMap);
			expect(result).to.be.undefined;
		});

		it('nested item in renamed collection', function () {
			const result = getCollectionKeyFromMap('content/group/nested/file/path/item.md', collectionPathsMap);
			expect(result).to.equal('renamed');
		});

		it('nested item in nested renamed collection', function () {
			const result = getCollectionKeyFromMap('content/nested/inner/file/path/item.md', collectionPathsMap);
			expect(result).to.equal('nestedRename');
		});

		it('item outside of nested collection', function () {
			const result = getCollectionKeyFromMap('content/nested/item.md', collectionPathsMap);
			expect(result).to.be.undefined;
		});
	});

	describe('getCollectionKeyFromPath contentDirectory', function () {
		it('_index file', function () {
			const result = getCollectionKeyFromPath('content/collectionName/_index.md', 'content');
			expect(result).to.equal('collectionName');
		});

		it('no _index file', function () {
			const result = getCollectionKeyFromPath('content/authors/jane-doe.md', 'content');
			expect(result).to.equal('authors');
		});

		it('nested, no _index file', function () {
			const result = getCollectionKeyFromPath('content/authors/nested/file/path/jane-doe.md', 'content');
			expect(result).to.equal('authors');
		});
	});

	describe('getCollectionKeyFromPath archetypes', function () {
		it('index file', function () {
			const result = getCollectionKeyFromPath('archetypes/archetypeName/index.md', 'content', 'archetypes');
			expect(result).to.equal('archetypeName');
		});

		it('no index file', function () {
			const result = getCollectionKeyFromPath('archetypes/someFolder/archetype.md', 'content', 'archetypes');
			expect(result).to.equal('archetype');
		});

		it('item in root archetype dir', function () {
			const result = getCollectionKeyFromPath('archetypes/archetypeName.md', 'content', 'archetypes');
			expect(result).to.equal('archetypeName');
		});

		it('default archetype', function () {
			const result = getCollectionKeyFromPath('archetypes/default.md', 'content', 'archetypes');
			expect(result).to.equal(undefined);
		});
	});

	describe('getPageUrl', function () {
		it('_index file', function () {
			const result = getPageUrl('content/authors/_index.md', {}, 'content');
			expect(result).to.equal('/authors/');
		});

		it('index file', function () {
			const result = getPageUrl('content/about/index.md', {}, 'content');
			expect(result).to.equal('/about/');
		});
	});

	describe('getLayout', function () {
		before(function () {
			pathHelper.clearCachedLayouts();
			mock(testFileStructure);
			pathHelper.getSupportedLanguages({ languages: { en: {} } });
		});

		it('Home page', async function () {
			const result = await getLayout('content/_index.md', {});
			expect(result).to.equal('index');
		});

		it('Home page with type set', async function () {
			const result = await getLayout('content/_index.md', { type: 'mytype' });
			expect(result).to.equal('mytype/list');
		});

		it('Home page with layout set', async function () {
			const result = await getLayout('content/_index.md', { layout: 'mylayout' });
			expect(result).to.equal('index');
		});

		it('single post', async function () {
			const result = await getLayout('content/posts/post.md', {});
			expect(result).to.equal('posts/single');
		});

		it('single leaf bundle post', async function () {
			const result = await getLayout('content/posts/item/index.md', {});
			expect(result).to.equal('posts/single');
		});

		it('single leaf bundle post in a language code', async function () {
			const result = await getLayout('content/en/posts/item/index.md', {});
			expect(result).to.equal('posts/single');
		});

		it('single post with layout set', async function () {
			const result = await getLayout('content/posts/post.md', { layout: 'mylayout' });
			expect(result).to.equal('posts/mylayout');
		});

		it('single post with a non-existent type set', async function () {
			const result = await getLayout('content/posts/post.md', { type: 'invalidType' });
			expect(result).to.equal('posts/single');
		});

		it('list page for posts', async function () {
			const result = await getLayout('content/posts/_index.md', {});
			expect(result).to.equal('_default/list');
		});

		it('list page using an _index.html file', async function () {
			const result = await getLayout('content/collectionName/_index.html', {});
			expect(result).to.equal('_default/list');
		});

		it('list page for mytype', async function () {
			const result = await getLayout('content/mytype/_index.md', {});
			expect(result).to.equal('mytype/list');
		});

		it('list page for posts with type mytype', async function () {
			const result = await getLayout('content/posts/_index.md', { type: 'mytype' });
			expect(result).to.equal('mytype/list');
		});

		it('list page for posts with layout set', async function () {
			const result = await getLayout('content/posts/_index.md', { layout: 'mylayout' });
			expect(result).to.equal('posts/mylayout');
		});

		it('list page for posts with type and layout set', async function () {
			const result = await getLayout('content/posts/_index.md', { type: 'mytype', layout: 'mylayout' });
			expect(result).to.equal('mytype/mylayout');
		});

		after(function () {
			mock.restore();
			pathHelper.clearCachedLayouts();
		});
	});

	describe('getCollectionsAndConfig', function () {
		before(function () {
			const fileStructure = {
				...collectionFiles,
				'data/staff_members': { 'anna.yml': '' }
			};

			mock(fileStructure);
		});

		it('should retrieve collections', async function () {
			const urlsPerPath = {
				'content/coll1/item1.md': '/coll1/item1/',
				'content/coll1/item2.md': '/coll1/item2/',
				'content/posts/post1.md': '/posts/post1/'
			};

			const config = {
				collections_config: {
					data: {
						_image_key: 'thumbnail'
					},
					posts: {
						_image_key: 'author_image',
						_image_size: 'cover'
					},
					fakeCollection: 'wackyLink',
					staff_members: {
						path: 'data/staff_members'
					}
				}
			};

			const { collections, collectionsConfig } = await getCollectionsAndConfig(config, urlsPerPath);

			const expectedCollections = {
				coll1: [
					{
						collection: 'coll1',
						path: 'content/coll1/_index.md',
						url: '/coll1/'
					},
					{
						collection: 'coll1',
						path: 'content/coll1/item1.md',
						url: '/coll1/item1/'
					},
					{
						collection: 'coll1',
						headless: true,
						output: false,
						path: 'content/coll1/item2.md',
						url: '/coll1/item2/'
					}
				],
				posts: [
					{
						collection: 'posts',
						path: 'content/posts/_index.md',
						url: '/posts/'
					},
					{
						collection: 'posts',
						draft: true,
						published: false,
						path: 'content/posts/post1.md',
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
				leaf: [],
				type: []
			};

			const expectedCollectionsConfig = {
				coll1: {
					path: 'content/coll1',
					output: true
				},
				posts: {
					path: 'content/posts',
					output: true,
					_image_key: 'author_image',
					_image_size: 'cover'
				},
				data: {
					path: 'data',
					output: false,
					_image_key: 'thumbnail'
				},
				leaf: {
					path: 'content/leaf',
					output: true
				},
				type: {
					path: 'content/type',
					output: false
				},
				staff_members: {
					path: 'data/staff_members',
					output: false
				}
			};

			expect(collections).to.deep.equal(expectedCollections);
			expect(collectionsConfig).to.deep.equal(expectedCollectionsConfig);
		});

		after(function () {
			mock.restore();
		});
	});
});
