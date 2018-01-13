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

var vows = require('perjury'),
    assert = vows.assert,
    http = require('http'),
    path = require('path'),
    url = require('url'),
    fs = require('fs');

function getRequest(port, path) {
	if (!path) {
		path = port;
		port = 8513;
	}

	return function() {
		var cb = this.callback,
		    req = http.get('http://localhost:' + port + path);

		req.on('error', cb);
		req.on('response', function(res) {
			res.on('readable', cb.bind(undefined, undefined, res));
		});
	};
}

function didntCallNext(err, res) {
	assert.equal(res.headers['x-next-fn-called'], 'false');
}

vows.describe('serve-random module').addBatch({
	'When we require the module and muck with Math.random()': {
		topic: function() {
			var lower = false;
			Math.random = function() {
				lower = !lower;
				if (lower) return 0.4;
				return 0.6;
			};

			return require('./index.js');
		},
		'it works': function(err, mod) {
			assert.ifError(err);
		},
		'and we mount it on an HTTP server': {
			topic: function(mod) {
				var cb = this.callback,
				    middleware = mod(path.join(__dirname, 'testdata'));

				var server = http.createServer(function(req, res) {
					res.setHeader('X-Next-Fn-Called', 'false');
					middleware(req, res, function() {
						res.setHeader('X-Next-Fn-Called', 'true');
						res.end();
					});
				});

				server.listen(8513, function(err) {
					cb(err, server);
				});
			},
			teardown: function(server) {
				server.close(this.callback);
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'and we make a GET request to /': {
				topic: getRequest('/'),
				'it works': function(err, res) {
					assert.ifError(err);
					assert.equal(res.statusCode, 200);
				},
				'it returns the first file': function(err, res) {
					assert.equal(res.read().toString(), 'file1\n');
				},
				'it didn\'t call next()': didntCallNext,
				'and we make a GET request to /path': {
					topic: getRequest('/path'),
					'it works': function(err, res) {
						assert.ifError(err);
						assert.equal(res.statusCode, 200);
					},
					'it returns the second file': function(err, res) {
						assert.equal(res.read().toString(), 'file2\n');
					},
					'it didn\'t call next()': didntCallNext,
					'and we make a GET request to /path/subpath': {
						topic: getRequest('/path/subpath'),
						'it works': function(err, res) {
							assert.ifError(err);
							assert.equal(res.statusCode, 200);
						},
						'it returns the first file': function(err, res) {
							assert.equal(res.read().toString(), 'file1\n');
						},
						'it didn\'t call next()': didntCallNext
					}
				}
			},
			'and we make a POST request': {
				topic: function() {
					var cb = this.callback,
					    reqUrl = url.parse('http://localhost:8513');

					reqUrl.method = 'POST';

					var req = http.request(reqUrl);

					req.on('error', cb);
					req.on('response', function(res) {
						res.on('readable', cb.bind(undefined, undefined, res));
					});

					req.end();
				},
				'it works': function(err, res) {
					assert.ifError(err);
					assert.equal(res.statusCode, 200);
				},
				'it called next()': function(err, res) {
					assert.equal(res.headers['x-next-fn-called'], 'true');
				}
			}
		},
		'and we mount it without fallthrough enabled on an HTTP server': {
			topic: function(mod) {
				var cb = this.callback,
				    middleware = mod(path.join(__dirname, 'testdata'), {
					    fallthrough: false
				    });

				var server = http.createServer(function(req, res) {
					res.setHeader('X-Next-Fn-Called', 'false');
					middleware(req, res, function() {
						res.setHeader('X-Next-Fn-Called', 'true');
						res.end();
					});
				});

				server.listen(8514, function(err) {
					cb(err, server);
				});
			},
			teardown: function(server) {
				server.close(this.callback);
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'and we make a POST request': {
				topic: function() {
					var cb = this.callback,
					    reqUrl = url.parse('http://localhost:8514');

					reqUrl.method = 'POST';
					
					var req = http.request(reqUrl);

					req.on('error', cb);
					req.on('response', function(res) {
						res.on('readable', cb.bind(undefined, undefined, res));
					});

					req.end();
				},
				'it works': function(err) {
					assert.ifError(err);
				},
				'it returns 405 Method Not Allowed': function(err, res) {
					assert.equal(res.statusCode, 405);
				},
				'it returns the right headers': function(err, res) {
					assert.equal(res.headers['allow'], 'GET, HEAD');
					assert.equal(res.headers['content-length'], '0');
				},
				'it didn\'t call next()': didntCallNext
			}
		},
		'and we doom it to ENOENT errors and mount it on an HTTP server': {
			topic: function(mod) {
				var cb = this.callback,
				    middleware = mod('/nonexistant');

				var server = http.createServer(function(req, res) {
					res.setHeader('X-Next-Fn-Called', 'false');
					middleware(req, res, function(err) {
						res.setHeader('X-Next-Fn-Called', 'true');
						if (err) res.setHeader('X-Next-Fn-Err', err.message);
						res.end();
					});
				});

				server.listen(8515, function(err) {
					cb(err, server);
				});
			},
			teardown: function(server) {
				server.close(this.callback);
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'and we make a GET request': {
				topic: getRequest(8515, '/'),
				'it works': function(err) {
					assert.ifError(err);
				},
				'it called next() with the right error': function(err, res) {
					assert.equal(res.headers['x-next-fn-called'], 'true');
					assert.isString(res.headers['x-next-fn-err']);
					assert.isTrue(res.headers['x-next-fn-err'].includes('ENOENT'));
				}
			}
		},
		'and we give it an empty directory and mount it on an HTTP server': {
			topic: function(mod) {
				var cb = this.callback,
				    dir = path.join(__dirname, 'empty'),
				    middleware = mod(dir);

				fs.mkdir(dir, function(err) {
					if (err && err.code != 'EEXIST') {
						cb(err);
						return;
					}

					var server = http.createServer(function(req, res) {
						res.setHeader('X-Next-Fn-Called', 'false');
						middleware(req, res, function(err) {
							res.setHeader('X-Next-Fn-Called', 'true');
							if (err) res.setHeader('X-Next-Fn-Err', err.message);
							res.end();
						});
					});

					server.listen(8516, function(err) {
						cb(err, server);
					});
				});
			},
			teardown: function(server) {
				server.close(this.callback);
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			// TODO this get request mucks with the Math.random stub
			'and we make a GET request': {
				topic: getRequest(8516, '/'),
				'it works': function(err) {
					assert.ifError(err);
				},
				'it called next() without an error': function(err, res) {
					assert.equal(res.headers['x-next-fn-called'], 'true');
					assert.isUndefined(res.headers['x-next-fn-err']);
				}
			}
		},
		'and we bind its arguments to have a falsy root option': {
			topic: function(mod) {
				return mod.bind(undefined, null);
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'calling it throws TypeError': function(err, boundFn) {
				assert.throws(boundFn, function(err) {
					return (err instanceof TypeError && err.message === 'root path required');
				});
			}
		},
		'and we bind its arguments to have a non-string root option': {
			topic: function(mod) {
				return mod.bind(undefined, 1337);
			},
			'it works': function(err) {
				assert.ifError(err);
			},
			'calling it throws TypeError': function(err, boundFn) {
				assert.throws(boundFn, function(err) {
					return (err instanceof TypeError && err.message === 'root path must be a string');
				});
			}
		}
	}
}).export(module);
