
function sendJSON(data,opt){
  opt = opt || {};
  opt.headers = opt.headers || {};
  opt.headers['Content-Type'] = opt.headers['Content-Type'] || 'application/json';
  this.send(JSON.stringify(data),opt);
}

/*/ exports /*/

module.exports = sendJSON;
