var Emitter = require('y-emitter'),
    define = require('u-proto/define'),

    Event = require('./Event.js'),

    from = Symbol(),
    to = Symbol(),
    map = Symbol(),
    emitter = Symbol(),

    maximum = Symbol(),

    hsm = 'cC8SHA-a63Gt';

// Hsm object

function Hsm(server,host){

  host = host || '';
  server[hsm] = server[hsm] || {};
  if(server[hsm][host]) return server[hsm][host];

  Emitter.Target.call(this,emitter);

  this[maximum] = 0;

  this[from] = [];
  this[to] = [];
  this[map] = {};

  server[hsm][host] = this;
  server.on('request',onRequest);

}

Hsm.prototype = Object.create(Emitter.Target.prototype);

Hsm.isHsm = 'cWxHkA-NbDtE';
Hsm.prototype[define](Hsm.isHsm,true);

Hsm.prototype[define]({

  constructor: Hsm,

  digest: function(){
    var max = 0,
        event;

    for(event of this.events()) max = Math.max(max,
      (event + '').split('/').length
    );

    this[maximum] = max;
  },

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

// Request listener

function onRequest(req,res){
  var h,path,e;

  h = this[hsm][req.headers.host] || this[hsm][''];
  if(!h) return;

  path = h.compute(decodeURI(req.url));
  e = new Event(req,res,path,h[emitter],h[maximum]);
}

/*/ exports /*/

module.exports = Hsm;
