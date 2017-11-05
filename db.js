var mysql = require('mysql');
var async = require('async');

function dbService(config) {
  var self = this;
  self.config = config;
  self.pool = mysql.createPool({
    host     : self.config.host,
    user     : self.config.user,
    password : self.config.password,
    database : self.config.database,
    connectionLimit : 100,
    debug    :  false
  });
}

dbService.prototype.connectToDb = function(callback) {
  var self = this;
  self.pool.getConnection(function(err,connection) {
    if(err) {
      return callback(true,"Error establishing connection to the database pool\n"+err);
    }
    callback(null,connection);
  });
}

dbService.prototype.getAddress = function(callback) {
  var self = this;
  var address = [];
  async.waterfall([
    function(callback) {
      self.connectToDb(function(err,connection) {
        if(err) {
          return callback(true,"Error establishing connection to the database.");
        }
        callback(null,connection);
      });
    },
    function(conn,callback) {
      conn.query("select * from address",function(err,data) {
        //release the connection to the pool
        conn.release();
        if(err) {
		console.log(err);
		return callback(true,"Error running the query");
	}
        if(data.length > 0) {
          data.map(function(singleAddress,index) {
            address.push(singleAddress.address);
          });
          callback(null,address);
        } else {
          return callback(null,[]);
        }
      });
    }
  ],function(err,data) {
    if(err) return callback(true,data);
    callback(null,data);
  });
}

module.exports = dbService;
