/*jslint node: true */
/*jslint nomen: true */
/*global document, window*/
'use strict';
var filter = Function.prototype.call.bind(Array.prototype.filter);
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
  //initial declared variables
  var polymerTour, polymerTourProperties, stepTour, stepTourProperties;

  polymerTour = Object.create(window.HTMLElement.prototype);
  stepTour = Object.create(window.HTMLElement.prototype);

  stepTourProperties = {
    for: {
      type: String
    },
    color: {
      type: String
    },
    value: {
      type: String
    },
    background: {
      type: String
    }
  };

  polymerTourProperties = {
    foo: {
      type: String
    }
  };
  // Fires when an instance of the element is created
  polymerTour.createdCallback = function () {
    addShadowRoot(this, 'vainilla-tour');
    declaredProps.init(this, polymerTourProperties);
    this.createButtons();
  };

  polymerTour.createButtons = function () {
    //create 4 buttons
    //next
    //forward
    //end
    var buttons = [
        {
          icon: 'fa-arrow-left',
          action: 'forward'
        },
        {
          icon: 'fa-arrow-right',
          action: 'next'
        },
        {
          icon: 'fa-times-circle',
          action: 'end'
        }
      ],
      container = document.createElement('div'),
      polymertour = this;

    buttons.forEach(function (button) {
      var buttonElement = document.createElement('span');
      buttonElement.classList.add('fa', button.icon);
      buttonElement.id = button.action;
      buttonElement.addEventListener('click', function () {
        polymertour.event(button.action);
      });
      container.appendChild(buttonElement);
    });
    container.className = 'buttons';
    this.appendChild(container);
  };

  polymerTour.event = function (evento) {
    //validations is here
    switch (evento) {
    case 'next':
      if (this.currentStep !== this.countStep) {
        this.currentStep += 1;
        this.currentLastStep = this.currentStep - 1;
      }
      //console.log(this.currentStep);
      break;
    case 'forward':
      if (this.currentStep > 0) {
        this.currentStep -= 1;
        this.currentLastStep = this.currentStep + 1;
      }
      //console.log(this.currentStep);
      break;
    case 'end':
      console.log('hidde all');
      break;
    }
    this.verificaBotones(this.currentStep);
    this.nextStep(this.currentStep);
    //console.log(this.currentSteps, this.countStep, this.currentStep);
  };

  polymerTour.nextStep = function (indexForStep) {
    if (indexForStep < this.countStep) {
      console.log(this.currentSteps[indexForStep].color);
      if (this.currentSteps[indexForStep].color.length !== 0) {
        this.currentSteps[indexForStep].parentNode.style.color = this.currentSteps[indexForStep].color;
        this.currentSteps[indexForStep].children[0].style.color = this.currentSteps[indexForStep].color;
      } else {
        this.currentSteps[indexForStep].parentNode.style.color = 'black';
        this.currentSteps[indexForStep].children[0].style.color = 'black';
      }
      if (this.currentSteps[indexForStep].background.length !== 0) {
        this.currentSteps[indexForStep].parentNode.style.background = this.currentSteps[indexForStep].background;
        this.currentSteps[indexForStep].children[0].style.background = this.currentSteps[indexForStep].background;
        this.currentSteps[indexForStep].parentNode.style.borderColor = this.currentSteps[indexForStep].background;
      } else {
        this.currentSteps[indexForStep].parentNode.style.background = 'white';
        this.currentSteps[indexForStep].children[0].style.background = 'white';
      }
      if (this.currentSteps[indexForStep].for.length !== 0) {
        this.currentSteps[indexForStep].parentNode.style.top = (document.querySelector('#' + this.currentSteps[indexForStep].for).getBoundingClientRect().top + document.querySelector('#' + this.currentSteps[indexForStep].for).getBoundingClientRect().height) + 'px';
        this.currentSteps[indexForStep].parentNode.style.left = document.querySelector('#' + this.currentSteps[indexForStep].for).getBoundingClientRect().left + 'px';
      } else {
        //this.currentSteps[indexForStep].parentNode.style.top = '20%';
        this.currentSteps[indexForStep].parentNode.style.left = 'calc(50% - 125px)';
        //this.currentSteps[indexForStep].parentNode.style.bottom = '0';
        //this.currentSteps[indexForStep].parentNode.style.margin = '0 auto 0 auto';
      }
      this.currentSteps[indexForStep].children[0].style.opacity = 1;
    }
    if (this.currentLastStep !== undefined) {
      this.currentSteps[this.currentLastStep].children[0].style.opacity = 0;
    }
    //console.log(this.currentLastStep);
  };

  polymerTour.verificaBotones = function (indexForSteps) {
    if (indexForSteps === 0) {
      //hidde forward button
      console.log('hidde forward');
      this.querySelector('#forward').style.display = 'none';
      this.querySelector('#next').style.display = 'inline';
    } else if (this.countStep - 1 === indexForSteps) {
      //is final hidde next button
      console.log('hidde next');
      this.querySelector('#next').style.display = 'none';
      this.querySelector('#forward').style.display = 'inline';
    } else {
      console.log('show all buttons');
      this.querySelector('#forward').style.display = 'inline';
      this.querySelector('#next').style.display = 'inline';
    }
  };

  polymerTour.attachedCallback = function () {
    var steps = this.children,
      polymertour = this;
    this.currentSteps = filter(steps, function (step) {
      return step.tagName === 'STEP-TOUR';
    });
    this.currentStep = 0;
    this.countStep = this.currentSteps.length;
    this.verificaBotones(this.currentStep);
    setTimeout(function () {
      polymertour.nextStep(polymertour.currentStep);
    }, 0);
  };

  stepTour.createdCallback = function () {
    addShadowRoot(this, 'step-tour');
    declaredProps.init(this, stepTourProperties);
    this.createElement(this.value);
  };

  stepTour.createElement = function (description) {
    var div = document.createElement('div');
    div.innerHTML = description;
    this.appendChild(div);
  };


  // Registers custom vainilla-tour
  document.registerElement('vainilla-tour', {
    prototype: polymerTour
  });
  document.registerElement('step-tour', {
    prototype: stepTour
  });

}());