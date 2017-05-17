var walk = require('y-walk'),
    Hsm = require('./index.js'),
    parent = Symbol(),
    host = Symbol();

class HostFilteredHsm extends Hsm{

  constructor(p, h){
    super();
    this[parent] = p;
    this[host] = h;
  }

  get bind(){}

  untilNext(...args){
    return walk(filter, args, this);
  }

}

function* filter(...args){
  var event;

  do{
    event = yield this[parent].untilNext(...args);
  }while(event.request.headers.host != this[host]);

  return event;
}

/*/ exports /*/

module.exports = HostFilteredHsm;
