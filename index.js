

var Duplex = require('readable-stream').Duplex;
var util = require('util');
var Buffer = require('buffer').Buffer;

function SerialDuplex (device) {
  var opts = { highWaterMark: 0 };
  Duplex.call(this, opts);
  this.device = device;
  this.initialized = false;
  return this;
}
util.inherits(SerialDuplex, Duplex);
SerialDuplex.prototype.open = function open_usb (opts, cb) {
  var connInfo;
  var self = this;
  var args = [ ].slice.call(arguments);
  cb = args.pop( );
  opts = args.pop( ) || {bitrate: 9600};
  chrome.serial.connect(this.device, opts, function (info) {
    self.handle = info;
    connInfo = info;
    cb(null, this);
    chrome.serial.onReceive.addListener(onRX);
  });
  function onRX (info) {
    if (info.connectionId == self.handle.connectionId) {
      var data = new Buffer(Array.prototype.slice.apply(new Uint8Array(info.data)));
      self.push(data);
      return;

    }
  }
};
SerialDuplex.prototype._write = function write_usb (chunk, enc, cb) {
  chrome.serial.send(this.handle.connectionId, chunk.buffer, function (info) {
    cb(null);
  });
}
SerialDuplex.prototype._read = function read_usb (n) {
  if (false && n == 0) {
    return;
  }
  return;
}

function scan (matches, callback) {
  if (!callback && matches && matches.call) {
    callback = matches;
    matches = null;
  }
  var r = new RegExp(matches || ".*");
  function whitelist (elem) {
    return elem.match(r) ? elem : null;
  }
  function paths (elem) {
    return elem.path ? elem.path : null;
  }
  chrome.serial.getDevices(function devices (devices) {
    var matched = devices.map(paths).filter(whitelist);
    callback(null, {ports: matched});
  });
}

function acquire (device, cb) {
  var serial = create(device);
  serial.open(opened);
  function opened ( ) {
    cb(serial);
  }
  return serial;
}

function create (device) {
  var serial = new create.SerialDuplex(device);
  return serial;
}
create.SerialDuplex = SerialDuplex;
create.scan = scan;
create.acquire = acquire;

module.exports = create;
