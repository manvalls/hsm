var http = require('http'),
    Hsm = require('../main'),
    base = new Hsm(),
    hsm1 = base.host('localhost:8888'),
    hsm2 = base.host('127.0.0.1:8888'),
    d = base.bind(8888,
      () => require('u-test/browser')(`${__dirname}/client.js`)
    );

hsm1.allowOrigin(/./);

hsm2.basicAuth(function(){
  return true;
});

hsm2.allowOrigin(function(origin){
  return origin.indexOf('127.0.0.1') != -1;
},{
  requestHeaders: [
    'superheader',
    'range',
    'if-range',
    'if-match',
    'if-unmodified-since',
    'if-modified-since',
    'if-none-match'
  ],
  responseHeaders: ['fooheader','etag'],
  methods: [],
  allowCredentials: true
});

hsm1.take('GET /basic',function*(e){
  yield e.basicAuth({foo: 'bar'});
  e.sendJSON('ok');
});

hsm1.on('GET /accept',function*(e){
  var type = JSON.parse(e.query.type),
      params = JSON.parse(e.query.params);

  yield e.take();
  if(!type) e.sendJSON(Array.from(e.accept()));
  else e.sendJSON(e.accept(type,params));
});

hsm1.on('GET /charset',function*(e){
  var type = JSON.parse(e.query.type);

  yield e.take();
  if(!type) e.sendJSON(Array.from(e.charset()));
  else e.sendJSON(e.charset(type));
});

hsm1.on('GET /encoding',function*(e){
  var type = JSON.parse(e.query.type);

  yield e.take();
  if(!type) e.sendJSON(Array.from(e.encoding()));
  else e.sendJSON(e.encoding(type));
});

hsm1.on('GET /language',function*(e){
  var type = JSON.parse(e.query.type);

  yield e.take();
  if(!type) e.sendJSON(Array.from(e.language()));
  else e.sendJSON(e.language(type));
});

hsm2.on('GET /query',function*(e){
  yield e.take();
  e.sendJSON(e.query);
});

hsm2.on('GET /gzip',function*(e){
  yield e.take();
  e.send('true',{gzipLevel: 9});
});

hsm2.on('GET /headers',function*(e){
  yield e.take();
  e.sendJSON(true);
});

hsm2.on('/file',function*(e){
  yield e.take();

  if('redirect' in e.query){
    e.redirect('/file');
    return;
  }

  if(e.query.staticGzip == 'false'){
    e.sendFile(__dirname + '/file.txt',{staticGzip: false});
    return;
  }

  if(e.query.failedGzip == 'folder'){
    e.sendFile(__dirname + '/file2.txt');
    return;
  }

  if(e.query.failedGzip == 'none'){
    e.sendFile(__dirname + '/file3.txt');
    return;
  }

  if(e.query.folder == 'true'){
    try{ yield e.sendFile(__dirname + '/file2.txt.gz'); }
    catch(err){ e.send('404'); }
    return;
  }

  if('range' in e.query){

    e.sendFile(__dirname + '/range.txt',{
      'cache-control': 'no-cache'
    });

    return;
  }

  e.sendFile(__dirname + '/file.txt');
});

hsm2.on('GET /cookie',function*(e){
  yield e.take();

  if('set' in e.query){
    e.setCookie({foo: 'bar',answer: -1});
    e.setCookie({bar: 'foo',answer: 42});
    e.send();
  }else{
    e.sendJSON(e.cookies);
  }

});

hsm2.on('GET /cache',function*(e){
  yield e.take();
  if(e.lastTime > new Date(0)) return e.notModified();
  e.send('foo',{
    headers: {
      'cache-control': 'no-cache'
    }
  });
});

hsm1.on('POST /endServer',function(){
  d.detach();
});
