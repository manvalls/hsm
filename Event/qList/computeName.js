
module.exports = function computeName(name,params){
  var keys,i,j;

  name = name.replace(/\0/g,'');

  if(!params) return name;
  keys = Object.keys(params).sort();

  for(j = 0;j < keys.length;j++){
    i = keys[j];
    if(i == 'q') continue;
    name += '\0' + i.replace(/\0/g,'') + '\0' + (params[i] + '').replace(/\0/g,'');
  }

  return name;
};
