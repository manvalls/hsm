var init = require('./qList/init.js'),
    computeName = require('./qList/computeName.js'),
    map = Symbol();

function charset(type){
  var name;

  if(!this[map]) init(this,map,'accept-charset','*','*','iso-8859-1');
  if(type == null) return this[map].entries();

  type = type || '';

  name = computeName(type);
  if(this[map].has(name)) return this[map].get(name);

  return this[map].get('*');
}

/*/ exports /*/

module.exports = charset;
