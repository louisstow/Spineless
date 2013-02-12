;(function (win, document) {

//create the global namespace
var Vertebrae = win.Vertebrae = {};

//list of attributes that require special logic
var blacklist = [
	"id",
	"tag",
	"children",
	"className",
	"text",
	"form"
];

//unique number #TODO: use this for something
var UID = 0;

/**
* merge all object keys from the argument list
* into one object and return it.
*/
function merge () {
	var target = {};
	var args = Array.prototype.slice.call(arguments);

	//loop over all the arguments
	for (var i = 0; i < args.length; ++i) {
		if (typeof args[i] !== "object") continue;

		for (var key in args[i]) {
			if (!(key in target))
				target[key] = args[i][key];
		}
	}

	return target;
}

/**
* Vertebrae Views are the backbone of the framework. Use
* this class to build your DOM structure in JSON, assign
* event handlers and communicate with the server.
*/
var View = function() {};

/**
* Static method to turn a JSON template into a DOM structure.
* @param ctx - Instance object to save ID references to
* @param obj - Template object to convert
* @param parent - Append the element to this parent
* @return HTMLElement
*/
View.toDOM = function (ctx, obj, parent) {
	if (arguments.length < 3) {
		parent = obj;
		obj = ctx;
		ctx = null;
	}

	var el = document.createElement(obj.tag || "div");

	for (var key in obj)
		if (blacklist.indexOf(key) === -1)
			el.setAttribute(key, obj[key]);

	if (obj.className)
		el.setAttribute("class", obj.className);

	if ('text' in obj)
		el.innerText = obj.text;

	//render children
	if (obj.children) {
		for (var i = 0; i < obj.children.length; ++i) {
			View.toDOM(ctx, obj.children[i], el);
		}
	}

	//append to a parent if specified
	if (parent) 
		parent.appendChild(el);

	if (ctx) {
		//save a ref on the context
		if (obj.id) ctx[obj.id] = el;

		//save in a special form prop group
		if (obj.form) 
			ctx._formProps[obj.form] = el;
	} 

	return el;
}

View.prototype = {
	/**
	* Render methods
	*/
	renderTemplate: function (parent) {
		var tpl = this.template;
		var container = document.createElement("div");
		container.setAttribute("class", "container");
		
		for (var i = 0; i < tpl.length; ++i) {
			View.toDOM(this, tpl[i], container);
		}

		parent.appendChild(container);
		this.container = container;
	},

	/**
	* Default methods
	*/
	render: function () {},
	init: function (opts) {
		opts = opts || {};

		//pass in the parent view through options
		this.parent = opts.parent;
		this.superview = opts.superview || (this.parent && this.parent.el);
		this.children = [];

		this._formProps = {};
		this._handlers = {};
		this.model = {};

		//DOM parent fragment
		this.el = document.createDocumentFragment();
		this.renderTemplate(this.el);
		
		//keep a reference to this class
		var self = this;

		//copy items from opts into the model
		for (var item in this.defaults) {
			if (item in opts) {
				this.model[item] = opts[item];
				delete opts[item];
			} else {
				this.model[item] = this.defaults[item];
			}
		}

		//attach any event handlers
		if (typeof this.events === "object") {
			for (var on in this.events) {
				var parsed = on.split(" ");
				var cb = this[this.events[on]];
				
				//ensure correct format and element exists
				if (parsed.length !== 2 || !this[parsed[1]])
					continue;

				//add a 2nd level evt handler in a closure
				(function (parsed, cb) {
					this[parsed[1]]["on" + parsed[0]] = function (e) {
						//simple IE fix
						e = e || window.event;

						cb && cb.call(self, e);
						self.emit("input:" + parsed[0], e, self);
					};
				}).call(this, parsed, cb);
			}
		}

		//execute render after initialisation
		setTimeout(function() {
			self.render && self.render.call(self);
			self.superview && self.superview.appendChild(self.el);
		}, 0);
	},

	/**
	* Heirarchy methods
	*/
	addChild: function (child) {
		child.parent = this;
		this.children.push(child);
		this.emit("ChildAdded");
		child.emit("ParentAdded");
	},

	removeFromParent: function () {
		var children = this.parent.children;
		for (var i = children.length - 1; i >= 0; --i) {
			if (children[i] === this) {
				children.splice(i, 1);
				break;
			}
		}

		this.superview.removeChild(this.container);
		this.parent.emit("ChildRemoved", this);
		this.emit("ParentRemoved", parent);

		//TODO: see how DocumentFragment works so it can be removed
	},

	/**
	* Recursively generate a new object containing
	* the models of the views.
	*/
	getModel: function () {
		var model = merge({}, this.model);

		//serialize all children if they exist		
		if (this.children.length) {
			model.children = [];

			for (var i = 0; i < this.children.length; ++i) {
				model.children.push(
					this.children[i].getModel()
				);
			}
		}

		return model;
	},

	serialize: function () {
		return JSON.stringify(this.getModel());
	},

	unserialize: function () {},

	/**
	* Event methods
	*/
	emit: function (evt) {
		//save all the arguments except the first one
		var args = Array.prototype.slice.call(arguments, 1);
		var node = this;
		
		do {
			//execute the handlers
			if (!node._handlers || !node._handlers[evt]) continue;

			for (var i = 0; i < node._handlers[evt].length; ++i) {
				//skip if the value is not executable
				if (typeof node._handlers[evt][i] !== "function")
					continue;

				node._handlers[evt][i].apply(node, args);
			}
		} while (node = node.parent);
	},

	on: function (evt, cb) {
		if (!this._handlers[evt])
			this._handlers[evt] = [];

		this._handlers[evt].push(cb);
	},

	/**
	* Network methods
	*/
	_formData: function () {
		var data = {};
		
		for (var key in this.props) {
			data[key] = this.props[key];
		}

		for (var key in this._formProps) {
			data[key] = $(this._formProps[key]).val();
		}

		return data;
	},

	/**
	* Override this for custom ajax
	*/
	sync: function(method, url, data) {
		console.log(method, url, data);
		var self = this;
		api({
			url: url,
			method: method,
			data: data,
			success: function () {
				self.success && self.success.apply(self, arguments);

				//send the event up
				self.emit(["success", method + ":success"], {
					method: method,
					url: url,
					data: data
				});
			}
		});
	},

	post: function () {
		var data = this._formData();
		this.sync("POST", this.url, data);
	},

	delete: function () {
		var data = this._formData();
		this.sync("DELETE", this.url, data);
	}
};

//helper method to create extend functions on widgets
function createExtend (parent) {
	return function(opts) {
		var cls = function () {
			this.init && this.init.apply(this, arguments);
		};

		//we don't want to use the original constructor
		//or else it will call `init`
		function Dummy(){}
  		Dummy.prototype = parent.prototype;

		//extend the prototype with the widget
		cls.prototype = new Dummy;
		cls.prototype.constructor = cls;

		//give access to the parent class
		cls.prototype.super = function (method, args) {
			parent.prototype[method].apply(this, args);
		};

		//give an extend function to this class
		cls.extend = createExtend(cls);

		//extend the class with these options
		for (var key in opts)
			cls.prototype[key] = opts[key];

		return cls;
	};
}

View.extend = createExtend(View);

//assign the classes to the namespace
Vertebrae.View = View;
Vertebrae.merge = merge;


})(window, window.document);
