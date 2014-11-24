var Su = require('vz.rand').Su,
    Vse = require('vse'),
    Yielded = require('vz.yielded'),
    
    url = require('url'),
    
    hsm = Su(),
    
    from = Su(),
    to = Su(),
    ids = Su(),
    
    Hsm;

// Event

function Event(req,res,parsedUrl){
  this.url = parsedUrl;
  this.request = req;
  this.response = res;
}

Object.defineProperties(Event.prototype,{
  query: {get: function(){
    return this.url.query;
  }},
  headers: {get: function(){
    return this.request.headers;
  }},
  send: {value: function(status,reason,headers,data){
    
    switch(arguments.length){
      case 1:
        data = status;
        status = 200;
        reason = '';
        headers = {};
      case 2:
        data = reason;
        reason = '';
        headers = {};
      case 3:
        data = headers;
        
        if(reason.constructor != String){
          headers = reason;
          reason = '';
        }else headers = {};
    }
    
    data = new Buffer(JSON.stringify(data),'utf8');
    
    headers['Content-Length'] = data.length;
    headers['Content-Type'] = 'application/json; charset=utf-8';
    if(!('Access-Control-Allow-Origin' in headers)) headers['Access-Control-Allow-Origin'] = '*';
    
    this.response.writeHead(status,reason,headers);
    this.response.end(data);
  }}
});

// Hsm

Hsm = module.exports = function Hsm(server){
  if(server[hsm]) return server[hsm];
  
  server.on('request',onRequest);
  
  this[from] = [];
  this[to] = [];
  this[ids] = [];
  
  server[hsm] = this;
  
  Vse.call(this);
};

function onRequest(req,res){
  var i,
      href,
      event,
      parsedUrl;
  
  href = req.url;
  for(i = 0;i < this[hsm][from].length;i++){
    href = href.replace(this[hsm][from][i],this[hsm][to][i]);
  }
  
  parsedUrl = url.parse(href,true);
  event = new Event(req,res,parsedUrl);
  
  this[hsm].fire(req.method + ' ' + parsedUrl.pathname,event);
}

Hsm.prototype = new Vse();
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

