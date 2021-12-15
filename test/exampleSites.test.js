import cp from 'child_process';
import { join, relative } from 'path';
import fs from 'fs';
import chai from 'chai';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';

chai.use(deepEqualInAnyOrder);
const { expect } = chai;

let ccInfo;
const expectedRaw = fs.readFileSync(join(process.cwd(), 'test/example-info.json'));
const ccInfoExpected = JSON.parse(expectedRaw);

const runProcess = function (wd, command, args) {
	cp.spawnSync(command, args, {
		cwd: wd,
		stdio: 'pipe',
		encoding: 'utf-8'
	});
};

describe('exampleSite', function () {
	this.timeout(5000); // sometimes takes longer than 2000ms (default)
	before(function () {
		const pathToPackage = relative('exampleSite/', '../');
		const wd = join(process.cwd(), 'test/exampleSite/');
		runProcess(wd, 'npx', [pathToPackage, '--config', 'cloudcannon.toml,config.toml']);

		const rawInfo = fs.readFileSync('test/exampleSite/public/_cloudcannon/info.json');
		ccInfo = JSON.parse(rawInfo);
	});

	Object.keys(ccInfoExpected).forEach(function (key) {
		it(`${key} in info.json should match expected output`, function () {
			expect(ccInfo[key]).to.deep.equalInAnyOrder(ccInfoExpected[key]);
		});
	});
});
