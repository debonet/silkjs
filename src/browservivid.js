"use strict";

window.Vivid = require("./GlobalVivid");
var nsVivid = require('./nsVivid');

var bVividInitialized = false;

$(function(){
	Vivid.init(function(err, jq){
		if (err){
			jq=$();
			console.error(err);
		}
		Vivid.setContents($('body'), jq);
		if (!bVividInitialized){
			$('body').css('visibility','visible');
			bVividInitialized = true;
		}
	});

});


