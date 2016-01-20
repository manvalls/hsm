var init = require('./qList/init.js'),
    computeName = require('./qList/computeName.js'),
    map = Symbol();

function language(type){
  var name,entry,key,value,base;

  if(!this[map]){
    init(false,this,map,'accept-language','*','*');

    for(entry of this[map].entries()){
      key = entry[0];
      value = entry[1];
      base = key.split('-')[0];
      if(this[map].has(base)) continue;
      this[map].set(base,value);
    }
  }

  if(type == null) return this[map].entries();

  type = type || '';

  name = type;
  if(this[map].has(name)) return this[map].get(name);

  return this[map].get('*');
}

/*/ exports /*/

module.exports = language;
