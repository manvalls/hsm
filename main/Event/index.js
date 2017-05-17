var PathEvent = require('path-event'),
    define = require('u-proto/define'),
    pct = require('pct'),

    query = require('./query.js'),
    cookies = require('./cookies.js'),

    hsm = Symbol(),
    request = Symbol(),
    response = Symbol(),

    fragment = Symbol(),
    rawQuery = Symbol(),
    path = Symbol(),
    url = Symbol(),
    lastTime = Symbol(),
    origin = Symbol();

class Event extends PathEvent{

  constructor(req,res,h,emitter){
    var url,m,prefixes,method;

    super();
    this[hsm] = emitter.target;
    this[request] = req;
    url = h.compute(req.url,this);

    this[response] = res;
    m = url.match(/([^\?#]*)(?:\?([^#]*))?(?:#(.*))?/);

    this[fragment] = m[3] == null ? null : m[3];
    this[rawQuery] = m[2] == null ? null : m[2];
    this[path] = m[1];
    this[url] = url;

    if(req.headers.query){
      if(this[rawQuery]) this[rawQuery] += '&' + req.headers.query;
      else this[rawQuery] = req.headers.query;
    }

    method = req.method.trim().toUpperCase();
    prefixes = [method + ' '];
    if(method == 'HEAD') prefixes.push('GET ');

    this.emit(m[1],emitter,prefixes);
  }

  get parent(){ return this[hsm]; }
  get hsm(){ return this[hsm]; }
  get request(){ return this[request]; }
  get response(){ return this[response]; }

  get fragment(){ return this[fragment]; }
  get rawQuery(){ return this[rawQuery]; }
  get query(){ return query(this); }
  get path(){ return this[path]; }
  get url(){ return this[url]; }

  get origin(){
    if(this.hasOwnProperty(origin)) return this[origin];

    if(this.request.headers.origin instanceof Array) this[origin] =
      this.request.headers.origin[this.request.headers.origin.length - 1];
    else this[origin] = this.request.headers.origin || null;

    return this[origin];
  }

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
  }

  get cookies(){ return cookies(this,this[request].headers.cookie || ''); }

}

Event.prototype[define]({

  redirect: require('./redirect.js'),
  notModified: require('./notModified.js'),

  setCookie: require('./setCookie.js'),
  sendFile: require('./sendFile.js'),
  send: require('./send.js'),
  sendJSON: require('./sendJSON.js'),

  checkOrigin: require('./checkOrigin.js'),
  checkCache: require('./checkCache.js'),
  basicAuth: require('./basicAuth.js'),

  accept: require('./accept.js'),
  charset: require('./charset.js'),
  encoding: require('./encoding.js'),
  language: require('./language.js')

});

/*/ exports /*/

module.exports = Event;
