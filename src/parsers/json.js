// Attempts to parse JSON from a string that may have content after it
export function parseJsonUnstrict(data) {
	let parseData = data;
	let lastBracketIndex = parseData.lastIndexOf('}');

	while (parseData) {
		try {
			return parseData ? JSON.parse(parseData) : parseData;
		} catch {
			lastBracketIndex = parseData.lastIndexOf('}', parseData.length - 2);
			parseData = parseData.substring(0, lastBracketIndex + 1); // Add one to include the bracket
		}
	}

	return {};
}
