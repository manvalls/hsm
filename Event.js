var PathEvent = require('path-event'),
    define = require('u-proto/define'),
    pct = require('pct'),

    query = require('./Event/query.js'),
    cookies = require('./Event/cookies.js'),

    request = Symbol(),
    response = Symbol(),

    fragment = Symbol(),
    rawQuery = Symbol(),
    path = Symbol(),
    url = Symbol(),
    lastTime = Symbol(),
    origin = Symbol();

function Event(req,res,h,emitter,max){
  var url,m,prefixes,method;

  this[request] = req;
  url = h.compute(req.url,this);

  this[response] = res;
  m = url.match(/([^\?#]*)(?:\?([^#]*))?(?:#(.*))?/);

  this[fragment] = m[3];
  this[rawQuery] = m[2];
  this[path] = m[1];
  this[url] = url;

  if(req.headers.query){
    if(this[rawQuery]) this[rawQuery] += '&' + req.headers.query;
    else this[rawQuery] = req.headers.query;
  }

  method = req.method.trim().toUpperCase();
  prefixes = [method + ' '];
  if(method == 'HEAD') prefixes.push('GET ');

  PathEvent.call(this,m[1],emitter,max,prefixes);
}

Event.prototype = Object.create(PathEvent.prototype);
Event.prototype[define]({

  constructor: Event,

  get request(){ return this[request]; },
  get response(){ return this[response]; },

  get fragment(){ return this[fragment]; },
  get rawQuery(){ return this[rawQuery]; },
  get query(){ return query(this); },
  get path(){ return this[path]; },
  get url(){ return this[url]; },

  get origin(){
    if(this.hasOwnProperty(origin)) return this[origin];

    if(this.request.headers.origin instanceof Array) this[origin] =
      this.request.headers.origin[this.request.headers.origin.length - 1];
    else this[origin] = this.request.headers.origin;

    return this[origin];
  },

  get lastTime(){
    var im,m;

    if(this[lastTime]) return this[lastTime];
    if(this.request.headers['if-modified-since'])
      return this[lastTime] = new Date(this.request.headers['if-modified-since']);

    im = this.request.headers['if-match'];
    if(im){
      if(im instanceof Array) im = im.join(',');
      m = im.match(/"hd\-(\-?[0-9a-z]*)"/);
      if(m) return this[lastTime] = new Date(parseInt(m[1],36));
    }

    return this[lastTime] = new Date(-1e15);
  },

  get cookies(){ return cookies(this,this[request].headers.cookie || ''); },

  redirect: require('./Event/redirect.js'),
  notModified: require('./Event/notModified.js'),

  setCookie: require('./Event/setCookie.js'),
  sendFile: require('./Event/sendFile.js'),
  send: require('./Event/send.js'),
  sendJSON: require('./Event/sendJSON.js'),
  checkOrigin: require('./Event/checkOrigin.js'),

  accept: require('./Event/accept.js'),
  charset: require('./Event/charset.js'),
  encoding: require('./Event/encoding.js'),
  language: require('./Event/language.js')

});

/*/ exports /*/

module.exports = Event;
