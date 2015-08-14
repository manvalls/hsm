
function redirect(location,permanent){

  this.response.writeHead(permanent ? 308 : 307,{
    Location: location
  });

  this.response.end();

}

/*/ exports /*/

module.exports = redirect;
