var PackagePreloader = function() {
  this.el = document.createElement('div');
	this.jqBar;

	// Initially called with PackageLoader config.
	this.init = function(config) {
		if (config.domParent) {
			$(this.el).appendTo(config.domParent);
			this.jqBar = $('<div>')
				.css('width',0)
				.addClass("progressbar-progress")
			;

			this.$loadList = $('<ul>').addClass('package-listing').css('width', '600px').css('margin', '0 auto').html("Loading...");
			$(this.el).append(
				$('<div>').append(
					$('<div>')
					.css('background-color', 'transparent')
					.append(this.jqBar)
					.addClass("progressbar-inner")
				).addClass("progressbar")
			).append(this.$loadList);
		} else {
			console.error("PackagePreloader.init: Config object requires 'domParent' property. This property must contain the parent dom object to which the progress bar will be attached. Otherwise the function cannot run.");
		}
	};

	// Returns the fraction current progress.
	this.interpretCurrent = function() {
		return PackageLoader.instance.current/PackageLoader.instance.batches.length;
	};

	// Called each time a batch is loaded and the current batch to be loaded is updated.
	this.update = function() {
		this.jqBar.css('width', (this.interpretCurrent()*100)+'%');
		var pkg = PackageLoader.instance.getCurrentPackage();
		if (pkg) {
			this.$loadList.append($('<li>').html("Loaded "+pkg.label));
		}
	};

	// Fades out when done.
	this.complete = function(onFadeOut) {
		$(this.el).fadeOut({complete:onFadeOut});
	};
};
PackagePreloader.instance = new PackagePreloader();