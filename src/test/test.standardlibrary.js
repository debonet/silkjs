var Silk = require("../GlobalSilk");
var nsSilk = require("../nsSilk");
var Scope = require("../Scope");
var assert = require("assert");
var fCreateDom = require("jsdom").env;


var fsNormalizeHtml = function(shtml){
	shtml = shtml.replace(/[ \t\r\n]+/gm,' ');
	shtml = shtml.replace(/^ /gm,'');
	shtml = shtml.replace(/ $/gm,'');
	return shtml;
};

var m = function(f){
	return f.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
};


// -------------------------------------------------------------------------
var fCompareSilkOutput = function(shtml, shtmlDesired){
	var scope = new Scope("test",Silk.scope);
	var jqOut = nsSilk.compile(scope,$(shtml))();
	var shtmlOut = $("<div></div>").append(jqOut).html();

	assert.equal(
		fsNormalizeHtml(shtmlOut),
		fsNormalizeHtml(shtmlDesired)
	);
};


var fBulkCompare = function(vs){
	for (var n=0,c=vs.length; n<c; n+=2){
		fCompareSilkOutput(vs[n],vs[n+1]);
	}
};



describe("standardlibrary", function(){

	before(function(fCallback){
		fCreateDom(
			"<body></body>",
			function(err, window){
				// this needs to be the global.$ because we're simulating
				// the browsers version of window.$
				global.$ = require('jquery')(window);

				Silk.fLoadStandardLibrary(Silk.scope, function(){
					fCallback(null);
				});
			}
		);
	});



	it("should support let", function(){
		fBulkCompare([
			"<let a='5'>{{_.a}}</let>",					
			"5",

			"<let b='3' a='5'>{{_.a}},{{_.b}}</let>",		
			"5,3",

			"<let a='1'>{{_.a}}<let a='2'>{{_.a}}</let>{{_.a}}</let>",		
			"121"
		]);
	});


	it("should support if", function(){
		fBulkCompare([
			"<if test='{{true}}'>yes</if>",
			"yes",

			"<if test='{{false}}'>no</if>",
			"",

			"<if>no</if>",
			"",

			"<if test='false'>yes</if>", // string not variable
			"yes",

			"<if test='{{3+5===2}}'>no</if>",
			"",

			"<if test='{{3+5===8}}'>yes</if>",
			"yes"
		]);
	});


	it("should support repeat", function(){
		fBulkCompare([
			"<repeat times='{{5}}' indexby='a'>{{_.a}},</repeat>",
			"0,1,2,3,4,",

			"<repeat times='{{0}}' indexby='a'>{{_.a}},</repeat>",
			"",

			"<repeat times='{{-1}}' indexby='a'>{{_.a}},</repeat>",
			"",

			"<repeat times='{{3}}' indexby='foo'>{{_.foo}},</repeat>",
			"0,1,2,",


			"<repeat times='{{3}}' indexby='a'>"
				+ "<repeat times='{{_.a + 1}}' indexby='b'>({{_.a}},{{_.b}}), "
				+ "</repeat></repeat>",
			"(0,0), (1,0), (1,1), (2,0), (2,1), (2,2),",

		]);
	});

	it("should support simple defmacros", function(){
		fBulkCompare([
			"<defmacro name='x'>FOO</defmacro>",
			"",

			"<defmacro name='x'>FOO</defmacro>"
				+ "<x></x>",
			"FOO",

			"<defmacro name='x' a='3'>FOO {{_.a}}</defmacro>"
				+ "<x></x>",
			"FOO 3",

			"<defmacro name='x' a='3'>FOO {{_.a}}</defmacro>"
				+ "<x a='bar'></x>",
			"FOO bar"
		]);
	});

	it("should support simple defmacros inners", function(){
		fBulkCompare([
			"<defmacro name='x'>aa{{_._inner}}bb</defmacro>",
			"",

			"<defmacro name='x'>aa{{_._inner}}bb</defmacro>"
				+ "<x></x>",
			"aabb",

			"<defmacro name='x'>aa{{_._inner}}bb</defmacro>"
				+ "<x>THIS GOES HERE</x>",
			"aaTHIS GOES HEREbb",

			"<defmacro name='x'>aa{{_._inner}}bb</defmacro>"
				+ "<x>THIS<a>GOES</a>HERE</x>",
			"aaTHIS<a>GOES</a>HEREbb",


		]);
	});

	it("should support object livevalues", function(){
		fBulkCompare([
			"<let a='{{ {b:1} }}'>{{_.a.b}}</let>",
			"1",

			"<let a='{{ [{b:1},{b:2},{b:3}] }}'>{{_.a[1].b}}</let>",
			"2",



		]);
	});



});
		

