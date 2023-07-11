const stream = require('stream');
const LimitExceededError = require('./LimitExceededError');

class LimitSizeStream extends stream.Transform {
  constructor(options) {
    super(options);

    this.limit = options.limit;
    this.totalSize = 0;
    this.isLimitedExceeded = false;
  }

  _transform(chunk, encoding, callback) {
    if(this.isLimitedExceeded){
      callback();
      return;
    }

    this.totalSize += chunk.length;

    if(this.totalSize > this.limit){
      this.isLimitedExceeded = true;
      callback(new LimitExceededError());
      return;
    }

    callback(null, chunk);
  }
}

module.exports = LimitSizeStream;