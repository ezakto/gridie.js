# gridie.js

gridie.js helps you building dynamic draggable/resizable layouts quickly. It's a standalone library inspired in [gridstack.js](https://github.com/troolee/gridstack.js) and [packery](https://github.com/metafizzy/packery).
It features multiple columns, non-fixed items height, mobile support and a quite small size (~6kb minified).

## Install

Just include `gridie.js` and `gridie.css` between your stuff and you're ready to go.
Gridie is also available as an npm module you can use along with browserify. Just `$ npm install gridie` it.

## Usage

All you need is a container element with a series of similar item elements, like:

```html
<div id="container">
    <div class="cell" data-x="0">Item 1</div>
    <div class="cell" data-x="1">Item 2</div>
    <div class="cell" data-x="2">Item 3</div>
</div>
```

The minimal data each item needs is a `data-x` attribute, representing a column.

#### Item attributes

* `data-x` item's horizontal position. This represents a column number. Required
* `data-y` item's vertical position **in pixels**. If not set, elements are stacked in order
* `data-width` item's width in columns (ie. not pixels). Defaults to `1`

Then you can initialize the layout passing the container element, and an optional settings object:

```js
var g = new Gridie(document.getElementById('container'), {
    columns: 6,
    selector: '.cell',
    resize: true,
    drag: true
});
```

#### Options

* `columns` amount of columns, defaults to 6
* `selector` items selector, defaults to `'.cell'`
* `resize` whether items could be resized or not. Could be false, true or a settings object. Defaults to `true`
    * `handler` selector for a resize handler element
* `drag` whether items could be dragged or not. Could be false, true or a settings object. Defaults to `true`
    * `handler` selector for a drag handler element
* `init` whether the layout should be rendered immediately or not. Defaults to `true`

## License

[Released under the MIT License](LICENSE)

Copyright (c) 2016 Nicolás Arias
