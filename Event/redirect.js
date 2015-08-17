var pct = require('pct');

function redirect(location,permanent){

  this.response.writeHead(permanent ? 308 : 307,{
    Location: pct.encode(location)
  });

  this.response.end();

}

/*/ exports /*/

module.exports = redirect;
