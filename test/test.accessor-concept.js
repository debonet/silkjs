"use strict";
var D=console.log;
var each=require("./each");

var Scope = function(){
	this._ = {};
	this.a = {};
	Object.freeze(this._);
};
var scope = new Scope();


Scope.prototype.defvar = function(sNew, xNew){
	var scope=this;
	if (sNew in scope.a){
		scope.a[sNew] = xNew;
		return;
	}

	scope.a[sNew] = xNew;

	delete scope._;
	scope._ = {};

	each(scope.a,function(x,s){
		Object.defineProperty(
			scope._,	s, {
				get : function(){D("get",s);return scope.a[s];},
				set : function(x){scope.a[s]=x;},
				configurable: true,
				enumerable: true,
				writeable : false
			}
		);
	});

	Object.freeze(scope._);
};



scope.defvar("a",5);
console.log(scope._);
scope.defvar("b",4);
console.log(scope._);
scope._.b=10;
console.log(scope._.b);

scope.defvar("c");
scope._.c={};
console.log(scope._.c);
scope._.c.a=4;
console.log(scope.a);


scope.defvar("d",new Scope());
console.log(scope.a);
scope._.d.defvar('da');
scope._.d._.da=1;
console.log(scope.a);
