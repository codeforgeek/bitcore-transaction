var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var bitcore = require('bitcore-lib');
var mysql = require('mysql');
var async = require('async');

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
  this._transaction = this.node.services.transaction;
  this._block = this.node.services.block;
  this._buffer = bitcore.util.buffer;
  this.node.services.bitcoind.on('tx', this.handlerBlock.bind(this));
  this.node.services.bitcoind.on('block', this.blockHandler.bind(this));
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

MyService.prototype.blockHandler = function(block) {
  var self = this;
  this.log.info('*** Got new block *** \n');
  //this.log.info(block.toString('hex'));
  this.node.getBlock(block.toString('hex'),function(err,blockObject) {
   self.log.info("block = ",err, "---\n",blockObject);
  });
  //this.log.info("Block = ",this._buffer.reverse(block));
}


MyService.prototype.handlerBlock = function(tx) {
  this.log.info('got some transaction')
  var self = this;
  var txList = bitcore.Transaction().fromBuffer(tx);
  this.log.info('listing them\n',txList);
  for (var i = 0; i < txList.inputs.length; i++) {
    self.transactionInputHandler(txList.inputs[i]);
  }
}

MyService.prototype.transactionInputHandler = function(input) {
  var self = this;
  if (!input.script) {
    return;
  }
  console.log("Full data\n",input);
  var address = input.script.toAddress(this.node.network);
  console.log("Address = ",address.toString());
  //var amount = this.node.getDetailedTransaction(input.prevTxId.toString());
  this.node.getDetailedTransaction(input.prevTxId.toString('hex'),function(err,data) {
   if(err) return;
   console.log("Transaction Output:\n",data.outputs,"\n--------------------------");
   data.outputs.map(function(singleOutput,index) {
     console.log("Single Output:\n",singleOutput);
     if (singleOutput.address && self.addresses.indexOf(singleOutput.address) != -1) {
        console.log("got something here");
      }
   });
  });
};

module.exports = MyService;
