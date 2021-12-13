let enabled = true;

function logInfo(text) {
	console.log(text);
}

function logWarning(text) {
	console.warn(text);
}

function logError(text) {
	console.error(text);
}

const levels = {
	info: logInfo,
	warn: logWarning,
	error: logError
};

module.exports = {
	toggleLogging: function (value) {
		enabled = value;
	},

	log: function (text, level = 'info') {
		if (!enabled) {
			return;
		}

		levels[level](text);
	}
};
