import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import mock from 'mock-fs';
import { exists, getUrlPathname, runProcess } from '../../src/helpers/helpers.js';
import { testFileStructure } from '../test-paths.js';

describe('helpers.js', function () {
	before(function () {
		mock(testFileStructure);
	});

	describe('exists', function () {
		it('should return true with existing path', async function () {
			const doesExist = await exists('content/about.md');
			assert.strictEqual(doesExist, true);
		});

		it('should return false with nonexistant path', async function () {
			const doesExist = await exists('nonExistantPath');
			assert.strictEqual(doesExist, false);
		});
	});

	describe('getUrlPathname', function () {
		const tests = [
			{ context: 'should error with an invalid url', input: [], expected: '/' }
		];
		tests.forEach((test) => {
			it(test.context, function () {
				const result = getUrlPathname(...test.input);
				assert.strictEqual(result, test.expected);
			});
		});
	});

	describe('runProcess', function () {
		it('should echo', async function () {
			const result = await runProcess('echo', ['hello']);
			assert.strictEqual(result, 'hello');
		});

		it('should return empty', async function () {
			const result = await runProcess('echo');
			assert.strictEqual(result, '');
		});

		it('should return empty string with unknown command', async function () {
			const result = await runProcess('fakeCommand');
			assert.strictEqual(result, '');
		});
	});

	after(function () {
		mock.restore();
	});
});
