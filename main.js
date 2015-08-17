var Emitter = require('y-emitter'),
    define = require('u-proto/define'),
    updateMax = require('path-event/updateMax'),
    pct = require('pct'),

    Event = require('./Event.js'),

    path = require('path'),

    from = Symbol(),
    to = Symbol(),
    map = Symbol(),
    emitter = Symbol(),

    maximum = Symbol(),

    hsm = 'cC8SHA-a63Gt',

    rest;

// Hsm object

function Hsm(server,host){

  host = host || '';
  server[hsm] = server[hsm] || {};
  if(server[hsm][host]) return server[hsm][host];

  Emitter.Target.call(this,emitter);

  this[maximum] = null;

  this[from] = [];
  this[to] = [];
  this[map] = {};

  server[hsm][host] = this;
  server.on('request',onRequest);

  updateMax(this,maximum);
}

Hsm.prototype = Object.create(Emitter.Target.prototype);

Hsm.isHsm = 'cWxHkA-NbDtE';
Hsm.prototype[define](Hsm.isHsm,true);

Hsm.prototype[define]({

  constructor: Hsm,

  compute: function(path){
    var computed = path,
        i;

    if(path in this[map]) computed = this[map][computed];
    else for(i = 0;i < this[from].length;i++)
      computed = computed.replace(this[from][i],this[to][i]);

    if(computed != path) return this.compute(computed);
    return computed;
  },

  rewrite: function(oldPath,newPath){
    var i;

    if(oldPath instanceof RegExp){

      i = this[from].indexOf(oldPath);

      if(i == -1){
        this[from].push(oldPath);
        this[to].push(newPath);
      }else this[to][i] = newPath;

    }else this[map][oldPath + ''] = newPath + '';

  },

  unrewrite: function(oldPath){
    var i;

    if(oldPath instanceof RegExp){

      i = this[from].indexOf(oldPath);
      if(i != -1){
        this[from].splice(i,1);
        this[to].splice(i,1);
      }

    }else delete this[map][oldPath + ''];

  }

});

// - utils

function onRequest(req,res){
  var h,path,e;

  h = this[hsm][req.headers.host] || this[hsm][''];
  if(!h) return;

  path = h.compute(decode(req.url));
  e = new Event(req,res,path,h[emitter],h[maximum]);
  e.next();
}

function decodeReplace(m){
  rest = m;
  return '';
}

function decode(u){
  url = u.replace(/[\?#].*$/,decodeReplace);
  try{ return pct.decode(path.normalize(url) + rest); }
  finally{ rest = null; }
}

/*/ exports /*/

module.exports = Hsm;
