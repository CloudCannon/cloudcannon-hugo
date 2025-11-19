import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import mock from "mock-fs";
import { getData } from "../../src/generators/data.js";
import { dataFiles } from "../test-paths.js";

const EXPECTED_DATA = {
	footer: [
		{ name: "Github", order: 0 },
		{ name: "RSS", order: 1 },
	],
	nav: [
		{ name: "About", url: "/about/" },
		{ name: "Contact", url: "/contact/" },
	],
	staff_members: {
		jane: { name: "Jane Doe", title: "Developer" },
		john: { name: "John Smith", title: "Designer" },
	},
};

describe("data generator", () => {
	before(() => {
		mock(dataFiles);
	});

	it("should allow all", async () => {
		const dataObjects = await getData({ data_config: true });
		assert.deepEqual(dataObjects, EXPECTED_DATA);
	});

	it("should allow some", async () => {
		const dataObjects = await getData({ data_config: { nav: true } });
		assert.deepEqual(dataObjects, { nav: EXPECTED_DATA.nav });
	});

	it("should allow none", async () => {
		const dataObjects = await getData({});
		assert.deepEqual(dataObjects, undefined);
	});

	after(() => {
		mock.restore();
	});
});
