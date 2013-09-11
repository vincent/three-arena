Views
===

> Views are Knockout views classes, and are used to bind Character and Game properties to HTML HUDs.

Example
=====

 * EntityView
```javascript

var EntityViewModel = function(entity) {

    this.life = ko.observable();
    this.mana = ko.observable();
 
    this.update = function(newState){ ... }

    entity.on('changed', this.update);
};
```

 * HUD template
```html

<div id="view-character">

        <div class="portrait-name" data-bind="text: name"></div>
        <div class="portrait-image" data-bind="style:{ backgroundImage: 'url(' + image() + ')' }"></div>
        <div class="portrait-life">
            <div class="bar" data-bind="text: life(), style: { width: life() + '%' }"></div>
        </div>

        <div class="portrait-mana">
            <div class="bar" data-bind="text: mana(), style: { width: mana() + '%' }"></div>
        </div>

</div>
```
