var InputView = Vertebrae.View.extend({
	template: [
		{tag: "label", children: [
			{tag: "span", id: "label", className: "label-text"},
			{tag: "input", id: "input"}
		]}
	],

	defaults: {
		type: "text",
		label: "",
		value: null
	},

	events: {
		"change input": "_change"
	},

	_change: function () {
		this.model.value = this.input.value;
	},

	render: function () {
		this.input.setAttribute("type", this.model.type);
		this.label.innerText = this.model.label;
	}
});

var SelectView = Vertebrae.View.extend({
	template: [
		{tag: "label", children: [
			{tag: "span", id: "label"},
			{tag: "select", id: "select"}
		]}
	],

	defaults: {
		selected: 0,
		label: ""
	},

	init: function (opts) {
		this.super("init", arguments);
		this.options = opts.options;
	},

	events: {
		"change select": "_change"
	},

	_change: function () {
		this.model.selected = this.select.value;
	},

	render: function () {
		var options = this.options;
		for (var i = 0; i < options.length; ++i) {
			Vertebrae.View.toDOM({
				tag: "option",
				text: options[i].label,
				value: options[i].value
			}, this.select);
		}

		this.label.innerText = this.model.label;
		this.select.value = this.model.selected;
	}
});