# http(s).Server Mapper [![Build Status][ci-img]][ci-url] [![Coverage Status][cover-img]][cover-url]

`Hsm` is a subclass of [UrlRewriter](https://www.npmjs.com/package/url-rewriter) that maps HTTP requests to [path events](https://www.npmjs.com/package/path-event). It extends the `PathEvent` class with several properties and methods.

## Sample usage:

```javascript
var server = new Hsm(8080);

server.on('/foo', function(e){
  e.response.end('bar');
});
```

Note that the `Hsm` constructor accepts a second parameter: the `host`, useful in environments where you need multiple web servers on the same port on the same machine.

## PathEvent extensions

Although these events will be used as the second argument on internal `urw.compute()` calls, some methods and properties are not available or will fail until the URL is fully computed, namely the following:

- `event.response`
- `event.url`
- `event.path`
- `event.query`
- `event.rawQuery`
- `event.fragment`
- `event.redirect()`
- `event.notModified()`
- `event.setCookie()`
- `event.sendFile()`
- `event.send()`
- `event.checkOrigin()`

If you don't plan to use the third argument of `urw.rewrite()` you may ignore above information.

### event.request

The original [http.IncomingMessage](https://nodejs.org/api/http.html#http_http_incomingmessage).

### event.response

The original [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse).

### event.url

Computed URL.

### event.path

The path part of computed URL.

### event.query

The parsed query part of computed URL.

### event.rawQuery

The query part of computed URL.

### event.fragment

The fragment part of computed URL.

### event.redirect( url  [, query] [, fragment] [, permanent] )

Redirect the request to the URL determined by encoding the result of `urlRewriter.format(url, query, fragment)`. If `permanent` is true, a `308` response will be sent, if not, the status will be `307`.

### event.lastTime

The date on which this resource was last sent to the client. Use it to determine whether to call `event.notModified()` or not.

### event.notModified()

Send a `304 Not Modified` response.

### event.cookies

Parsed cookies of the request.

### event.setCookie( cookies [, options] )

Populate `Set-Cookie` headers with provided cookies. `options` can contain the following keys:

- expires ( *Date* )
- maxAge ( *Number* )
- domain ( *String* )
- path ( *String* )
- secure ( *Boolean* )
- httpOnly ( *Boolean* )

#### Sample usage

```javascript

event.setCookie({
  species: 'chameleon',
  color: 'red'
},{ maxAge: 3600 });

```

### event.sendFile( filename [, options] )

Send a file as the response to the current request. Returns a `Promise/A+` which may be fulfilled or rejected depending on whether the file could be accessed or not. If it's rejected, you are in charge of sending a `404` or whatever you may like. `options` can contain the following keys:

- code ( *Number* ) `= 200`
- headers ( *Object* ) `= {}`
- staticGzip ( *Boolean* ) `= true`
- applyMimeHeaders ( *Boolean* ) `= true`
- mimeHeaders ( *Object* ) `= {}`

If `options.staticGzip` is `true`, `<filename>.gz` will be sent if possible. Default MIME headers will be sent with the response, unless `options.applyMimeHeaders` is `false`. You can add your own custom MIME headers.

#### Sample usage

```javascript

event.sendFile('./evil plans.txt',{
  code: 418,
  headers: { 'X-Foo': 'BAR' },
  mimeHeaders: { txt: { 'X-Evil': 'true' } }
});

```

### event.send( data [, options] )

Send some data as the response to the current request. `data` can be a `Buffer` or `String`. `options` can contain the following keys:

- code ( *Number* ) `= 200`
- gzipLevel ( *Number* ) `= 0`
- headers ( *Object* ) `= {}`

### event.sendJSON( data [, options] )

Same as `event.send()`, but it will serialize `data` as JSON.

### event.origin

The `Origin` header of the request, if present.

### event.checkOrigin( origin [, options] )

Handle CORS headers exchange. Returns a `Promise/A+` that will be fulfilled when / if you should continue handling the request. It wont be rejected. `origin` can be a:

- `String`: the origin header must be equal to `origin` for the request to be acceptable.

- `RegExp`: `origin.test(originHeader)` must be `true` for the request to be acceptable.

- `Function`: `origin(originHeader)` must be `true` for the request to be acceptable.

`options` can contain the following keys:

- methods ( *Set* )
- requestHeaders ( *Set* )
- responseHeaders ( *Set* )
- timeout ( *Number* )
- allowCredentials ( *Boolean* )

### event.accept( type [, params] )

When called with arguments, returns the correspondant `q` value of supplied MIME type. When called without arguments, returns an iterator which will yield arrays in the form:

```javascript
[ type, qValue ]
```

### event.charset( charset )

When called with arguments, returns the correspondant `q` value of supplied charset. When called without arguments, returns an iterator which will yield arrays in the form:

```javascript
[ charset, qValue ]
```

### event.encoding( encoding )

When called with arguments, returns the correspondant `q` value of supplied encoding. When called without arguments, returns an iterator which will yield arrays in the form:

```javascript
[ encoding, qValue ]
```

### event.language( language )

When called with arguments, returns the correspondant `q` value of supplied language. When called without arguments, returns an iterator which will yield arrays in the form:

```javascript
[ language, qValue ]
```

[ci-img]: https://circleci.com/gh/manvalls/hsm.svg?style=shield
[ci-url]: https://circleci.com/gh/manvalls/hsm
[cover-img]: https://coveralls.io/repos/manvalls/hsm/badge.svg?branch=master&service=github
[cover-url]: https://coveralls.io/github/manvalls/hsm?branch=master
