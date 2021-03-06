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
    fs = require('fs'),
    getRequest = require('./lib/getrequest');

function didntCallNext(err, res) {
	assert.equal(res.headers['x-next-fn-called'], 'false');
}

vows.describe('empty directory handling').addBatch({
	'When we require the module': {
		topic: function() {
			return require('../index.js');
		},
		'it works': function(err, mod) {
			assert.ifError(err);
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

					server.listen(8515, function(err) {
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
			'and we make a GET request': {
				topic: getRequest(8515, '/'),
				'it works': function(err) {
					assert.ifError(err);
				},
				'it called next() without an error': function(err, res) {
					assert.equal(res.headers['x-next-fn-called'], 'true');
					assert.isUndefined(res.headers['x-next-fn-err']);
				}
			}
		},
		'and we give it an empty directory and disable fallthrough and mount it on an HTTP server': {
			topic: function(mod) {
				var cb = this.callback,
				    dir = path.join(__dirname, 'empty'),
				    middleware = mod(dir, {
					    fallthrough: false
				    });

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
			'and we make a GET request': {
				topic: getRequest(8516, '/'),
				'it works': function(err) {
					assert.ifError(err);
				},
				'it returns 404 Not Found': function(err, res) {
					assert.equal(res.statusCode, 404);
				},
				'it didn\'t call next()': didntCallNext
			}
		}
	}
}).export(module);
