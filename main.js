var Emitter = require('y-emitter'),
    define = require('u-proto/define'),
    updateMax = require('path-event/updateMax'),
    UrlRewriter = require('url-rewriter'),
    walk = require('y-walk'),

    Event = require('./Event.js'),

    emitter = Symbol(),
    maximum = Symbol(),
    server = Symbol(),
    host = Symbol(),

    hsm = 'gAvXhw-VXzYq';

// Hsm object

function Hsm(srv,hst){

  if(!this instanceof Hsm) return new Hsm(srv,hst);

  if(!srv[hsm]){
    srv[hsm] = {};
    srv.on('request',onRequest);
  }

  hst = hst || '';
  if(srv[hsm][hst]) return srv[hsm][hst];
  srv[hsm][hst] = this;
  this[server] = srv;
  this[host] = hst;

  UrlRewriter.call(this,emitter);
  this[maximum] = null;
  updateMax(this,maximum);

}

Hsm.prototype = Object.create(UrlRewriter.prototype);
Hsm.prototype[define]({

  constructor: Hsm,

  get server(){ return this[server]; },
  get host(){ return this[host]; },

  detach: function(){
    delete this.server[hsm][this.host];
  },

  allowOrigin: function(handle,opts){
    return this.on('/*',handleCORS,handle,opts);
  },

  basicAuth: function(handle,realm){
    return this.on('/*',handleBA,handle,realm);
  }

});

// - utils

function onRequest(req,res){
  var h,e;

  h = this[hsm][req.headers.host] || this[hsm][''];
  if(!h) return;

  e = new Event(req,res,h,h[emitter],h[maximum]);
  e.give();
}

function* handleCORS(e,d,handle,opt){
  yield e.capture();
  yield e.checkOrigin(handle,opt);
  e.give();
}

function* handleBA(e,d,handle,realm){
  yield e.capture();
  yield e.basicAuth(handle,realm);
  e.give();
}

/*/ exports /*/

module.exports = Hsm;
