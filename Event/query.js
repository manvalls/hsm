var pct = require('pct'),
    query = Symbol(),
    holder;

function getter(e){
  if(!e.rawQuery) return {};
  return e[query] = e[query] || getQuery(e.rawQuery);
}

// - utils

function queryReplace(m,key,value){
  key = pct.decodeComponent(key);
  value = pct.decodeComponent(value || '');

  if(holder.hasOwnProperty(key)) holder[key] = [].concat(holder[key],value);
  else holder[key] = value;
}

function getQuery(query){
  query = (query || '') + '';

  holder = {};
  query.replace(/\+/g,'%20').replace(/(.+?)(?:=(.*?))?(&|$)/g,queryReplace);
  try{ return Object.freeze(holder); }
  finally{ holder = null; }
}

/*/ exports /*/

module.exports = getter;
