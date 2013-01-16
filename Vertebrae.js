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
var View = function(opts) {
	//pass in the parent view through options
	this.parent = opts.parent;
	this.children = [];

	this._formProps = {};
	this._handlers = {};

	//DOM parent fragment
	this.el = document.createDocumentFragment();
	this.renderTemplate(this.el);
	
	//keep a reference to this class
	var self = this;

	//attach any event handlers
	if (this.events && typeof this.events === "object") {
		for (var on in this.events) {
			var parsed = on.split(" ");
			var cb = this[this.events[on]];
			
			//ensure correct format and element exists
			if (parsed.length !== 2 || !this[parsed[1]])
				continue;

			//add a 2nd level evt handler in a closure
			(function (parsed, cb) {
				this[parsed[1]]["on" + parsed[0]] = function () {
					cb && cb.apply(self, arguments);
				};	
			}).call(this, parsed, cb);
		}
	}

	//execute render after initialisation
	setTimeout(function() {
		self.render && self.render.call(self);
	}, 0);
};

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

		for (var i = 0; i < tpl.length; ++i) {
			View.toDOM(this, tpl[i], parent);
		}
	},

	/**
	* Default methods
	*/
	render: function () {},
	init: function () {},

	/**
	* Heirarchy methods
	*/
	add: function (name, child) {
		this[name] = child;
		child.parent = this;
		this.children.push(child);
	},

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
		cls.prototype.super = parent;

		//give an extend function to this class
		cls.extend = createExtend(cls);

		//extend the class with these options
		for (var key in opts)
			cls.prototype[key] = opts[key]

		//give the class these properties if not defined already
		/** (this should be done for us by extending prototype)
		for (var key in parent.prototype)
			if (!cls.prototype[key])
				cls.prototype[key] = parent.prototype[key];
		*/

		return cls;
	};
}

View.extend = createExtend(View);

//assign the classes to the namespace
Vertebrae.View = View;
Vertebrae.merge = merge;


})(window, window.document);
