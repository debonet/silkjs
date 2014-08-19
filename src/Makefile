
index.js: $(filter-out index.js, $(wildcard *.js))
	../node_modules/browserify/bin/cmd.js silk.js > index.js

test:
	mocha -C -R tap

.PHONY: test