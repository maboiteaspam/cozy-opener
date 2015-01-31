
var fs = require('fs');
var pathExtra = require('path-extra');


var Mutexer = function(cozyLight){

  var configHelpers = cozyLight.configHelpers;
  var nodeHelpers = cozyLight.nodeHelpers;

  /**
   * Path to the mutex file
   */
  this.path = function(){
    var mutexPath = configHelpers.getHomePath();
    return pathExtra.join(mutexPath, 'mutex');
  };
  /**
   * Tells if mutex file exists
   */
  this.exists = function(){
    return fs.existsSync(this.path() );
  };
  /**
   * Writes mutex file
   */
  this.write = function(pid){
    fs.writeFileSync(this.path(), pid || process.pid);
  };
  /**
   * Reads mutex file
   * if it does not exist,
   * returns -1;
   *
   * @return {int} Pid of the current process
   */
  this.read = function(){
    if (this.exists() ) {
      return parseInt(fs.readFileSync(this.path(), 'utf-8') );
    }
    return -1;
  };
  /**
   * Removes mutex file
   */
  this.remove = function(){
    if (this.exists() ) {
      return fs.unlinkSync(this.path() );
    }
    return false;
  };
  /**
   * Tells if this process is the master
   */
  this.amIMaster = function(){
    // check if it the master / child process
    var masterPid = this.read();
    return masterPid === process.pid;
  };
  /**
   * Kills master process
   * according to mutex information
   */
  this.killMaster = function(then){
    var pid = this.read();
    if (pid) {
      try {
        process.kill(this.read(), 'SIGINT'); // can take up to ten seconds
      } catch(ex) {
        //console.error(ex); // ignore it
      }
    }
    setTimeout(function(){
      nodeHelpers.invoke(then);
    }, 10 * 1000);
  };
};

module.exports = Mutexer;
