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

var http = require('http');

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

module.exports = getRequest;
