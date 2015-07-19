var PathEvent = require('path-event'),
    Emitter = require('y-emitter'),
    define = require('u-proto/define'),
    apply = require('u-proto/apply'),
    walk = require('y-walk'),
    Cb = require('y-callback/node'),

    url = require('url'),
    QS = require('querystring'),
    fs = require('fs'),
    mime = require('./mime.js'),

    from = Symbol(),
    to = Symbol(),
    map = Symbol(),
    emitter = Symbol(),

    hsm = 'cC8SHA-a63Gt',

    getFinalFile;

// Hsm object

function Hsm(server,host){

  host = host || '';
  server[hsm] = server[hsm] || {};
  if(server[hsm][host]) return server[hsm][host];

  Emitter.Target.call(this,emitter);

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

function encodeCookie(m,c,end){
  return '=' + encodeURIComponent(c) + end;
}

function onRequest(req,res){
  var h,u,path,e,c;

  h = this[hsm][req.headers.host] || this[hsm][''];
  if(!h) return;

  path = h.compute(decodeURI(req.url));
  u = url.parse(path,true);

  e = new Event(u.pathname,h[emitter]);

  e.request = req;
  e.response = res;

  e.hash = u.hash;
  e.search = u.search;
  e.query = u.query;
  e.pathname = u.pathname;
  e.path = u.path;
  e.href = u.href;

  c = req.headers.cookie || '';
  c = c.trim();
  c = c.replace(/="(.*?)"(;|$)/g,encodeCookie);
  c = c.replace(/; /g,';');

  e.cookies = QS.parse(c,';','=');
  e.next();
}

// Event

function Event(path,emitter){
  PathEvent.call(this,path,emitter);
}

Event.prototype = Object.create(PathEvent.prototype);
Event.prototype[define]({

  constructor: Event,

  sendFile: walk.wrap(function*(file,opt){
    var temp,stats,headers,cb,range,code,
        size;

    opt = opt || {};
    headers = opt.headers || {};
    code = opt.code || 200;

    if(opt.staticGzip !== false){
      temp = yield getFinalFileAndStats(file,this.request);
      file = temp[0];
      stats = temp[1];
    }else{
      fs.stat(file,cb = Cb());
      stats = yield cb;
    }

    if(opt.applyMimeHeaders !== false)
      populateMimeHeaders(file,headers,opt.mimeHeaders);

    if(dateCheckFailed(this.request,this.response,stats)) return;

    if(code == 200){

      headers['Accept-Ranges'] = 'bytes';
      headers['Last-Modified'] = stats.mtime.toUTCString();

      range = getRange(this.request,stats);
      if(!validRange(range,stats)){
        this.response.writeHead(416);
        this.response.end();
        return;
      }

    }else range = [0,stats.size - 1];

    size = range[1] - range[0] + 1;
    if(size != stats.size){
      headers['Content-Range'] = range[0] + '-' + range[1] + '/' + stats.size;
      code = 206;
    }

    headers['Content-Length'] = size;

    this.response.writeHead(code,headers);
    if(this.request.method == 'HEAD') return this.response.end();

    fs.createReadStream(file,{start: start, end: end}).pipe(this.response);
  })

});

// - sendFile utils

getFinalFileAndStats = walk.wrap(function*(file,req){
  var enc = req.headers['accept-encoding'],
      cb,stats,gzFile;

  if(enc && enc.indexOf('gzip') != -1) try{

    gzFile = file + 'gz';

    fs.stat(gzFile,cb = Cb());

    stats = yield cb;
    file = gzFile;

  }catch(e){}

  if(!stats){
    fs.stat(file,cb = Cb());
    stats = yield cb;
  }

  return [file, stats];
});

function populateMimeHeaders(file,headers,customMime){
  var i,lastPart,dotParts,ext;

  customMime = customMime || {};

  i = file.lastIndexOf('/');
  if(i == -1) lastPart = file;
  else lastPart = file.slice(i + 1);

  dotParts = lastPart.split('.');

  for(i = 1;i < dotParts.length;i++){
    ext = dotParts[i];

    if(mime[ext]) headers[apply](mime[ext]);
    if(customMime[ext]) headers[apply](customMime[ext]);
  }

}

function dateCheckFailed(req,res,stats){
  var date;

  if(req.headers['if-modified-since']){
    date = new Date(req.headers['if-modified-since']);

    if(date >= stats.mtime){
      res.writeHead(304);
      res.end();
      return true;
    }
  }

  if(req.headers['if-unmodified-since']){
    date = new Date(req.headers['if-unmodified-since']);

    if(date < stats.mtime){
      res.writeHead(412);
      res.end();
      return true;
    }
  }

  return false;
}

function getRange(req,stats){
  var start,end,date,splittedRange,range;

  start = 0;
  end = stats.size - 1;

  if(!req.headers.range) return [start,end];

  if(req.headers['if-range']){
    date = new Date(req.headers['if-range']);
    if(date < stats.mtime) return [start,end];
  }

  splittedRange = req.headers.range.split('=');
  if(splittedRange[0] != 'bytes' || !splittedRange[1]) return [start,end];

  range = splittedRange[1].split('-');

  if(range.length != 2) return [start,end];
  if(!(range[0] || range[1])) return [start,end];

  if(!range[0]){
    start = end - parseInt(range[1]) + 1;
    return [start,end];
  }

  if(!range[1]){
    start = parseInt(range[0]);
    return [start,end];
  }

  start = parseInt(range[0]);
  end = parseInt(range[1]);

  return [start,end];
}

function validRange(range,stats){
  return range[0] >= 0 && range[1] < stats.size && range[1] > range[0];
}
