/* global document, module, define */
(function(){
  function GridieItem(elem) {
    this.elem = elem.elem || elem;
    this.x = elem.x || 0;
    this.y = elem.y || 0;
    this.width = elem.width || 1;
    this.rendered = false;
  }

  GridieItem.prototype.setPosition = function(x, y) {
    this.x = parseInt(x);
    this.y = parseInt(y);
    this.rendered = false;
  };

  GridieItem.prototype.setWidth = function(width) {
    this.width = parseInt(width);
    this.rendered = false;
  };

  GridieItem.prototype.getPosition = function() {
    return {
      x: this.x,
      y: this.y
    }
  };

  GridieItem.prototype.getWidth = function() {
    return this.width;
  };

  GridieItem.prototype.getHeight = function() {
    return this.elem.getBoundingClientRect().height;
  };

  function Gridie(container, options) {
    options = this.options = Object.assign({
      columns: 6,
      container: container,
      selector: '.cell',
      init: true,
      resize: true,
      drag: true
    }, options);

    this.matrix = [];
    this._placeholder = new GridieItem(document.createElement('div'));
    this._placeholder.elem.classList.add('placeholder');
    container.style.position = 'relative';

    if (options.init) {
      this.init(Array.prototype.map.call(container.querySelectorAll(options.selector), function(elem){
        return {
          elem: elem,
          x: parseInt(elem.dataset.x),
          y: parseInt(elem.dataset.y),
          width: parseInt(elem.dataset.width)
        }
      }));
    }
  }

  Gridie.prototype.init = function(items) {
      // var idx = 0;
      items.forEach(function(elem) {
        var item = new GridieItem(elem);
        item.elem.style.width = item.getWidth() * 100 / this.options.columns + '%';
        // this.insert(item, item.elem.dataset.x || (idx++ % this.options.columns), item.elem.dataset.y);
        this.insert(item, item.x, item.y);
        if (this.options.resize) this.resizable(item);
        if (this.options.drag) this.draggable(item);
      }, this);
      this.refresh();
  };

  Gridie.prototype.resizable = function(item) {
    var self = this;
    var options = this.options;
    var container = this.options.container;
    var placeholder = this._placeholder;
    var columnWidthPx;
    var containerRect;

    function mousedown(e) {
      if (item.resize === false) return;

      var x = pageX(e);
      // var y = pageY(e);
      var rect = item.elem.getBoundingClientRect();

      if (x < (rect.left+rect.width-10) || x > (rect.left+rect.width)) {
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();

      placeholder.elem.style.position = 'absolute';
      placeholder.elem.style.left = item.elem.style.left;
      placeholder.elem.style.top = item.elem.style.top;
      placeholder.elem.style.width = rect.width + 'px';
      placeholder.elem.style.height = rect.height + 'px';

      placeholder.setWidth(item.width);
      container.appendChild(placeholder.elem, null);

      self.extract(item);
      self.insert(placeholder, item.x, item.y);
      self.render();

      containerRect = container.getBoundingClientRect();
      columnWidthPx = containerRect.width / options.columns;

      item.elem.classList.add('resizing');
      document.body.classList.add('resizing');
      addEventListener(document, 'mousemove', mousemove, false);
      addEventListener(document, 'mouseup', mouseup, false);
    }

    function mousemove(e) {
      var rect = item.elem.getBoundingClientRect();
      var diff = pageX(e) - rect.left;
      var wall = containerRect.left + containerRect.width;

      if (pageX(e) > wall) return;
      if (diff < columnWidthPx) diff = columnWidthPx;

      var width = (columnWidthPx * Math.round(diff / columnWidthPx)) / columnWidthPx;

      if (width != placeholder.width) {
        placeholder.setWidth(width);
        self.shiftOverlaps(placeholder);
        self.render();
      }

      item.elem.style.width = diff + 'px';
    }

    function mouseup() {
      document.body.classList.remove('resizing');
      item.elem.classList.remove('resizing');
      item.setWidth(placeholder.width);
      container.removeChild(placeholder.elem);

      self.extract(placeholder);
      self.insert(item, item.x, item.y);
      self.shiftOverlaps(item);
      self.render();

      removeEventListener(document, 'mousemove', mousemove);
      removeEventListener(document, 'mouseup',  mouseup);
      removeEventListener(document, 'touchmove', mousemove);
      removeEventListener(document, 'touchend',  mouseup);
    }

    addEventListener(item.elem, 'mousedown', mousedown, false);
    addEventListener(item.elem, 'touchstart', mousedown, false);
  };

  Gridie.prototype.draggable = function(item) {
    var self = this;
    var placeholder = this._placeholder;
    var container = this.options.container;
    var options = this.options;
    var diffX;
    var diffY;
    var mouseDiff;
    var columnWidthPx;
    var targetX;
    var targetY;

    function mousedown(e){
      if (item.drag === false) return;

      if (options.drag && options.drag.handle) {
        if (!e.target.matches(options.drag.handle)) return;
      }

      e.preventDefault();
      var rect = item.elem.getBoundingClientRect();

      placeholder.elem.style.position = 'absolute';
      placeholder.elem.style.left = item.elem.style.left;
      placeholder.elem.style.top = item.elem.style.top;
      placeholder.elem.style.width = rect.width + 'px';
      placeholder.elem.style.height = rect.height + 'px';

      placeholder.setWidth(item.width);
      container.appendChild(placeholder.elem, null);

      self.extract(item);
      self.insert(placeholder, item.x, item.y);
      self.render();

      targetX = item.x;
      targetY = item.y;
      diffX = pageX(e);
      diffY = pageY(e);
      mouseDiff = pageY(e) - rect.top - item.getHeight()/2;

      columnWidthPx = container.getBoundingClientRect().width / options.columns;

      item.elem.classList.add('dragging');
      document.body.classList.add('dragging');
      addEventListener(document, 'mousemove', mousemove, false);
      addEventListener(document, 'mouseup',  mouseup, false);
      addEventListener(document, 'touchmove', mousemove, false);
      addEventListener(document, 'touchend',  mouseup, false);
    }

    function mousemove(e){
      var rect = container.getBoundingClientRect();
      var x = Math.floor((pageX(e) - rect.left) / columnWidthPx);
      var top = self.getColumnHeight(targetX, pageY(e) - rect.top - mouseDiff);

      if (x < 0) x = 0;
      if (x >= options.columns - item.width) x = options.columns - item.width;

      if (targetX !== x || targetY !== top) {
        targetX = x;
        targetY = top;
        self.insert(placeholder, targetX, targetY);
        self.shiftOverlaps(placeholder);
        self.render();
      }

      item.elem.style.transform = 'translate('+(pageX(e)-diffX)+'px, '+(pageY(e)-diffY)+'px)';
    }

    function mouseup(){
      document.body.classList.remove('dragging');
      item.elem.classList.remove('dragging');
      item.elem.style.transform = 'translate(0px, 0px)';
      container.removeChild(placeholder.elem);

      self.extract(placeholder);
      self.insert(item, targetX, targetY);
      self.shiftOverlaps(item);
      self.render();

      removeEventListener(document, 'mousemove', mousemove);
      removeEventListener(document, 'mouseup',  mouseup);
      removeEventListener(document, 'touchmove', mousemove);
      removeEventListener(document, 'touchend',  mouseup);
    }

    addEventListener(item.elem, 'mousedown', mousedown, false);
    addEventListener(item.elem, 'touchstart', mousedown, false);
  };

  Gridie.prototype.refresh = function() {
    this.matrix.forEach(function(item) {
      this.shiftOverlaps(item);
    }, this);
    this.render();
  };

  Gridie.prototype.render = function() {
    this.matrix.forEach(function(item) {
      if (item.rendered) return;
      var pos = item.getPosition();
      item.elem.style.position = 'absolute';
      item.elem.style.width = item.getWidth() * 100 / this.options.columns + '%';
      item.elem.style.left = 100 / this.options.columns * pos.x + '%';
      item.elem.style.top = pos.y + 'px';
      item.elem.style.transform = 'translate(0px, 0px)';
      item.elem.setAttribute('data-x', pos.x);
      item.elem.setAttribute('data-y', pos.y);
      item.elem.setAttribute('data-width', pos.width);
      item.rendered = true;
    }, this);

    var gridHeight = 0;
    var columnHeight = 0;

    for (var x = 0; x < this.options.columns; x++) {
      columnHeight = this.getColumnHeight(x);
      if (columnHeight > gridHeight) gridHeight = columnHeight;
    }

    this.options.container.style.height = gridHeight + 'px';
  }

  Gridie.prototype.getColumn = function(column) {
    return this.matrix.filter(function(item) {
      return (item.x <= column) && ((item.x + item.width - 1) >= column);
    });
  };

  Gridie.prototype.getColumnHeight = function(column, until) {
    var y = 0;
    var height = 0;

    this.getColumn(column).filter(function(item){
      return until !== 0 && !until || item.y+item.getHeight() <= until;
    }).forEach(function(item){
      if (item.y >= y) {
        y = item.y;
        height = item.getHeight();
      }
    });

    return y + height;
  };

  Gridie.prototype.extract = function(item) {
    this.matrix.some(function(item2, idx) {
      if (item === item2) {
        return this.matrix.splice(idx, 1)[0];
      }
    }, this);
    return item;
  };

  Gridie.prototype.insert = function(item, x, y) {
    if (y !== 0 && !y) {
      y = this.getColumnHeight(x);
    }

    item.setPosition(x, y);
    
    if (this.matrix.indexOf(item) === -1) {
      this.matrix.push(item);
    }
  };

  Gridie.prototype.snapItems = function() {
    this.matrix.forEach(function(item){
      var max = 0;
      var y;
      for (var x = item.x, l = item.x+item.width; x < l; x++) {
        y = this.getColumnHeight(x, item.y);
        if (y > max) max = y;
      }
      if (max < item.y) {
        item.setPosition(item.x, max);
      }
    }, this); 
  };

  Gridie.prototype.shiftOverlaps = function(master, sorted) {
    if (!sorted) {
      sorted = this.matrix.sort(function(a, b){
        return a.y > b.y ? 1 : -1;
      });
    }

    sorted.forEach(function(item) {
      if (item === master) return;
      if (item.x < master.x && item.x + item.width <= master.x) return;
      if (item.x >= master.x + master.width) return;
      if (item.y + item.getHeight() <= master.y) return;
      if (item.y > master.y + master.getHeight()) return;

      item.setPosition(item.x, master.y + master.getHeight());
      this.shiftOverlaps(item, sorted);
    }, this);

    this.snapItems();
  };

  function pageX(e) {
    if (e.changedTouches) {
      return e.changedTouches[0].pageX;
    }
    return e.pageX;
  }

  function pageY(e) {
    if (e.changedTouches) {
      return e.changedTouches[0].pageY;
    }
    return e.pageY;
  }

  function addEventListener(element, event, listener) {
    return element.addEventListener(event, listener, false);
  }

  function removeEventListener(element, event, listener) {
    return element.removeEventListener(event, listener);
  }

  if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
    module.exports = Gridie;
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return Gridie; });
  } else {
    this.Gridie = Gridie;
  }
}());