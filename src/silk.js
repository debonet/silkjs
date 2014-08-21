"use strict";

var nsSilk = require("./nsSilk.js");
var Scope = require("./Scope");

window.Silk = {

	lv    : undefined,

	scope : new Scope("global"),

	digest : function(){
		nsSilk.fSafeSwapContents($('body'), nsSilk.digest(Silk.scope,'_page'));
	},

	init : function(){
		var jq=$('body').contents();
		Silk.scope.defvar('_page', nsSilk.compile(Silk.scope, jq));
		Silk.digest();
	}
};


$(function(){
	Silk.init();
});


