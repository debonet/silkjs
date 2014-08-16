var nsUtil = require("util");
var D=console.log;


// ---------------------------------------------------------------------------
var each = function(a,f){
	for(var sKey in a){
		if (a.hasOwnProperty(sKey)){
			f(a[sKey],sKey,a);
		}
	}
};


// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var LiveValue = function(s,x){
	this.sName         = s;
	this.x            = undefined;
	this.vlvDependsOn  = [];
	this.vlvListeners  = [];
	this.xCached      = null;
	this.bDirty        = false;
	this.fSet(x);
};


// ---------------------------------------------------------------------------
LiveValue.prototype.fSet = function(x){
	this.fDirty();
	// change function
//	D("SET",this.sName,x);

	this.x = x;
}


// ---------------------------------------------------------------------------
LiveValue.prototype.fDirty = function(){	
	// if we weren't already dirty we are now 
	if (!this.bDirty){
	
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
	this.vlvListeners.push(lv);
};


// ---------------------------------------------------------------------------
var kvlvDependsCache=[];

LiveValue.prototype.fxGet = function(){

//	D("GET",this.sName);

	if(kvlvDependsCache.length){
//		D("DEP",this.sName);
		kvlvDependsCache[0].push(this);
	}

	if (this.bDirty){
		if (typeof(this.x) === "function"){
			var vlvDependsNew = [];
			kvlvDependsCache.unshift(vlvDependsNew);
			this.xCached = this.x();
			kvlvDependsCache.shift();
	
			// mark all new dependencies
			vlvDependsNew.forEach(function(vlDep){vlDep.nMark = 1;});
	
			// remove watches on any which are no longer dependencies
			// and mark prexisting dependencies
			var lv = this;
			this.vlvDependsOn.forEach(function(lvDep){
				if ( lvDep.nMark !==1 ){
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
			this.bRedefined = false;
		}
		else{
			this.xCached = this.x;
		}	
		this.bDirty = false;
	}
	return this.xCached;
};




// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var Scope = function(s, scopeParent){
	this.scopeParent = scopeParent;
	this.sName = s;
	this.alv = {};
};

// ---------------------------------------------------------------------------
Scope.prototype.defvar = function(s,x){
	if (s==="test"){	D("DEF",s,x);}
	var scope = this;

	this.alv[s] = new LiveValue(this.sName + ":" + s,x);

	if (s==="test"){D("POSTSET",this.test);}
};

// ---------------------------------------------------------------------------
Scope.prototype.get = function(s, xDefault){
	if (s in this.alv){
		return this.alv[s].fxGet();
	}
	if (this.scopeParent){
		return this.scopeParent.get(s,xDefault);
	}
	return xDefault;
};
// ---------------------------------------------------------------------------
Scope.prototype.set = function(s,x){
	if (s in this.alv){
		return this.alv[s].fSet(x);
	}
	if (this.scopeParent){
		return this.scopeParent.set(s,x);
	}
	D("UNKNOWN VARIABLE ",s);
};
// ---------------------------------------------------------------------------
Scope.prototype.del = function(s){
	if (s in this.alv){
		delete this.alv[s];
		delete this[s];
	}
};

// ---------------------------------------------------------------------------
Scope.prototype.fscopeClone = function(s){
	return new Scope(s, this);
};

// ---------------------------------------------------------------------------
Scope.prototype.expr = function(x,sScope){
	var sScope = sScope || "_";
	var scope = this;
	return eval("var " + sScope + "=scope;(function(){return " + x + "})");
};









// ---------------------------------------------------------------------------
// stub out jQuery
// ---------------------------------------------------------------------------
var $;
var fCreateDom = require("jsdom").env;
var nsFs = require('fs');

fCreateDom(
	"<page />",
	function(err, window){
		$ = require('jquery')(window);
		var html = nsFs.readFileSync("../examples/test-repeat.silk").toString();
		$(html).appendTo("page");

		// get all script definitions?
		var scope = new Scope("global");

		$("script[type=defelt]").each(function(n,e){
			fDefElement(scope,$(e) );
		});

		scope.defvar("_index");
		scope.defvar("_page", ffjqEvalElement(scope, $("page")));

		D($("<div></div>").append(scope.get('_page')).html());


		D("--------------------------------------------");
		D($("<div></div>").append(scope._page).html());

	}
);



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
	each(jq.prop("attributes"), function(aAttr){
		var sAttr = aAttr["name"];
		var sVal = aAttr["value"];
		if (sAttr){
			a[sAttr] = sVal;
		}
	});
	return a;
};

// ---------------------------------------------------------------------------
var ffjqPassthrough = function(scope){
	return function(){
		var jq = $("<" + scope.get('_element') + ">");
		each(scope.get('_attributes'), function(sVal, sVar){
			jq.attr(sVar,scope.get(sVar));
		});
		jq.append(scope.get('_inner'));
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
	var sScope = aAttr["scope"];
	delete aAttr["name"];
	delete aAttr["scope"];
	
	var afClosure = {};
	each(aAttr, function(sVal, sVar){
		// we allow the argument to be an expression
		afClosure[sVar]=scope.expr(sVal);
	});


	sBody = fsUnescape(sBody);

	// using this eval trick gives us a closure over $ 
	var f=eval("(function(" + sScope + "){" + sBody +"})");

	scope.defvar(
		sName,
		function(){
			return function(scopeIn){
				// arguments
				each(afClosure, function(fClosure, sVar){
					scopeIn.defvar(sVar, fClosure);
				});
				return f(scopeIn);
			}
		}
	);
	D("scope",scope);

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

	return function(_){
		var vs=[];

		each(vx,function(x){
			if (typeof(x) === "function"){
				vs.push(x(_));
			}
			else{
				vs.push(x);
			}
		});

		var s=vs.join('');
		return $("<div>").text(s).contents();
	}
};

// ---------------------------------------------------------------------------
var ffjqEvalElement = function(scopeIn,jqScript){
	var sElement = (jqScript.prop('tagName')+"").toLowerCase();
	if (jqScript.length === 0 || sElement === "script"){
		return function(){return $();};
	}

	var _ = scopeIn.fscopeClone(scopeIn.sName + ".1");

	_.defvar("_inner");

	var fjq;

	if (jqScript.get()[0].nodeType === 3){
		fjq = ffjqEvalText(_,jqScript);
	}
	else{
		// evaluate element before its children
		var ffjq = _.get(sElement, ffjqPassthrough);

		fjq = ffjq(_,jqScript);

		var aAttr = faAttributes(jqScript);
		// predeclare the _inner so that the element is bound
		// to the _inner of its own scope
		_.defvar("_element",sElement);
		_.defvar("_attributes",aAttr);
		each(aAttr, function(sVal, sVar){
			_.defvar(sVar, scopeIn.expr(sVal));
		});

	}

	_.defvar("_createInner", function(){
		return function(_2){
			var vf = [];
			each(jqScript.contents().get(),function(e){
				vf.push(ffjqEvalElement(_2, $(e)));
			});

			return function(){
				var jqInner=$();
				each(vf, function(f){
					jqInner = jqInner.add(f(_2).clone());
				});
				return jqInner;
			};
		}
	});


	// quick alias for _._createInner(_);
	_.set("_inner", _.get("_createInner")(_));

	return fjq;

};
