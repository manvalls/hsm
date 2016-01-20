var http = require('http'),
    server = http.createServer().listen(8888,
      () => require('u-test/browser')(`${__dirname}/client.js`)
    ),
    Hsm = require('../main.js'),
    hsm1 = new Hsm(server,'localhost:8888'),
    hsm2 = new Hsm(server);

hsm2 = new Hsm(server);

hsm1.allowOrigin(/./);

hsm2.allowOrigin(function(origin){
  return origin.indexOf('127.0.0.1') != -1;
},{
  requestHeaders: ['superheader','range'],
  responseHeaders: ['fooheader'],
  methods: []
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

hsm2.on('GET /file',function*(e){
  yield e.take();

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
    e.sendFile(__dirname + '/range.txt');
    return;
  }

  e.sendFile(__dirname + '/file.txt');
});

hsm1.on('POST /endServer',function(){
  server.close();
});
