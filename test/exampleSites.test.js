const { expect } = require('chai');
const cp = require('child_process');
const Path = require('path');
const fs = require('fs');

let ccInfo;
const expectedRaw = fs.readFileSync(Path.join(process.cwd(), 'test/example-info.json'));
const ccInfoExpected = JSON.parse(expectedRaw);

const runProcess = function (wd, command, args) {
	cp.spawnSync(command, args, {
		cwd: wd,
		stdio: 'pipe',
		encoding: 'utf-8'
	});
};

describe('exampleSite', function () {
	before(function () {
		const pathToPackage = Path.relative('exampleSite/', '../');
		const wd = Path.join(process.cwd(), 'test/exampleSite/');
		runProcess(wd, 'npx', [pathToPackage]);

		const rawInfo = fs.readFileSync('test/exampleSite/public/_cloudcannon/info.json');
		ccInfo = JSON.parse(rawInfo);
	});

	Object.keys(ccInfoExpected).forEach(function (key) {
		it(`${key} in info.json should match expected output`, function () {
			expect(ccInfo[key]).to.eql(ccInfoExpected[key]);
		});
	});
});
