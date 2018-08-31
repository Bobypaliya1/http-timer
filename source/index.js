'use strict';

const deferToConnect = require('defer-to-connect');

module.exports = request => {
	const timings = {
		start: Date.now(),
		socket: null,
		lookup: null,
		connect: null,
		response: null,
		end: null,
		phases: {
			wait: null,
			dns: null,
			firstByte: null,
			download: null,
			tcp: null,
			total: null
		}
	};

	request.once('socket', socket => {
		timings.socket = Date.now();
		timings.phases.wait = timings.socket - timings.start;

		const lookupListener = () => {
			timings.lookup = Date.now();
			timings.phases.dns = timings.lookup - timings.socket;
		};

		socket.once('lookup', lookupListener);

		deferToConnect(socket, () => {
			timings.connect = Date.now();

			if (timings.lookup === null) {
				socket.removeListener('lookup', lookupListener);
				timings.lookup = timings.connect;
				timings.phases.dns = timings.lookup - timings.socket;
			}

			timings.phases.tcp = timings.connect - timings.lookup;
		});
	});

	request.once('response', response => {
		timings.response = Date.now();
		timings.phases.firstByte = timings.response - timings.connect;

		response.once('end', () => {
			timings.end = Date.now();
			timings.phases.download = timings.end - timings.response;
			timings.phases.total = timings.end - timings.start;
		});
	});

	return timings;
};
