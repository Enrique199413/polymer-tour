# vainilla-tour
Is a pure JS web-component for tour like [Bootstrap Tour](http://bootstraptour.com/) but is made with web-components

## Check it Demo

[Live Demo](http://enrique199413.github.io/vainilla-tour/)

## How it works

``` bower install --save vainilla-tour ```

```html
<vainilla-tour with-labels='true' name='tourname' id='uniqueID'>
  <step-tour value='content visible' for='elementId' background='colorHEX' color='colorHEX'></step-tour>
</vainilla-tour>
```
## `<vainilla-tour>` properties
|property   | default | require  |  description |
|---|---|---|---|
|with-labels   | false | no  |  show or hidde labels |
|name   |  | yes  |  name for unique when use multiple tours |


## `<step-tour>` properties

|property   | default | require  |  description |
|---|---|---|---|
| value | ""  | yes  | message to show  |
| for | ""  | no  | element `id` reference  |
| color  |  black | no  | the custom font-color HEX or byName |
| background  | white  | no   | custom background color for element  |


## Run

In your attachedCallback element uses `init()` function to vainilla-tour to start

```JavaScript
...
//If you use a polymer
element.attached: function () {
  document.querySelector('#uniqueID').init();
}

...
//If you use pure JS

element.attachedCallback = function () {
  document.querySelector('#uniqueID').init();
}
```

## Fork and enjoy

After you clone Run these steps:

`npm install` `bower install`

### run server

`npm start`

### Visit browser

`localhost:3000/src/demo.html`
