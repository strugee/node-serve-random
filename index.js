/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var resolve = require('path').resolve,
    fs = require('fs'),
    send = require('send'),
    defaults = require('lodash.defaults');

module.exports = function serveRandom(root, opts) {
	opts = defaults({}, opts, {
		fallthrough: true
	});

	if (!root) {
		throw new TypeError('root path required');
	}

	if (typeof root !== 'string') {
		throw new TypeError('root path must be a string');
	}

	return function serveStatic(req, res, next) {
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			if (opts.fallthrough) {
				next();
				return;
			}

			// Method not allowed
			res.statusCode = 405;
			res.setHeader('Allow', 'GET, HEAD');
			res.setHeader('Content-Length', '0');
			res.end();
			return;
		}

		fs.readdir(root, function(err, files) {
			if (err) {
				next(err);
				return;
			}

			var path = files.filter(function(name) {
				return name[0] !== '.';
			// https://stackoverflow.com/a/4550514/1198896
			})[Math.floor(Math.random() * files.length)];

			if (!path) {
				// Directory was empty
				if (opts.fallthrough) {
					next();
					return;
				}

				res.statusCode = 404;
				res.end();
				return;
			}

			var stream = send(req, path, {
				maxAge: 0,
				root: resolve(root),
				lastModified: false,
				etag: false
			});

			// Forward errors
			stream.on('error', function error(err) {
				next(err);
				return;
			});

			stream.pipe(res);
		});
	};
};
