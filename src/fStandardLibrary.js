
module.exports = function(Silk, scope){


	scope.defelt("include", function(){
		return function(scope,jq){
			scope.defvar("sync",false);

			var scopeLoadedFiles = new Silk.Scope();
			return function(){
				var _ = scope._;

				if (!scopeLoadedFiles.checkvar(_.file)){
					scopeLoadedFiles.defvar(_.file, _._inner);

//					console.log("loading",_.file);
					Silk.fGet(_.file, function(err,sData){
						scopeLoadedFiles.defvar(
							_.file, 
							Silk.compile(scope.parent, Silk.parseHTML(sData))()
						);
						Silk.digest();
					});
				}
					
				return scopeLoadedFiles._[_.file];
			};
		};
	});

};

