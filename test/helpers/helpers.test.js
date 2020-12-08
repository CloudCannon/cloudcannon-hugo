/* eslint-disable prefer-arrow-callback */
/* eslint-disable quote-props */
const { expect } = require('chai');
const mock = require('mock-fs');

const helpers = require('../../helpers/helpers');
const { testFileStructure } = require('../test-paths');

describe('helpers.js', function () {
	before(function () {
		mock(testFileStructure);
	});

	describe('exists', function () {
		it('should return true with existing path', async function () {
			const doesExist = await helpers.exists('archetypes/default.md');
			expect(doesExist).to.equal(true);
		});

		it('should return false with nonexistant path', async function () {
			const doesExist = await helpers.exists('nonExistantPath');
			expect(doesExist).to.equal(false);
		});
	});

	describe('getItemDetails', function () {
		it('should return empty when path is empty', async function () {
			const details = await helpers.getItemDetails('fakePath');
			const expected = {};
			expect(details).to.deep.equal(expected);
		});
	});

	describe('parseYaml', function () {
		it('should parse correctly', function () {
			const tomlString = `
			key: "value"
			`;
			const parsedObject = helpers.parseYaml(tomlString);
			const expectedObject = {
				key: 'value'
			};
			expect(parsedObject).to.deep.equal(expectedObject);
		});

		it('should not parse', function () {
			const tomlString = `
			,
			`;
			const parsedObject = helpers.parseYaml(tomlString);
			expect(parsedObject).to.deep.equal(undefined);
		});
	});

	describe('parseToml', function () {
		it('should parse correctly', function () {
			const tomlString = `
			key = "value"
			`;
			const parsedObject = helpers.parseToml(tomlString);
			const expectedObject = {
				key: 'value'
			};
			expect(parsedObject).to.deep.equal(expectedObject);
		});

		it('should not parse', function () {
			const tomlString = `
			key: "value"
			`;
			const parsedObject = helpers.parseToml(tomlString);
			expect(parsedObject).to.deep.equal(undefined);
		});
	});

	describe('parseFrontMatter', function () {
		const tests = [
			{
				context: 'empty file',
				input: '',
				expected: {}
			},
			{
				context: 'file with small valid yaml frontmatter',
				input: '---\nkey: value\n---\n',
				expected: {
					key: 'value'
				}
			},
			{
				context: 'file with small invalid yaml frontmatter',
				input: '---\n,\n---\n',
				expected: undefined
			},
			{
				context: 'file with small valid yaml frontmatter but invalid fences',
				input: '--\nkey: value\n---\n',
				expected: {}
			},
			{
				context: 'file with small valid toml frontmatter',
				input: '+++\nkey = "value"\n+++\n',
				expected: {
					key: 'value'
				}
			},
			{
				context: 'file with small invalid toml frontmatter',
				input: '+++\nkey: "value"\n+++\n',
				expected: undefined
			},
			{
				context: 'file with small valid toml frontmatter but invalid fences',
				input: '++\nkey: "value"\n+++\n',
				expected: {}
			},
			{
				context: 'file with small valid json frontmatter',
				input: '{\n"key" = "value"\n}\n',
				expected: {}
			},
			{
				context: 'file with no frontmatter',
				input: 'This is some cool content!',
				expected: {}
			}
		];

		tests.forEach((test) => {
			it(test.context || '', function () {
				const result = helpers.parseFrontMatter(test.input);
				expect(result).to.deep.equal(test.expected);
			});
		});
	});

	describe('getUrlPathname', function () {
		const tests = [
			{ context: 'should error with an invalid url', input: [], expected: '/' }
		];
		tests.forEach((test) => {
			it(test.context, function () {
				const result = helpers.getUrlPathname(...test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});

	describe('runProcess', function () {
		it('should echo', function () {
			const result = helpers.runProcess('echo', ['hello']);
			expect(result).to.equal('hello');
		});

		it('should return empty', function () {
			const result = helpers.runProcess('echo');
			expect(result).to.equal('');
		});

		it('should return empty string with unknown command', function () {
			const result = helpers.runProcess('fakeCommand');
			expect(result).to.equal('');
		});
	});

	describe('processArgs', function () {
		it('should return relevant build options', async function () {
			const argArray = ['--environment', 'production', '--theme', 'theme1,theme2', '--quiet', '-s', 'src', '--verbose'];
			const expectedObject = { source: 'src', environment: 'production' };
			const argObject = helpers.processArgs(argArray);
			expect(argObject).to.deep.equal(expectedObject);
		});
	});

	after(function () {
		mock.restore();
	});
});
