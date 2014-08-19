"use strict";

var nsSilk = require("./nsSilk.js");
var Scope = require("./LiveObject");

window.Silk = {

	lv    : undefined,

	scope : new Scope("global"),

	digest : function(){
		$('body').replaceWith(nsSilk.digest(Silk.scope,'_page'));
	},

	init : function(){
		Silk.scope.defvar('_page', nsSilk.compile(Silk.scope, $('body')));
		Silk.digest();
	}
};


$(function(){
	//	console.log($("<div></div>").append($('body').clone()).html());
	Silk.init();
});


