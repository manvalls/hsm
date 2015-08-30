var pct = require('pct'),
    cookies = Symbol(),
    holder;

function getter(e,str){
  return e[cookies] = e[cookies] || getCookies(str);
}

// - utils

function cookieReplace(m,key,value){
  key = pct.decodeComponent(key);
  value = pct.decodeComponent(value);

  if(!holder.hasOwnProperty(key)) holder[key] = value;
}

function getCookies(cookieStr){
  cookieStr = (cookieStr || '') + '';

  holder = {};
  cookieStr.replace(/(?:^|\s*;\s*)(.+?)(?:\s*=\s*(.*?))?\s*(?=;|$)/g,cookieReplace);
  try{ return Object.freeze(holder); }
  finally{ holder = null; }
}

/*/ exports /*/

module.exports = getter;
