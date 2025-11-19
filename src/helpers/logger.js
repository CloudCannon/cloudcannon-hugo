let enabled = true;
let verbose = false;

export function setLogOptions(options) {
	enabled = options.enabled;
	verbose = options.verbose;
}

const loggers = {
	debug: (text) => console.debug(text),
	info: (text) => console.log(text),
	warn: (text) => console.warn(text),
	error: (text) => console.error(text),
};

export default function log(text, level = "info") {
	if (!enabled || (level === "debug" && !verbose)) {
		return;
	}

	loggers[level](text);
}
