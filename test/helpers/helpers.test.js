import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import mock from 'mock-fs';
import { exists, getUrlPathname, runProcess } from '../../src/helpers/helpers.js';
import { testFileStructure } from '../test-paths.js';

describe('helpers.js', () => {
	before(() => {
		mock(testFileStructure);
	});

	describe('exists', () => {
		it('should return true with existing path', async () => {
			const doesExist = await exists('content/about.md');
			assert.strictEqual(doesExist, true);
		});

		it('should return false with nonexistant path', async () => {
			const doesExist = await exists('nonExistantPath');
			assert.strictEqual(doesExist, false);
		});
	});

	describe('getUrlPathname', () => {
		const tests = [{ context: 'should error with an invalid url', input: [], expected: '/' }];
		tests.forEach((test) => {
			it(test.context, () => {
				const result = getUrlPathname(...test.input);
				assert.strictEqual(result, test.expected);
			});
		});
	});

	describe('runProcess', () => {
		it('should echo', async () => {
			const result = await runProcess('echo', ['hello']);
			assert.strictEqual(result, 'hello');
		});

		it('should return empty', async () => {
			const result = await runProcess('echo');
			assert.strictEqual(result, '');
		});

		it('should return empty string with unknown command', async () => {
			const result = await runProcess('fakeCommand');
			assert.strictEqual(result, '');
		});
	});

	after(() => {
		mock.restore();
	});
});
