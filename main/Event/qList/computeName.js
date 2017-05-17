
module.exports = function computeName(name,params){
  var keys,i,j;

  keys = Object.keys(params).sort();
  for(j = 0;j < keys.length;j++){
    i = keys[j];
    if(i == 'q') continue;
    name += ';' + i.trim() + ( params[i] ? '=' + (params[i] + '').trim() : '');
  }

  return name;
};
