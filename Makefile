
vivid.js: $(wildcard src/*.js)
	node_modules/browserify/bin/cmd.js src/browservivid.js > web/vivid.js


