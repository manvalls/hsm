var t = require('u-test'),
    assert = require('assert'),
    walk = require('y-walk'),
    wait = require('y-timers/wait'),
    accept,charset,encoding,language;

function json(data){
  return encodeURIComponent(JSON.stringify(data));
}

accept = walk.wrap(function*(header,type,params){
  type = type || null;
  params = params || null;

  return yield (
    yield fetch(`http://localhost:8888/accept?type=${json(type)}&params=${json(params)}`,{
      headers: new Headers({
        Accept: header
      })
    })
  ).json();
});

charset = walk.wrap(function*(type){
  type = type || null;

  return yield (
    yield fetch(`http://localhost:8888/charset?type=${json(type)}`)
  ).json();
});

encoding = walk.wrap(function*(type){
  type = type || null;

  return yield (
    yield fetch(`http://localhost:8888/encoding?type=${json(type)}`)
  ).json();
});

language = walk.wrap(function*(header,type){
  type = type || null;

  return yield (
    yield fetch(`http://localhost:8888/language?type=${json(type)}`,{
      headers: new Headers({'Accept-Language': header})
    })
  ).json();
});

t('Accept',function*(){
  var data,txt;

  data = yield accept('application/json');
  assert.deepEqual(data,[["application/json",1],["*/*",0]]);

  data = yield accept('image/*','image/png');
  assert.strictEqual(data,1);

  txt = 'text/*;q=0.3, text/html;q=0.7, text/html;level=1, text/html;level="2";q=0.4, */*;q=0.5';
  data = yield accept(txt);
  assert.deepEqual(data,[["text/html;level=1",1],["text/html",0.7],["*/*",0.5],["text/html;level=2",0.4],["text/*",0.3]]);

  data = yield accept(txt,'text/html');
  assert.strictEqual(data,0.7);
  data = yield accept(txt,'text/html',{level: 1});
  assert.strictEqual(data,1);
  data = yield accept(txt,'text/html',{level: 3});
  assert.strictEqual(data,0.7);
  data = yield accept(txt,'foo/bar');
  assert.strictEqual(data,0.5);

  data = yield accept('image/png,image/jpeg');
  assert.deepEqual(data,[["image/jpeg",1],["image/png",1],["*/*",0]]);
});

t('Charset',function*(){
  var data;

  data = yield charset();
  assert.deepEqual(data,[["iso-8859-1",1],["*",1]]);
  data = yield charset('iso-8859-1');
  assert.strictEqual(data,1);
  data = yield charset('blerg');
  assert.strictEqual(data,1);
});

t('Encoding',function*(){
  var data;

  data = yield encoding();
  assert(data.map(e => e[0]).indexOf('gzip') != -1);
  data = yield encoding('identity');
  assert(data > 0);
  data = yield encoding('blerg');
  assert.strictEqual(data,0);
});

t('Language',function*(){
  var data,txt;

  txt = 'da, en-gb;q=0.8, en;q=0.7';
  data = yield language(txt);
  assert.deepEqual(data,[["da",1],["en-gb",0.8],["en",0.7],["*",0]]);
  data = yield language(txt,'en');
  assert.strictEqual(data,0.7);

  data = yield language('es-ES');
  assert.deepEqual(data,[["es-es",1],["*",0],["es",1]]);
  data = yield language('es-ES','es');
  assert.strictEqual(data,1);
  data = yield language('es-ES','en');
  assert.strictEqual(data,0);
});

t('Query',function*(){
  var data,res;

  res = yield fetch('http://127.0.0.1:8888/query');
  data = yield res.json();
  assert.deepEqual(data,{});

  res = yield fetch('http://127.0.0.1:8888/query?foo=bar&foo=bar2&lorem=ipsum');
  data = yield res.json();
  assert.deepEqual(data,{
    foo: ['bar','bar2'],
    lorem: 'ipsum'
  });

});

t('Gzip send',function*(){
  var req = yield fetch('http://127.0.0.1:8888/gzip');
  assert(yield req.json());
});

t('Custom headers',function*(){
  var res,error;

  res = yield fetch('http://127.0.0.1:8888/headers',{
    headers: new Headers({superheader: 'foo'})
  });

  assert(yield res.json());

  try{
    yield fetch('http://127.0.0.1:8888/headers',{
      headers: new Headers({superheader2: 'foo'})
    });
  }catch(e){ error = e; }

  assert(!!error);
  error = null;

  try{
    yield fetch('http://127.0.0.1:8888/headers',{
      method: 'POTATOE'
    });
  }catch(e){ error = e; }
  assert(!!error);

});

t('File',function*(){
  var res;

  res = yield fetch('http://127.0.0.1:8888/file');
  assert.strictEqual(res.headers.get('content-type'),'text/plain');
  assert.strictEqual((yield res.text()).trim(),'0123456789');

  res = yield fetch('http://127.0.0.1:8888/file?staticGzip=false');
  assert.strictEqual(res.headers.get('content-type'),'text/plain');
  assert.strictEqual((yield res.text()).trim(),'0123456789');

  res = yield fetch('http://127.0.0.1:8888/file?failedGzip=folder');
  assert.strictEqual(res.headers.get('content-type'),'text/plain');
  assert.strictEqual((yield res.text()).trim(),'0123456789');

  res = yield fetch('http://127.0.0.1:8888/file?failedGzip=none');
  assert.strictEqual(res.headers.get('content-type'),'text/plain');
  assert.strictEqual((yield res.text()).trim(),'0123456789');

  res = yield fetch('http://127.0.0.1:8888/file?folder=true');
  assert.strictEqual((yield res.text()).trim(),'404');

  res = yield fetch('http://127.0.0.1:8888/file?range',{
    headers: new Headers({
      range: 'bytes=2-3'
    })
  });

  assert.strictEqual(res.headers.get('content-type'),'text/plain');
  assert.strictEqual((yield res.text()).trim(),'23');

});

t.done.then(function(){
  navigator.sendBeacon('http://localhost:8888/endServer','');
});
