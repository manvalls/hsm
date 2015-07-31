var PathEvent = require('path-event'),
    define = require('u-proto/define'),

    url = require('url'),
    QS = require('querystring'),

    request = Symbol(),
    response = Symbol(),

    hash = Symbol(),
    search = Symbol(),
    query = Symbol(),
    textQuery = Symbol(),
    pathname = Symbol(),
    path = Symbol(),
    href = Symbol(),

    cookies = Symbol();

function Event(req,res,p,emitter){
  var u = url.parse(p);

  this[request] = req;
  this[response] = res;

  this[hash] = u.hash;
  this[search] = u.search;
  this[textQuery] = u.query;
  this[pathname] = u.pathname;
  this[path] = u.path;
  this[href] = u.href;

  PathEvent.call(this,u.pathname,emitter);
}

Event.prototype = Object.create(PathEvent.prototype);
Event.prototype[define]({

  constructor: Event,

  get request(){ return this[request]; },
  get response(){ return this[response]; },

  get hash(){ return this[hash]; },
  get search(){ return this[search]; },
  get query(){ return this[query] = this[query] || Object.freeze(QS.parse(this[textQuery])); },
  get pathname(){ return this[pathname]; },
  get path(){ return this[path]; },
  get href(){ return this[href]; },

  get cookies(){
    var c;

    if(this[cookies]) return this[cookies];

    c = this[request].headers.cookie || '';
    c = c.trim();
    c = c.replace(/"((?:[^"]|(?:\\.))*)"/g,encode);
    c = c.replace(/; /g,';');

    this[cookies] = Object.freeze(QS.parse(c,';','='));
    return this[cookies];
  },

  sendFile: require('./Event/sendFile.js'),
  accept: require('./Event/accept.js')

});

function encode(m,s1){
  return encodeURIComponent(s1);
}

/*/ exports /*/

module.exports = Event;
