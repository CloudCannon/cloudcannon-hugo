/* eslint-disable prefer-arrow-callback */
/* eslint-disable quote-props */
const { expect } = require('chai');
const mock = require('mock-fs');

const pathHelper = require('../../helpers/paths');

describe('pathHelper', function () {
	before(function () {
		mock({
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
		});
	});

	describe('getDataPaths', function () {
		it('should retrieve data files', async function () {
			const paths = await pathHelper.getDataPaths('data');
			expect(paths).to.deep.equal(['data/authors/jane-doe.md', 'data/authors/john-smith.md']);
		});
	});

	after(function () {
		mock.restore();
	});
});
