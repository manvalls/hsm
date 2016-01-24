var init = require('./qList/init.js'),
    computeName = require('./qList/computeName.js'),
    map = Symbol();

function charset(type){
  var name;

  if(!this[map]) init(false,this,map,'accept-charset','*','*','iso-8859-1');
  if(type == null) return filter(this[map].entries());

  type = type || '';

  name = type;
  if(this[map].has(name)) return this[map].get(name);

  return this[map].get('*');
}

function* filter(it){
  var entry;
  for(entry of it) if(entry[1] > 0) yield entry;
}

/*/ exports /*/

module.exports = charset;
