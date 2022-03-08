import { expect } from 'chai';
import mock from 'mock-fs';
import { exists, getUrlPathname, runProcess } from '../../src/helpers/helpers.js';
import { testFileStructure } from '../test-paths.js';

describe('helpers.js', function () {
	before(function () {
		mock(testFileStructure);
	});

	describe('exists', function () {
		it('should return true with existing path', async function () {
			const doesExist = await exists('archetypes/default.md');
			expect(doesExist).to.equal(true);
		});

		it('should return false with nonexistant path', async function () {
			const doesExist = await exists('nonExistantPath');
			expect(doesExist).to.equal(false);
		});
	});

	describe('getUrlPathname', function () {
		const tests = [
			{ context: 'should error with an invalid url', input: [], expected: '/' }
		];
		tests.forEach((test) => {
			it(test.context, function () {
				const result = getUrlPathname(...test.input);
				expect(result).to.equal(test.expected);
			});
		});
	});

	describe('runProcess', function () {
		it('should echo', async function () {
			const result = await runProcess('echo', ['hello']);
			console.log(`got result: ${result}`);
			expect(result).to.equal('hello');
		});

		it('should return empty', async function () {
			const result = await runProcess('echo');
			expect(result).to.equal('');
		});

		it('should return empty string with unknown command', async function () {
			const result = await runProcess('fakeCommand');
			expect(result).to.equal('');
		});
	});

	after(function () {
		mock.restore();
	});
});
