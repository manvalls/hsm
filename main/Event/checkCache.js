var walk = require('y-walk'),
    Resolver = require('y-resolver'),
    Yielded = Resolver.Yielded;

function* checkCache(mdate,etag){
  var req = this.request,
      res = this.response,
      date,inm,im;

  if(req.headers['if-unmodified-since']){
    date = new Date(req.headers['if-unmodified-since']);

    if(mdate - date > 1000){
      res.writeHead(412);
      res.end();
      yield new Yielded();
    }
  }

  if(req.headers['if-match']){
    im = req.headers['if-match'];
    if(im instanceof Array) im = im.join(',');
    im = im.match(/(W\/)?"([^"]|\\.)*"|\*/gi);

    if(!(im && etag) || (im.indexOf('*') == -1 && im.indexOf(etag) == -1)){
      res.writeHead(412);
      res.end();
      yield new Yielded();
    }
  }

  if(req.headers['if-none-match'] ){

    inm = req.headers['if-none-match'];
    if(inm instanceof Array) inm = inm.join(',');
    inm = inm.match(/(W\/)?"([^"]|\\.)*"|\*/gi);

    if((inm && etag) && (inm.indexOf(etag) != -1 || inm.indexOf('*') != -1)){
      if(req.method == 'GET' || req.method == 'HEAD') res.writeHead(304);
      else res.writeHead(412);
      res.end();
      yield new Yielded();
    }

  }else if(req.headers['if-modified-since']){
    date = new Date(req.headers['if-modified-since']);

    if(!(mdate - date > 1000)){
      res.writeHead(304);
      res.end();
      yield new Yielded();
    }
  }

}

/*/ exports /*/

module.exports = walk.wrap(checkCache);
