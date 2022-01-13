import { expect } from 'chai';
import mock from 'mock-fs';
import { getData } from '../../src/generators/data.js';
import { dataFiles } from '../test-paths.js';

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

describe('data generator', function () {
	before(function () {
		mock(dataFiles);
	});

	it('should allow all', async function () {
		const dataObjects = await getData({ data_config: true });
		expect(dataObjects).to.deep.equal(EXPECTED_DATA);
	});

	it('should allow some', async function () {
		const dataObjects = await getData({ data_config: { nav: true } });
		expect(dataObjects).to.deep.equal({ nav: EXPECTED_DATA.nav });
	});

	it('should allow none', async function () {
		const dataObjects = await getData({});
		expect(dataObjects).to.deep.equal(undefined);
	});

	after(function () {
		mock.restore();
	});
});
