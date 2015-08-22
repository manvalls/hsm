var Emitter = require('y-emitter'),
    define = require('u-proto/define'),
    updateMax = require('path-event/updateMax'),
    pct = require('pct'),

    Event = global.process ? require('./Eve' + 'nt.js') : null,

    from = Symbol(),
    to = Symbol(),
    map = Symbol(),
    emitter = Symbol(),

    maximum = Symbol(),

    hsm = 'gAvXhw-VXzYq',

    rest;

// Hsm object

function Hsm(server,host){

  this[from] = [];
  this[to] = [];
  this[map] = {};

  if(!arguments.length) return;

  host = host || '';
  server[hsm] = server[hsm] || {};
  if(server[hsm][host]) return server[hsm][host];

  server[hsm][host] = this;
  Emitter.Target.call(this,emitter);
  server.on('request',onRequest);

  this[maximum] = null;
  updateMax(this,maximum);
  
}

Hsm.prototype = Object.create(Emitter.Target.prototype);
Hsm.prototype[define]({

  constructor: Hsm,

  compute: function(path){
    var computed = decode(path,this.maxSlashes),
        i;

    if(this[map].hasOwnProperty(computed)) computed = this[map][computed];
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

  path = h.compute(req.url);
  e = new Event(req,res,path,h[emitter],h[maximum]);
  e.next();
}

function decode(url,max){
  var m = ((url || '') + '').match(/^(.*?)([#\?].*)?$/),
      path = m[1] || '',
      rest = m[2] || '',
      segments = path.split('/',max || 1000),
      result = [],
      segment;

  while((segment = segments.shift()) != null) switch(segment){
    case '..':
      if(result.length > 1) result.pop();
    case '.':
      if(!segments.length) result.push('');
      break;
    default:
      result.push(segment);
      break;
  }

  return pct.decode(result.join('/') + rest);
}

/*/ exports /*/

module.exports = Hsm;
