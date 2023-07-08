const stream = require('stream');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);
    this.remainingData = '';
  }

  _transform(chunk, encoding, callback) {
    const data = this.remainingData + chunk.toString();
    const lines = data.split(/\r?\n/);

    for (let i = 0; i < lines.length - 1; i++) {
      this.push(lines[i]);
    }

    this.remainingData = lines[lines.length - 1];

    callback();
  }

  _flush(callback) {
    if (this.remainingData) {
      this.push(this.remainingData);
    }

    callback();
  }
}

module.exports = LineSplitStream;
