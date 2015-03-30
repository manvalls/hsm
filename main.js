var Su = require('u-su'),
    Emitter = require('y-emitter'),
    url = require('url'),
    
    hsm = '1VAXCeD8nIPITw3',
    
    from = Su(),
    to = Su(),
    map = Su(),
    
    emitter = Su(),
    
    Hsm;

Hsm = module.exports = function Hsm(server){
  if(server[hsm]) return server[hsm];
  
  server.on('request',onRequest);
  
  this[from] = [];
  this[to] = [];
  this[map] = {};
  
  server[hsm] = this;
  
  Emitter.Target.call(this,emitter);
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
  event = {
    request: req,
    response: res,
    url: u
  };
  
  en = req.method + ' ' + u.pathname;
  if(h.listeners(en)) return e.give(en,event);
  
  path = u.pathname.split('/');
  path.pop();
  
  while(path.length){
    en = path.join('/');
    if(h.listeners(en)) return e.give(en,event);
    path.pop();
  }
  
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

