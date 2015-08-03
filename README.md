# http(s).Server Mapper

## Sample usage:

```javascript
var Hsm = require('hsm'),
    server = require('http').createServer(),
    hsm = new Hsm(server);

server.listen(12345);

hsm.on('/foo',function([e]){
  yield e.handle();
  e.response.end('bar');
});

hsm.digest();
```
