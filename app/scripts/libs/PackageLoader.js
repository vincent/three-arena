var PackageLoader = function() {
  this.cb = Math.random(0, 100000000000);
	this.current = 0;
	this.batches = [];

	// Load kicks off the entire loading process.
	this.load = function(config, loadMap, onload) {
		var scope = this;
		for(label in loadMap) {
			scope.batches.push(new PackageBatch(label, loadMap[label]));
		}
		scope.onload = onload;
		if (config.preloader && config.jQuery) {
			requirejs([
				config.preloader,
				config.jQuery
			], function() {
				PackagePreloader.instance.init(config);
				scope._subLoad();
			});
		} else {
			console.error("PackageLoader.load: First argument (config object) requires 'preloader' and 'jQuery' source path properties, or the function cannot run.");
		}
	};

	// This loads the current (not-yet-loaded) batch of packages.
	this._subLoad = function() {
		PackagePreloader.instance.update();
		var scope = this;
		if (this.current<this.batches.length) {
			this.batches[this.current].require(function() {
				scope.current++;
				scope._subLoad();
			});
		} else {
			PackagePreloader.instance.complete(scope.onload);
		}
	};

	// Returns the current package. The point of this is to be a neat public function.
	this.getCurrentPackage = function() {
		return this.batches[this.current];
	};
};

// This is currently automatically a singleton, until a better method of defining the PackageLoader/PackagePreloader relationship is defined.
PackageLoader.instance = new PackageLoader();

// Handles a single 'batch' of packages.
var PackageBatch = function(label, batch) {
	this.label = label;
	this.batch = batch;

	this.require = function(complete) {
		requirejs(this.batch, complete);
	};
	
};
