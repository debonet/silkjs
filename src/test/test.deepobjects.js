var LiveValue = require("../LiveValue");
var LiveObject = require("../LiveObject");
var assert = require("assert");
var D=require("../fDebugOutput");

describe("deep objects", function(){

	it("should store as LiveObjects", function(){
		var lv = new LiveValue('val',['a','b','c']);
		assert.equal(lv.bDirty,true);
		assert(lv.fxGet() instanceof LiveObject);
	});

	it("should get clean when accessed", function(){
		var lv = new LiveValue('val',['a','b','c']);
		assert.equal(lv.bDirty,true);
		assert.equal(lv.fxGet()[1],'b');
		assert.equal(lv.bDirty,false);
	});

	it("push should adjust length and make dirty", function(){
		var lv = new LiveValue('val',['a','b','c']);
		assert.equal(lv.fxGet().length,3);
		assert.equal(lv.bDirty,false);
		
		lv.fxGet().push('d');

		assert.equal(lv.bDirty,true);
		assert.equal(lv.fxGet().length,4);

		assert.equal(lv.fxGet().__reallength,4);
	});

	it("change when clean should make dirty", function(){
		var lv = new LiveValue('val',['a','b','c']);

		assert.equal(lv.bDirty,true);
		assert.equal(lv.fxGet().__xlv[2].bDirty, true);

		// fetch makes object clean
		assert.equal(lv.fxGet()[2], 'c');
		assert.equal(lv.bDirty,false);

		// make object dirty
		lv.fxGet()[2]='x';

		// verify
		assert.equal(lv.bDirty,true);

	});

	// TODO: consider if this is really the desired behavior
	it("change when dirty should NOT make parent dirty", function(){
		var lv = new LiveValue('val',['a','b','c']);

		assert.equal(lv.bDirty,true);

		// make parent clean
		assert.equal(lv.fxGet()[1], 'b');
		assert.equal(lv.fxGet().__xlv[2].bDirty, true);

		assert.equal(lv.bDirty,false);
		lv.fxGet()[2]='x';

		assert.equal(lv.bDirty,false);

	});

});
		

