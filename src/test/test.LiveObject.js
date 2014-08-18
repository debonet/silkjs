"use strict";

var LiveValue = require("../LiveValue");

var LiveObject = require("../LiveObject");

var assert = require("assert");

describe("LiveObject", function(){

/*
	it("should allow defvar values", function(){
		var lo = new LiveObject();
		lo.defvar("a",5);
		assert.equal(lo._.a,5);
	});


	it("should not allow setting without defvar", function(){
		var lo = new LiveObject();
		assert.throws(function(){
			lo._.a=5;
		});
	});

*/

	it("should allow setting after defvar", function(){
		var lo = new LiveObject();
		lo.defvar("a",5);
		assert.doesNotThrow(function(){ lo._.a=7; });
		assert.equal(lo._.a,7);
		console.log(Object.isFrozen(lo._));
		assert.throws(function(){ lo._.b=5; });
		console.log(lo._.b);

	});


	it("should allow setting after defvar", function(){
		var lo = new LiveObject();
		assert.equal(lo._.b,undefined);
		assert.throws(function(){ lo._.b=4;	});
		assert.equal(lo._.b,undefined);
		lo.defvar("b",5);
		assert.equal(lo._.b,5);
		assert.doesNotThrow(function(){ lo._.b=6;	});
		assert.equal(lo._.b,6);
	});

	it("expr should work", function(){
		var lo = new LiveObject();
		lo.defvar("a",5);
		lo.defvar("b",lo.expr("lo._.a+2"));
		assert.equal(lo._.b,7);
		lo._.a = 3;
		assert.equal(lo._.b,5);

	});

	it("mutable values should work", function(){
		var lo = new LiveObject();
		lo.defmutable("a",5);
		lo.defvar("b",lo.expr("lo._.a+2"));
		assert.equal(lo._.b,7);
		lo._.a = 3;
		assert.equal(lo._.b,7);

	});


});

		


describe("LiveObject Scoping", function(){
	it("should do simple scoping", function(){
		var lo = new LiveObject("scope1");
		lo.defvar("a",1);
		assert.equal(lo._.a,1);

		var lo2 = lo.clone("scope2");
		assert.equal(lo2._.a,1);
		assert.equal(lo._.a,1);

		lo2.defvar("a",2);
		assert.equal(lo2._.a,2);
		assert.equal(lo._.a,1);

		lo2.defvar("b",3);
		assert.equal(lo2._.b,3);
		assert.equal(lo._.b,undefined);


		lo2.delvar("a");
		assert.equal(lo2._.a,1);


		lo.defvar("c",20);
		assert.equal(lo2._.c,20);
		assert.equal(lo2.get('c'),20);
		
	});
});
