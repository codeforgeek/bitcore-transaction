var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var bitcore = require('bitcore-lib');
var mysql = require('mysql');

function MyService(options) {
  EventEmitter.call(this);
  this.node = options.node;
  this.log = this.node.log;
  this.log.info("I am called");
  this.addresses = [
"2Mxs1sYMGh2dR5tHBLCMnhdjMim8Kvn88wW",
"2MvVK98nuCj9TsPWJ855njDT733CKwpVdCw",
"2N3xPEq3AiWXgW6QnyN15efaMqVPC1SBsTd",
"2N5xZUhG3mTpUhRd6FCFuFXUhwA1TQ9Zy4z",
"2MvVPENNKb2gLHvnR7WRWjSB3F7HpnfD2ZV"
];
  this.node.services.bitcoind.on('tx', this.handlerBlock.bind(this));
}
inherits(MyService, EventEmitter);

MyService.dependencies = ['bitcoind'];

MyService.prototype.start = function(callback) {
  this.log.info("***** Starting");
  setImmediate(callback);
};

MyService.prototype.stop = function(callback) {
  setImmediate(callback);
};

MyService.prototype.getAPIMethods = function() {
  return [];
};

MyService.prototype.getPublishEvents = function() {
  return [];
};

MyService.prototype.blockHandler = function(block, add, callback) {
  this.log.info('asdasdasdasdasdasd') 
  this.log.info("Block = ",block);
  this.log.info("address = ",add);
   setImmediate(callback);
}

MyService.prototype.handlerBlock = function(tx) {
  this.log.info('got some transaction')
var self = this;
  var txList = bitcore.Transaction().fromBuffer(tx);
  this.log.info('listing them');
 for (var i = 0; i < txList.inputs.length; i++) {
    self.transactionInputHandler(txList.inputs[i]);
  }
}

MyService.prototype.transactionInputHandler = function(input) {
  if (!input.script) {
    return;
  }
  var address = input.script.toAddress(this.node.network);
  console.log("Address = ",address);
  if (address && this.addresses.indexOf(address.toString()) != -1) {
    console.log("got something here");
  }
};

module.exports = MyService;
