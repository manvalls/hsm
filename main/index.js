var Emitter = require('y-emitter'),
    Detacher = require('detacher'),
    UrlRewriter = require('url-rewriter'),
    Event = require('./Event'),

    emitter = Symbol();

// Hsm object

class Hsm extends UrlRewriter{

  constructor(...args){
    super(emitter);
    if(args.length) this.bind(...args);
  }

  bind(...args){
    var d = new Detacher(),
        server;

    if(args.length == 1 && typeof args[0] == 'object' && typeof args[0].on == 'function'){
      server = args[0];
    }else{
      server = require('http').createServer().listen(...args);
      d.add(server);
    }

    let onRequest = (req, res) => {
      var e = new Event(req, res, this, this[emitter]);
      e.give();
    };

    server.on('request', onRequest);
    d.listen(server.removeListener, ['request', onRequest], server);
    return d;
  }

  allowOrigin(handle, opts){
    return this.on('/*', handleCORS, handle, opts);
  }

  basicAuth(handle, realm){
    return this.on('/*', handleBA, handle, realm);
  }

  host(host){
    var HostFilteredHsm = require('./HostFilteredHsm');
    return new HostFilteredHsm(this, host);
  }

}

// - utils

function* handleCORS(e, d, handle, opt){
  yield e.capture();
  yield e.checkOrigin(handle, opt);
  e.give();
}

function* handleBA(e, d, handle, realm){
  yield e.capture();
  yield e.basicAuth(handle, realm);
  e.give();
}

/*/ exports /*/

module.exports = Hsm;
