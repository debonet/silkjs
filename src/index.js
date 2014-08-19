(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var D=console.log;
var each = require("./each");
var LiveValue = require("./LiveValue");
var ffBind = require("./ffBind");

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var LiveObject = function(s, loParent){
	this.sName = s;
	this.alv = {};
	this.vlvListeners  = [];
	this.loParent = loParent;
	this.vloChildren = [];
	this.fRemakeAccessLayer();
};


// ---------------------------------------------------------------------------
LiveObject.prototype.getParent = function(){
	return this.loParent;
}

// ---------------------------------------------------------------------------
LiveObject.prototype.fvslv = function(){
	var setVar = {};

	var lo = this;
	do{
		each(lo.alv, function(x,s){
			setVar[s]=true;
		});
		lo = lo.loParent;
	} while(lo);

	var vs=[];
	each(setVar, function(x,s){
		vs.push(s);
	});

	return vs;
}

// ---------------------------------------------------------------------------
LiveObject.prototype.fDirty = function(){	
	this.vlvListeners.forEach(function(lvListener){
		lvListener.fDirty();
	});
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fRemoveListener = function(lv){
	this.vlvListeners.splice(this.vlvListeners.indexOf(lv),1);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fAddListener = function(lv){
	this.vlvListeners.push(lv);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fRemakeAccessLayer = function(){
	delete this._;
	this._ = {};

	var vslv = this.fvslv();

	var lo = this;
	vslv.forEach(function(s,n){
		Object.defineProperty(
			lo._,	s, {
				get : function(){return lo.get(s);},
				set : function(x){return lo.set(s,x);},
				configurable: true,
				enumerable: true,
				writeable : false
			}
		);
	});
	
	Object.freeze(this._);

	each(this.vloChildren, function(lo){
		lo.fRemakeAccessLayer();
	});
};

// ---------------------------------------------------------------------------
LiveObject.prototype.defvar = function(s,x){
	var bNew = !this.checkvar(s);
	this.alv[s] = new LiveValue(this.sName + ":" + s, x);

	if (bNew){
		this.fRemakeAccessLayer();
	}
};


// ---------------------------------------------------------------------------
LiveObject.prototype.defmutable = function(s,x){
	var bNew = !this.checkvar(s);
	this.alv[s] = new LiveValue(this.sName + ":" + s, x, true);

	if (bNew){
		this.fRemakeAccessLayer();
	}
};

// ---------------------------------------------------------------------------
LiveObject.prototype.delvar = function(s){
	if (s in this.alv){
		delete this.alv[s];
		this.fRemakeAccessLayer();
		return;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.get = function(s){
	if (s in this.alv){
		return this.alv[s].fxGet();
	}
	if (this.loParent){
		return this.loParent.get(s);
	}
	D("GET UNKNOWN VARIABLE ",this.sName,s);
};
// ---------------------------------------------------------------------------
LiveObject.prototype.set = function(s,x){
	if (s in this.alv){
		this.alv[s].fSet(x);
		this.alv[s].fAddListener(this);
		return;
	}
	if (this.loParent){
		return this.loParent.set(s,x);
	}
	D("SET UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.checkvar = function(s){
	if (s in this.alv){
		return true;
	}
	if (this.loParent){
		return this.loParent.checkvar(s);
	}
	return false;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.localvar = function(s){
	return s in this.alv;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.fbIsDirty = function(s){
	if (s in this.alv){
		return this.alv[s].bDirty;
	}
	D("UNKNOWN VARIABLE ",this.sName,s);
};

// ---------------------------------------------------------------------------
LiveObject.prototype.floClone = function(s){
	var lo = new LiveObject(s,this);
	this.vloChildren.push(lo);
	lo.fRemakeAccessLayer();
	return lo;
};

// ---------------------------------------------------------------------------
LiveObject.prototype.expr = function(x){
	var sLiveObject = sLiveObject || "_";
	var lo = this;
	var sScope = "lo";
	return eval(
		""
			+ "var defvar     = ffBind(" + sScope + ", 'defvar');\n"
			+ "var defmutable = ffBind(" + sScope + ", 'defmutable');\n"
			+ "var delvar     = ffBind(" + sScope + ", 'delvar');\n"
			+ "var checkvar   = ffBind(" + sScope + ", 'checkvar');\n"
			+ "var _          = " + sScope + "._;\n"
			+ "(function(){return " + x + "})"
	);
};


LiveObject.prototype.clone = LiveObject.prototype.floClone;
LiveObject.prototype.fscopeClone = LiveObject.prototype.floClone;

module.exports = LiveObject;





},{"./LiveValue":2,"./each":3,"./ffBind":4}],2:[function(require,module,exports){
var D=console.log;

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var LiveValue = function(s,x,bMutable){
	this.sName         = s+Math.floor(Math.random()*1000);
	this._x            = undefined;
	this.vlvDependsOn  = [];
	this.vlvListeners  = [];
	this._xCached      = null;
	this.bDirty        = false;
	this.bMutable      = !!bMutable;
	this.fSet(x);
};


// ---------------------------------------------------------------------------
LiveValue.prototype.fSet = function(x){
	// change function
//	D("SET",this.sName,x);

	if(this._x !== x){
		this.fDirty();
		this._x = x;
	}
}


// ---------------------------------------------------------------------------
LiveValue.prototype.fDirty = function(){	
	// if we weren't already dirty we are now 
	if (!this.bDirty){
//		D("MARKING DIRTY", this.sName, this.vlvListeners.length);
		// so tell listensers
		this.vlvListeners.forEach(function(lvListener){
			lvListener.fDirty();
		});

		// mark dirtyness
		this.bDirty = true;
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
var kvlvDependsCache=[];
var klvListeners = [];
var cDepth = 0;
LiveValue.prototype.fxGet = function(){

	if(kvlvDependsCache.length && !this.bMutable){
		var c = kvlvDependsCache.length;
		kvlvDependsCache[c-1].push(this);
		this.fAddListener(klvListeners[c-1]);
	}

	if (this.bDirty){
		this.bDirty = false;

		if (typeof(this._x) === "function"){
			var vlvDependsNew = [];
			kvlvDependsCache.push(vlvDependsNew);
			klvListeners.push(this);
			this._xCached = this._x();
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
			this._xCached = this._x;
		}	
	}
	return this._xCached;
};





// ---------------------------------------------------------------------------
/*
Object.defineProperty(
	LiveValue.prototype, "x", {
		get: LiveValue.prototype.fxGet,
		set: LiveValue.prototype.fSet,
	}
);


var LV = function(s,x){
	return new LiveValue(s,x);
};




var lvA = LV("a",5);
var lvB = LV("b",function(){return 2*lvA.x;});
var lvC = LV("c",function(){return "happy" + lvA.fxGet() +"--"+ lvB.x;});


D(lvC.fxGet());
lvA.x=20;
D(lvC.fxGet());
lvB.x=30;
D(lvC.fxGet());
lvB.fSet(function(){return 10*lvA.x ;});
D(lvC.fxGet());
lvA.x=3;
D(lvC.fxGet());

*/


module.exports = LiveValue;

},{}],3:[function(require,module,exports){
// ---------------------------------------------------------------------------
var each = function(a,f){
	for(var sKey in a){
		if (a.hasOwnProperty(sKey)){
			f(a[sKey],sKey,a);
		}
	}
};

module.exports = each;

},{}],4:[function(require,module,exports){
module.exports = function(o,sf){
	return function(){
		return o[sf].apply(o,arguments);
	}
};

},{}],5:[function(require,module,exports){
"use strict";

var each = require("./each");
var Scope = require("./LiveObject");
var LiveValue = require("./LiveValue");
var ffBind = require("./ffBind");

// ---------------------------------------------------------------------------
var D = function(){
  Function.apply.call(console.log, console, arguments);
};


// ---------------------------------------------------------------------------
var fCopyAttributes = function(jqTo, jqFrom){
	// copy attributes
	each(jqFrom.prop("attributes"), function(aAttr){
		var sAttr = aAttr["name"];
		var sVal = aAttr["value"];
		jqTo.attr(sVar, sVal);
	});
};

// ---------------------------------------------------------------------------
var faAttributes = function(jq){
	var a = {};
	if (!jq.length){
		return a;
	}

	each(jq[0].attributes, function(aAttr){
		var sAttr = aAttr["name"];
		var sVal = aAttr["value"];
		if (sAttr && typeof(sAttr) === "string" && sVal){
			a[sAttr] = sVal;
		}
	});
	return a;
};

// ---------------------------------------------------------------------------
var ffjqPassthrough = function(scope){
	return function(){
		var _ = scope._;
		var jq = $("<" + _._element + ">");
		each(scope._attributes, function(sVal, sVar){
			jq.attr(sVar,_[sVar]);
		});
		jq.append(_._inner.clone());

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
var fDefElement = function(scope,jq){
	var sBody = jq.html();

	var aAttr = faAttributes(jq);
	var sName = aAttr["name"];
	var sScope = "scope";
	var sQuery = "jq";
	delete aAttr["name"];
	delete aAttr["scope"];
	delete aAttr["query"];

	
	var afClosure = {};
	each(aAttr, function(sVal, sVar){
		// we allow the argument to be an expression
		afClosure[sVar]=scope.expr(sVal);
	});


	sBody = fsUnescape(sBody);

	// using this eval trick gives us a closure over $ 
	var f=eval(
		"(function(" + sScope + "," + sQuery + "){\n"
			+ "var defvar     = ffBind(" + sScope + ", 'defvar');\n"
			+ "var defmutable = ffBind(" + sScope + ", 'defmutable');\n"
			+ "var delvar     = ffBind(" + sScope + ", 'delvar');\n"
			+ "var checkvar   = ffBind(" + sScope + ", 'checkvar');\n"
			+ "var _          = " + sScope + "._;\n"
			+ sBody 
			+"\n})"
	);


	scope.defvar(
		sName,
		function(){
			return function(scopeIn,jqIn){
				// arguments
				each(afClosure, function(fClosure, sVar){
					scopeIn.defvar(sVar, fClosure);
				});
				return f(scopeIn,jqIn);
			}
		}
	);
};


// ---------------------------------------------------------------------------
var fDefMacro = function(scope, jq){
	var aAttr = faAttributes(jq);
	var sName = aAttr["name"];
	var sScope = "scope";
	var sQuery = "jq";
	delete aAttr["name"];
	delete aAttr["scope"];
	delete aAttr["query"];

	D("DEFINING MACRO " + sName + " IN SCOPE " + scope.sName);
	scope.defvar(sName, function(){
		return function(scopeIn, jqIn){
			return function(){
				each(aAttr, function(sVal, sVar){
					scopeIn.defvar(sVar, scopeIn.expr(sVal));
				});
				each(faAttributes(jqIn), function(sVal, sVar){
					scopeIn.defvar(sVar, scopeIn.expr(sVal));
				});
				return compile(scopeIn, jq.contents())();
			};
		};
	});

};

// ---------------------------------------------------------------------------
var reExpr = /\{\{(.*?)\}\}/g;
var ffjqEvalText = function(scope,jqScript){
	var s=jqScript.text();
	var re=reExpr;

	var aMatch;
	var vx=[];
	var n = 0;


	while(aMatch = re.exec(s)){
		var c = aMatch[0].length;
		vx.push(s.slice(n,aMatch["index"]));
		n=aMatch["index"] + c;
		vx.push(scope.expr(aMatch[1]));
	};
	vx.push(s.slice(n));

	return function(){
		var vs=[];

		each(vx,function(x){
			if (typeof(x) === "function"){
				x=x(scope);
			}
			vs.push(x);
		});

		var s=vs.join('');
		s=s.replace(/\\\n/g,"");
		return $("<div>").text(s).contents();
	}
};

// ---------------------------------------------------------------------------
var ffjqEvalElements = function(scope, jq){
	var vf = [];
	each(jq.get(),function(e){
		vf.push(ffjqEvalElement(scope, $(e)));
	});

	return function(){
		var jqInner=$();
		each(vf, function(f,n){
			jqInner = jqInner.add(f(scope));
		});
		return jqInner;
	};
};

var compile = ffjqEvalElements;


// ---------------------------------------------------------------------------
var ffjqEvalElement = function(scopeIn,jqScript){
	var nNodeType = jqScript.get()[0].nodeType;
	var sElement  = (jqScript.prop('tagName')+"").toLowerCase();

	if (nNodeType === 8 
			|| jqScript.length === 0 
			|| sElement === "script" 
			|| sElement ==="defmacro"
		 ){
		return function(){return $();};
	}

	if (nNodeType === 3){
		return  ffjqEvalText(scopeIn, jqScript);
	}

	var scope = scopeIn.fscopeClone(scopeIn.sName + "." + sElement);

	// find defelt
	jqScript.find("script[type=defelt]").each(function(n,e){
		fDefElement(scope,$(e) );
	});

	// find defmacros
	jqScript.children("defmacro").each(function(n,e){
		fDefMacro(scope,$(e));
	});

	// predeclare the _inner so that the element is bound
	// to the _inner of its own scope
	scope.defvar("_inner");
	scope.defvar("_createInner");

	var ffjq = (
		scopeIn.checkvar(sElement)
			? scopeIn.get(sElement)
			: ffjqPassthrough
	);

	var fjq = ffjq(scope,jqScript);

	var aAttr = faAttributes(jqScript);
	scope.defvar("_element",sElement);
	scope.defvar("_attributes",aAttr);
	each(aAttr, function(sVal, sVar){
		scope.defvar(sVar, scopeIn.expr(sVal));
	});

	scope._._createInner = function(){
		return function(scope){
			return ffjqEvalElements(scope,jqScript.contents());
		}
	};


	// quick alias for _._createInner(_);
	scope._._inner = ffjqEvalElements(scope, jqScript.contents());

	return fjq;
};




var nsSilk = {};

// ---------------------------------------------------------------------------
nsSilk.digest = function(scope, sVar, cIterations){
	cIterations = cIterations || 10;

	var x;
	for (var n=0; n<cIterations; n++){
		x = scope.get(sVar);
		if (!scope.fbIsDirty(sVar)){
			break;
		}
		D("iterating..." + n + "/" + cIterations);
	}	
	if (scope.fbIsDirty(sVar)){
		console.warn("Reached " + cIterations + " giving up...");
	}

	return x;
};

// ---------------------------------------------------------------------------
nsSilk.compile = ffjqEvalElements;

// ---------------------------------------------------------------------------
nsSilk.fjqSilkify = function(jqIn, scope, cIterations){
	scope = scope || new Scope("global");
	cIterations = cIterations || 10;

	scope.defvar("_page", ffjqEvalElements(scope, jqIn));

	return nsSilk.fjqRefresh(scope, cIterations);
};


module.exports = nsSilk;

},{"./LiveObject":1,"./LiveValue":2,"./each":3,"./ffBind":4}],6:[function(require,module,exports){
"use strict";

var nsSilk = require("./nsSilk.js");
var Scope = require("./LiveObject");

window.Silk = {

	lv    : undefined,

	scope : new Scope("global"),

	digest : function(){
		$('body').replaceWith(nsSilk.digest(Silk.scope,'_page'));
	},

	init : function(){
		Silk.scope.defvar('_page', nsSilk.compile(Silk.scope, $('body')));
		Silk.digest();
	}
};


$(function(){
	//	console.log($("<div></div>").append($('body').clone()).html());
	Silk.init();
});



},{"./LiveObject":1,"./nsSilk.js":5}]},{},[6]);
