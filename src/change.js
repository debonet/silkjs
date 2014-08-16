var nsUtil = require("util");
var D=console.log;
var each = require("./each");
var Scope = require("./Scope");


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
		var html = nsFs.readFileSync("test-foreach.silk").toString();;
		$(html).appendTo("page");

		// get all script definitions?
		var scope = new Scope("global");

		$("script[type=defelt]").each(function(n,e){
			fDefElement(scope,$(e) );
		});

		scope.defvar("x",[1,2,3]);
		scope.defvar("_page", ffjqEvalElement(scope, $("page")));

		D($("<div></div>").append(scope._page).html());

		D("--------------------------------------------");
//		scope.times = 5;
		scope.set("x",[1,4,3]);
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
		var jq = $("<" + scope._element + ">");
		each(scope._attributes, function(sVal, sVar){
			jq.attr(sVar,scope.alv[sVar].fxGet());
		});
		jq.append(scope._inner);
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
	var sScope = aAttr["scope"] || "_";
	var sQuery = aAttr["query"] || "jq";
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
	var f=eval("(function(" + sScope + "," + sQuery + "){" + sBody +"})");
//	var f = new Function(sScope, sBody);

	scope.defvar(
		sName,
		function(){
			return function(scopeIn){
				// arguments
				each(afClosure, function(fClosure, sVar){
//					if (!(sVar in scope.alv)){
						scopeIn.defvar(sVar, fClosure);
//					}
				});
				return f(scopeIn);
			}
		}
	);
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
	var nNodeType = jqScript.get()[0].nodeType;
	var sElement  = (jqScript.prop('tagName')+"").toLowerCase();
	if (nNodeType === 8 || jqScript.length === 0 || sElement === "script"){
		return function(){return $();};
	}

	var _ = scopeIn.fscopeClone(scopeIn.sName + ".1");
	_.defvar("_inner");

	var fjq;

	if (nNodeType === 3){
		fjq = ffjqEvalText(_,jqScript);
	}
	else{
		// evaluate element before its children
		var ffjq = (
			(sElement in _.alv)
				? _.alv[sElement].fxGet()
				: ffjqPassthrough
		);
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

	_.defvar('_createInner', function(){
		return function(_){
			var vf = [];
			each(jqScript.contents().get(),function(e){
				vf.push(ffjqEvalElement(_, $(e)));
			});

			return function(){
				var jqInner=$();
				each(vf, function(f){
					jqInner = jqInner.add(f(_).clone());
				});
				return jqInner;
			};
		}
	});


	// quick alias for _._createInner(_);
	_._inner = _._createInner(_);

	return fjq;

};
