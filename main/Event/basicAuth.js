var walk = require('y-walk'),
    Resolver = require('y-resolver'),
    Yielded = Resolver.Yielded;

function* basicAuth(handler,realm){
  var auth = (this.request.headers['authorization'] || '').trim() || 'Basic Og==',
      res = this.response;

  if(!(/^basic .+$/i.test(auth) && (yield walk(credentialsValid,[auth,handler])))){

    res.setHeader('WWW-Authenticate',`Basic realm="${((realm || '') + '').replace(/\\/g,'\\\\').replace(/"/g,'\\"')}"`);
    res.writeHead(401,'You Shall Not Pass');
    res.end();

    yield new Yielded();

  }

}

// - utils

function* credentialsValid(auth,handler){
  var user,pwd,base64,creds;

  base64 = auth.match(/^basic (.+)$/i)[1];
  creds = (new Buffer(base64,'base64')).toString();
  [,user,pwd] = creds.match(/^(.*?)\:(.*)/);

  if(typeof handler == 'function'){
    try{ return yield walk(handler,[user,pwd]); }
    catch(e){ return false; }
  }

  return (handler || {})[user] == pwd;
}

/*/ exports /*/

module.exports = walk.wrap(basicAuth);
