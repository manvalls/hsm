var zlib = require('zlib');

function send(str,opt){
  var res = this.response,
      gz;

  opt = opt || {};
  opt.code = opt.code || 200;

  res.setHeader('Accept-Ranges','none');
  res.setHeader('Last-Modified',(opt.lastModified || new Date()).toGMTString());

  if(opt.gzipLevel && this.encoding('gzip')){

    gz = zlib.createGzip({level: opt.gzipLevel});
    gz.write(str);
    gz.end();

    res.setHeader('Content-Encoding','gzip');

  }

  if(opt.headers) res.writeHead(opt.code,opt.headers);
  else res.writeHead(opt.code);

  if(gz) gz.pipe(res);
  else res.end(str);

}

/*/ exports /*/

module.exports = send;
