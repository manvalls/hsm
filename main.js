var Emitter = require('y-emitter'),
    define = require('u-proto/define'),
    updateMax = require('path-event/updateMax'),
    UrlRewriter = require('url-rewriter'),
    walk = require('y-walk'),

    Event = require('./Event.js'),

    emitter = Symbol(),
    maximum = Symbol(),

    hsm = 'gAvXhw-VXzYq';

// Hsm object

function Hsm(server,host){

  if(!server[hsm]){
    server[hsm] = {};
    server.on('request',onRequest);
  }

  host = host || '';
  if(server[hsm][host]) return server[hsm][host];
  server[hsm][host] = this;

  UrlRewriter.call(this,emitter);
  this[maximum] = null;
  updateMax(this,maximum);

}

Hsm.prototype = Object.create(UrlRewriter.prototype);
Hsm.prototype[define]({

  constructor: Hsm,

  allowOrigin: function(handle,opts){
    return this.on('*',handleCORS,handle,opts);
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
  yield e.take();
  yield e.checkOrigin(handle,opt);
  e.give();
}

/*/ exports /*/

module.exports = Hsm;
