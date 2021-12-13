const { expect } = require('chai');
const mock = require('mock-fs');
const helpers = require('../../src/helpers/helpers');
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
