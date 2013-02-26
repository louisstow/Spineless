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
		'click all': 'filter',
		'click active': 'filter',
		'click completed': 'filter',
		'click clear-completed': 'clearCompleted'
	},

	addTask: function (e) {
		//on ENTER key save the task
		if (e.which !== 13)
			return;

		this.addChild(new ItemView({
			text: this['new-todo'].value,
			superview: this['todo-list']
		}));

		this['new-todo'].value = ""; //clear textbox
	},

	filter: function (e, evt, obj, node) {
		var show = false;

		for (var i = 0; i < this.children.length; ++i) {
			//show or hide the view based on the filter
			if (obj === "all") show = true;
			else if (obj === "active") show = !this.children[i].model.done;
			else if (obj === "completed") show = this.children[i].model.done;

			this.children[i].container.style.display = show ? "block" : "none";
		}

		this.all.className = this.active.className = this.completed.className = "";
		node.className = "selected";
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
		this['todo-count'].innerText = left + " items left";
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
		'blur text': 'close'
	},

	edit: function () {
		console.log("EDIT")
		this.text.value = this.model.text;
		this.li.className += " editing";
	},

	close: function () {
		this.li.className = this.model.done ? "completed" : "";
		if (this.text.value === "") {
			this.removeFromParent();
		}
	},

	render: function () {
		this.label.innerText = this.model.text;

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