/*jslint node: true */
/*jslint nomen: true */
/*global document, window, localStorage, getComputedStyle*/
'use strict';
var filter = Function.prototype.call.bind(Array.prototype.filter),
  forEach;

forEach = Function.prototype.call.bind(Array.prototype.forEach);

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

  polymerTour.savePreferencesForSteps = function () {
    var that = this,
      objTmp = {};


    forEach(that.currentSteps, function (step) {
      if (step.for.length !== 0 && document.getElementById(step.for) !== null) {
        objTmp[step.for] = (isNaN(parseInt(window.getComputedStyle(document.getElementById(step.for), null).zIndex, 10)) ? '' : parseInt(window.getComputedStyle(document.getElementById(step.for), null).zIndex, 10));
      }
    });

    this.overlapingValue = objTmp;
    //this.addDataToLocalstorage(this.name, data);
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
        document.querySelector('#' + this.currentSteps[indexForStep - 1].for).style.zIndex = this.overlapingValue[this.currentSteps[indexForStep - 1].for];
      }
    }
    if (indexForStep + 1 < this.countStep && this.currentSteps[indexForStep + 1].for.length !== 0) {
      if (document.querySelector('#' + this.currentSteps[indexForStep + 1].for) !== null) {
        document.querySelector('#' + this.currentSteps[indexForStep + 1].for).classList.remove('border');
        document.querySelector('#' + this.currentSteps[indexForStep + 1].for).style.zIndex = this.overlapingValue[this.currentSteps[indexForStep + 1].for];
        //console.log(this.currentSteps[indexForStep - 1].for);
        //document.getElementById(this.currentSteps[indexForStep - 1].for).style.zIndex = 1;
      }
    }
  };

  polymerTour.parentCoordinates = function (element, indexForStep) {
    var backdrop,
      that = this;

    if (element && document.querySelector('#' + element) !== null) {
      if (document.querySelectorAll('#vainilla-tour-backdrop').length === 0) {
        backdrop = document.createElement('DIV');
        backdrop.id = 'vainilla-tour-backdrop';
        this.parentNode.insertBefore(backdrop, this);
      }

      document.querySelector('#' + this.currentSteps[indexForStep].for).classList.add('border');
      document.querySelector('#' + this.currentSteps[indexForStep].for).style.borderColor = this.currentSteps[indexForStep].background;
      document.querySelector('#' + this.currentSteps[indexForStep].for).style.zIndex = 10000000;

      this.validateCurrentCoordinatesElementFor(element, indexForStep);
    } else {
      this.removeBackDrop();
      setTimeout(function () {
        that.getRulesTourPosition(indexForStep);
        that.currentSteps[indexForStep].parentNode.style.left = that.windowScreen.middlePointX - (that.tourSizes.width / 2) + 'px';
        that.currentSteps[indexForStep].parentNode.style.top = that.windowScreen.middlePointY - (that.tourSizes.height / 2) + 'px';
      }, 0);
    }
  };

  polymerTour.removeBackDrop = function () {
    if (document.querySelectorAll('#vainilla-tour-backdrop').length === 1) {
      this.parentNode.removeChild(document.getElementById('vainilla-tour-backdrop'));
    }
  };

  polymerTour.compareAndGetCoordinate = function (coordinate, element) {
    var coordinateComputed,
      coordinateBounding;

    coordinateBounding = document.getElementById(element).getBoundingClientRect()[coordinate];
    coordinateComputed = !isNaN(parseInt(window.getComputedStyle(document.getElementById(element), null)[coordinate].replace("px", ""), 10)) ?  parseInt(window.getComputedStyle(document.getElementById(element), null)[coordinate].replace("px", ""), 10) : window.getComputedStyle(document.getElementById(element), null)[coordinate];

    return coordinateBounding < coordinateComputed ? coordinateComputed : coordinateBounding;
  };

  polymerTour.getCurrentPositionForInWindow = function (element) {
    var elementForCoordinates;

    elementForCoordinates = {
      top: this.compareAndGetCoordinate('top', element),
      left: this.compareAndGetCoordinate('left', element),
      right: this.compareAndGetCoordinate('right', element),
      bottom: this.compareAndGetCoordinate('bottom', element),
      height: this.compareAndGetCoordinate('height', element),
      width: this.compareAndGetCoordinate('width', element),
      position: window.getComputedStyle(document.getElementById(element), null).position
    };
    this.coordinatesForElement = elementForCoordinates;
  };

  polymerTour.getRulesTourPosition = function (indexForStep) {
    var elementCoordinates, windowCoordinates, that = this;


    windowCoordinates = {
      middlePointX: (window.innerWidth / 2),
      middlePointY: (window.innerHeight / 2),
      width: window.innerWidth,
      height: window.innerHeight
    };

    elementCoordinates = that.currentSteps[indexForStep].parentNode.getBoundingClientRect();
    elementCoordinates.marginElemnt = 4;
    this.tourSizes = elementCoordinates;
    this.windowScreen = windowCoordinates;
  };

  polymerTour.validateCurrentCoordinatesElementFor = function (element, indexForStep) {
    //Check for window Visibility
    this.getCurrentPositionForInWindow(element);
    this.getRulesTourPosition(indexForStep);
    //console.log(this.coordinatesForElement, this.windowScreen, this.tourSizes);
    if (this.coordinatesForElement.left > this.windowScreen.middlePointX) {
      this.currentSteps[indexForStep].parentNode.style.right = this.coordinatesForElement.width + this.tourSizes.marginElemnt + 'px';
      this.currentSteps[indexForStep].parentNode.style.left = 'initial';
      if ((this.coordinatesForElement.width + this.tourSizes.width) > this.windowScreen.width) {
        this.currentSteps[indexForStep].parentNode.style.right = this.coordinatesForElement.width - this.tourSizes.width + 'px';
      }
    } else {
      this.currentSteps[indexForStep].parentNode.style.left = this.coordinatesForElement.width + this.tourSizes.marginElemnt + 'px';
      this.currentSteps[indexForStep].parentNode.style.right = 'initial';
      if ((this.coordinatesForElement.width + this.tourSizes.width) > this.windowScreen.width) {
        this.currentSteps[indexForStep].parentNode.style.left = this.coordinatesForElement.width - this.tourSizes.width + 'px';
      }
    }



    if ((this.coordinatesForElement.top + this.coordinatesForElement.height + this.tourSizes.height) > this.windowScreen.height) {
      this.currentSteps[indexForStep].parentNode.style.top = this.windowScreen.middlePointY - (this.tourSizes.height / 2) + 'px';
      //console.log('el elemnto ya no se ve en pantalla se centra');
    } else {
      if ((this.coordinatesForElement.top + this.coordinatesForElement.height) > this.windowScreen.middlePointY) {
        this.currentSteps[indexForStep].parentNode.style.top = this.coordinatesForElement.top - this.tourSizes.height + 'px';
      } else {
        this.currentSteps[indexForStep].parentNode.style.top = this.coordinatesForElement.top + this.coordinatesForElement.height + 'px';
      }
    }

  };

  polymerTour.changeColors = function (indexForStep) {
    var color = this.currentSteps[indexForStep].color.length !== 0 ? this.currentSteps[indexForStep].color : 'black',
      background = this.currentSteps[indexForStep].background.length !== 0 ? this.currentSteps[indexForStep].background : 'white';

    this.currentSteps[indexForStep].parentNode.style.color = color;
    this.currentSteps[indexForStep].parentNode.style.background = background;
    this.currentSteps[indexForStep].parentNode.style.borderColor = background;
    this.currentSteps[indexForStep].children[0].style.opacity = 1;
    this.currentSteps[indexForStep].children[0].style.display = 'block';
  };

  polymerTour.nextStep = function (indexForStep) {
    var that = this;

    forEach(that.currentSteps, function (step) {
      step.children[0].style.display = 'none';
    });
    if (indexForStep < this.countStep) {
      that.currentSteps[indexForStep].style.display = 'inline';
      this.parentCoordinates(that.currentSteps[indexForStep].for, indexForStep);
    }
    this.cleanBorders(indexForStep);
    this.changeColors(indexForStep);

    if (this.currentLastStep !== undefined && this.currentSteps[this.currentLastStep] !== undefined) {
      this.currentSteps[this.currentLastStep].children[0].style.opacity = 0;
      this.currentSteps[this.currentLastStep].children[0].style.display = 'none';
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
    var that = this;
    this.registerElementActions();
    this.savePreferencesForSteps();
    window.addEventListener('resize', function () {
      that.parentCoordinates(that.currentSteps[that.currentStep].for, that.currentStep);
    });
  };

  polymerTour.hideAll = function () {
    this.style.opacity = 0;
    this.removeBackDrop();
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

  stepTour.createElement = function () {
    var div = document.createElement('div');

    forEach(this.children, function (child) {
      setTimeout(function () {
        div.appendChild(child);
      }, 0);
    });
    //div.innerHTML = description;
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
