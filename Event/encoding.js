var init = require('./qList/init.js'),
    computeName = require('./qList/computeName.js'),
    map = Symbol();

function encoding(type){
  var name;

  if(!this[map]) init(this,map,'accept-encoding','identity,*;q=0.1','*','identity');
  if(type == null) return this[map].entries();

  type = type || '';

  name = computeName(type,{});
  if(this[map].has(name)) return this[map].get(name);

  return this[map].get('*');
}

/*/ exports /*/

module.exports = encoding;
