const cp = require('child_process');

module.exports = {
	runProcess: async function (command, args) {
		const childProcess = await cp.spawnSync(command, args, {
			cwd: process.cwd(),
			env: process.env,
			stdio: 'pipe',
			encoding: 'utf-8'
		});
		return Promise.resolve(childProcess.output[1]); // second item contains the actual response
	}
};
