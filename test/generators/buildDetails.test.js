/* eslint-disable prefer-arrow-callback */
const { expect } = require('chai');
const mock = require('mock-fs');

const buildDetails = require('../../generators/buildDetails');
const { cloudCannonMeta } = require('../../helpers/metadata');
const pathHelper = require('../../helpers/paths');

const {
	collectionFiles,
	dataFiles,
	pages,
	testFileStructure
} = require('../test-paths');

describe('buildDetails', function () {
	describe('getMarkdownMeta', function () {
		it('should return default markdown metadata', function () {
			const result = buildDetails.getMarkdownMetadata({});
			const expected = {
				markdown: 'goldmark',
				goldmark: {
					extensions: {
						definitionList: true,
						footnote: true,
						linkify: true,
						strikethrough: true,
						table: true,
						taskList: true,
						typographer: true
					},
					parser: {
						attribute: true,
						autoHeadingID: true,
						autoHeadingIDType: 'github'
					},
					renderer: {
						hardWraps: false,
						unsafe: false,
						xhtml: false
					}
				}
			};
			expect(result).to.deep.equal(expected);
		});

		it('should return default blackfriday metadata', function () {
			const result = buildDetails.getMarkdownMetadata({ markup: { defaultMarkdownHandler: 'blackfriday' } });
			const expected = {
				markdown: 'blackfriday',
				blackfriday: {
					angledQuotes: false,
					extensions: null,
					extensionsMask: null,
					footnoteAnchorPrefix: '',
					footnoteReturnLinkContents: '',
					fractions: true,
					hrefTargetBlank: false,
					latexDashes: true,
					nofollowLinks: false,
					noreferrerLinks: false,
					plainIDAnchors: true,
					skipHTML: false,
					smartDashes: true,
					smartypants: true,
					smartypantsQuotesNBSP: false,
					taskLists: true
				}
			};
			expect(result).to.deep.equal(expected);
		});

		it('should return markup in config', function () {
			const markup = { markup: { goldmark: { renderer: { unsafe: true } } } };
			const expected = {
				markdown: 'goldmark',
				goldmark: {
					extensions: {
						definitionList: true,
						footnote: true,
						linkify: true,
						strikethrough: true,
						table: true,
						taskList: true,
						typographer: true
					},
					parser: {
						attribute: true,
						autoHeadingID: true,
						autoHeadingIDType: 'github'
					},
					renderer: {
						hardWraps: false,
						unsafe: true,
						xhtml: false
					}
				}
			};

			const result = buildDetails.getMarkdownMetadata(markup);
			expect(result).to.deep.equal(expected);
		});
	});

	describe('getCollectionName()', function () {
		const tests = [
			{ input: ['content/authors/jane-doe.md'], expected: 'authors', context: 'input: author collection' },
			{ input: ['data/staff/john.toml', 'data'], expected: 'staff', context: 'input: datafile' },
			{ input: ['content/posts/test-post/index.md'], expected: 'posts', context: 'post in page bundle' },
			{ input: ['nested/content/dir/_index.md'], expected: 'dir', context: '_index page in nested content dir' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = buildDetails.getCollectionName(...test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});

	describe('getPageUrl()', function () {
		const tests = [
			{ input: ['content/authors/_index.md', {}, 'content'], expected: '/authors/', context: 'input: _index file' },
			{ input: ['content/about/index.md', {}, 'content'], expected: '/about/', context: 'input: index file' }
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = buildDetails.getPageUrl(...test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});

	describe('getDataFiles()', function () {
		before(function () {
			mock(dataFiles);
		});

		it('should work', async function () {
			const dataObjects = await buildDetails.getDataFiles();
			const expected = {
				footer: [{ name: 'Github', order: 0 }, { name: 'RSS', order: 1 }],
				nav: [{ name: 'About', url: '/about/' }, { name: 'Contact', url: '/contact/' }],
				staff_members: {
					jane: { name: 'Jane Doe', title: 'Developer' },
					john: { name: 'John Smith', title: 'Designer' }
				}
			};

			expect(dataObjects).to.deep.equal(expected);
		});

		after(function () {
			mock.restore();
		});
	});

	describe('getCollections', function () {
		before(function () {
			mock(collectionFiles);
		});

		it('should retrieve collections', async function () {
			const urlsPerPath = {
				'content/coll1/item1.md': '/coll1/item1/',
				'content/coll1/item2.md': '/coll1/item2/',
				'content/posts/post1.md': '/posts/post1/'
			};
			const results = await buildDetails.getCollections(urlsPerPath);
			const expected = {
				coll1: [
					{
						collection: 'coll1',
						path: 'content/coll1/item1.md',
						url: '/coll1/item1/',
						layout: ''
					},
					{
						collection: 'coll1',
						output: false,
						path: 'content/coll1/item2.md',
						url: '/coll1/item2/',
						layout: ''
					}
				],
				posts: [
					{
						collection: 'posts',
						published: false,
						path: 'content/posts/post1.md',
						url: '/posts/post1/',
						layout: ''
					}
				]
			};
			expect(results).to.deep.equal(expected);
		});

		after(function () {
			mock.restore();
		});
	});

	describe('getLayout', function () {
		before(function () {
			delete pathHelper.cachedLayouts;
			mock(testFileStructure);
		});

		const tests = [
			{
				input: ['content/_index.md', {}],
				expected: 'index',
				context: 'input: Home page'
			},
			{
				input: ['content/_index.md', { type: 'mytype' }],
				expected: 'mytype/list',
				context: 'input: Home page with type set'
			},
			{
				input: ['content/_index.md', { layout: 'mylayout' }],
				expected: 'index',
				context: 'input: Home page with layout set'
			},
			{
				input: ['content/posts/post.md', {}],
				expected: 'posts/single',
				context: 'input: single post'
			},
			{
				input: ['content/posts/item/index.md', {}],
				expected: 'posts/single',
				context: 'input: single leaf bundle post'
			},
			{
				input: ['content/posts/post.md', { layout: 'mylayout' }],
				expected: 'posts/mylayout',
				context: 'input: single post with layout set'
			},
			{
				input: ['content/posts/post.md', { type: 'invalidType' }],
				expected: 'posts/single',
				context: 'input: single post with a non-existent type set'
			},
			{
				input: ['content/posts/_index.md', {}],
				expected: '_default/list',
				context: 'input: list page for posts'
			},
			{
				input: ['content/mytype/_index.md', {}],
				expected: 'mytype/list',
				context: 'input: list page for mytype'
			},
			{
				input: ['content/posts/_index.md', { type: 'mytype' }],
				expected: 'mytype/list',
				context: 'input: list page for posts with type mytype'
			},
			{
				input: ['content/posts/_index.md', { layout: 'mylayout' }],
				expected: 'posts/mylayout',
				context: 'input: list page for posts with layout set'
			},
			{
				input: ['content/posts/_index.md', { type: 'mytype', layout: 'mylayout' }],
				expected: 'mytype/mylayout',
				context: 'input: list page for posts with type and layout set'
			}
		];

		tests.forEach((test) => {
			it(test.context || '', async function () {
				const result = await buildDetails.getLayout(...test.input);
				expect(result).to.equal(test.expected);
			});
		});

		after(function () {
			mock.restore();
			delete pathHelper.cachedLayouts;
		});
	});

	describe('getPages', function () {
		before(function () {
			mock(pages);
		});

		it('should retrieve only pages', async function () {
			const expected = [
				{
					name: '_index.md',
					path: 'content/_index.md',
					title: '_index.md',
					url: '/',
					layout: ''
				},
				{
					name: 'about.md',
					path: 'content/about.md',
					title: 'about.md',
					url: '',
					published: false,
					layout: ''
				},
				{
					name: '_index.md',
					path: 'content/contact/_index.md',
					title: '_index.md',
					url: '/contact/',
					layout: ''
				},
				{
					name: 'index.md',
					path: 'content/help/index.md',
					title: 'index.md',
					url: '/help/',
					output: false,
					layout: ''
				}
			];
			const results = await buildDetails.getPages({});

			expect(results).to.deep.equal(expected);
		});

		after(function () {
			mock.restore();
		});
	});

	describe('generateDetails', function () {
		this.timeout(10000); // can take slightly longer than 2000ms
		it('should return default details', async function () {
			const expected = {
				collections: {},
				cloudcannon: cloudCannonMeta,
				pages: [],
				time: ''
			};
			const result = await buildDetails.generateDetails({});
			Object.keys(result).forEach((key) => {
				if (key === 'generator') {
					return;
				}
				expect(result[key]).to.deep.equal(expected[key]);
			});
		});

		describe('with data', async function () {
			before(function () {
				mock(dataFiles);
			});

			it('should return all data', async function () {
				const expected = {
					data: {
						footer: [
							{ name: 'Github', order: 0 },
							{ name: 'RSS', order: 1 }
						],
						nav: [
							{ name: 'About', url: '/about/' },
							{ name: 'Contact', url: '/contact/' }
						],
						staff_members: {
							jane: { name: 'Jane Doe', title: 'Developer' },
							john: { name: 'John Smith', title: 'Designer' }
						}
					}
				};

				const result = await buildDetails.generateDetails({
					cloudcannon: { data: true }
				});
				expect(result.data).to.deep.equal(expected.data);
			});

			it('should return the specified data', async function () {
				const expected = {
					data: {
						nav: [
							{ name: 'About', url: '/about/' },
							{ name: 'Contact', url: '/contact/' }
						],
						staff_members: {
							jane: { name: 'Jane Doe', title: 'Developer' },
							john: { name: 'John Smith', title: 'Designer' }
						}
					}
				};

				const result = await buildDetails.generateDetails({
					cloudcannon: { data: { nav: true, staff_members: true } }
				});
				expect(result.data).to.deep.equal(expected.data);
			});
		});

		after(function () {
			mock.restore();
		});
	});
});
