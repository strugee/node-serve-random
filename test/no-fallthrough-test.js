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
    url = require('url');

function didntCallNext(err, res) {
	assert.equal(res.headers['x-next-fn-called'], 'false');
}

vows.describe('disabled fallthrough option').addBatch({
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
		'and we mount it without fallthrough enabled on an HTTP server': {
			topic: function(mod) {
				var cb = this.callback,
				    middleware = mod(path.join(__dirname, 'data'), {
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
		}
	}
}).export(module);
