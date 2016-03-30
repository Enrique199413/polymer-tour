/*jslint node: true */
/*jslint nomen: true */
/*global document, window*/
'use strict';

var addShadowRoot = (function () {
  var importDoc, shimStyle;

  importDoc = (document._currentScript || document.currentScript).ownerDocument;

  if (window.ShadowDOMPolyfill) {
    shimStyle = document.createElement('style');
    document.head.insertBefore(shimStyle, document.head.firstChild);
  }

  return function (obj, idTemplate, tagName) {
    var template, list;

    obj.root = obj.createShadowRoot();
    template = importDoc.getElementById(idTemplate);
    obj.root.appendChild(template.content.cloneNode(true));

    if (window.ShadowDOMPolyfill) {
      list = obj.root.getElementsByTagName('style');
      Array.prototype.forEach.call(list, function (style) {
        var name = tagName || idTemplate;
        if (!template.shimmed) {
          shimStyle.innerHTML += style.innerHTML
            .replace(/:host\(([\^\)]+)\)/gm, name + '$1')
            .replace(/:host\b/gm, name)
            .replace(/::shadow\b/gm, ' ')
            .replace(/::content\b/gm, ' ');
        }
        style.parentNode.removeChild(style);
      });
      template.shimmed = true;
    }
  };
}());

var declaredProps = (function () {
  var exports = {};

  function parse(val, type) {
    switch (type) {
    case Number:
      return parseFloat(val || 0, 10);
    case Boolean:
      return val !== null;
    case Object:
    case Array:
      return JSON.parse(val);
    case Date:
      return new Date(val);
    default:
      return val || '';
    }
  }
  function toHyphens(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }
  function toCamelCase(str) {
    return str.split('-')
      .map(function (x, i) {
        return i === 0 ? x : x[0].toUpperCase() + x.slice(1);
      }).join('');
  }
  exports.serialize = function (val) {
    if (typeof val === 'string') {
      return val;
    }
    if (typeof val === 'number' || val instanceof Date) {
      return val.toString();
    }
    return JSON.stringify(val);
  };

  exports.syncProperty = function (obj, props, attr, val) {
    var name = toCamelCase(attr), type;
    if (props[name]) {
      type = props[name].type || props[name];
      obj[name] = parse(val, type);
    }
  };

  exports.init = function (obj, props) {
    Object.defineProperty(obj, 'props', {
      enumerable : false,
      configurable : true,
      value : {}
    });

    Object.keys(props).forEach(function (name) {
      var attrName = toHyphens(name), desc, value;

      desc = props[name].type ? props[name] : { type : props[name] };
      value = typeof desc.value === 'function' ? desc.value() : desc.value;
      obj.props[name] = obj[name] || value;

      if (obj.getAttribute(attrName) === null) {
        if (desc.reflectToAttribute) {
          obj.setAttribute(attrName, exports.serialize(obj.props[name]));
        }
      } else {
        obj.props[name] = parse(obj.getAttribute(attrName), desc.type);
      }
      Object.defineProperty(obj, name, {
        get : function () {
          return obj.props[name] || parse(obj.getAttribute(attrName), desc.type);
        },
        set : function (val) {
          var old = obj.props[name];
          obj.props[name] = val;
          if (desc.reflectToAttribute) {
            if (desc.type === Boolean) {
              if (val) {
                obj.setAttribute(attrName, '');
              } else {
                obj.removeAttribute(attrName);
              }
            } else {
              obj.setAttribute(attrName, exports.serialize(val));
            }
          }
          if (typeof obj[desc.observer] === 'function') {
            obj[desc.observer](val, old);
          }
        }
      });
    });
  };
  return exports;
}());

(function () {
  var ikengaMenu, ikengaNav, ikengaProperties, ikengaItemMenu, ikengaIconNav,
    ikengaIconNavProperties, ikengaContent, ikengaContainer, ikengaItemMenuProperties,
    ikengaMenuActions, ikengaMenuActionsProperties, ikengaNavProperties,
    items = [];//forEach,;

  //forEach = Function.prototype.call.bind(Array.prototype.forEach);
  //Declarate web components
  ikengaMenu = Object.create(window.HTMLElement.prototype);
  ikengaNav = Object.create(window.HTMLElement.prototype);
  ikengaItemMenu = Object.create(window.HTMLElement.prototype);
  ikengaMenuActions = Object.create(window.HTMLElement.prototype);
  ikengaIconNav = Object.create(window.HTMLElement.prototype);
  ikengaContent = Object.create(window.HTMLElement.prototype);
  ikengaContainer = Object.create(window.HTMLElement.prototype);

  ikengaProperties = {
    value: {
      type: String,
      value: 100
    }
  };
  ikengaItemMenuProperties = {
    href: {
      type: String
    }
  };
  ikengaNavProperties = {
    color: {
      type: String
    }
  };
  ikengaIconNavProperties = {
    for: {
      type: String
    },
    icon: {
      type: String
    },
    position: {
      type: String
    }
  };
  ikengaMenuActionsProperties = {
    home: {
      type: Boolean
    },
    backPage: {
      type: Boolean
    },
    nextPage: {
      type: Boolean
    },
    title: {
      type: String
    }
  };
  // Fires when an instance of the element is created
  ikengaMenu.createdCallback = function () {
    addShadowRoot(this, 'ikenga-menu');
    declaredProps.init(this, ikengaProperties);
    //this.reflow();
  };

  ikengaMenu.reflow = function () {
    this.createItemMenu();
  };

  // Fires when an instance was inserted into the document
  ikengaMenu.addItemMenu = function (item) {
    items.push(item);
    this.reflow();
  };
  /*
  ikengaMenu.createItemMenu = function () {

  };
  ikengaMenu.attachedCallback = function() {
  };
  // Fires when an instance was removed from the document
  ikengaMenu.detachedCallback = function() {
  };
  // Fires when an attribute was added, removed, or updated
  ikengaMenu.attributeChangedCallback = function(attr, oldVal, newVal) {};
  */

  // Fires when an instance was inserted into the document
  ikengaNav.addItemMenu = function (item) {
    items.push(item);
  };
  ikengaNav.createdCallback = function () {
    addShadowRoot(this, 'ikenga-nav');
    declaredProps.init(this, ikengaNavProperties);
    this.changeColor();
  };
  ikengaNav.changeColor = function () {
    this.style.background = this.color;
    if (this.color === '#FFFFFF' || this.color.substr(1, 3) === 'FFF') {
      this.style.color = 'black';
    } else {
      this.style.color = 'white !important';
    }
  };
  /*
  ikengaNav.attachedCallback = function() {
  };
  // Fires when an instance was removed from the document
  ikengaNav.detachedCallback = function() {
  };
  // Fires when an attribute was added, removed, or updated
  ikengaNav.attributeChangedCallback = function(attr, oldVal, newVal) {};
  */


  ikengaItemMenu.createdCallback = function () {
    var that = this;
    addShadowRoot(this, 'ikenga-item-menu');
    declaredProps.init(this, ikengaItemMenuProperties);
    this.addEventListener('click', function () {
      window.location.href = that.href;
    });
  };
  /*
  ikengaItemMenu.attachedCallback = function() {
  };
  // Fires when an instance was removed from the document
  ikengaItemMenu.detachedCallback = function() {
  };
  // Fires when an attribute was added, removed, or updated
  ikengaItemMenu.attributeChangedCallback = function(attr, oldVal, newVal) {};
  */

  function getIcon(iconToSearch) {
    console.log(iconToSearch);
    var div, iconToSearchFor;

    if (iconToSearch.querySelector('#ikengaImage') === undefined || iconToSearch.querySelector('#ikengaImage') === null) {
      div = document.createElement('div');
    } else {
      div = iconToSearch.querySelector('#ikengaImage');
    }
    div.id = 'ikengaImage';
    if (iconToSearch.icon.length === 0) {
      iconToSearch.icon = 'https://lh6.googleusercontent.com/-zXM7UZDjmX4/AAAAAAAAAAI/AAAAAAAACL8/TGDTeAhcvHk/photo.jpg';
    }
    div.style.background = 'URL("' + iconToSearch.icon + '")';
    div.style.backgroundSize = 'cover';
    div.style.width = '40px';
    div.style.height = '40px';
    div.style.margin = '10px';
    iconToSearchFor = document.querySelector(iconToSearch.for);
    if (iconToSearchFor) {
      switch (iconToSearch.position) {
      case "left":
        div.style.left = 0;
        iconToSearchFor.style.left = 0;
        break;
      case "right":
        div.style.right = 0;
        iconToSearchFor.style.right = 0;
        break;
      default:
        div.style.left = 0;
        iconToSearchFor.style.right = 0;
      }
    }
    return div;
  }
  ikengaIconNav.createdCallback = function () {
    var that = this;
    addShadowRoot(this, 'ikenga-icon-nav');
    declaredProps.init(this, ikengaIconNavProperties);

    this.addEventListener('click', function () {
      that.parentNode.querySelector(that.for).classList.toggle('view');
    });
  };
  ikengaIconNav.changeIcon = function (url) {
    this.icon = url;
    getIcon(this);
  };

  ikengaIconNav.attachedCallback = function () {
    this.appendChild(getIcon(this));
  };


  ikengaContent.createdCallback = function () {
    addShadowRoot(this, 'ikenga-content');
  };

  ikengaMenuActions.reflow = function () {
    if (this.container !== undefined) {
      this.innerHTML = '';
    }
    var title, iconSpan;
    if (this.querySelector('#container-menu-actions') !== undefined) {
      this.container = document.createElement('div');
      this.container.id = 'container-menu-actions';
    } else {
      this.container = this.querySelector('#container-menu-actions');
    }
    if (this.home) {
      iconSpan = document.createElement('span');
      this.home = document.createElement('div');
      this.home.className = 'actions';
      iconSpan.classList.add('fa', 'fa-home');
      this.home.id = 'home';
      this.home.appendChild(iconSpan);
      this.container.appendChild(this.home);
    }
    if (this.backPage) {
      iconSpan = document.createElement('span');
      this.backpage = document.createElement('div');
      this.backpage.id = 'backPage';
      this.backpage.className = 'actions';
      iconSpan.classList.add('fa', 'fa-arrow-left');
      this.backpage.appendChild(iconSpan);
      this.container.appendChild(this.backpage);
    }
    if (this.nextPage) {
      iconSpan = document.createElement('span');
      this.nextpage = document.createElement('div');
      this.nextpage.id = 'nextPage';
      this.nextpage.className = 'actions';
      iconSpan.classList.add('fa', 'fa-arrow-right');
      this.nextpage.appendChild(iconSpan);
      this.container.appendChild(this.nextpage);
    }
    title = document.createElement('div');
    title.innerHTML = this.title;
    title.className = 'title';
    this.container.appendChild(title);
    this.appendChild(this.container);
  };
  ikengaMenuActions.homeEventHandler = function (cb) {
    this.home.addEventListener('click', cb, false);
    return this.home;
  };
  ikengaMenuActions.getBack = function (cb) {
    this.backpage.addEventListener('click', cb, false);
  };
  ikengaMenuActions.getNext = function (cb) {
    this.nextpage.addEventListener('click', cb, false);
  };

  ikengaMenuActions.createdCallback = function () {
    addShadowRoot(this, 'ikenga-menu-actions');
    declaredProps.init(this, ikengaMenuActionsProperties);
    this.reflow();
  };

  ikengaContainer.createdCallback = function () {
    addShadowRoot(this, 'ikenga-container');
  };
  // Registers custom ikengaMenu
  document.registerElement('ikenga-nav', {
    prototype: ikengaNav
  });

  document.registerElement('ikenga-menu-actions', {
    prototype: ikengaMenuActions
  });

  document.registerElement('ikenga-container', {
    prototype: ikengaContainer
  });
  // Registers custom ikengaMenu
  document.registerElement('ikenga-menu', {
    prototype: ikengaMenu
  });

  document.registerElement('ikenga-content', {
    prototype: ikengaContent
  });
  document.registerElement('ikenga-item-menu', {
    prototype: ikengaItemMenu
  });
  document.registerElement('ikenga-icon-nav', {
    prototype: ikengaIconNav
  });
}());
