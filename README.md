# http(s).Server Mapper

## Sample usage:

```javascript
var Hsm = require('hsm'),
    server = require('http').createServer(),
    hsm = new Hsm(server);

server.listen(12345);

hsm.on('GET /foo',function(e){
  e.request.end('Hello world!');
});
```

