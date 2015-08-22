var init = require('./qList/init.js'),
    computeName = require('./qList/computeName.js'),
    map = Symbol();

function getBaseType(name){
  return name.match(/^[^\/]*/)[0] + '/*';
}

function accept(type,params){
  var baseType,name;

  if(!this[map]) init(true,this,map,'accept','*/*','*/*');
  if(type == null) return this[map].entries();

  type = type || '';
  params = params || {};

  name = computeName(type,params);
  if(this[map].has(name)) return this[map].get(name);

  baseType = getBaseType(type);
  if(this[map].has(baseType)) return this[map].get(baseType);

  return this[map].get('*/*');
}

/*/ exports /*/

module.exports = accept;
