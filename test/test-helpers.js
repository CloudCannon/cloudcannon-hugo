const originalCwd = process.cwd();

export function useFixture(name) {
	process.chdir(new URL(`fixtures/${name}`, import.meta.url).pathname);
}

export function restoreCwd() {
	process.chdir(originalCwd);
}
