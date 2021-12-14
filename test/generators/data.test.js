const { expect } = require('chai');
const mock = require('mock-fs');
const { getData } = require('../../src/generators/data');
const { dataFiles } = require('../test-paths');

const EXPECTED_DATA = {
	footer: [
		{ name: 'Github', order: 0 },
		{ name: 'RSS', order: 1 }
	],
	nav: [
		{ name: 'About', url: '/about/' },
		{ name: 'Contact', url: '/contact/' }
	],
	staff_members: {
		jane: { name: 'Jane Doe', title: 'Developer' },
		john: { name: 'John Smith', title: 'Designer' }
	}
};

describe('getData', function () {
	before(function () {
		mock(dataFiles);
	});

	it('should work', async function () {
		const dataObjects = await getData({ cloudcannon: { data: true } });
		expect(dataObjects).to.deep.equal(EXPECTED_DATA);
	});

	after(function () {
		mock.restore();
	});
});
