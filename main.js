var Emitter = require('y-emitter'),
    define = require('u-proto/define'),
    updateMax = require('path-event/updateMax'),
    UrlRewriter = require('url-rewriter'),
    walk = require('y-walk'),

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

  constructor: Hsm,

  options: function(){
    return this.on(arguments[0],methodHandler,arguments,arguments[1],'OPTIONS');
  },

  get: function(){
    return this.on(arguments[0],methodHandler,arguments,arguments[1],'GET');
  },

  head: function(){
    return this.on(arguments[0],methodHandler,arguments,arguments[1],'HEAD');
  },

  gh: function(){
    return this.on(arguments[0],ghHandler,arguments,arguments[1]);
  },

  post: function(){
    return this.on(arguments[0],methodHandler,arguments,arguments[1],'POST');
  },

  put: function(){
    return this.on(arguments[0],methodHandler,arguments,arguments[1],'PUT');
  },

  delete: function(){
    return this.on(arguments[0],methodHandler,arguments,arguments[1],'DELETE');
  },

  trace: function(){
    return this.on(arguments[0],methodHandler,arguments,arguments[1],'TRACE');
  },

  connect: function(){
    return this.on(arguments[0],methodHandler,arguments,arguments[1],'CONNECT');
  }

});

// - utils

function methodHandler(a,d,args,cb,method){
  var e = a[0];

  if(e.request.method != method) return e.next();

  args[0] = a;
  args[1] = d;

  walk(cb,args,this);
}

function ghHandler(a,d,args,cb){
  var e = a[0],
      m = e.request.method;

  if(m != 'GET' && m != 'HEAD') return e.next();

  args[0] = a;
  args[1] = d;

  walk(cb,args,this);
}

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
