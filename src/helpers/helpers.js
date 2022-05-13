import cp from 'child_process';
import fs from 'fs/promises';
import log from '../helpers/logger.js';

const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);

// Adapted from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
export function mergeDeep(target, ...sources) {
	if (!sources.length) {
		return target;
	}

	const source = sources.shift();

	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach((key) => {
			if (isObject(source[key])) {
				if (!target[key]) {
					Object.assign(target, { [key]: {} });
				}

				mergeDeep(target[key], source[key]);
			} else {
				Object.assign(target, { [key]: source[key] });
			}
		});
	}

	return mergeDeep(target, ...sources);
}

export async function runInChunks(array, asyncMapFn, chunkSize = 10) {
	const chunkCount = Math.ceil(array.length / chunkSize);

	for (let i = 0; i < chunkCount; i += 1) {
		const slice = array.slice(i * chunkSize, ((i + 1) * chunkSize));
		await Promise.all(slice.map(asyncMapFn));
	}
}

export function cheapPlural(amount, str) {
	const amountStr = amount === 0 ? 'no' : amount;
	return `${amountStr} ${str}${amount === 1 ? '' : 's'}`;
}

export async function exists(path) {
	try {
		await fs.access(path);
		return true;
	} catch (err) {
		return false;
	}
}

export function getUrlPathname(url = '/') {
	try {
		return new URL(url).pathname;
	} catch (urlError) {
		return url;
	}
}

export async function runProcess(command, args) {
	return new Promise((resolve) => {
		const childProcess = cp.spawn(command, args, {
			cwd: process.cwd(),
			env: process.env,
			stdio: 'pipe',
			encoding: 'utf-8'
		});

		let result = '';
		childProcess.stdout.on('data', (data) => {
			result = result + data;
		});

		childProcess.on('close', () => {
			const processed = result.toString('utf8')?.trim();
			return resolve(processed || '');
		});

		childProcess.on('error', (code) => {
			log(`command "${command}" exited with code ${code}`, 'error');
			return resolve('');
		});
	});
}
