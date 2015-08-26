var Emitter = require('y-emitter'),
    define = require('u-proto/define'),
    updateMax = require('path-event/updateMax'),
    UrlRewriter = require('url-rewriter'),

    Event = require('./Event.js'),

    emitter = Symbol(),
    maximum = Symbol(),

    hsm = 'gAvXhw-VXzYq',

    rest;

// Hsm object

function Hsm(server,host){

  host = host || '';
  server[hsm] = server[hsm] || {};
  if(server[hsm][host]) return server[hsm][host];

  UrlRewriter.call(this);
  Emitter.Target.call(this,emitter);

  server[hsm][host] = this;
  server.on('request',onRequest);

  this[maximum] = null;
  updateMax(this,maximum);

}

Hsm.prototype = Object.create(UrlRewriter.prototype);
Hsm.prototype[define]({

  constructor: Hsm

});

// - utils

function onRequest(req,res){
  var h,url,e;

  h = this[hsm][req.headers.host] || this[hsm][''];
  if(!h) return;

  url = h.compute(req.url);
  e = new Event(req,res,url,h[emitter],h[maximum]);
  e.next();
}

/*/ exports /*/

module.exports = Hsm;
