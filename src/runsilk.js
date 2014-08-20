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
	"<page />",
	function(err, window){
		$ = require('jquery')(window);

		shtml = shtml.replace(/<defelt/g,"<script type='defelt'");
		shtml = shtml.replace(/<\/defelt>/g,"</script>");

		$("<!-- -->" + shtml+"<!-- -->").appendTo("page");

		var scope = new Scope("global");
		scope.defvar('_page', nsSilk.compile(scope, $('body')));
		var jq = scope.get("_page");

		console.log(jq.html().replace(/^[\n\s]*$/gmi,''));
	}
);

