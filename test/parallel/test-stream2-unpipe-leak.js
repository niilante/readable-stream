/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/
require('../common');
var assert = require('assert/');
var stream = require('../../');

var chunk = bufferShim.from('hallo');

var util = require('util');

function TestWriter() {
  stream.Writable.call(this);
}
util.inherits(TestWriter, stream.Writable);

TestWriter.prototype._write = function (buffer, encoding, callback) {
  callback(null);
};

var dest = new TestWriter();

// Set this high so that we'd trigger a nextTick warning
// and/or RangeError if we do maybeReadMore wrong.
function TestReader() {
  stream.Readable.call(this, { highWaterMark: 0x10000 });
}
util.inherits(TestReader, stream.Readable);

TestReader.prototype._read = function (size) {
  this.push(chunk);
};

var src = new TestReader();

for (var i = 0; i < 10; i++) {
  src.pipe(dest);
  src.unpipe(dest);
}

assert.strictEqual(src.listeners('end').length, 0);
assert.strictEqual(src.listeners('readable').length, 0);

assert.strictEqual(dest.listeners('unpipe').length, 0);
assert.strictEqual(dest.listeners('drain').length, 0);
assert.strictEqual(dest.listeners('error').length, 0);
assert.strictEqual(dest.listeners('close').length, 0);
assert.strictEqual(dest.listeners('finish').length, 0);

console.error(src._readableState);
process.on('exit', function () {
  src._readableState.buffer.length = 0;
  console.error(src._readableState);
  assert(src._readableState.length >= src._readableState.highWaterMark);
  console.log('ok');
});