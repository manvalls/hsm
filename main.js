var Su = require('u-su'),
    Emitter = require('y-emitter'),
    walk = require('y-walk'),
    apply = require('u-proto/apply'),
    Cb = require('y-callback/node'),
    
    url = require('url'),
    QS = require('querystring'),
    fs = require('fs'),
    mime = require('./mime.js'),
    
    hsm = '1VAXCeD8nIPITw3',
    
    from = Su(),
    to = Su(),
    map = Su(),
    
    emitter = Su(),
    path = Su(),
    
    Hsm;

// Event

function Event(req,res,url,p,e){
  this.request = req;
  this.response = res;
  
  this.url = url;
  this.parts = [];
  
  if(req.headers.cookie) this.cookies = QS.parse(req.headers.cookie.trim(),'; ','=');
  else this.cookies = {};
  
  this[path] = p;
  this[emitter] = e;
}

Object.defineProperties(Event.prototype,{
  
  next: {value: function(){
    var p = this[path],
        e = this[emitter],
        en;
    
    this.parts.unshift(p.pop());
    while(p.length){
      en = p.join('/');
      if(e.target.listeners(en)) return e.give(en,this);
      
      this.parts.unshift(p.pop());
    }
    
  }},
  
  sendFile: {value: walk.wrap(function*(file,opt){
    var headers = (opt = opt || {}).headers || {},
        uMime = opt.mime,
        code = opt.code || 200,
        
        req = this.request,
        res = this.response,
        
        ext,ef,m,cb,stats,start,end,range,size;
    
    if(
        req.headers['accept-encoding'] &&
        req.headers['accept-encoding'].indexOf('gzip') != -1
      ) try{
      
      fs.stat(file + '.gz',cb = Cb());
      stats = yield cb;
      
      headers['Content-Encoding'] = 'gzip';
      file = file + '.gz';
      
    }catch(e){}
    
    if(!stats){
      fs.stat(file,cb = Cb());
      stats = yield cb;
    }
    
    if(stats.isDirectory()) throw new Error('Not a file');
    
    if(!headers['Content-Type']){
      
      ef = file;
      while(m = ef.match(/([^\/]*)\.([^\.]*)$/)){
        ef = m[1];
        ext = m[2];
        
        if(mime[ext]) headers[apply](mime[ext]);
        if(uMime && uMime[ext]) headers[apply](uMime[ext]);
      }
      
      headers['Content-Type'] = headers['Content-Type'] || 'application/octet-stream';
      
    }
    
    if(req.headers['if-modified-since']){
      date = new Date(req.headers['if-modified-since']);
      
      if(date >= stats.mtime){
        res.writeHead(304);
        res.end();
        return;
      }
    }
    
    if(req.headers['if-unmodified-since']){
      date = new Date(req.headers['if-unmodified-since']);
      
      if(date < stats.mtime){
        res.writeHead(412);
        res.end();
        return;
      }
    }
    
    start = 0;
    end = stats.size - 1;
    
    if(req.headers.range) top: {
      
      if(req.headers['if-range']){
        date = new Date(req.headers['if-range']);
        if(date < stats.mtime) break top;
      }
      
      range = req.headers.range.replace('bytes=','').split('-');
      
      if(range.length != 2) break top;
      if(!(range[0] || range[1])) break top;
      
      if(!range[0]){
        start = end - range[1] + 1;
        break top;
      }
      
      if(!range[1]){
        start = parseInt(range[0]);
        break top;
      }
      
      start = parseInt(range[0]);
      end = parseInt(range[1]);
      
    }
    
    size = end - start + 1;
    
    if(start < 0 || end < start || size > stats.size){
      res.writeHead(416);
      res.end();
      return;
    }
    
    if(size != stats.size){
      headers['Content-Range'] = start + '-' + end + '/' + stats.size;
      code = 206;
    }
    
    headers['Accept-Ranges'] = 'bytes';
    headers['Last-Modified'] = stats.mtime.toUTCString();
    headers['Content-Length'] = size;
    
    if(req.method == 'HEAD'){
      res.writeHead(code,headers);
      res.end();
      return;
    }
    
    res.writeHead(code,headers);
    fs.createReadStream(file,{start: start, end: end}).pipe(res);
    
  })}
  
});

// Hsm

Hsm = module.exports = function Hsm(server,host){
  
  host = host || '';
  server[hsm] = server[hsm] || {};
  if(server[hsm][host]) return server[hsm][host];
  
  Emitter.Target.call(this,emitter);
  this[emitter].syn('','request');
  
  server.on('request',onRequest);
  
  this[from] = [];
  this[to] = [];
  this[map] = {};
  
  server[hsm][host] = this;
  
};

function rewrite(href,map,from,to){
  var ph,i;
  
  if(href in map) return rewrite(href,map,from,to);
  
  ph = href;
  for(i = 0;i < from.length;i++) href = href.replace(from[i],to[i]);
  
  if(href != ph) return rewrite(href,map,from,to);
  return href;
}

function onRequest(req,res){
  var i,href,event,u,en,path,e,h;
  
  h = this[hsm][req.headers.host] || this[hsm][''];
  if(!h) return;
  
  e = h[emitter];
  
  href = rewrite(decodeURI(req.url),h[map],h[from],h[to]);
  
  u = url.parse(href,true);
  event = new Event(req,res,u,u.pathname.split('/'),e);
  
  en = req.method + ' ' + u.pathname;
  if(h.listeners(en)) return e.give(en,event);
  
  event.next();
}

Hsm.prototype = new Emitter.Target();
Hsm.prototype.constructor = Hsm;

Hsm.prototype.rewrite = function(key,value){
  var i;
  
  if(key instanceof RegExp){
    i = this[from].indexOf(key);
    if(i == -1){
      this[from].push(key);
      this[to].push(value);
    }else this[to][i] = value;
  }else this[map][key + ''] = value + '';
  
};

Hsm.prototype.unrewrite = function(key){
  var i;
  
  if(key instanceof RegExp){
    
    i = this[from].indexOf(key);
    if(i != -1){
      this[from].splice(i,1);
      this[to].splice(i,1);
    }
    
  }else delete this[map][key + ''];
  
}

