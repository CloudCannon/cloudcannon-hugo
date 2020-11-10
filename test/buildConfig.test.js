/* eslint-disable prefer-arrow-callback */
const { expect } = require('chai');

const buildConfig = require('../generators/buildConfig');

describe('buildConfig', function () {
	describe('getCollectionName', function () {
		describe('contentDirectory', function () {
			context('with index file', function () {
				it('should work', function () {
					const path = 'content/collectionName/index.md';
					const result = buildConfig.getCollectionName(path, false);
					expect(result).to.equal('collectionName');
				});
			});
			context('without index file', function () {
				it('should return nothing', function () {
					const path = 'content/collectionName/item.md';
					const result = buildConfig.getCollectionName(path, false);
					expect(result).to.equal(undefined);
				});
			});
			context('outside of directory', function () {
				it('should return nothing', function () {
					const path = 'content/item.md';
					const result = buildConfig.getCollectionName(path, false);
					expect(result).to.equal(undefined);
				});
			});
			context('outside of directory', function () {
				it('should return nothing', function () {
					const path = 'content/index.md';
					const result = buildConfig.getCollectionName(path, false);
					expect(result).to.equal(undefined);
				});
			});
		});
		describe('archetypes', function () {
			context('with index file', function () {
				it('should work', function () {
					const path = 'archetypes/collectionName/index.md';
					const result = buildConfig.getCollectionName(path, true);
					expect(result).to.equal('collectionName');
				});
			});
			context('without index file in file', function () {
				it('should work', function () {
					const path = 'archetypes/someFolder/archetype.md';
					const result = buildConfig.getCollectionName(path, true);
					expect(result).to.equal('archetype');
				});
			});
			context('in root archetype dir', function () {
				it('should return the collection name', function () {
					const path = 'archetypes/collectionName.md';
					const result = buildConfig.getCollectionName(path, true);
					expect(result).to.equal('collectionName');
				});
			});
			context('default archetype', function () {
				it('should return nothing', function () {
					const path = 'archetypes/default.md';
					const result = buildConfig.getCollectionName(path, true);
					expect(result).to.equal(undefined);
				});
			});
		});
	});
});
