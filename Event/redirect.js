
function redirect(location,query,fragment,permanent){
  var res = this.response;

  if(typeof query != 'object'){
    permanent = fragment;
    fragment = query;
    query = null;
  }

  if(typeof fragment != 'string'){
    permanent = fragment;
    fragment = null;
  }

  res.writeHead(permanent ? 308 : 307,{
    Location: encodeURI(this.format(location,query,fragment))
  });

  res.end();

}

/*/ exports /*/

module.exports = redirect;
