var nsVivid = require("./nsVivid.js");
var Scope = require("./Scope");
var GlobalVivid={};

// --------------------------------------------------------------------
GlobalVivid.scope = new Scope("global");

// --------------------------------------------------------------------
var cIteration = 0;
var timeoutDraw;
var ffOnDirty = function(fCallback){

	return function(){
		if (!timeoutDraw){
			cIteration ++;
			if (cIteration >= 10){
				return fCallback("TOO MANY ITERATIONS");
			}

			timeoutDraw = setTimeout(function(){
				timeoutDraw = undefined;
				var jq = Vivid.scope._._inner;
				if (Vivid.scope.loVariables.fbIsDirty("_inner")){
					return;
				}

				Vivid.scope.loVariables.fCheckHonesty();

				cIteration = 0;
				fCallback(null, jq);
			}, 1);

		}
	};
};

// --------------------------------------------------------------------
GlobalVivid.fLoadStandardLibrary = function(scope,fCallback){
	var fStandardLibrary = require("./fStandardLibrary");
	fStandardLibrary(scope);

	// TODO: we should compile stdlib.vivid into a big comment at the end of this
	// file so that we don't have to have an extra network lookup in a real
	// deployemnt
	GlobalVivid.fGet('standardlibrary.vivid', function(err,sData){
		nsVivid.compile(scope,GlobalVivid.parseHTML(sData))();
		fCallback(null);
	});
};


// --------------------------------------------------------------------
GlobalVivid.init = function(fRender, bSkipStdLib){
	var jq=$('body').contents();

	this.scope.defvar('_inner',undefined,ffOnDirty(fRender));
	// force _inner to be clean
	this.scope.getvar('_inner');

	if (bSkipStdLib){
		GlobalVivid.scope.setvar('_inner', nsVivid.compile(GlobalVivid.scope, jq));
	}
	else{
		this.fLoadStandardLibrary(this.scope, function(err){
			GlobalVivid.scope.setvar('_inner', nsVivid.compile(GlobalVivid.scope, jq));
			// no need to callback. _inner will take care of it.
		});
	}
};

// --------------------------------------------------------------------
GlobalVivid.fGet = (
	typeof window !== 'undefined' 
		?  function(sUrl, fCallback){
			$.ajax({
				url: sUrl,
				error: function(err){
					fCallback(err);
				},
				success: function(sData, sStatus){
					fCallback(null,sData);
				}
			});
		}
	:  function(sUrl, fCallback){
		var nsFs = require("fs");
		nsFs.readFile(sUrl, function(err,buff){
			if (err){return fCallback(err);}
			fCallback(null, buff.toString());
		});
	}
);


// --------------------------------------------------------------------
GlobalVivid.affjqModules = {};
GlobalVivid.fDefineModule = function(s,ffjq){
	GlobalVivid.affjqModules[s] = ffjq;
};

GlobalVivid.ffjqModule = function(s){
	return GlobalVivid.affjqModules[s];
};



// --------------------------------------------------------------------
GlobalVivid.cleanHTML = function(shtml){
	shtml = shtml.replace(/<defelt/g,"<script type='defelt'");
  shtml = shtml.replace(/<\/defelt>/g,"</script>");
	
	shtml = shtml.replace(/<defun/g,"<script type='defun'");
  shtml = shtml.replace(/<\/defun>/g,"</script>");
	
	shtml = shtml.replace(/<defattr/g,"<script type='defattr'");
  shtml = shtml.replace(/<\/defattr>/g,"</script>");

	return shtml;
};

// --------------------------------------------------------------------
GlobalVivid.parseHTML = function(shtml){
	return $($.parseHTML(this.cleanHTML(shtml)));
};

// --------------------------------------------------------------------
GlobalVivid.setContents = nsVivid.fSafeSwapContents;
GlobalVivid.compile = nsVivid.compile;
GlobalVivid.expression = nsVivid.ffxLiveExpression;
GlobalVivid.Scope = Scope;


module.exports = GlobalVivid;

