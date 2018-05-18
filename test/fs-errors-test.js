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
    getRequest = require('./lib/getrequest');

vows.describe('directory read error handling').addBatch({
	'When we require the module and muck with Math.random()': {
		topic: function() {
			var lower = false;
			Math.random = function() {
				lower = !lower;
				if (lower) return 0.4;
				return 0.6;
			};

			return require('../index.js');
		},
		'it works': function(err, mod) {
			assert.ifError(err);
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
		}
	}
}).export(module);
