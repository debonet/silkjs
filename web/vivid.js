(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"_process":3,"inherits":2}],6:[function(require,module,exports){
var nsVivid = require("./nsVivid.js");
var Scope = require("./Scope");
var GlobalVivid={};

// --------------------------------------------------------------------
GlobalVivid.scope = new Scope("global");

// --------------------------------------------------------------------
var cIteration = 0;
var timeoutDraw;
var ffOnDirty = function(fCallback){

	return function(){
		if (!timeoutDraw){
			cIteration ++;
			if (cIteration >= 10){
				return fCallback("TOO MANY ITERATIONS");
			}

			timeoutDraw = setTimeout(function(){
				timeoutDraw = undefined;
				var jq = Vivid.scope._._inner;
				if (Vivid.scope.loVariables.__fbIsDirty("_inner")){
					return;
				}

				Vivid.scope.loVariables.__fCheckHonesty();

				cIteration = 0;
				fCallback(null, jq);
			}, 1);

		}
	};
};

// --------------------------------------------------------------------
GlobalVivid.fLoadStandardLibrary = function(scope,fCallback){
	var fStandardLibrary = require("./fStandardLibrary");
	fStandardLibrary(scope);

	// TODO: we should compile stdlib.vivid into a big comment at the end of this
	// file so that we don't have to have an extra network lookup in a real
	// deployemnt
	GlobalVivid.fGet('standardlibrary.vivid', function(err,sData){
		nsVivid.compile(scope,GlobalVivid.parseHTML(sData))();
		fCallback(null);
	});
};


// --------------------------------------------------------------------
GlobalVivid.init = function(fRender, bSkipStdLib){
	var jq=$('body').contents();

	this.scope.defvar('_inner',undefined,ffOnDirty(fRender));
	// force _inner to be clean
	this.scope.getvar('_inner');

	if (bSkipStdLib){
		GlobalVivid.scope.setvar('_inner', nsVivid.compile(GlobalVivid.scope, jq));
	}
	else{
		this.fLoadStandardLibrary(this.scope, function(err){
			GlobalVivid.scope.setvar('_inner', nsVivid.compile(GlobalVivid.scope, jq));
			// no need to callback. _inner will take care of it.
		});
	}
};

// --------------------------------------------------------------------
GlobalVivid.fGet = (
	typeof window !== 'undefined' 
		?  function(sUrl, fCallback){
			$.ajax({
				url: sUrl,
				error: function(err){
					fCallback(err);
				},
				success: function(sData, sStatus){
					fCallback(null,sData);
				}
			});
		}
	:  function(sUrl, fCallback){
		var nsFs = require("fs");
		nsFs.readFile(sUrl, function(err,buff){
			if (err){return fCallback(err);}
			fCallback(null, buff.toString());
		});
	}
);


// --------------------------------------------------------------------
GlobalVivid.affjqModules = {};
GlobalVivid.fDefineModule = function(s,ffjq){
	GlobalVivid.affjqModules[s] = ffjq;
};

GlobalVivid.ffjqModule = function(s){
	return GlobalVivid.affjqModules[s];
};



// --------------------------------------------------------------------
GlobalVivid.cleanHTML = function(shtml){
	shtml = shtml.replace(/<defelt/g,"<script type='defelt'");
  shtml = shtml.replace(/<\/defelt>/g,"</script>");
	
	shtml = shtml.replace(/<defun/g,"<script type='defun'");
  shtml = shtml.replace(/<\/defun>/g,"</script>");
	
	shtml = shtml.replace(/<defattr/g,"<script type='defattr'");
  shtml = shtml.replace(/<\/defattr>/g,"</script>");

	return shtml;
};

// --------------------------------------------------------------------
GlobalVivid.parseHTML = function(shtml){
	return $($.parseHTML(this.cleanHTML(shtml)));
};

// --------------------------------------------------------------------
GlobalVivid.setContents = nsVivid.fSafeSwapContents;
GlobalVivid.compile = nsVivid.compile;
GlobalVivid.expression = nsVivid.ffxLiveExpression;
GlobalVivid.Scope = Scope;


module.exports = GlobalVivid;


},{"./Scope":9,"./fStandardLibrary":13,"./nsVivid.js":15,"fs":1}],7:[function(require,module,exports){
// ---------------------------------------------------------------------------
var D = require("./fDebugOutput");
var each = require("./each");
var LiveValue = require("./LiveValue");
var ffBind = require("./ffBind");


// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var nLiveObject = 0;
var LiveObject = function LiveObject(s, bArray, __loParent){
	this.__sName = s + '(lo'+nLiveObject + ")";
	nLiveObject++;

	this.__loParent = __loParent;
	this.__vloChildren = [];

	this.__xlv = bArray ? [] : {};

	var lo = this;

	// freeze members
	each(this, function(f,s){
		Object.defineProperty(lo,s,{
			value: f,
			enumerable: false,
			configurable: false
		});
	});


	// add length pseudo-member if array
	if (bArray){
		this.__xlv['__reallength'] = new LiveValue(this.__sName + ":__reallength", function(){
			return lo.__xlv.length;
		});
		this.__fAddAccess('__reallength',true);

		Object.defineProperty(
			lo,	"length", {
				get : function(){
					return lo.__reallength;
					return lo.__xlv['__reallength'].fxGet();
				},
				configurable: false,
				enumerable: false,
				writeable : false
			}
		);
	}


	// set up scoping hierarchy 
	if(__loParent){
		__loParent.__vloChildren.push(this);
		this.__proto__ = __loParent;
	}
};


LiveObject.prototype.push = function(x){
//		D("TRACKUSAGE");LiveValue.fTrackUsage(this);
	var c=this.__xlv.length;
	this.__xlv.push(new LiveValue(this.__sName+":" + c,x));
	this.__fAddAccess(c);
	this.__fDirty();
};

LiveObject.prototype.pop = function(){
	this.__fDirty();
	delete this[this.__xlv.length-1];
	return this.__xlv.pop().fxGet();
};

LiveObject.prototype.shift = function(x){
	this.__fDirty();
	this.__xlv.shift(new LiveValue(this.__sName+"[shift]",x));
	this.__fAddAccess(this.__xlv.length-1);
};

LiveObject.prototype.unshift = function(){
	this.__fDirty();
	delete this[this.__xlv.length-1];
	return this.__xlv.unshift().fxGet();
};

LiveObject.prototype.sort = function(f){
	this.__fDirty();
	this.__xlv.sort(f);
};

LiveObject.prototype.reverse = function(){
	this.__fDirty();
	this.__xlv.reverse();
};

LiveObject.prototype.splice = function(){
	this.__fDirty();
	var cOrig = this.__xlv.length;
	Array.prototype.splice(this.__xlv,arguments);
	var cNew = this.__xlv.length;

	var n;
	for (n=cNew; n<cOrig; n++){
		delete this[n];
	}
	for (var n=cOrig; n<cNew; n++){
		this.__fAddAccess(n);
	}
};


// ---------------------------------------------------------------------------
Object.defineProperty(
	LiveObject.prototype,"parent", {
		get: function(){return this.__loParent;}
	}
);


// ---------------------------------------------------------------------------
LiveObject.prototype.__fDirty = function(){   
	if (this.__xlv.constructor === Array){
		this.__xlv['__reallength'].fDirty();
	}
};
 
// ---------------------------------------------------------------------------
LiveObject.prototype.__fCheckHonesty = function(){
	var lo=this;
	each(Object.keys(this), function(s){
		if (!(s in lo.__xlv)){
			throw("ILLEGAL VARIABLE ASSIGNMENT WITHOUT DEFINE " + lo.__sName + "." + s);
		}
		if (lo.__xlv[s]._x instanceof LiveObject){
			lo.__xlv[s]._x.__fCheckHonesty();
		}
	});

	each(this.__vloChildren, function(lo){
		lo.__fCheckHonesty();
	});
};



// ---------------------------------------------------------------------------
LiveObject.prototype.__fAddAccess = function(s,bHide){
	var lo=this;
	Object.defineProperty(
		lo,	s, {
			get : function(){return lo.__xlv[s].fxGet();},
			set : function(x){return lo.__xlv[s].fSet(x);},
			configurable: true,
			enumerable: !bHide,
			writeable : false
		}
	);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fDefine = function(s,x,f,bMutable){

	var bExistsLocal = this.__fbExistsLocally(s);

	if (!bExistsLocal){
		this.__xlv[s] = new LiveValue(this.__sName + ":" + s, x, bMutable, f);
		this.__fAddAccess(s);
		this.__fDirty();
	}
	else{
		this.__xlv[s].bMutable = bMutable;
		if (f){
			this.__xlv[s].fCallbackDirty = f;
		}
		this.__xlv[s].fSet(x);
	}
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fDefineMutable = function(s,x,f){
	this.__fDefine(s,x,f,true);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fRecompile = function(s){
	if (s in this.__xlv){
		this.__xlv[s].fRecompile();
		return;
	}
	if (this.__loParent){
		return this.__loParent.__fRecompile(s);
	}
	D("RECOMPILE UNKNOWN VARIABLE ",this.__sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fDirtyVar = function(s){
	if (s in this.__xlv){
		this.__xlv[s].fDirty(s);
		return;
	}
	if (this.__loParent){
		return this.__loParent.__fDirtyVar(s);
	}
	D("UNKNOWN VARIABLE ",this.__sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fDelete = function(s){
	if (s in this.__xlv){
		delete this[s];
		delete this.__xlv[s];
		this.__fDirty();
		return;
	}
	D("UNKNOWN VARIABLE ",this.__sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fxGet = function(s){
	if (s in this.__xlv){
//		D("TRACKUSAGE");LiveValue.__fTrackUsage(this);
		return this.__xlv[s].fxGet();
	}
	if (this.__loParent){
		return this.__loParent.__fxGet(s);
	}
	D("GET UNKNOWN VARIABLE ",this.__sName,s);
};
// ---------------------------------------------------------------------------
LiveObject.prototype.__fSet = function(s,x){
	if (s in this.__xlv){
//		D("TRACKUSAGE");LiveValue.__fTrackUsage(this);
		this.__xlv[s].fSet(x);
//		this.__xlv[s].fAddListener(this);
//		D("NOADDLISTENER",this.__sName);
		return;
	}
	if (this.__loParent){
		return this.__loParent.__fSet(s,x);
	}
	D("SET UNKNOWN VARIABLE ",this.__sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fbExists = function(s){
	if (s in this.__xlv){
		return true;
	}
	if (this.__loParent){
		return this.__loParent.__fbExists(s);
	}
	return false;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fbExistsLocally = function(s){
	return s in this.__xlv;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.__fbIsDirty = function(s){
	if (s in this.__xlv){
		return this.__xlv[s].bDirty;
	}
	D("UNKNOWN VARIABLE ",this.__sName,s);
};




// add .*var variants so that _.defvar() will work
LiveObject.prototype.defvar = LiveObject.prototype.__fDefine;
LiveObject.prototype.recompilevar = LiveObject.prototype.__fRecompile;
LiveObject.prototype.defun = function(s,x){
	return this.__fDefine(s,function(){return x;});
};

LiveObject.prototype.defmutable = LiveObject.prototype.__fDefineMutable;
LiveObject.prototype.checkvar = LiveObject.prototype.__fbExists;
LiveObject.prototype.localvar = LiveObject.prototype.__fbExistsLocally;
LiveObject.prototype.delvar = LiveObject.prototype.__fDelete;
LiveObject.prototype.dirtyvar = LiveObject.prototype.__fDirtyVar;
LiveObject.prototype.getvar = LiveObject.prototype.__fxGet;
LiveObject.prototype.setvar = LiveObject.prototype.__fSet;


// freeze class methods
each(LiveObject.prototype, function(f,s){
	Object.defineProperty(LiveObject.prototype,s,{
		value: f,
		enumerable: false,
		configurable: false
	});
});


module.exports = LiveObject;





},{"./LiveValue":8,"./each":11,"./fDebugOutput":12,"./ffBind":14}],8:[function(require,module,exports){
// ---------------------------------------------------------------------------
var D = require("./fDebugOutput");
var each = require("./each");

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var nLiveValue = 0;
var LiveValue = function(s,x,bMutable,fCallbackDirty){
	this.sName          = s + "(lv" + nLiveValue + ")";
	nLiveValue++;

	this.xValue             = undefined;
	this.vlvDependsOn   = [];
	this.vlvListeners   = [];
	this.xValueCached       = null;
	this.bDirty         = false;

	if (bMutable){
		this.bMutable       = !!bMutable;
	}
	if (fCallbackDirty){
		this.fCallbackDirty = fCallbackDirty;
	}

	this.fSet(x);
};

// ---------------------------------------------------------------------------
LiveValue.prototype.fSet = function(x){
	// change function
	//	D("SET",this.sName,x);

	if(this.xValue !== x){
		this.fDirty();

		if (
			typeof(x) === "object" 
				&& (x.constructor.name === "Object" || x.constructor.name==="Array")
		){
			var lv = this;
			var LiveObject = require("./LiveObject");
			
			var lo = new LiveObject(this.sName + "[]", x instanceof Array);
			each(x,function(xSub,n){
				lo.__fDefine(n,xSub);
				lo.__xlv[n].fAddListener(lv);
			});
			if (x instanceof Array){
				lo.__xlv['__reallength'].fAddListener(lv);
			}
			this.xValue = lo;
		}
		else{
			this.xValue = x;
		}
		
	}
};



// ---------------------------------------------------------------------------
LiveValue.prototype.fDirty = function(){	
	// if we weren't already dirty we are now 
	if (!this.bDirty){
//		D("MARKING DIRTY", this.sName, "----------------------------------", this.vlvListeners.length);

		if (this.fCallbackDirty){
			this.fCallbackDirty();
		}

		// mark dirtyness
		this.bDirty = true;

		// so tell listensers
		var lv = this;
		this.vlvListeners.forEach(function(lvListener){
//			D("     DIRTY CASCADE --->",lvListener.sName);
			lvListener.fDirty();
		});

	}
};

// ---------------------------------------------------------------------------
LiveValue.prototype.fRemoveListener = function(lv){
	this.vlvListeners.splice(this.vlvListeners.indexOf(lv),1);
};

// ---------------------------------------------------------------------------
LiveValue.prototype.fAddListener = function(lv){
	if (this.vlvListeners.indexOf(lv)===-1){
		this.vlvListeners.push(lv);
	}
};



// ---------------------------------------------------------------------------
LiveValue.prototype.fRecompile = function(){
	if (!this.xValue.fRecompile){
		D("NO RECOMPILE AVAILABLE");
	}
	else{
		this.xValue = this.xValue.fRecompile(this.xValue);
		this.fDirty();
	}
};



// ---------------------------------------------------------------------------
var kvlvDependsCache=[];
var klvListeners = [];
var cDepth = 0;
var fTrackUsage=function(lv){
	if(kvlvDependsCache.length && !lv.bMutable){
		var c = kvlvDependsCache.length;
		kvlvDependsCache[c-1].push(lv);
		lv.fAddListener(klvListeners[c-1]);
	}
};

LiveValue.fTrackUsage = fTrackUsage;
LiveValue.prototype.fxGet = function(){
	fTrackUsage(this);

	if (this.bDirty){
		this.bDirty = false;

		if (typeof(this.xValue) === "function"){
			var vlvDependsNew = [];
			kvlvDependsCache.push(vlvDependsNew);
			klvListeners.push(this);
			this.xValueCached = this.xValue();
			klvListeners.pop();
			kvlvDependsCache.pop();

			// mark all new dependencies
			vlvDependsNew.forEach(function(vlDep){vlDep.nMark = 1;});

			// remove watches on any which are no longer dependencies
			// and mark prexisting dependencies
			var lv = this;
			this.vlvDependsOn.forEach(function(lvDep){
				if ( !lvDep.nMark ){
					lvDep.fRemoveListener(lv);
				}
				else {
					lvDep.nMark = 2;
				}
			});
	
			// add watches on any new dependencies
			// and remove all marks
			vlvDependsNew.forEach(function(vlDep){
				if(vlDep.nMark !== 2){
					vlDep.fAddListener(lv);
				}
				delete vlDep.nMark;
			});
	
			// update the dependency list
			this.vlvDependsOn = vlvDependsNew;
		}
		else{
			this.xValueCached = this.xValue;
		}	
	}
	return this.xValueCached;
};






module.exports = LiveValue;

},{"./LiveObject":7,"./each":11,"./fDebugOutput":12}],9:[function(require,module,exports){
"use strict";

var each = require("./each");
var ffBind = require("./ffBind");
var LiveObject = require("./LiveObject");
var D = require('./fDebugOutput');

var nScope=0;
var Scope = function(s, scopeParent, bVarOnly){
	this.sName=s + nScope;
	nScope ++;

	this.scopeParent = scopeParent;
	this.vlvListeners = [];

	scopeParent = scopeParent || {};
	this.loVariables  = new LiveObject(s + "(vars)", false, scopeParent.loVariables);
	this.loElements   = new LiveObject(s + "(elt)", false, scopeParent.loElements);
	this.loAttributes = new LiveObject(s + "(attr)", false, scopeParent.loAttributes);
};

Object.defineProperty(
	Scope.prototype,"_", {
		get: function(){return this.loVariables;}
	}
);

Object.defineProperty(
	Scope.prototype,"parent", {
		get: function(){return this.scopeParent;}
	}
);


// ---------------------------------------------------------------------------
Scope.prototype.__fDirty = function(){   
  this.vlvListeners.__forEach(function(lvListener){
    lvListener.__fDirty();
  });
};
 
// ---------------------------------------------------------------------------
Scope.prototype.__fRemoveListener = function(lv){
    this.vlvListeners.splice(this.vlvListeners.indexOf(lv),1);
};
 
// ---------------------------------------------------------------------------
Scope.prototype.__fAddListener = function(lv){
    this.vlvListeners.push(lv);
};
 


// variable methods
Scope.prototype.recompilevar = function(s){
	this.loVariables.__fRecompile(s);
};


// variable methods
Scope.prototype.defvar = function(s,x,f){
	return this.loVariables.__fDefine(s,x,f);
};

Scope.prototype.defun = function(s,x){
	return this.loVariables.__fDefine(s,function(){return x;});
};

Scope.prototype.defmutable = function(s,x){
	return this.loVariables.__fDefineMutable(s,x);
};

Scope.prototype.checkvar = function(s){
	return this.loVariables.__fbExists(s);
};

Scope.prototype.localvar = function(s){
	return this.loVariables.__fbExistsLocally(s);
};

Scope.prototype.delvar = function(s){
	return this.loVariables.__fDelete(s);
};

Scope.prototype.dirtyvar = function(s){
	D("DIRTYVAR",s);
	return this.loVariables.__fDirtyVar(s);
};

Scope.prototype.getvar = function(s){
	return this.loVariables.__fxGet(s);
};

Scope.prototype.setvar = function(s,x){
	return this.loVariables.__fSet(s,x);
};


// element methods
Scope.prototype.defelt = function(s,x){
	return this.loElements.__fDefine(s,function(){return x;});
};

Scope.prototype.checkelt = function(s){
	return this.loElements.__fbExists(s);
};

Scope.prototype.localelt = function(s){
	return this.loElements.__fbExistsLocally(s);
};

Scope.prototype.delelt = function(s){
	return this.loElements.__fDelete(s);
};

Scope.prototype.dirtyelt = function(s){
	return this.loElements.__fDirtyVar(s);
};

Scope.prototype.getelt = function(s){
	return this.loElements.__fxGet(s);
};

Scope.prototype.setelt = function(s,x){
	return this.loElements.__fSet(s,x);
};

// attribute methods
Scope.prototype.defattr = function(s,x){
	return this.loAttributes.__fDefine(s,function(){return x;});
};

Scope.prototype.checkattr = function(s){
	return this.loAttributes.__fbExists(s);
};

Scope.prototype.localattr = function(s){
	return this.loAttributes.__fbExistsLocally(s);
};

Scope.prototype.delattr = function(s){
	return this.loAttributes.__fDelete(s);
};

Scope.prototype.dirtyattr = function(s){
	return this.loAttributes.__fDirtyVar(s);
};

Scope.prototype.getattr = function(s){
	return this.loAttributes.__fxGet(s);
};

Scope.prototype.setattr = function(s,x){
	return this.loAttributes.__fSet(s,x);
};




module.exports = Scope;
},{"./LiveObject":7,"./each":11,"./fDebugOutput":12,"./ffBind":14}],10:[function(require,module,exports){
"use strict";

window.Vivid = require("./GlobalVivid");
var nsVivid = require('./nsVivid');

var bVividInitialized = false;

$(function(){
	Vivid.init(function(err, jq){
		if (err){
			jq=$();
			console.error(err);
		}
		Vivid.setContents($('body'), jq);
		if (!bVividInitialized){
			$('body').css('visibility','visible');
			bVividInitialized = true;
		}
	});

});



},{"./GlobalVivid":6,"./nsVivid":15}],11:[function(require,module,exports){
(function (global){
// ---------------------------------------------------------------------------
var each = function(x,f){
	if (global.$ && x instanceof $){
		var jq=x;
		var vjq=[];
		for (var n=0,c=jq.get().length; n<c; n++){
			vjq.push(jq.eq(n));
		}
		return each(vjq,f);
	}
	else if (x instanceof Array || x.hasOwnProperty('length')){
		var vx = x;
		for (var n=0,c=vx.length; n<c; n++){
			f(vx[n],n,vx);
		}
	}
	else {
		var ax = x;
		for(var sKey in ax){
			if (ax.hasOwnProperty(sKey)){
				f(ax[sKey],sKey,ax);
			}
		}
	}
};

module.exports = each;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
(function (global){
// ---------------------------------------------------------------------------
var each = require("./each");

module.exports = function(){
	var vxArg = Array.prototype.slice.call(arguments);

	each(vxArg, function(xArg,n){
		if (global.$ && typeof(xArg) === 'object' && xArg instanceof $){
			var jq = xArg;
			var s="jquery [";
			jq.each(function(ne,e){
				s+="\n\t" + ne + " -> " + $("<div />").append($(e).clone()).html();
			});
			s+= "]";
			vxArg[n] = s;
		}
	});

  Function.apply.call(console.log, console, vxArg);
};




}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./each":11}],13:[function(require,module,exports){
var Vivid = require("./GlobalVivid");
var D = require("./fDebugOutput");

module.exports = function(scope){

	var scopeInclude = new Vivid.Scope("include");

	// ------------------------------------------------------------------------
	scope.defelt("include", function(scope,jq){
			var fjq;
			return function(){
				var _ = scope._;

				if (!scopeInclude.checkvar(_.url)){
					scopeInclude.defvar(_.url, _._inner);

					Vivid.fGet(_.url, function(err,sData){
						scopeInclude.setvar(
							_.url, 
							Vivid.parseHTML(sData)
						);

						fjq = null;
						scope.parent.recompilevar('_inner');

					});
				}
				if (!fjq){
					fjq = Vivid.compile(
						scope.parent, 
						scopeInclude.getvar(_.url).clone()
					);
				}

				return fjq();
			};
	});

	// ------------------------------------------------------------------------
	scope.defelt("usemodule", function(scope,jq){
			var bInstalled;
			return function(){
				var sModule = scope._.module
				if (!bInstalled){
					bInstalled = true;
					var ffjq = Vivid.ffjqModule(sModule);
					ffjq(scope,jq);
					scope.recompilevar('_inner');
				}
				return scope._._inner;
			}
	});

};


},{"./GlobalVivid":6,"./fDebugOutput":12}],14:[function(require,module,exports){
module.exports = function(o,sf){
	return function(){
		return o[sf].apply(o,arguments);
	}
};

},{}],15:[function(require,module,exports){
"use strict";

var each = require("./each");
var ffBind = require("./ffBind");
var Scope = require("./Scope");
var nsUtil = require("util");
var LiveObject = require("./LiveObject");

var D = require("./fDebugOutput");

// ---------------------------------------------------------------------------
var faAttributes = function(jq){
	var a = {};
	if (!jq.length){
		return a;
	}

	each(jq[0].attributes, function(aAttr){
		var sAttr = aAttr["name"];
		var sVal = aAttr["value"];
		if (sAttr && typeof(sAttr) === "string"){
			a[sAttr] = sVal;
		}
	});

	return a;
};


									 
// ---------------------------------------------------------------------------
// this tricky bit makes sure we don't remove/detach
// node which we still need. detach and reattach
// loses focus. remove wipes handlers
var fSafeSwapContents = function(jq, jqNew){
	if (!(jqNew instanceof $)){
		jqNew = fjqText(jqNew);
	}

	var eParent = jq.get(0);
	var veNew =  jqNew.get();
	var jqOld = jq.contents();
	var veOld = jqOld.get();

	var jqFocus = jqNew.find(":focus");

	for (var nOld=0, cOld=veOld.length; nOld<cOld; nOld++){
		if (veNew.indexOf(veOld[nOld]) === -1){
			$(veOld[nOld]).detach();
			veOld.splice(nOld,1);
			nOld --;
			cOld --;
		}
	}

	nOld = 0;
	for (var nNew=0, cNew=veNew.length; nNew<cNew; nNew++){
		if (veOld[nOld] !== veNew[nNew]){
			eParent.insertBefore(veNew[nNew], veOld[nOld]);
		}
		else{
			nOld++;
		}
	};



};

// ---------------------------------------------------------------------------
var ffjqPassthrough = function(scope,jq){
	return function(){

		each(scope._._attributes, function(sVar){
			var sVal = scope._[sVar];
			if (sVal instanceof $){
				sVal = sVal.text();
			}
			if (typeof(sVal)!=='string'){
				sVal = null;
			}
			jq.attr(sVar, sVal);
		});

		var jqInner = scope._._inner;
		fSafeSwapContents(jq, jqInner);
		return jq;
	}
};


// ---------------------------------------------------------------------------
var fsUnescape = function(s){
	// NOTE: this may not be efficient. compare to replace(re,f) style
	return s
		.replace(/&amp;/gim,"&")
		.replace(/&lt;/gim,"<")
		.replace(/&gt;/gim,">")
		.replace(/&quot/gim,"\"")
		.replace(/&#x27;/gim,"'");
};



// ---------------------------------------------------------------------------
// These are the magic variables which are preadded to all of our execution
// environments.
//
// it only works if the external environment with the
// eval() call defines the relevant scope "scope"
// we could make this a function of sScope, but that
// would incur a runtime penalty
//
var sVarClosureForEval = (
	""
/*
		+ "var defvar     = ffBind(scope, 'defvar');\n"
		+ "var defmutable = ffBind(scope, 'defmutable');\n"
		+ "var delvar     = ffBind(scope, 'delvar');\n"
		+ "var checkvar   = ffBind(scope, 'checkvar');\n"
*/
		+ "var _          = scope._;\n"
);

// ---------------------------------------------------------------------------
var fDefCode = function(scope,jq, sfDefine){
	var sBody = jq.html();

	var aAttr = faAttributes(jq);
	var sName = aAttr["name"];
	delete aAttr["name"];

	//D("DEFINING",scope.sName,sfDefine,sName);

	var afxAttributes = {};
	each(aAttr, function(sVal, sVar){
		// we allow the argument to be an expression
		afxAttributes[sVar]=ffxInterpolateString(scope,sVal);
	});


	sBody = fsUnescape(sBody);

	var sf=(
		"(function(scope,jq,jqDefinition){\n"
			+ sVarClosureForEval
			+ sBody  + "\n"
			+"})"
	);

	// using this eval trick gives us a closure over $ 
	var f;
	try{
		f=eval(sf);
	}
	catch(e){
		D("\nERROR: syntax error in " + sfDefine + " " + sName, sf);
		throw(e);
	}

	scope[sfDefine](
		sName,
		function(scopeIn,jqIn,jq){
			// arguments
			each(afxAttributes, function(fClosure, sVar){
				if (!scopeIn.localvar(sVar)){
					scopeIn.defvar(sVar, fClosure);
				}
			});
			return f(scopeIn,jqIn);
		}
	);
};


// ---------------------------------------------------------------------------
var fDoInScope = function(scope,jq, sfDefine){
	var sBody = jq.html();

	var aAttr = faAttributes(jq);
	
	var afClosure = {};
	each(aAttr, function(sVal, sVar){
		// we allow the argument to be an expression
		afClosure[sVar]=ffxInterpolateString(scope,sVal);
	});


	sBody = fsUnescape(sBody);

	var sf=sVarClosureForEval + sBody;

	// using this eval trick gives us a closure over $ 
	eval(sf);
};



// ---------------------------------------------------------------------------
var fDefElement = function(scope,jq){
	return fDefCode(scope,jq,'defelt');
};

// ---------------------------------------------------------------------------
var fDefAttribute = function(scope,jq){
	return fDefCode(scope,jq,'defattr');
};

// ---------------------------------------------------------------------------
var fDefUserFunction = function(scope,jq){
	var sName = jq.attr("name");
	var sBody = jq.html();
	sBody = fsUnescape(sBody);

	var sf=(
		"(function(){\n"
			+ sVarClosureForEval
			+ sBody
			+"})"
	);
	var f=eval(sf);
	scope.defvar(sName, function(){
		return f();
	});

};


// ---------------------------------------------------------------------------
var fDefMacro = function(scope, jq){
	var aAttr = faAttributes(jq);
	var sName = aAttr["name"];
	delete aAttr["name"];


//	D("DEFINING MACRO " + sName + " IN SCOPE " + scope.sName);
	scope.defelt(sName, function(scopeIn, jqIn){
		var aAttrCall = faAttributes(jqIn);
		each(aAttr, function(sVal, sVar){
			if (!(sVar in aAttrCall)){
				scopeIn.defvar(sVar, ffxInterpolateString(scope,sVal));
			}
		});
		each(aAttrCall, function(sVal, sVar){
			scopeIn.defvar(sVar, ffxInterpolateString(scopeIn.parent,sVal));
		});
		// make sure to clone contents as the macro can be called 
		// multiple times
		var f = nsVivid.compile(scopeIn, jq.contents().clone(true));
		return function(){
			var jqOut = f();
			return jqOut;

		};
	});
};


// ---------------------------------------------------------------------------
var ffxLiveExpression = function(scope, x){

	x=(""+x).replace(/[\r\n]/g,' ');
	
	try{
		var f = new Function("return " + x);
		try{
			var x=f();
			// not live!
//			D("NOT LIVE",x,x instanceof Array);
			return x;
		}
		catch(e){
//			D("IS LIVE",x);
			// is live
		}
	}
	catch(e){
		throw("Syntax error in expression:" + x);
	}

	return eval(
		""
			+ "(function(){\n"
			+ "  var _ = scope._;\n"
			+ "    return " + x + ";\n"
			+ "})"
	);

};





// ---------------------------------------------------------------------------
var fjqText = function(s){
	return Vivid.parseHTML(""+s);
};

var reInterpolate = /\{\{([\s\S]*?)\}\}/gm;
var ffxInterpolateString = function(scope,s,bForceJq){
		
	if (s.indexOf("{{")===-1){
		return bForceJq?fjqText(s):s;
	}


	var lo = new LiveObject(scope.sName+":TEXTINNER", true);

	var n = 0;
	var aMatch;
	while(aMatch = reInterpolate.exec(s)){
		var c = aMatch[0].length;
		if (aMatch["index"]){
			lo.push(fjqText(s.slice(n,aMatch["index"])));
		}
		n=aMatch["index"] + c;
		lo.push(ffxLiveExpression(scope,aMatch[1]));
	};

	if (n!==s.length){
		lo.push(fjqText(s.substr(n)));	
	}

	if (lo.length === 1){
		return function(){
			return lo[0];
		}
	}

	return function(){
		var veOut=[];

//		D(s,lo);
		each(lo,function(x,n){
			if (!(x instanceof $)){
				x = fjqText(x);
			}
//			D("GOT",x.constructor.name, n, x,lo[n],x.b);
			veOut = veOut.concat(x.get());
		});

		return $(veOut);
	};
};

// ---------------------------------------------------------------------------
var ffjqEvalTextElement = function(scope,jqScript){
	var s = jqScript.text();
	if (s.indexOf("{{")===-1){
		return jqScript;
	}
	return ffxInterpolateString(scope, s, true);
};

// ---------------------------------------------------------------------------
var ffjqCompileElements = function(scope, jq){

	var lo = new LiveObject(scope.sName+":INNER", true);

	each(jq.get(),function(e,n){
		lo.push(ffjqCompileElement(scope, $(e)));
	});

	var c = jq.length;

	var fOut = (
		c === 1
			? function(){ return lo[0]; }
		: function(){
			var ve=[];
			for (var n=0; n<c; n++){
				var jqInner = lo[n];
				if (!(jqInner instanceof $)){
					jqInner = fjqText(jqInner);
				}
				ve = ve.concat(jqInner.get());
			}
			return $(ve);
		}
	);

	

	fOut.fRecompile = function(){
		return ffjqCompileElements(scope, jq);
	};

	return fOut;
};




// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var afHandlerForElement = {
	"defelt"   : fDefElement,
	"defattr"  : fDefAttribute,
	"defmacro" : fDefMacro,
	"defun"    : fDefUserFunction,
	"run"      : fDoInScope
};


// ---------------------------------------------------------------------------
var ffjqCompileElement = function(scopeIn,jqScript){
	var nNodeType = jqScript.get()[0].nodeType;

	// comments and empty
	if (nNodeType === 8 || jqScript.length === 0){
		return $();
	}

	// text
	if (nNodeType === 3){
		return ffjqEvalTextElement(scopeIn, jqScript);
	}

	var sElement  = (jqScript.prop('tagName')+"").toLowerCase();

	// handle scripts or remap them
	if (sElement === "script"){
		var sType = jqScript.attr("type");
		if (sType in afHandlerForElement){
			sElement = sType;
		}
		else{
			return jqScript;
		}
	}
//	D("COMPILE",sElement);
	
	// check if it has a special handler
	var fHandler = afHandlerForElement[sElement];
	if (fHandler){
		fHandler(scopeIn,jqScript);
		return $();
	}

	// elements
	var scope = new Scope(scopeIn.sName + "." + sElement, scopeIn);

	var bKnownElement = scopeIn.checkelt(sElement);

	var ffjq = (bKnownElement ? scopeIn.getelt(sElement) : ffjqPassthrough);

	// predeclare the _inner so that the element is bound
	// to the _inner of its own scope
	scope.defvar("_inner");

	var fjq  = ffjq(scope, jqScript);

	var aAttr = faAttributes(jqScript);
	scope.defvar("_attributes",Object.keys(aAttr));
	each(aAttr, function(sVal, sVar){
		scope.defvar(sVar, ffxInterpolateString(scopeIn,sVal));
	});
	
	var vfjqChange = [];
	each(aAttr, function(sVal, sVar){
		if (scopeIn.checkattr(sVar)){
			vfjqChange.push(scopeIn.getattr(sVar)(scope,jqScript));
		}
	});

	scope._._inner = ffjqCompileElements(scope, jqScript.contents());

	return function(){
		var jq=fjq();
		each(vfjqChange, function(fjqChange){
			jq = fjqChange(jq);
		});
		return jq;
	};
};




var nsVivid = {};

// ---------------------------------------------------------------------------
nsVivid.compile = ffjqCompileElements;
nsVivid.fSafeSwapContents = fSafeSwapContents;
nsVivid.ffxLiveExpression = ffxLiveExpression;

module.exports = nsVivid;

},{"./LiveObject":7,"./Scope":9,"./each":11,"./fDebugOutput":12,"./ffBind":14,"util":5}]},{},[10]);
