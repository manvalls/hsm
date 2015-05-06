var Su = require('u-su'),
    Emitter = require('y-emitter'),
    walk = require('y-walk'),
    apply = require('u-proto/apply'),
    Cb = require('y-callback/node'),
    
    url = require('url'),
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
  
  sendFile: {value: walk.wrap(function*(file,code,uMime){
    var headers = {},
        req = this.request,
        res = this.response,
        ext,ef,m,cb,stats;
    
    if(typeof code != 'number'){
      uMime = code;
      code = 200;
    }
    
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
    
    ef = file;
    while(m = ef.match(/([^\/]*)\.([^\.]*)$/)){
      ef = m[1];
      ext = m[2];
      
      if(mime[ext]) headers[apply](mime[ext]);
      if(uMime && uMime[ext]) headers[apply](uMime[ext]);
    }
    
    headers['Content-Type'] = headers['Content-Type'] || 'application/octet-stream';
    
    if(req.headers['if-modified-since']){
      date = new Date(req.headers['if-modified-since']);
      
      if(date >= stats.mtime){
        res.writeHead(304);
        res.end();
        return;
      }
    }
    
    headers['Last-Modified'] = stats.mtime.toUTCString();
    headers['Content-Length'] = stats.size;
    
    if(req.method == 'HEAD'){
      res.writeHead(code,headers);
      res.end();
      return;
    }
    
    res.writeHead(code,headers);
    fs.createReadStream(file).pipe(res);
    
  })}
  
});

// Hsm

Hsm = module.exports = function Hsm(server){
  if(server[hsm]) return server[hsm];
  
  Emitter.Target.call(this,emitter);
  this[emitter].syn('','request');
  
  server.on('request',onRequest);
  
  this[from] = [];
  this[to] = [];
  this[map] = {};
  
  server[hsm] = this;
  
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
  
  h = this[hsm];
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

