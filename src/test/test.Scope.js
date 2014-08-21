"use strict";


var Scope = require("../Scope");

var assert = require("assert");

describe("Scope", function(){


	it("should alscopew defvar values", function(){
		var scope = new Scope();
		scope.defvar("a",5);
		assert.equal(scope._.a,5);
	});


	it("should not alscopew setting without defvar", function(){
		var scope = new Scope();
		assert.throws(function(){
			scope._.a=5;
		});
	});




	it("should alscopew setting after defvar", function(){
		var scope = new Scope();
		scope.defvar("a",5);
		assert.doesNotThrow(function(){ scope._.a=7; });
		assert.equal(scope._.a,7);
		assert.throws(function(){ scope._.b=5; });
	});


	it("should alscopew setting after defvar", function(){
		var scope = new Scope();
		assert.equal(scope._.b,undefined);
		assert.throws(function(){ scope._.b=4;	});
		assert.equal(scope._.b,undefined);
		scope.defvar("b",5);
		assert.equal(scope._.b,5);
		assert.doesNotThrow(function(){ scope._.b=6;	});
		assert.equal(scope._.b,6);
	});


	it("expr should work", function(){
		var scope = new Scope("testexpr");
		scope.defvar("a",5);
		scope.defvar("b",scope.expr("_.a+2"));
		assert.equal(scope._.b,7);
		scope._.a = 2;
		assert.equal(scope._.b,4);

	});

	it("mutable values should work", function(){
		var scope = new Scope("yesper");
		scope.defmutable("a",5);

		scope.defvar("b",scope.expr("_.a+2"));
		assert.equal(scope._.b,7);
		scope._.a = 2;
		assert.equal(scope._.b,7);

	});

});

describe("Scope Scoping", function(){
	it("should do simple scoping", function(){
		var scope = new Scope("scope1");
		scope.defvar("a",1);
		assert.equal(scope._.a,1);

		var scope2 = new Scope("scope2", scope);
		assert.equal(scope2._.a,1);
		assert.equal(scope._.a,1);

		scope2.defvar("a",2);
		assert.equal(scope2._.a,2);
		assert.equal(scope._.a,1);

		scope2.defvar("b",3);
		assert.equal(scope2._.b,3);
		assert.equal(scope._.b,undefined);


		scope2.delvar("a");
		assert.equal(scope2._.a,1);


		scope.defvar("c",20);
		assert.equal(scope2._.c,20);
		assert.equal(scope2.getvar('c'),20);
		
	});
});
