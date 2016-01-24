var init = require('./qList/init.js'),
    computeName = require('./qList/computeName.js'),
    map = Symbol();

function getBaseType(name){
  return name.match(/^[^\/]*/)[0] + '/*';
}

function accept(type,params){
  var baseType,name;

  if(!this[map]) init(true,this,map,'accept','*/*','*/*');
  if(type == null) return filter(this[map].entries());

  type = type || '';
  params = params || {};

  name = computeName(type,params);
  if(this[map].has(name)) return this[map].get(name);

  name = computeName(type,{});
  if(this[map].has(name)) return this[map].get(name);

  baseType = getBaseType(type);
  if(this[map].has(baseType)) return this[map].get(baseType);

  return this[map].get('*/*');
}

function* filter(it){
  var entry;
  for(entry of it) if(entry[1] > 0) yield entry;
}

/*/ exports /*/

module.exports = accept;
