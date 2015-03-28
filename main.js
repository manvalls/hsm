var Su = require('u-su'),
    Emitter = require('y-emitter'),
    url = require('url'),
    
    hsm = '1VAXCeD8nIPITw3',
    
    from = Su(),
    to = Su(),
    ids = Su(),
    
    emitter = Su(),
    
    Hsm;

Hsm = module.exports = function Hsm(server){
  if(server[hsm]) return server[hsm];
  
  server.on('request',onRequest);
  
  this[from] = [];
  this[to] = [];
  this[ids] = [];
  
  server[hsm] = this;
  
  Emitter.Target.call(this,emitter);
};

function onRequest(req,res){
  var i,href,event,u,en,path,e,h;
  
  h = this[hsm];
  e = h[emitter];
  
  href = decodeURI(req.url);
  for(i = 0;i < h[from].length;i++){
    href = href.replace(h[from][i],h[to][i]);
  }
  
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
    en = (req.method + ' ' + path.join('/')).trim();
    if(h.listeners(en)) return e.give(en,event);
    
    path.pop();
  }
  
}

Hsm.prototype = new Emitter.Target();
Hsm.prototype.constructor = Hsm;

Hsm.prototype.rewrite = function(f,t){
  var id = {};
  
  this[from].push(f);
  this[to].push(t);
  this[ids].push(id);
  
  return id;
};

Hsm.prototype.unrewrite = function(id){
  var i = this[ids].indexOf(id);
  
  if(i != -1){
    this[from].splice(i,1);
    this[to].splice(i,1);
    this[ids].splice(i,1);
  }
}

