var Su = require('vz.rand').Su,
    Vse = require('vse'),
    Yielded = require('vz.yielded'),
    walk = require('vz.walk'),
    
    QS = require('querystring'),
    url = require('url'),
    
    sent = Su(),
    hsm = Su(),
    
    from = Su(),
    to = Su(),
    ids = Su(),
    
    bodyOps = Su(),
    body = Su(),
    bodyDone = Su(),
    
    ctRE = /([^;]+).*charset=(.*)(;.*)?/,
    
    Hsm;

// Event

function Event(req,res,parsedUrl){
  var m = req.headers['content-type'];
  
  this.url = parsedUrl;
  this.request = req;
  this.response = res;
  
  if(m){
    m = m.match(ctRE);
    this.encoding = m[2];
    this.mime = m[1];
  }else{
    this.encoding = null;
    this.mime = null;
  }
}

function onData(data){
  this[body] = Buffer.concat([this[body],data]);
}

function onEnd(){
  var yd;
  
  this[bodyDone] = true;
  while(yd = this[bodyOps].shift()) yd.value = this[body];
}

function* getJSON(body,charset){
  body = yield body;
  return JSON.parse(body.toString(charset));
}

function* getQS(body,charset){
  body = yield body;
  return QS.parse(body.toString(charset));
}

Object.defineProperties(Event.prototype,{
  query: {get: function(){
    return this.url.query;
  }},
  headers: {get: function(){
    return this.request.headers;
  }},
  send: {value: function(status,reason,headers,data){
    if(this[sent]) throw new Error('Request already answered');
    
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
    
    if(!headers['Content-Type']){
      data = new Buffer(JSON.stringify(data),'utf8');
      
      headers['Content-Length'] = data.length;
      headers['Content-Type'] = 'application/json; charset=utf-8';
      if(!('Access-Control-Allow-Origin' in headers)) headers['Access-Control-Allow-Origin'] = '*';
    }
    
    this.response.writeHead(status,reason,headers);
    this.response.end(data);
    
    this[sent] = true;
  }},
  getBody: {value: function(){
    var yd;
    
    if(this.request[bodyDone]) return new Yielded(this.request[body]);
    
    if(!this.request[bodyOps]){
      this.request[bodyOps] = [];
      this.request[body] = new Buffer(0);
      this.request[bodyDone] = false;
      
      this.request.on('data',onData);
      this.request.on('close',onEnd);
      this.request.on('end',onEnd);
    }
    
    yd = new Yielded();
    this.request[bodyOps].push(yd);
    
    return yd;
  }},
  getJSON: {value: function(){
    return walk(getJSON,[this.getBody(),this.encoding]);
  }},
  getQS: {value: function(){
    return walk(getQS,[this.getBody(),this.encoding]);
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
  
  if(this[hsm].fire(req.method + ' ' + parsedUrl.pathname,event).length == 0){
    if(this[hsm].fire(req.method + ' DEFAULT',event).length == 0) this[hsm].fire('DEFAULT',event);
  }
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

