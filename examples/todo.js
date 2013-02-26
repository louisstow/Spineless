var ENTER_KEY = 13;

//main view
TodoView = Spineless.View.extend({
	init: function (opts) {
		TodoView.super(this, 'init', arguments);

		//serialize the model to localStorage
		this.on("child:* change", function () {
			opts.storage.todo = this.serialize();
		});
	},

	template: "todoapp",

	events: {
		'keyup new-todo': 'addTask',
		'click toggle-all': 'toggleAll',
		'click clear-completed': 'clearCompleted'
	},

	routes: {
		'/': 'handleRoute',
		'/completed': 'handleRoute',
		'/active': 'handleRoute',
	},

	addTask: function (e) {
		//on ENTER key save the task
		if (e.which !== ENTER_KEY)
			return;

		if (this['new-todo'].value.trim() === "")
			return;

		this.addChild(new ItemView({
			text: this['new-todo'].value,
			superview: this['todo-list']
		}));

		this['new-todo'].value = ""; //clear textbox
	},

	handleRoute: function (route) {
		var link = route.substr(1) || "all";
		this.filter(link);
	},

	filter: function (type) {
		this.model.filter = type;

		//reset the selected class
		this.all.className = this.active.className = this.completed.className = "";
		this[type].className = "selected";
	},

	//if all completed, mark all as uncomplete
	//if none completed, mark all as complete
	//else mark all as complete
	toggleAll: function () {
		var markAsUncomplete = true;

		for (var i = 0; i < this.children.length; ++i) {
			if (!this.children[i].model.done) {
				markAsUncomplete = false;
				break;
			}
		}

		for (var i = 0; i < this.children.length; ++i) {
			this.children[i].set('done', !markAsUncomplete);
		}
	},

	clearCompleted: function () {
		for (var i = 0; i < this.children.length; ++i) {
			if (this.children[i].model.done)
				this.removeChild(this.children[i]);
		}
	},

	//TODO: can this be automagic?
	unserialize: function (blob) {
		var data = JSON.parse(blob);
		if (!data.children) return;
		for (var i = 0; i < data.children.length; ++i) {
			this.addChild(new ItemView({
				text: data.children[i].text,
				done: data.children[i].done,
				superview: this['todo-list']
			}));
		}
	},

	render: function () {
		TodoView.super(this, "render");

		var left = 0;
		var completed = 0;

		for (var i = 0; i < this.children.length; ++i) {
			if (!this.children[i].model.done) {
				left++;
			} else {
				completed++;
			}
		}

		//add the counts to the footer info
		this['todo-count'].innerHTML = "<strong>" + left + "</strong> item" + (left != 1 ? "s" : "") + " left";
		this['clear-completed'].innerText = "Clear Completed (" + completed + ")";

		//hide the clear button if nothing to clear
		if (completed === 0) this['clear-completed'].style.display = "none";
		else this['clear-completed'].style.display = "block";

		//everything is completed
		this['toggle-all'].checked = (completed === this.children.length);
	}
});

//view for individual items
ItemView = Spineless.View.extend({
	//this will form the model object
	defaults: {
		"text": "", 
		"done": false
	},

	validate: function () {
		if (!this.model.text.length)
			return "Text must not be empty";
		
	},

	template: [
		{tag: "li", id: "li", children: [
			{className: "view", children: [
				{id: "done", tag: "input", type: "checkbox", className: "toggle"},
				{id: "label", tag: "label"},
				{id: "remove", tag: "button", className: "destroy"}
			]},

			{tag: "input", className: "edit", id: "text", "autofocus": true}
		]}
	],

	events: {
		'click remove': 'removeFromParent',
		'dblclick label': 'edit',
		'blur text': 'close',
		'keyup text': 'close'
	},

	edit: function () {
		this.text.value = this.model.text;
		this.li.className += " editing";
	},

	close: function (e) {
		//check for ENTER key
		if (e.which && e.which !== ENTER_KEY) {
			return;
		}

		this.li.className = this.model.done ? "completed" : "";
		if (this.text.value === "") {
			this.removeFromParent();
		}
	},

	render: function () {
		this.label.innerText = this.model.text;

		//show or hide based on the parent filter
		var style = this.container.style;
		if (this.parent.model.filter === "completed")
			style.display = !this.model.done ? "none" : "block";
		else if (this.parent.model.filter === "active")
			style.display = this.model.done ? "none" : "block";
		else
			style.display = "block";

		if (this.model.done && !this.li.classList.contains("completed"))
			this.li.classList.add("completed");
		else if (!this.model.done)
			this.li.classList.remove("completed");


		this.done.checked = this.model.done;
	}
});

todo = new TodoView({
	storage: localStorage || {}
});

if (localStorage.todo)
	todo.unserialize(localStorage.todo);