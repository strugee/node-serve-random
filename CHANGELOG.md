# `serve-random` change log

`serve-random` follows [Semantic Versioning][1].

## 3.0.0 - future

### Breaking

* Drop Node 4 and Node 6 support

## 2.0.1 - 2018-01-13

### Security

* Bump `send` to pull in a `debug` with denial-of-service security fixes

## 2.0.0 - 2018-01-13

### Fixed

* Providing an empty directory no longer crashes the module

### Breaking

* The `fallthrough` option is no longer overwritten with `true`
* `fs.readdir()` errors are now properly passed back to Express

## 1.0.0 - 2017-06-24

### Added

* Initial release

 [1]: http://semver.org/
