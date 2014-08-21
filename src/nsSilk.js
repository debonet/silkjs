"use strict";

var each = require("./each");
var ffBind = require("./ffBind");
var Scope = require("./Scope");

									 
// ---------------------------------------------------------------------------
var D = function(){
	var vxArg = Array.prototype.slice.call(arguments);

	each(vxArg, function(xArg,n){
		if (typeof(xArg) === 'object' && xArg instanceof $){
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


// this tricky bit makes sure we don't remove/detach
// node which we still need. detach and reattach
// loses focus. remove wipes handlers
var fSafeSwapContents = function(jq, jqNewContents){
	jq.append(jqNewContents);

	var veNew = jqNewContents.get();
	var jqOld = jq.contents();
	var veOld = jqOld.get();

	for (var nOld=0, cOld=veOld.length; nOld<cOld; nOld++){
		if (veNew.indexOf(veOld[nOld]) === -1){
			$(veOld[nOld]).remove();
		}
	}
};

// ---------------------------------------------------------------------------
var ffjqPassthrough = function(scope,jq){
	return function(){
		fSafeSwapContents(jq, scope._._inner);
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


var fsf




// ---------------------------------------------------------------------------
var fDefElement = function(scope,jq){
	var sBody = jq.html();

	var aAttr = faAttributes(jq);
	var sName = aAttr["name"];
	delete aAttr["name"];

	
	var afClosure = {};
	each(aAttr, function(sVal, sVar){
		// we allow the argument to be an expression
		afClosure[sVar]=ffxInterpolateString(scope,sVal);//scope.expr(sVal);
	});


	sBody = fsUnescape(sBody);

	var sf=(
		"(function(scope,jq,jqDefinition){\n"
			+ "var defvar     = ffBind(scope, 'defvar');\n"
			+ "var defmutable = ffBind(scope, 'defmutable');\n"
			+ "var delvar     = ffBind(scope, 'delvar');\n"
			+ "var checkvar   = ffBind(scope, 'checkvar');\n"
			+ "var _          = scope._;\n"
			+ sBody  + "\n"
			+"})"
	);

	// using this eval trick gives us a closure over $ 
	var f=eval(sf);


	scope.defvar(
		sName,
		function(){
			return function(scopeIn,jqIn,jq){
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
	var sScopPPe = "scope";
	var sQuery = "jq";
	delete aAttr["name"];
	delete aAttr["scope"];
	delete aAttr["query"];

//	D("DEFINING MACRO " + sName + " IN SCOPE " + scope.sName);
	scope.defvar(sName, function(){
		return function(scopeIn, jqIn){
			return function(){
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
				return compile(scopeIn, jq.contents().clone())();
			};
		};
	});

};

// ---------------------------------------------------------------------------
var reInterpolate = /\{\{([\s\S]*?)\}\}/gm;
var ffxInterpolateString = function(scope,s,bForceJq){
	var aMatch;
	var vx=[];
	var n = 0;
	
	while(aMatch = reInterpolate.exec(s)){
		var c = aMatch[0].length;
		if (aMatch["index"]){
			vx.push(s.slice(n,aMatch["index"]));
		}
		n=aMatch["index"] + c;
		vx.push(scope.expr(aMatch[1]));
	};
	if (n!==c){
		vx.push(s.slice(n));	
	}

	return function(){
		if (vx.length === 1 && !bForceJq){
			var x=vx[0];

			if (typeof(x) === "function"){
				x=x();
			}

			if (x instanceof $){
				// clone because variables can be used many times
				return x.clone();
			}
			else{
				return x;
			}
		}

		var ve=[];
		each(vx,function(x){
			if (typeof(x) === "function"){
				var sf=x.toString();
				x=x();
			}
			if (x instanceof $){
				// clone because variables can be used many times
				ve = ve.concat(x.clone().get());
			}
			else{
				x=x+"";
				x=x.replace(/\\\n/g,"");
				x=x.replace(/\\\t+/g,"");
				// for some reason $.parseHTML does not like ""
				if (x.length){
					ve = ve.concat($.parseHTML(x));
				}
			}
		});

		return $(ve);
	}
};

// ---------------------------------------------------------------------------
var ffjqEvalTextElement = function(scope,jqScript){
	return ffxInterpolateString(scope, jqScript.text(), true);
};


// ---------------------------------------------------------------------------
var ffjqEvalElements = function(scope, jq){

	var scopeInner = new Scope(scope.sName+":INNER");

	each(jq.get(),function(e,n){
		scopeInner.defvar(n,ffjqEvalElement(scope, $(e)));
	});

	var c=jq.length;

	return function(){
    var ve=[];
		for (var n=0; n<c; n++){
      ve = ve.concat(scopeInner.getvar(n).get());
		}
		return $(ve);
	};

};



var compile = ffjqEvalElements;


// ---------------------------------------------------------------------------
var ffjqEvalElement = function(scopeIn,jqScript){
	var nNodeType = jqScript.get()[0].nodeType;
	var sElement  = (jqScript.prop('tagName')+"").toLowerCase();

	if (nNodeType === 8 || jqScript.length === 0){
		return function(){return $();};
	}

	// defelt
	if (
		sElement === "defelt" 
			|| (sElement === "script" && jqScript.attr("type") === "defelt")
	){
		// find defelt
		fDefElement(scopeIn,jqScript);
		return function(){return $();};
	}
 
	// defmacro
	if (sElement === "defmacro"){
		fDefMacro(scopeIn,jqScript);
		return function(){return $();};
	}

	// text
	if (nNodeType === 3){
		return ffjqEvalTextElement(scopeIn, jqScript);
	}

	// elements
	var scope = new Scope(
		scopeIn.sName + "." + sElement + Math.floor(Math.random()*1000),
		scopeIn
	);

	var ffjq = (
		scopeIn.checkvar(sElement)
			? scopeIn.getvar(sElement)
			: ffjqPassthrough
	);

	// predeclare the _inner so that the element is bound
	// to the _inner of its own scope

	scope.defvar("_inner");
	scope.defvar("_createInner");

	var fjq = ffjq(scope,jqScript);

	var aAttr = faAttributes(jqScript);
	scope.defvar("_element",sElement);
	each(aAttr, function(sVal, sVar){
		aAttr[sVar] =  ffxInterpolateString(scopeIn,sVal);
		scope.defvar(sVar, aAttr[sVar]);
	});
	scope.defvar("_attributes",aAttr);

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
		x = scope.getvar(sVar);
		if (!scope.dirtyvar(sVar)){
			break;
		}
		D("iterating..." + n + "/" + cIterations);
	}	
	if (scope.dirtyvar(sVar)){
		console.warn("Reached " + cIterations + " giving up...");
	}

	return x;
};

// ---------------------------------------------------------------------------
nsSilk.compile = ffjqEvalElements;
nsSilk.fSafeSwapContents = fSafeSwapContents;

// ---------------------------------------------------------------------------
nsSilk.fjqSilkify = function(jqIn, scope, cIterations){
	scope = scope || new Scope("global");
	cIterations = cIterations || 10;

	scope.defvar("_page", ffjqEvalElements(scope, jqIn));

	return nsSilk.fjqRefresh(scope, cIterations);
};


module.exports = nsSilk;
