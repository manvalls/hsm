var map = Symbol();

function computeName(name,params){
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
}

function getBaseType(name){
  return name.match(/^[^\/]*/)[0] + '/*';
}

function encode(m,s1){
  return encodeURIComponent(s1);
}

function sort(a,b){
  var pa,pb,la,lb;

  pa = a[1];
  pb = b[1];

  if(pa.q > pb.q) return -1;
  if(pa.q < pb.q) return 1;

  la = Object.keys(pa).length;
  lb = Object.keys(pb).length;

  return lb - la;
}

function init(hsm){
  var accept,types,parts,list,
      type,pair,params,name,
      i,j;

  accept = hsm.request.headers.accept || '*/*';
  accept = accept.replace(/\0/g,'').replace(/"((?:[^"]|(?:\\.))*)"/g,encode);

  hsm[map] = new Map();
  types = accept.split(',');

  list = [];
  for(i = 0;i < types.length;i++){
    parts = types[i].split(';');
    type = parts[0].toLowerCase();
    params = {};

    for(j = 1;j < parts.length;j++){
      pair = parts[j].split('=');

      pair[0] = decodeURIComponent(pair[0].trim()).toLowerCase();
      pair[1] = decodeURIComponent((pair[1] || '').trim()).toLowerCase();

      params[pair[0]] = pair[1];
    }

    if(params.q == null) params.q = 1;
    else params.q = parseFloat(params.q);

    Object.freeze(params);

    name = computeName(type,params);
    list.push([name,params]);
  }

  list.sort(sort);
  for(i = 0;i < list.length;i++) hsm[map].set(list[i][0],list[i][1]);

}

function accept(type,params){
  var baseType,name;

  if(!this[map]) init(this);
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
