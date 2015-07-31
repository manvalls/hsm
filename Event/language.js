var init = require('./qList/init.js'),
    computeName = require('./qList/computeName.js'),
    map = Symbol();

function encoding(type,params){
  var name;

  if(!this[map]) init(this,map,'accept-language','*','*');
  if(type == null) return this[map].entries();

  type = type || '';
  params = params || {};

  name = computeName(type,params);
  if(this[map].has(name)) return this[map].get(name);

  return this[map].get('*');
}

/*/ exports /*/

module.exports = encoding;
