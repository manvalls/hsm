var pct = require('pct');

function setCookie(obj,props){
  var attrs = '',
      pairs = [],
      prevPairs,keys,i,j,m;

  props = props || {};

  if(props.expires) attrs += ';Expires=' + props.expires.toGMTString();
  if(props.maxAge) attrs += ';Max-Age=' + props.maxAge;
  if(props.domain) attrs += ';Domain=' + props.domain;
  if(props.path) attrs += ';Path=' + props.path;
  if(props.secure) attrs += ';Secure';
  if(props.httpOnly) attrs += ';HttpOnly';

  obj = obj || {};
  keys = Object.keys(obj);

  for(j = 0;j < keys.length;j++){
    i = keys[j];
    pairs.push(pct.encodeComponent(i) + '=' + pct.encodeComponent(obj[i]) + attrs);
  }

  prevPairs = this.response.getHeader('set-cookie') || [];
  if(typeof prevPairs == 'string') prevPairs = [prevPairs];

  for(i = 0;i < prevPairs.length;i++){
    m = prevPairs[i].match(/^.*(?=\=)/);
    if(m && obj.hasOwnProperty(m[0])) continue;
    pairs.push(prevPairs[i]);
  }

  this.response.setHeader("Set-Cookie",pairs);
}

/*/ exports /*/

module.exports = setCookie;
