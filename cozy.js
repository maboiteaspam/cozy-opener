var running = require('is-running');
var opener = require('opener');
var Mutexer = require('./mutexer.js');
var spawn = require('child_process').spawn;

var plugin = {
  configure: function(options, config, program, cozyLight) {
    if (program.command) {
      var cozyMutex = new Mutexer(cozyLight);
      var configHelpers = cozyLight.configHelpers;
      var logger = cozyLight.logger;

      var exists = cozyMutex.exists();

      process.on('exit', function(){
        if (cozyMutex.amIMaster() ) {
          cozyMutex.remove();
        }
      });

      program
        .command('open')
        .description('Starts and browse to Cozy Light')
        .action(function(){

          var openBrowser = function(){
            var browser = opener(configHelpers.getServerUrl() );
            browser.unref();
            browser.stdin.unref();
            browser.stdout.unref();
            browser.stderr.unref();
          };

          var startCozyLight = function(){
            var cozyProcess = spawn('cozy-light', ['start'],
              {detached: true, stdio:'inherit' });
            var pid = cozyProcess.pid;
            cozyProcess.unref();
            return pid;
          };

          if (exists ) {
            console.error(cozyMutex.read())
            running(cozyMutex.read(), function(err, live) {
              if (err) {
                console.error('err');
                console.error(err);
                return ;
              }
              if (live === false){
                logger.info('Restarting !');
                cozyMutex.write(startCozyLight() );
                setTimeout(function(){
                  openBrowser();
                  /*eslint-disable */
                  process.exit(0);
                  /*eslint-enable */
                }, 1000);
              } else {
                logger.info('Already started !');
                openBrowser();
              }
            });
          } else {
            logger.info('Starting !');
            cozyMutex.write(startCozyLight() );
            openBrowser();
          }
        });
    }
  }
};

module.exports = plugin;
