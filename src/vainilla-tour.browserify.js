/*jslint node: true */
/*jslint nomen: true */
/*global document, window, localStorage, getComputedStyle*/
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
  var polymerTour, polymerTourProperties, stepTour, stepTourProperties,
    stepInnerTour, stepInnerTourProperties;

  polymerTour = Object.create(window.HTMLElement.prototype);
  stepTour = Object.create(window.HTMLElement.prototype);
  stepInnerTour = Object.create(window.HTMLElement.prototype);


  stepTourProperties = {
    inherit: {
      type: Boolean
    },
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

  stepInnerTourProperties = stepTourProperties;

  polymerTourProperties = {
    withLabels: {
      type: Boolean
    },
    name: {
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
          action: 'forward',
          message: 'Atrás'
        },
        {
          icon: 'fa-arrow-right',
          action: 'next',
          message: 'Siguiente'
        },
        {
          icon: 'fa-times-circle',
          action: 'end',
          message: 'Finalizar Tour'
        }
      ],
      container = document.createElement('div'),
      polymertour = this,
      labels = this.withLabels,
      buttonElement;
    buttons.forEach(function (button) {
      if (labels) {
        buttonElement = document.createElement('span');
        buttonElement.classList.add('button');
        buttonElement.innerHTML = button.message;
        buttonElement.id = button.action;
        buttonElement.addEventListener('click', function () {
          polymertour.event(button.action);
        });
      } else {
        buttonElement = document.createElement('span');
        buttonElement.classList.add('fa', button.icon);
        buttonElement.id = button.action;
        buttonElement.addEventListener('click', function () {
          polymertour.event(button.action);
        });
      }
      container.appendChild(buttonElement);
    });
    container.className = 'buttons';
    this.appendChild(container);
  };

  polymerTour.event = function (evento) {
    //validations is here
    var data = {},
      ultimo;
    switch (evento) {
    case 'next':
      if (this.currentStep !== this.countStep) {
        this.currentStep += 1;
        this.currentLastStep = this.currentStep - 1;

        data.currentStep = this.currentStep;
        data.lastStep = this.lastStep;
        data.countStep = this.countStep;

        this.addDataToLocalstorage(this.name, data);
      }
      this.verificaBotones(this.currentStep);
      this.nextStep(this.currentStep);
      //console.log(this.currentStep);
      break;
    case 'forward':
      if (this.currentStep > 0) {
        this.currentStep -= 1;
        this.currentLastStep = parseInt(this.currentStep, 10) + 1;

        data.currentStep = this.currentStep;
        data.lastStep = this.lastStep;
        data.countStep = this.countStep;

        this.addDataToLocalstorage(this.name, data);
      }
      this.verificaBotones(this.currentStep);
      this.nextStep(this.currentStep);
      //console.log(this.currentStep);
      break;
    case 'end':
      ultimo = this.currentStep;
      this.cleanBorders(ultimo + 1);
      this.hideAll();
      data.currentStep = -1;
      data.countStep = this.countStep;
      this.addDataToLocalstorage(this.name, data);
      break;
    }
    //console.log(this.currentSteps, this.countStep, this.currentStep);
  };


  polymerTour.cleanBorders = function (indexForStep) {
    if (indexForStep !== 0 && indexForStep !== -1 && this.currentSteps[indexForStep - 1].for.length !== 0) {
      if (document.querySelector('#' + this.currentSteps[indexForStep - 1].for) !== null) {
        document.querySelector('#' + this.currentSteps[indexForStep - 1].for).classList.remove('border');
        document.querySelector('#' + this.currentSteps[indexForStep - 1].for).style.zIndex = 1;
      }
    }
    if (indexForStep + 1 < this.countStep && this.currentSteps[indexForStep + 1].for.length !== 0) {
      if (document.querySelector('#' + this.currentSteps[indexForStep + 1].for) !== null) {
        document.querySelector('#' + this.currentSteps[indexForStep + 1].for).classList.remove('border');
        document.querySelector('#' + this.currentSteps[indexForStep + 1].for).style.zIndex = 1;
        //console.log(this.currentSteps[indexForStep - 1].for);
        //document.getElementById(this.currentSteps[indexForStep - 1].for).style.zIndex = 1;
      }
    }
  };

  polymerTour.nextSubStep = function (indexForStep) {
    this.getLastItem = this.currentSteps[indexForStep - 1].children[this.currentSteps[indexForStep - 1].children.length - 1];
    this.getLastItem.style.opacity = 0;
    this.hijos[this.currentSubStep].children[0].style.opacity = 1;
    console.log('tiene subSteps', this.currentSubStep, this.hijos[this.currentSubStep].children[0]);
    this.currentSubStep = this.currentSubStep + 1;
  };

  polymerTour.parentCoordinates = function (element, indexForStep) {
    var newCoordinates,
      //that = this,
      //divide in two beacuse get the center element
      currentWidth = this.currentSteps[indexForStep].parentNode.getBoundingClientRect().width,
      currentHeight = this.currentSteps[indexForStep].parentNode.getBoundingClientRect().height,
      backdrop,
      //get the current window coordinates
      currentWindowWidth = window.innerWidth || document.body.clientWidth,
      currentWindowHeight = window.innerHeight || document.body.clientHeight;

    if (element && document.querySelector('#' + element) !== null) {
      if (document.querySelectorAll('#vainilla-tour-backdrop').length === 0) {
        backdrop = document.createElement('DIV');
        backdrop.id = 'vainilla-tour-backdrop';
        this.parentNode.insertBefore(backdrop, this);
      }
      document.styleSheets[0].insertRule('.border {border:2px solid ' + this.currentSteps[indexForStep].background + ';}', 0);
      //Exception because is more easy remove classList
      document.querySelector('#' + this.currentSteps[indexForStep].for).classList.add('border');
      document.querySelector('#' + this.currentSteps[indexForStep].for).style.zIndex = 10000000;

      /*
      currentClientCoordinates = {
        currentWidth: that.currentSteps[indexForStep].parentNode.getBoundingClientRect().width,
        currentHeight: that.currentSteps[indexForStep].parentNode.getBoundingClientRect().height,
        currentWindowWidth: window.innerWidth || document.body.clientWidth,
        currentWindowHeight: window.innerHeight || document.body.clientHeight
      };
      */

      newCoordinates = {
        top: document.querySelector('#' + element).getBoundingClientRect().top - currentHeight,
        bottom: document.querySelector('#' + element).getBoundingClientRect().bottom,
        left: document.querySelector('#' + element).getBoundingClientRect().left,
        right: document.querySelector('#' + element).getBoundingClientRect().right,
        width: document.querySelector('#' + element).getBoundingClientRect().width,
        height: document.querySelector('#' + element).getBoundingClientRect().height,
        position: window.getComputedStyle(document.querySelector('#' + element), null).position
      };

      console.log('Elemento#', element, document.getElementById(element), newCoordinates);
      newCoordinates.autoHeight = newCoordinates.bottom - newCoordinates.height === 0 ? (newCoordinates.position === 'fixed' ? true : false) : false;
      if (newCoordinates.position === 'fixed') {
        if (!newCoordinates.autoHeight) {
          this.currentSteps[indexForStep].parentNode.style.top = newCoordinates.top - (newCoordinates.height * 2) + 'px';
          this.verifyLeftRightBorder(newCoordinates.left, currentWidth, currentWindowWidth, this.currentSteps[indexForStep]);
        } else {
          this.currentSteps[indexForStep].parentNode.style.top =  (currentWindowHeight / 2) - (currentHeight / 2) + 'px';
          this.currentSteps[indexForStep].parentNode.style.left =  newCoordinates.width + newCoordinates.left + 'px';
        }
      } else {
        this.currentSteps[indexForStep].parentNode.style.top = newCoordinates.top + newCoordinates.height + currentHeight + 'px';
        this.verifyLeftRightBorder(newCoordinates.left, currentWidth, currentWindowWidth, this.currentSteps[indexForStep]);
      }
    } else {
      if (document.querySelectorAll('#vainilla-tour-backdrop').length === 1) {
        //console.log('Enrique', document.querySelector('#' + this.currentSteps[indexForStep - 1].for));
        document.removeChild(document.body.querySelector('#vainilla-tour-backdrop'));
      }
      newCoordinates = {
        top: parseInt(currentWindowHeight / 2, 10),
        left: parseInt(currentWindowWidth / 2, 10) - (currentWidth / 2)
      };
      this.currentSteps[indexForStep].parentNode.style.left = newCoordinates.left + 'px';
      this.currentSteps[indexForStep].parentNode.style.top = newCoordinates.top + 'px';
    }
  };
  polymerTour.verifyLeftRightBorder = function verifyLeftRightBorder(left, currentWidth, currentWindowWidth, element) {
    if (left + currentWidth >= currentWindowWidth) {
      element.parentNode.style.left = currentWindowWidth - currentWidth + 'px';
    } else if (left - currentWidth <= currentWindowWidth) {
      element.parentNode.style.left = left + 'px';
    } else {
      element.parentNode.style.left = left - currentWidth + 'px';
    }
  };
  polymerTour.changeColors = function (indexForStep) {
    var color = this.currentSteps[indexForStep].color.length !== 0 ? this.currentSteps[indexForStep].color : 'black',
      background = this.currentSteps[indexForStep].background.length !== 0 ? this.currentSteps[indexForStep].background : 'white';

    this.currentSteps[indexForStep].parentNode.style.color = color;
    this.currentSteps[indexForStep].parentNode.style.background = background;
    this.currentSteps[indexForStep].parentNode.style.borderColor = background;
    this.currentSteps[indexForStep].children[0].style.opacity = 1;
  };

  polymerTour.nextStep = function (indexForStep) {
    if (indexForStep < this.countStep) {
      this.parentCoordinates(this.currentSteps[indexForStep].for, indexForStep);
    }
    this.cleanBorders(indexForStep);
    this.changeColors(indexForStep);

    if (this.currentLastStep !== undefined && this.currentSteps[this.currentLastStep] !== undefined) {
      this.currentSteps[this.currentLastStep].children[0].style.opacity = 0;
    }
  };

  polymerTour.verificaBotones = function (indexForSteps) {
    if (indexForSteps === 0) {
      //hidde forward button
      this.querySelector('#forward').style.display = 'none';
      this.querySelector('#next').style.display = 'inline';
    } else if (this.countStep - 1 === indexForSteps) {
      //is final hidde next button
      this.querySelector('#next').style.display = 'none';
      this.querySelector('#forward').style.display = 'inline';
    } else if (indexForSteps === -1) {
      this.querySelector('#next').style.display = 'none';
      this.querySelector('#forward').style.display = 'none';
    } else {
      this.querySelector('#forward').style.display = 'inline';
      this.querySelector('#next').style.display = 'inline';
    }
  };

  polymerTour.addDataToLocalstorage = function () {
    var name, data, argumentos;

    argumentos = arguments;
    if (arguments.length === 2) {
      name = argumentos[0];
      data = argumentos[1];
      localStorage.setItem(name, JSON.stringify(data));
    }

  };

  polymerTour.getFromLocalStorage = function () {
    var origin, query, data, argumentos;

    argumentos = arguments;
    if (argumentos.length === 1) {
      origin = argumentos[0];
    }
    if (argumentos.length === 2) {
      origin = argumentos[0];
      query = argumentos[1];
    }
    if (query) {
      if (localStorage[origin]) {
        data = JSON.parse(localStorage[origin])[query];
      } else {
        console.error('getFromLocalStorage()says: El atributo de "' + origin + '" no esta definido en el localStorage');
      }
    } else {
      if (localStorage[origin]) {
        data = JSON.parse(localStorage[origin]);
      } else {
        console.error('getFromLocalStorage()says: El atributo de "' + origin + '" no esta definido en el localStorage');
      }
    }
    return data;
  };

  polymerTour.init = function () {
    this.registerElementActions();
  };

  polymerTour.hideAll = function () {
    this.style.opacity = 0;
  };

  polymerTour.registerElementActions = function () {
    var steps = this.children,
      polymertour = this;


    this.currentSubStep = 0;
    this.currentSteps = filter(steps, function (step) {
      return step.tagName === 'STEP-TOUR';
    });

    this.currentStep = this.getFromLocalStorage(this.name, 'currentStep') || 0;

    this.countStep = this.currentSteps.length;

    if (this.currentStep === -1) {
      this.hideAll();
    } else {
      if (this.countStep === 1) {
        this.verificaBotones(-1);
        setTimeout(function () {
          polymertour.nextStep(0);
        }, 10);
      } else {
        this.verificaBotones(this.currentStep);
        setTimeout(function () {
          polymertour.nextStep(polymertour.currentStep);
        }, 10);
      }
    }
  };

  stepTour.createdCallback = function () {
    addShadowRoot(this, 'step-tour');
  };

  stepTour.createElement = function (description) {
    var div = document.createElement('div');
    div.innerHTML = description;
    this.appendChild(div);
  };

  stepTour.attachedCallback = function () {
    declaredProps.init(this, stepTourProperties);
    this.createElement(this.value);
  };



  stepInnerTour.createdCallback = function () {
    addShadowRoot(this, 'step-inner-tour');
  };

  stepInnerTour.createElement = function (description) {
    var div = document.createElement('div');
    div.innerHTML = description;
    this.appendChild(div);
  };

  stepInnerTour.attachedCallback = function () {
    declaredProps.init(this, stepInnerTourProperties);
    this.createElement(this.value);
  };

  // Registers custom vainilla-tour
  document.registerElement('vainilla-tour', {
    prototype: polymerTour
  });
  document.registerElement('step-tour', {
    prototype: stepTour
  });
  document.registerElement('step-inner-tour', {
    prototype: stepInnerTour
  });

}());
