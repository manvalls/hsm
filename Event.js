var PathEvent = require('path-event'),
    define = require('u-proto/define'),
    pct = require('pct'),

    QS = require('querystring'),

    request = Symbol(),
    response = Symbol(),

    fragment = Symbol(),
    query = Symbol(),
    rawQuery = Symbol(),
    path = Symbol(),
    url = Symbol(),
    lastTime = Symbol(),

    origin = Symbol(),

    cookies = Symbol();

function Event(req,res,p,emitter){
  var m = p.match(/([^\?#]*)(?:\?([^#]*))?(?:#(.*))?/);

  this[request] = req;
  this[response] = res;

  this[fragment] = m[3];
  this[rawQuery] = m[2];
  this[path] = m[1];
  this[url] = p;

  PathEvent.call(this,m[1],emitter);
}

Event.prototype = Object.create(PathEvent.prototype);
Event.prototype[define]({

  constructor: Event,

  get request(){ return this[request]; },
  get response(){ return this[response]; },

  get fragment(){ return this[fragment]; },
  get rawQuery(){ return this[rawQuery]; },
  get query(){ return this[query] = this[query] || Object.freeze(QS.parse(this[rawQuery])); },
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

  get cookies(){
    var c;

    if(this.hasOwnProperty(cookies)) return this[cookies];

    c = this[request].headers.cookie || '';
    if(c instanceof Array) c = c[c.length - 1];

    c = c.trim();
    c = c.replace(/"((?:[^"]|(?:\\.))*)"/g,encode);
    c = c.replace(/; /g,';');

    this[cookies] = Object.freeze(QS.parse(c,';','='));
    return this[cookies];
  },

  redirect: require('./Event/redirect.js'),
  notModified: require('./Event/notModified.js'),

  setCookie: require('./Event/setCookie.js'),
  sendFile: require('./Event/sendFile.js'),
  send: require('./Event/send.js'),
  checkOrigin: require('./Event/checkOrigin.js'),

  accept: require('./Event/accept.js'),
  charset: require('./Event/charset.js'),
  encoding: require('./Event/encoding.js'),
  language: require('./Event/language.js')

});

function encode(m,s1){
  return pct.encodeComponent(s1);
}

/*/ exports /*/

module.exports = Event;
