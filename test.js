'use strict';

var vows = require('perjury'),
    assert = vows.assert;

vows.describe('serve-random module').addBatch({
	'When we require the module': {
		topic: function() {
			return require('./index.js');
		},
		'it works': function(err, mod) {
			assert.ifError(err);
		}
	}
}).export(module);
