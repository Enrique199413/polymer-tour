# How it works! `<ikenga-container>`

`bower install --save git@prestigos-git:ikenga/ikenga-container.git#lastDistCommit`

Last commit for this `c60ba4a847ae8357e07e8b4ce1eabff7301cecf2`

### Import web component

```html
<html>
  <head>
    <link href='/bower_components/ikenga-container/ikenga-container.html' rel='import'></link>
  </head>
  <body>
    <ikenga-container>
    <ikenga-nav>
      <ikenga-menu-actions>
      </ikenga-menu-actions>
      <ikenga-icon-nav>
      </ikenga-icon-nav>
      <ikenga-menu>
        <ikenga-item-menu>
        </ikenga-item-menu>
      </ikenga-menu>
    </ikenga-nav>
    <ikenga-content>
    </ikenga-content>
    </ikenga-container>
  </body>
</html>
```


The basic structure is this:

```html
<ikenga-container>
<ikenga-nav>
  <ikenga-menu-actions>
  </ikenga-menu-actions>
  <ikenga-icon-nav>
  </ikenga-icon-nav>
  <ikenga-menu>
    <ikenga-item-menu>
    </ikenga-item-menu>
  </ikenga-menu>
</ikenga-nav>
<ikenga-content>
</ikenga-content>
</ikenga-container>
```
## `<ikenga-container>` is main element.

## `<ikenga-nav>` is the site toolbar

### Atributes

| Attribute        | Use           | Default  |
| ------------- |:-------------:| -----:|
| color      | Color in hexadecimal | none|


```html
<ikenga-nav color='#000000'>
</ikenga-nav>
```

### Methods

`changeColor()` Need if you will try change color value

## `<ikenga-menu-actions>` is the actions in toolbar

### Atributes

| Attribute        | Use           | Default  |
| ------------- |:-------------:| -----:|
| home      | Icon to home | none|
| back-page      | Icon to back | none|
| next-page      | Icon to next | none|
| title      | App title | none|


```html
<ikenga-menu-actions title='Some app' next-page, back-page, home>
</ikenga-menu-actions>
```

### Methods
| Method          | Use           |
| -------------   | -------------:|
| reflow()            | Need if you will try change any properties values  |
| homeEventHandler(cb)       | click in `home` icon, and event `click` is fire |
| getBack(cb)       |click in `home` icon, and event `click` is fire  |
| getNext(cb)           |click in `home` icon, and event `click` is fire     |

### Example

```html
<ikenga-menu-actions id="toolbar" title="Some app" next-page, back-page, home>
</ikenga-menu-actions>
<script>
  //get click event go to '/home'
  document.querySelector('toolbar').homeEventHandler(function (e) {
    window.location.href = '/home';
  });
  //change attributes
  document.querySelector('toolbar').setAttribute('home', '');
  document.querySelector('toolbar').setAttribute('next-page', '');
  document.querySelector('toolbar').setAttribute('back-page', '');
  document.querySelector('toolbar').title = 'Some another title app';

  //show all changes
  document.querySelector('toolbar').reflow();

</script>
```

## `<ikenga-icon-nav>` icon for toolbar like avatar

### Atributes

| Attribute        | Use           | Default  |
| ------------- |:-------------:| -----:|
| icon      | URL to avatar image | none|
| for      | The element in `<ikenga-container>` | none|
| position      | Position prefer for element `for` | none|


```html
<ikenga-icon-nav icon="https://lh6.googleusercontent.com/-zXM7UZDjmX4/AAAAAAAAAAI/AAAAAAAACL8/TGDTeAhcvHk/photo.jpg" for="ikenga-menu" position="right">
</ikenga-icon-nav>
```

### Methods

`changeIcon()` Need if you will try change URL for avatar

## `<ikenga-menu>` Menu for toolbar

### Atributes

| Attribute        | Use           | Default  |
| ------------- |:-------------:| -----:|
| position      | position for dropdown menu | none|


```html
<ikenga-menu position="right">
</ikenga-menu>
```

## `<ikenga-item-menu>` Items for toolbar menu

### Atributes

| Attribute        | Use           | Default  |
| ------------- |:-------------:| -----:|
| href      | path to refer | none|


```html
<ikenga-menu position="right">
  <ikenga-item-menu href='/item1'>
    Item 1
  </ikenga-item-menu>
</ikenga-menu>
```

## `<ikenga-content>` The content for website

```html
<ikenga-content>
  //import html content, web-components or whatever
</ikenga-content>
```
