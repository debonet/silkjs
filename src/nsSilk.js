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

	var eParent = jq.get(0);
	var veNew = jqNew.get();
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
		var f = nsSilk.compile(scopeIn, jq.contents().clone(true));
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
	return Silk.parseHTML(""+s);
};

var reInterpolate = /\{\{([\s\S]*?)\}\}/gm;
var ffxInterpolateString = function(scope,s,bForceJq){
		
	if (s.indexOf("{{")===-1){
		return bForceJq?fjqText(s):s;
	}


	var lo = new LiveObject(
		scope.sName+":TEXTINNER" + Math.floor(Math.random()*1000), true
	);

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

	var lo = new LiveObject(
		scope.sName+":INNER" + Math.floor(Math.random()*1000), true
	);

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
					D("NOT JQ",c,jqInner);
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
	var scope = new Scope(
		scopeIn.sName + "." + sElement + Math.floor(Math.random()*1000),
		scopeIn
	);

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




var nsSilk = {};

// ---------------------------------------------------------------------------
nsSilk.compile = ffjqCompileElements;
nsSilk.fSafeSwapContents = fSafeSwapContents;
nsSilk.ffxLiveExpression = ffxLiveExpression;

module.exports = nsSilk;
