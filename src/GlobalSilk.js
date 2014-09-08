var nsSilk = require("./nsSilk.js");
var Scope = require("./Scope");
var GlobalSilk={};

// --------------------------------------------------------------------
GlobalSilk.scope = new Scope("global");

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
				var jq = Silk.scope._._inner;
				if (Silk.scope.loVariables.fbIsDirty("_inner")){
					return;
				}

				Silk.scope.loVariables.fCheckHonesty();

				cIteration = 0;
				fCallback(null, jq);
			}, 1);

		}
	};
};

// --------------------------------------------------------------------
GlobalSilk.fLoadStandardLibrary = function(scope,fCallback){
	var fStandardLibrary = require("./fStandardLibrary");
	fStandardLibrary(scope);

	// TODO: we should compile stdlib.silk into a big comment at the end of this
	// file so that we don't have to have an extra network lookup in a real
	// deployemnt
	GlobalSilk.fGet('standardlibrary.silk', function(err,sData){
		nsSilk.compile(scope,GlobalSilk.parseHTML(sData))();
		fCallback(null);
	});
};


// --------------------------------------------------------------------
GlobalSilk.init = function(fRender, bSkipStdLib){
	var jq=$('body').contents();

	this.scope.defvar('_inner',undefined,ffOnDirty(fRender));
	// force _inner to be clean
	this.scope.getvar('_inner');

	if (bSkipStdLib){
		GlobalSilk.scope.setvar('_inner', nsSilk.compile(GlobalSilk.scope, jq));
	}
	else{
		this.fLoadStandardLibrary(this.scope, function(err){
			GlobalSilk.scope.setvar('_inner', nsSilk.compile(GlobalSilk.scope, jq));
			// no need to callback. _inner will take care of it.
		});
	}
};

// --------------------------------------------------------------------
GlobalSilk.fGet = (
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
GlobalSilk.affjqModules = {};
GlobalSilk.fDefineModule = function(s,ffjq){
	GlobalSilk.affjqModules[s] = ffjq;
};

GlobalSilk.ffjqModule = function(s){
	return GlobalSilk.affjqModules[s];
};



// --------------------------------------------------------------------
GlobalSilk.cleanHTML = function(shtml){
	shtml = shtml.replace(/<defelt/g,"<script type='defelt'");
  shtml = shtml.replace(/<\/defelt>/g,"</script>");
	
	shtml = shtml.replace(/<defun/g,"<script type='defun'");
  shtml = shtml.replace(/<\/defun>/g,"</script>");
	
	shtml = shtml.replace(/<defattr/g,"<script type='defattr'");
  shtml = shtml.replace(/<\/defattr>/g,"</script>");

	return shtml;
};

// --------------------------------------------------------------------
GlobalSilk.parseHTML = function(shtml){
	return $($.parseHTML(this.cleanHTML(shtml)));
};

// --------------------------------------------------------------------
GlobalSilk.setContents = nsSilk.fSafeSwapContents;
GlobalSilk.compile = nsSilk.compile;
GlobalSilk.expression = nsSilk.ffxLiveExpression;
GlobalSilk.Scope = Scope;


module.exports = GlobalSilk;

