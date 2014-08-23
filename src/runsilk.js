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
//		$('page').append($.parseHTML(shtml));

		shtml = shtml.replace(/<defelt/g,"<script type='defelt'");
    shtml = shtml.replace(/<\/defelt>/g,"</script>");
 
		shtml = shtml.replace(/<defun/g,"<script type='defun'");
    shtml = shtml.replace(/<\/defun>/g,"</script>");
 
		shtml = shtml.replace(/<defattr/g,"<script type='defattr'");
    shtml = shtml.replace(/<\/defattr>/g,"</script>");
 
    $("<!-- -->" + shtml+"<!-- -->").appendTo("page");


		var scope = new Scope("global");
		scope.defvar('_page', nsSilk.compile(scope, $('page')));
//		var jq = scope.getvar("_page");
		var jq = nsSilk.digest(scope,"_page");

		console.log(jq.html().replace(/^[\n\s]*$/gmi,''));
	}
);

