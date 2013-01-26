
var Table = Widget.extend({
	init: function (opts) {
		opts = opts || {};

		//set the widget for rows
		this.rowWidget = opts.rowWidget || Row;

		Widget.call(this, opts);

		for (var key in opts)
			this[key] = opts[key];

		//fill the data
		if (opts.data)
			this.fill(opts.data)
	},

	template: [
		{tag: "table", id: "table"}
	],

	rows: [],

	fill: function (data) {
		for (var i = 0; i < data.length; ++i) {
			
			this.rows[i] = new this.rowWidget(merge(data[i], {
				parent: this
			}));

			this.table.appendChild(this.rows[i].el);
		}

		this.render();
	}
});