var each = require("./each");
var LiveValue = require("./LiveValue");

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
var Scope = function(s){
	this.sName = s;
	this.alv = {};
};

// ---------------------------------------------------------------------------
Scope.prototype.defvar = function(s,x){
//	D("DEF",s,x);
	var scope = this;
	if (!Object.getOwnPropertyDescriptor(this,s)){
		Object.defineProperty(
			this,	s, {
				get: function() {return scope.get(s);},
				set: function(x){return scope.set(s,x);},
				configurable: true
			}
		);
	}

	this.alv[s] = new LiveValue(this.sName + ":" + s,x);
};

// ---------------------------------------------------------------------------
Scope.prototype.get = function(s){
	if (s in this.alv){
		return this.alv[s].fxGet();
	}
	D("UNKNOWN VARIABLE ",s);
};
// ---------------------------------------------------------------------------
Scope.prototype.set = function(s,x){
	if (s in this.alv){
		return this.alv[s].fSet(x);
	}
	D("UNKNOWN VARIABLE ",s);
};
// ---------------------------------------------------------------------------
Scope.prototype.del = function(s){
	if (s in this.alv){
		delete this[s];
	}
};

// ---------------------------------------------------------------------------
Scope.prototype.fscopeClone = function(s){
	var scope = new Scope(s);

	each(this.alv, function(lv, slv){
		scope.alv[slv]=lv;

		Object.defineProperty(
			scope,	slv, {
				get: function() {return scope.get(slv);},
				set: function(x){return scope.set(slv,x);},
				configurable: true
			}
		);
	});

	return scope;
};

// ---------------------------------------------------------------------------
Scope.prototype.expr = function(x,sScope){
	var sScope = sScope || "_";
	var scope = this;
	return eval("var " + sScope + "=scope;(function(){return " + x + "})");
};


module.exports = Scope;


/*

var f1=function(_){
	_.defvar("b", _.expr("_.a * 2"));

	return function(){
		return "<f1 varb='" + _.b + "'>" + _._inner + "</f1>";
	};
};

var n=1;
var f2=function(_){
	_.defvar("c", _.expr("_.b * 2"));

	return function(){
		return "<div width='" + _.c + "'>" + _._inner + "</div>\n";
	};
};


var fEvalIt = function(scopeIn,a){
	var _ = scopeIn.fscopeClone(scopeIn.sName + ".1");

	// predeclare the _inner so that the element is bound
	// to the _inner of its own scope
	_.defvar("_inner");

	// evaluate element before its children
	var x = a.f(_);

	// if it has children
	if (a.va){
		// evaluate the child fuctions
		var vf = a.va.map(function(aSub){
			return fEvalIt(_,aSub);
		});

		// reset the inner value to the new function
		_._inner = function(){
			var s="";
			each(vf, function(f){
				s+=f();
			});
			return s;
		};
	}
	return x;

};

var _ = new Scope("global");
_.defvar("a",5);
_.defvar("_outer",fEvalIt(_,{f:f1,va:[{f:f2},{f:f1, va:[{f:f2}]}]}));
//_.defvar("_outer",fEvalIt(_,{f:f1}));
D(_._outer);
*/




