var LiveValue = require("../LiveValue");
var LiveObject = require("../LiveObject");
var assert = require("assert");
var D=require("../fDebugOutput");

describe("deep objects", function(){

	it("should work", function(){
		var lv = new LiveValue('val',['a','b','c']);
/*
		assert.equal(lv.bDirty,true);

		assert(lv.fxGet() instanceof LiveObject);
		assert.equal(lv.fxGet()[1],'b');
		assert.equal(lv.bDirty,false);

		assert.equal(lv.fxGet().length,3);
		
		lv.fxGet().push('d');

		assert.equal(lv.bDirty,true);

		assert.equal(lv.fxGet().length,4);
		assert.equal(lv.bDirty,false);
*/

		assert.equal(lv.bDirty,true);
		assert.equal(lv.fxGet().xlv[2].bDirty, true);
		D("2L",lv.fxGet()[2]);
		assert.equal(lv.bDirty,false);
		assert.equal(lv.fxGet().xlv[2].bDirty, false);
		D("2L",lv.fxGet().xlv[2].sName,lv.fxGet().xlv[2].bDirty);

		D("--------_");
		lv.fxGet()[2]='x';
		assert.equal(lv.bDirty,true);

	});

});
		

