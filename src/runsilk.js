var nsSilk = require("./nsSilk.js");

// ---------------------------------------------------------------------------
// stub out jQuery
// ---------------------------------------------------------------------------
var fCreateDom = require("jsdom").env;
var nsFs = require('fs');
var nsProcess = process;
var nsSilk = require("./nsSilk.js");
var Scope = require("./Scope");

var sfl = nsProcess.argv[2] || "../examples/test-repeat.silk";
var shtml = nsFs.readFileSync(sfl).toString();


fCreateDom(
	"<page></page>",
	function(err, window){
		$ = require('jquery')(window);
		$('page').append($.parseHTML(shtml));

		var scope = new Scope("global");
		scope.defvar('_page', nsSilk.compile(scope, $('page')));
		var jq = scope.getvar("_page");

		console.log(jq.html().replace(/^[\n\s]*$/gmi,''));
	}
);

