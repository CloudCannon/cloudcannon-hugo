const testPaths = {
	defaultPaths: [
		'archetypes/default.md',
		'archetypes/notes.md'],
	collectionPaths: [
		'archetypes/notes.md',
		'content/authors/jane-doe.md',
		'content/authors/john-smith.md',
		'content/collectionName/_index.md',
		'content/posts/_index.md',
		'content/posts/firstPost.md'],
	dataPaths: [
		'data/info.yml'],
	pagePaths: [
		'content/about/index.md',
		'content/collectionName/_index.md',
		'content/index.md',
		'content/posts/_index.md'],
	otherPages: [
		'config.toml',
		'theme/exampleSite/index.html']
};

const testFileStructure = {};
Object.keys(testPaths).forEach((pathType) => {
	testPaths[pathType].forEach((path) => {
		if (!testFileStructure[path]) {
			testFileStructure[path] = 'file contents';
		}
	});
});

module.exports = {
	pathsByType: testPaths,
	testFileStructure: testFileStructure // in a structure that is readable to mock-fs
};
