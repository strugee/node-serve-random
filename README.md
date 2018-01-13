# node-serve-random

[![Build Status](https://travis-ci.org/strugee/node-serve-random.svg?branch=master)](http://travis-ci.org/strugee/node-serve-random)
[![Coverage Status](https://coveralls.io/repos/github/strugee/node-serve-random/badge.svg?branch=master)](https://coveralls.io/github/strugee/node-serve-random?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/strugee/node-serve-random.svg)](https://greenkeeper.io/)

Serve random files

Vaguely API-compatible with [serve-static][].

## API

### serveRandom(root, options)

Create a new middleware function to serve files from within a given root directory. With each inbound request, a random file will be selected from the given root directory. The module will not recurse into subdirectories.

The response's max-age is always set to 0.

#### Options

##### fallthrough

Set the middleware to have client errors (mostly just use of an HTTP method other than `GET` or `HEAD`) fall-through as just unhandled requests, otherwise forward a client error. The difference is that client errors will cause this middleware to simply `next()` to your next middleware when this value is `true`. When this value is `false`, these errors (even 404s), will invoke `next(err)`.

Defaults to `true`.

## Acknowledgments

This module heavily borrows code from [serve-static][] - many thanks to the great people who work on that module.

## License

LGPL 3.0+

## Author

AJ Jordan <alex@strugee.net>

 [serve-static]: https://github.com/expressjs/serve-static
