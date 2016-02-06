var Resolver = require('y-resolver'),
    Yielded = Resolver.Yielded,

    simpleMethods = new Set(['GET','HEAD','POST']),
    simpleHeaders = new Set(['accept', 'accept-language', 'content-language', 'content-type']),
    simpleResponseHeaders = new Set(['cache-control','content-language','content-type','expires','last-modified','pragma']);

function checkOrigin(handler,opts){
  var origin = this.origin,
      res = this.response,

      i,header,
      rm,rh,orh;

  if(!origin) return Resolver.accept();

  if(!originValid(origin,handler)){
    res.writeHead(403,'You Shall Not Pass');
    res.end();
    return new Yielded();
  }

  opts = opts || {};
  if(opts.responseHeaders) opts.responseHeaders = new Set(opts.responseHeaders);
  if(opts.requestHeaders) opts.requestHeaders = new Set(opts.requestHeaders);
  if(opts.methods) opts.methods = new Set(opts.methods);

  if(this.request.method == 'OPTIONS'){

    rm = this.request.headers['access-control-request-method'];
    if(!rm) return Resolver.accept();
    if(rm instanceof Array) rm = rm[rm.length - 1];

    if(opts.methods && !(simpleMethods.has(rm) || opts.methods.has(rm))){
      res.writeHead(403,'You Shall Not Pass');
      res.end();
      return new Yielded();
    }

    rh = this.request.headers['access-control-request-headers'];
    orh = rh instanceof Array ? rh.join(', ') : rh;

    if(rh && opts.requestHeaders){

      if(rh instanceof Array) rh = rh.join(',');
      rh = rh.split(',');

      for(i = 0;i < rh.length;i++){
        header = (rh[i] = rh[i].trim()).toLowerCase();
        if(!(simpleHeaders.has(header) || opts.requestHeaders.has(header))){
          res.writeHead(403,'You Shall Not Pass');
          res.end();
          return new Yielded();
        }
      }

    }

    res.setHeader('Access-Control-Allow-Origin',origin);
    if(opts.allowCredentials) res.setHeader('Access-Control-Allow-Credentials','true');
    if(rm) res.setHeader('Access-Control-Allow-Methods',rm);
    if(orh) res.setHeader('Access-Control-Allow-Headers',orh);
    if(opts.timeout) res.setHeader('Access-Control-Max-Age',opts.timeout + '');
    res.end();

    return new Yielded();

  }

  res.setHeader('Access-Control-Allow-Origin',origin);
  if(opts.allowCredentials) res.setHeader('Access-Control-Allow-Credentials','true');
  if(opts.responseHeaders)
    res.setHeader('Access-Control-Expose-Headers',join(opts.responseHeaders));

  return Resolver.accept();
}

// - utils

function join(set){
  var res = '',
      v;

  for(v of set){
    v = v.toLowerCase();
    if(!simpleResponseHeaders.has(v)) res += v + ', ';
  }

  return res.slice(0,-2);
}

function originValid(origin,handler){

  switch(typeof handler){
    case 'string': return origin == handler;
    case 'function':
      try{ return handler(origin); }
      catch(e){ return false; }
    default: return !!origin.match(handler);
  }

}

/*/ exports /*/

module.exports = checkOrigin;
