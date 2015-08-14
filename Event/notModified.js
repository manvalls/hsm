
function notModified(){
  this.response.writeHead(304);
  this.response.end();
}

/*/ exports /*/

module.exports = notModified;
