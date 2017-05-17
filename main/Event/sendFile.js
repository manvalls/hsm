var walk = require('y-walk'),
    apply = require('u-proto/apply'),
    Cb = require('y-callback/node'),
    fs = require('fs'),
    mime = require('./sendFile/mime.js'),

    sendFile, getFinalFileAndStats;

sendFile = walk.wrap(function*(file,opt){
  var temp,stats,headers,cb,range,code,
      size,etag;

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

  if(stats.isDirectory()){
    e = new Error('Can not send a directory');
    e.code = 'EISDIR';
    throw e;
  }

  if(opt.applyMimeHeaders !== false)
    populateMimeHeaders(file,headers,opt.mimeHeaders);

  if(code == 200){

    headers['Accept-Ranges'] = 'bytes';
    headers['Last-Modified'] = stats.mtime.toUTCString();
    headers.ETag = etag = headers.ETag ||
                          headers.etag ||
                          '"' + stats.ino + '-' + stats.dev + '-' + stats.mtime.getTime().toString(36) + '"';

    yield this.checkCache(stats.mtime,etag);
    range = getRange(this.request,stats,etag);

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
  yield fs.createReadStream(file,{start: range[0], end: range[1]}).pipe(this.response);
});

// utils

getFinalFileAndStats = walk.wrap(function*(file,e){
  var cb,stats,gzFile,e;

  if(e.encoding('gzip')) try{

    gzFile = file + '.gz';

    fs.stat(gzFile,cb = Cb());
    stats = yield cb;

    if(stats.isDirectory()){
      stats = null;
      throw new Error();
    }

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

function getRange(req,stats,etag){
  var start,end,date,splittedRange,range;

  start = 0;
  end = stats.size - 1;

  if(!req.headers.range) return [start,end];

  if(req.headers['if-range'] && req.headers['if-range'] != etag){
    date = new Date(req.headers['if-range']);
    if(!(stats.mtime - date <= 1000)) return [start,end];
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
