"use strict";

var each = require("./each");
var ffBind = require("./ffBind");
var Scope = require("./Scope");
var nsUtil = require("util");
									 
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
		if (sAttr && typeof(sAttr) === "string"){
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
		each(scope._._attributes, function(sVar){
			var sVal = scope._[sVar];
			if (sVal instanceof $){
				sVal = sVal.text();
			}
			jq.attr(sVar, sVal);
		});
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
		+ "var defvar     = ffBind(scope, 'defvar');\n"
		+ "var defmutable = ffBind(scope, 'defmutable');\n"
		+ "var delvar     = ffBind(scope, 'delvar');\n"
		+ "var checkvar   = ffBind(scope, 'checkvar');\n"
		+ "var _          = scope._;\n"
);

// ---------------------------------------------------------------------------
var fDefCode = function(scope,jq, sfDefine){
	var sBody = jq.html();

	var aAttr = faAttributes(jq);
	var sName = aAttr["name"];
	delete aAttr["name"];

	//D("DEFINING",scope.sName,sfDefine,sName);

	var afClosure = {};
	each(aAttr, function(sVal, sVar){
		// we allow the argument to be an expression
		afClosure[sVar]=ffxInterpolateString(scope,sVal);
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
		D("\nERROR: syntax error in " + sfDefine + " " + sName);
		throw(e);
	}

	scope[sfDefine](
		sName,
		function(){
			return function(scopeIn,jqIn,jq){
				// arguments
				each(afClosure, function(fClosure, sVar){
					if (!scopeIn.localvar(sVar)){
						scopeIn.defvar(sVar, fClosure);
					}
				});
				return f(scopeIn,jqIn);
			}
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
	scope.defelt(sName, function(){
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
				return nsSilk.compile(scopeIn, jq.contents().clone())();
			};
		};
	});
};


// ---------------------------------------------------------------------------
var fLiveExpression = function(scope, x){

	x=x.replace(/[\r\n]/g,' ');

	return eval(
		""
			+ "(function(){\n"
			+ "  var _ = scope._;\n"
			+ "  try{\n"
			+ "    return " + x + ";\n"
			+ "  } catch(e){\n"
			+ "    return '';\n"
			+ "  } "
			+ "})"
	);
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
		vx.push(fLiveExpression(scope,aMatch[1]));
	};

	if (n!==s.length){
		vx.push(s.substr(n));	
	}


	if (vx.length === 1 && !bForceJq){
		var x=vx[0];

		return function(){
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
		};
	};

	return function(){
		var ve=[];
		each(vx,function(x){
			if (typeof(x) === "function"){
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

var LiveValue = require("./LiveValue");
// ---------------------------------------------------------------------------
var ffjqEvalElements = function(scope, jq){

	var scopeInner = new Scope(scope.sName+":INNER" + Math.floor(Math.random()*1000));

	each(jq.get(),function(e,n){
		scopeInner.defvar(n,ffjqEvalElement(scope, $(e)));
	});

	var c=jq.length;

	var fOut = function(){
    var ve=[];
		for (var n=0; n<c; n++){
      ve = ve.concat(scopeInner.getvar(n).get());
		}
		return $(ve);
	};


	fOut.fRecompile = function(){
		return ffjqEvalElements(scope, jq);
	};

	return fOut;
};


var afHandlerForElement = {
	"defelt"   : fDefElement,
	"defattr"  : fDefAttribute,
	"defmacro" : fDefMacro,
	"defun"    : fDefUserFunction,
	"run"      : fDoInScope
};

// ---------------------------------------------------------------------------
var ffjqEvalElement = function(scopeIn,jqScript){
	var nNodeType = jqScript.get()[0].nodeType;
	var sElement  = (jqScript.prop('tagName')+"").toLowerCase();

	// comments and empty
	if (nNodeType === 8 || jqScript.length === 0){
		return function(){return $();};
	}

	// text
	if (nNodeType === 3){
		return ffjqEvalTextElement(scopeIn, jqScript);
	}

	// handle scripts or remap them
	if (sElement === "script"){
		var sType = jqScript.attr("type");
		if (sType in afHandlerForElement){
			sElement = sType;
		}
		else{
			return function(){return jqScript;};
		}
	}
	
	// check if it has a special handler
	var fHandler = afHandlerForElement[sElement];
	if (fHandler){
		fHandler(scopeIn,jqScript);
		return function(){return $();};
	}

	// elements
	var scope = new Scope(
		scopeIn.sName + "." + sElement, // + Math.floor(Math.random()*1000),
		scopeIn
	);

	var bKnownElement = scopeIn.checkelt(sElement);

	var ffjq = (bKnownElement ? scopeIn.getelt(sElement) : ffjqPassthrough);

	// predeclare the _inner so that the element is bound
	// to the _inner of its own scope
	scope.defvar("_inner");

	var fjq  = ffjq(scope, jqScript);

	var aAttr = faAttributes(jqScript);
	scope.defvar("_element",sElement);
	each(aAttr, function(sVal, sVar){
		scope.defvar(sVar, ffxInterpolateString(scopeIn,sVal));
	});
	scope.defvar("_attributes",Object.keys(aAttr));

	var vfjqChange = [];
	each(aAttr, function(sVal, sVar){
		if (scopeIn.checkattr(sVar)){
			vfjqChange.push(scopeIn.getattr(sVar)(scope,jqScript));
		}
	});

	scope._._inner = ffjqEvalElements(scope, jqScript.contents());

	return function(){
		var jq=fjq();
		each(vfjqChange, function(fjqChange){
			jq = fjqChange(jq);
		});
		return jq;
	};
};




var nsSilk = {};

// ---------------------------------------------------------------------------
nsSilk.compile = ffjqEvalElements;
nsSilk.fSafeSwapContents = fSafeSwapContents;
nsSilk.fLiveExpression = fLiveExpression;

module.exports = nsSilk;
