"use strict";

window.Silk = require("./GlobalSilk");
var nsSilk = require('./nsSilk');

var bSilkInitialized = false;

$(function(){
	Silk.init(function(err, jq){
		if (err){
			jq=$();
			console.error(err);
		}
		Silk.setContents($('body'), jq);
		if (!bSilkInitialized){
			$('body').css('visibility','visible');
			bSilkInitialized = true;
		}
	});

});


