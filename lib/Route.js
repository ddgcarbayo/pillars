/* jslint node: true */
"use strict";

var ObjectArray = require('objectarray');
require('date.format');

module.exports = Route;
function Route(config){
  if(!(this instanceof Route)){return new Route(...arguments);}
  var route = this;
  config = (config && typeof config !== 'function')?config:{};
  route.id = (new Date()).format("{YYYY}{MM}{DD}{hh}{mm}{ss}{ms}")+Math.round(Math.random()*1000000000000000).toString(36);

  if(!config.path){config.path = '/';}

  route.routes = new ObjectArray();
  route.active = true;
  route.host = undefined;
  route.port = undefined;
  route.iPath = undefined;

  var pathComponentsCache = {};
  Object.defineProperty(route,"pathComponentsCache",{
    enumerable : false,
    get : function(){return pathComponentsCache;},
    set : function(set){
      pathComponentsCache = set;
    }
  });

  var args = Array.prototype.slice.call(arguments);
  var handlers = [];
  for(var i=0,l=args.length;i<l;i++){
    if(typeof args[i] === 'function'){
      handlers.push(args[i]);
    }
  }

  Object.defineProperty(route,"connectSupport",{
    enumerable : true,
    get : function(){
      var result = [];
      handlers.forEach(function(e,i,a){
        result.push(e.length >= (i == a.length-1?2:3));
      });
      return result;
    }
  });

  Object.defineProperty(route,"handlers",{
    enumerable : true,
    get : function(){
      handlers.forEach(function(e,i,a){
        e.isConnect = e.length >= (i == a.length-1?2:3);
      });
      return handlers;
    },
    set : function(set){
        set = Array.isArray(set)?set:[set];
        handlers = set;
    }
  });

  var path;
  Object.defineProperty(route,"path",{
    enumerable : true,
    get : function(){return path;},
    set : function(set){
      var components = route.pathComponents(set);
      path = components.path;
    }
  });

  var method; // Parse String to [String].
  Object.defineProperty(route,"method",{
    enumerable : true,
    get : function(){return method;},
    set : function(set){
      if(set===undefined){
        method = undefined;
      } else {
        set = Array.isArray(set)?set:[set];
        set = set.map(function(e,i){return e.toUpperCase();});
        method = set;
      }
    }
  });

  var https;
  Object.defineProperty(route,"https",{
    enumerable : true,
    get : function(){return https;},
    set : function(set){
      if(set===undefined){
        https = undefined;
      } else {
        https = set?true:false;
      }
    }
  });

  route.configure(config);
}
  Route.prototype.configure = function configure(config){
    for(var i=0,k=Object.keys(config),l=k.length;i<l;i++){
      this[k[i]]=config[k[i]];
    }
    return this;
  };

  Route.prototype.pathComponents = function(path){
    path = path.replace(/\/+/gi,'/').replace(/^\/|\/$/gi,'');
    if(this.pathComponentsCache[path]){
      return this.pathComponentsCache[path];
    } else {
      var parts = path.split('/');
      var compose = [];
      var params = [];
      var arg;
      for(var i=0,l=parts.length;i<l;i++){
        if(/^:/.test(parts[i])){
          arg = parts[i].replace(/^:/,'');
          params.push(arg);
          compose.push("\\/([^\\/]+)");
        } else if(/^\*:/.test(parts[i])){
          arg = parts[i].replace(/^\*:/,'');
          params.push(arg);
          compose.push("(?:\\/(.*))?");
        } else if(parts[i]!=='') {
          compose.push("\\/"+parts[i]);
        }
      }
      this.pathComponentsCache[path] = {
        path: path,
        regexp: new RegExp('^'+compose.join(''),'i'),
        params: params
      };
      return this.pathComponentsCache[path];
    }
  };
