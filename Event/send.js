var zlib = require('zlib');

function send(str,opt){
  var res = this.response,
      req = this.request,
      gz,d;

  opt = opt || {};
  opt.code = opt.code || 200;

  d = opt.lastModified || new Date();

  res.setHeader('Accept-Ranges','none');
  res.setHeader('Last-Modified',d.toGMTString());
  res.setHeader('ETag','"hd-' + d.getTime().toString(36) + '"');

  if(opt.gzipLevel && this.encoding('gzip')){

    gz = zlib.createGzip({level: opt.gzipLevel});
    gz.write(str);
    gz.end();

    res.setHeader('Content-Encoding','gzip');

  }

  if(opt.headers) res.writeHead(opt.code,opt.headers);
  else res.writeHead(opt.code);

  if(req.method == 'HEAD') return res.end();
  if(gz) gz.pipe(res);
  else res.end(str);

}

/*/ exports /*/

module.exports = send;
