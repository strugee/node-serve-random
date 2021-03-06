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
    http = require('http');

vows.describe('middleware setup error handling').addBatch({
	'When we require the module': {
		topic: function() {
			return require('../index.js');
		},
		'it works': function(err, mod) {
			assert.ifError(err);
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
