var walk = require('y-walk'),
    apply = require('u-proto/apply'),
    Cb = require('y-callback/node'),
    fs = require('fs'),
    mime = require('./sendFile/mime.js'),

    sendFile, getFinalFileAndStats;

sendFile = walk.wrap(function*(file,opt){
  var temp,stats,headers,cb,range,code,
      size;

  opt = opt || {};
  headers = opt.headers || {};
  code = opt.code || 200;

  if(opt.staticGzip !== false){
    temp = yield getFinalFileAndStats(file,this);
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

  yield fs.createReadStream(file,{start: start, end: end}).pipe(this.response);
});

// utils

getFinalFileAndStats = walk.wrap(function*(file,e){
  var cb,stats,gzFile,e;

  if(e.encoding('gzip')) try{

    gzFile = file + '.gz';

    fs.stat(gzFile,cb = Cb());

    stats = yield cb;
    file = gzFile;

    if(stats.isDirectory()){
      e = new Error();
      e.code = 'EISDIR';
      throw e;
    }

  }catch(e){}

  if(!stats){
    fs.stat(file,cb = Cb());
    stats = yield cb;
  }

  if(stats.isDirectory()){
    e = new Error();
    e.code = 'EISDIR';
    throw e;
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

/*/ exports /*/

module.exports = sendFile;
