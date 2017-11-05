var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var bitcore = require('bitcore-lib');
var config = require('./config');
var dbService = require('./db');
var db = new dbService(config);

function MyService(options) {
  EventEmitter.call(this);
  this.node = options.node;
  this.log = this.node.log;
  this.unit = bitcore.Unit;
  this.unitPreference = this.unit.BTC;
  this.addresses = null;
  // Add event listeners
  this.node.services.bitcoind.on('tx', this.handleTransaction.bind(this));
  this.node.services.bitcoind.on('block', this.blockHandler.bind(this));
}
inherits(MyService, EventEmitter);

MyService.dependencies = ['bitcoind'];

MyService.prototype.start = function(callback) {
  var self = this;
  self.log.info("***** Starting ****");
  // get the address to watch
  db.getAddress(function(err,data) {
    if(err) {
      self.log.info(err);
      self.stop();
      return;
    }
    if(data.length > 0) {
      self.addresses = data;
    } else {
      // no address to watch
      self.stop();
      return;
    }
  });
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
  self.log.info('*** Got new block *** \n');
  self.node.getBlock(block.toString('hex'),function(err,blockObject) {
   self.log.info("block = ",err, "---\n",blockObject);
  });
}

MyService.prototype.handleTransaction = function(tx) {
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
  var sum = [];
  var cumulativeSum = [];
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
     // look for the address we got from db
     if (singleOutput.address && self.addresses.indexOf(singleOutput.address) != -1) {
        self.log.info("Got the matching address");
        // convert satoshi to btc
        value = self.unit.fromSatoshis(singleOutput.satoshis).to(self.unitPreference);
        //push the satoshi amount in the array
        sum.push({"address": singleOutput.address, "satoshi": value});
      }
   });
   if(sum.length > 0) {
     // got some money,find the cumulative sum
     sum.reduce(function(a,b,i) {
       return cumulativeSum[i] = a+b;
     },0);
     self.log.info("Full Sequence of sum\n",cumulativeSum);
     self.log.info("Total amount: = ",cumulativeSum[cumulativeSum.length -1]);
   }
  });
};

module.exports = MyService;
