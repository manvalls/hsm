var computeName = require('./computeName.js'),
    pct = require('pct');

function encode(m,s1){
  return pct.encodeComponent(s1);
}

function sort(a,b){
  var pa,pb,la,lb;

  pa = a[1];
  pb = b[1];

  if(pa.q > pb.q) return -1;
  if(pa.q < pb.q) return 1;

  la = a[0].length;
  lb = b[0].length;

  return lb - la;
}

module.exports = function init(cn,hsm,map,prop,def,wc,abd){
  var accept,types,parts,list,
      type,pair,params,name,keys,
      key,i,j;

  accept = ((hsm.request.headers[prop] || '').trim() || def).toLowerCase();
  accept = accept.replace(/"((?:[^"]|(?:\\.))*)"/g,encode);

  hsm[map] = new Map();
  types = accept.split(',',1000);

  list = [];
  if(prop == 'accept-language') keys = new Map();
  for(i = 0;i < types.length;i++){
    parts = types[i].split(';',100);
    type = parts[0].trim();
    params = {};

    for(j = 1;j < parts.length;j++){
      pair = parts[j].split('=',2);

      pair[0] = pct.decodeComponent(pair[0].trim());
      pair[1] = pct.decodeComponent((pair[1] || '').trim());

      params[pair[0]] = pair[1];
    }

    if(params.q == null) params.q = 1;
    else params.q = parseFloat(params.q);

    if(type == abd) abd = null;
    if(type == wc) wc = null;

    if(cn) name = computeName(type,params);
    else name = type;

    if(keys && (!keys.has(name) || keys.get(name) > params.q)) keys.set(name,params.q);
    list.push([name,params]);
  }

  if(keys) for(key of keys.keys()){
    name = key.split('-',1)[0];
    if(keys.has(name)) continue;
    list.push([name,{q: keys.get(key)}]);
  }

  if(abd) list.push([abd,{q: 1}]);
  if(wc) list.push([wc,{q: 0}]);

  list.sort(sort);
  for(i = 0;i < list.length;i++) hsm[map].set(list[i][0],list[i][1].q);

}
