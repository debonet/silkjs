var nsSilk = require("./nsSilk.js");

// ---------------------------------------------------------------------------
// stub out jQuery
// ---------------------------------------------------------------------------
var fCreateDom = require("jsdom").env;
var nsFs = require('fs');
var nsProcess = process;
var nsSilk = require("./nsSilk.js");
var Scope = require("./LiveObject");

var sfl = nsProcess.argv[2] || "../examples/test-repeat.silk";
var shtml = nsFs.readFileSync(sfl).toString();


fCreateDom(
	shtml,
	function(err, window){
		$ = require('jquery')(window);

		var scope = new Scope("global");
		scope.defvar('_page', nsSilk.compile(scope, $('body')));
		var jq = scope.get("_page");

		console.log(jq.html().replace(/^[\n\s]*$/gmi,''));
	}
);

