# Yaat - yet another angularjs table

Yaat is a *yet another AngularJS table* but it uses server-side processing only. It is suitable for systems where
live HTML tables are required with column reordering, hiding, data sorting and paging. It is using Bootstrap
for its styling so it doesn't try to reinvent the wheel.

Table of Contents
=================

* [Install](#install)
* [Usage](#usage)
* [API](#api)
  * [Declarative](#declarative)
    * [POST ](#post)
    * [flags object](#flags-object)
  * [Imperative](#imperative)
    * [Hooking](#hooking)
    * [From scratch](#from-scratch)
    * [Sending and accessing non-Yaat data](#sending-and-accessing-non-yaat-data)
  * [Passing sortable(); options](#passing-sortable-options)
  * [Mixed mode](#mixed-mode)
* [Events](#events)
  * [Events that Yaat is listening to](#events-that-yaat-is-listening-to)
  * [Events that Yaat is emitting](#events-that-yaat-is-emitting)
* [Dynamic CSS classes](#dynamic-css-classes)
* [Overriding the standard template](#overriding-the-standard-template)
  * [Per-table templates](#per-table-templates)
    * [Overriding the whole template](#overriding-the-whole-template)
  * [Helper methods](#helper-methods)
* [Build](#build)
* [Django integration](#django-integration)
* [Development](#development)
  * [Development server](#development-server)

# Install

Simply with npm:

`npm install yaat`

Or just download the repository and bundle it in your project.

# Usage

1. Yaat uses some 3rd-party libraries. Hope you've already using some of them. These are:
    - jQuery
    - jQuery-UI
    - Bootstrap
    - AngularJS

2. Don't forget to include `yaat.min.js` and `yaat.css` files as well!
3. Yaat registers the `yaat` module. Either use it directly as an AngularJS app or create your own module which depends
    on this.
4. Use the `<yat>` directive to create a pretty table.

## API

### Declarative

Use the declarative API if the built-in logic (HTTP loading, table rendering, column
hiding and ordering, paging) suits your needs. In this case you still have some
HTML attributes where you can customize the behaviour of the directive:

-   `api`

    There goes your API entry point which will be used to initialize the table. This
    value is stored in `$scope.$api` and it is also watched so changing it dynamically
    causes table reload.
    
    Yaat sends a single `HTTP POST` with initialization data (see later).
    You must always return the following structure:
    
    ```javascript
    {
        "columns": [
            {
                "key": <string>,
                "value": <string>,
                "order": <boolean>,
                "hidden": <boolean>
            }, ...
        ],
        "rows": [
            {
                "id": <string>
                "values": [
                    <string>,
                    ...
                ] 
            }, ...
        ],
        "pages": {
            "current": <string>,
            "list": [
                {
                    "key": <string>,
                    "value": <string>
                }, ...
            ],
        }
    }
    ```
    
    You must always return every available column name in `columns` for every request,
    but you should not return every cell in every row. Use the `hidden` property for those
    columns which should be skipped from rendering and also leave those values out from
    rows.
    `key` indicates column key, which can be anything. `value` will be placed on the
    rendered table.
    Use the key `order` to indicate if the column is ordered. Value `0` stands for unordered,
    `1` is for ascending and `2` is for descending order.
    
    Leave `"order"` or `"hidden"` keys out if you don't wish to let the user change their
    value (their toggle buttons will not be rendered).
    
    `rows` contains every result rows. `id` field should be unique for each row
    (so you should use some primary key here). `values` array contains the actual row cells.
    
    `pages.list` object contains pages as an array. In it the `key` is used as
    page offset (passed to `$scope.loadPage()`) and `value` is rendered on the UI.
    `pages.current` is the key of the current page in the `pages.list` array. It is
    rendered non-clickable.
    
-   `offset`
    
    Start page number (or any string). Value is stored in `$scope.$offset` and in `$scope.$untouchedOffset` (which is always the value used for initialization).
    On table init the `$scope.$untouchedOffset` is `POST`ed
    On paging the `$scope.$offset` is sent. Default value: `null`.

-   `limit`

    Required row count. This value can either be a constant or a model. Default value: `25`.
    Current value is stored in `$scope.$limit`. This value is watched so you can set the
    visible row count dynamically.
    
-   `nocontrols`
    To hide the `.ya-ctrl` `<div>` use this attribute. The value is not stored but if the 
    attribute is exitst the `$scope.$noControls` is set to `true`. Default value: `false`.

-   `nodropdown`

    Use this attribute if you wish to hide the dropdown. The value of the attribute is not stored
    but if the attribute exists the `$scope.$noDropdown` is set to `true`. Default value: `false`.
    
-   `dropdownText`

    This is the label text of the show/order drop-down list. Value is stored in `$scope.dropdownText`
    Default value: `Columns`.
    
-   `template`

    This is the template url of the `yat` directive which will be used to render the template.
    Default value: `yatable/table.html`.
    See `Overriding templates` section for more.
    
-   `id`

    The value of `id` attribute is stored in `$scope.$yaatId`. This is useful for event identification and targeting events to exact table instances.
  
> Note: Declared attributes have higher priority than imperative (scope) ones.

#### `POST`

On initialization yaat `POST`s the following object:

```javascript
{
    "offset": $scope.$offset,
    "limit": $scope.$limit,
    "flags": {}
}
```

You have to reply with the header and the row list to this. After the table knows its headers it always sends
their current client-side state in each `POST`. So the structure after initialization is this:

```
{
    "offset": $scope.$offset,
    "limit": $scope.$limit,
    "headers": [
        {
            "order": <boolean>,
            "hidden": <boolean>,
            "key": <string>
        }, ...
    ],
    "flags": {}
}
```

You should observe property changes and header differences and reply with the required data. However the
table is always rebuilt from scratch meaning that you can deny property changes if you want. The table
always reflects the data it have received.

#### `flags` object

Since `v 1.0.4` yaat sends request flags in its `POST`s so the backend can detect which client-side event sent the 
`POST`. The flags object is placed under the `"flags"` key. It's not a secret that this function was introduced to make
yaat and django-yaat to work together better.

All flags are merged. This simply means that if you call `$scope.init()` the object will be `{init: true}`. If you
change the `$scope.$api` model then the watcher will set the flag `api` and calls `$scope.init()` so the `POST`ed
flags object will be `{init: true, api: true}`.

The following flags may appear in the `POST`s:

-   init
-   update
-   yaat.update
-   yaat.reload
-   loadPage
-   sortable

> Note: `init` or `update` is always set because they are the core HTTP methods.


### Imperative

It is possible to override the default behaviour completely by passing a controller to the
`<yat>` directive.

```html
<script>
    var app = angular.module('yaat');
    app.controller('ImperativeExample', ['$scope', function($scope){
        // Custom logic comes here
    }]);
</script>
<yat ng-controller="ImperativeExample"></yat>
```

> Note: Don't add controllers directly to the `yaat` module.

If you prefer this way but you still want to use the default behaviour just set
the `$scope.$api` property and everything starts working automagically (details in the
above section).

#### Hooking

You can override most of scope methods of `<yat>`'s controller in case you prefer using
your own algorithms but you still want to stick to the original program flow:

-   `$scope.init(url [, flags])`

    This method is called when the value of `$scope.$api` is initialized or changed, the value of `$scope.$limit` is 
    changed or `yaat.init` event is received. New value of `$api` is passed as `url`.
    
    This method adds the `init` flag to the `flags` object. You can also add custom flags by passing an object. This
    object must contain the flag name and the value `true` associated to it. Keys with different values are going
    to be dropped.

-   `$scope.update(sortable [, flags])`

    This method is called when any table update is required (hide/sort state or column order changed) or `yaat.update` 
    event is received. When column order is changed the `sortable` element is passed so you can sync the header order
    (when no ordering made this argument is `undefined`).
    
    This method adds the `update` flag to the `flags` object. You can also add custom flags by passing an object. This
    object must contain the flag name and the value `true` associated to it. Keys with different values are going
    to be dropped.
    
-   `$scope.loadPage(offset)`

    This method is called when the user navigates through table pages. Offset is
    the `key` value of the clicked `$scope.$pages` object (previous or next).
    
    This method adds the `loadPage` flag to the `flags` object.
    
> **Important**: Your methods must operate on `yat` models or the template fails to render.
> See the next section for model list.

#### From scratch

When the `$scope.$api` value is undefined you get full control over the table rendering.
However there are some variables you must use to hold the values to be rendered:

-   `$scope.$headers`: This array contains every available column header. Contained object
    structure must be this:

    ```javascript
    [
        {
            "key": <string>,
            "value": <string>,
            "order": <boolean>,
            "hidden": <boolean>
        }, ...
    ]
    ```

    These items will be rendered in the column order/hide box.
    
    Leave `"order"` or `"hidden"` keys out to prevent the column to be ordered or hidden.
    When the `"order"` key is missing the `"unorderable": true` key will be added to the column.
    When the `"hidden"` key is missing the `"unhideable": true` key will be added to the column.
    These are client-side keys only so they will not be sent in any `POST`.
    
-   `$scope.$visibleHeaders`: This array contains every visible header. Contained object
    structure is identical to the ones stored in `$headers` but this array must not
    contain `"hidden": true` objects.
    
    These items will be rendered in the table `<thead>` section.
    
-   `$scope.$rows`: This array contains every result row object. The structure must be 
     this:
    
    ```javascript
    [
        {
            "id": <string>
            "values": [
                <string>,
                ...
            ] 
        }, ...
    ]
    ```
    
    Length of each `"values"` array should match the length of `$scope.$visibleHeaders`
    so every cell have its column in the row.
    
-   `$scope.$pages`: This object contains a page array and the key of the current page
    in that array. Expected structure:
    
    ```javascript
    {
        "current": <string>,
        "list": [
            {
                "key": <string>,
                "value": <string>
            }, ...
        ],
    }
    ```
    
#### Sending and accessing non-Yaat data

It is fine to send custom key-value pairs in the POST replying to Yaat's request. These keys are
going to be collected and stored in `$scope.$customData` scope variable. The value is populated
at the end of reply parsing meaning that after receiving `yaat.http.success` you can access
the latest values safely.

### Passing `sortable();` options

It is possible to customize the behaviour of the sortable which is used for column
reordering but you must use the imperative method described above.

-   `$scope.$sortableOptions`: Use this property to pass your object.
    
    When no update handler is in the object the default handler will be used.
    
#### The default behaviour:

```javascript
{
    axis: 'y',
    containment: 'parent',
    tolerance: 'pointer',
    update: function(){
        scope.update(this, {sortable: true});
    }
}
```

See the widget [documentation](http://api.jqueryui.com/sortable/) for more information.

> Note: `update` callback calls the `$scope.update()` method. The `sortable` itself
is passed as an argument.
> Also note that the `{sortable: true}` flag is passed so this value will appear in the `flags` object.
    
### Mixed mode

It is fine to mix the previous modes. This can be useful when you want to change 
the `$scope.$sortableOptions` but nothing more.

## Events

It is possible to send and receive events from Yaat so you can create connections
between your own and Yaat's directive. This can be useful when you want the table
to be controller by a parent controller (e.g.: Yaat is a child of a filter form
so some data of the filter should be passed during paging).

### Events that Yaat is listening to
    
-   `yaat.init(api [, target])`

    This event calls `$scope.init()`. An URL must be passed (which will be stored in `$scope.$api`). You can pass the
    id of the target table optionally. This event adds the `yaat.init` flag.
    
-   `yaat.update([target])`

    This event calls `$scope.update()` You can pass the id of the target table optionally. This event adds the
    `yaat.update` flag.
    
-   `yaat.reload([target])`

    This event is very similar to `yaat.update` except that you should use this after the table is already initialized.
    When the table receives the event it sends its initial payload again. This is useful for cases where the data
    is excepted to change. This event adds the `yaat.reload` flag.
    
-   `yaat.http.add(key, model [, target])`

    You can use this event to add models which should also be
    sent along with Yaat's own data. This is useful when the
    table is a child of a parent controller (like a filter form).
    You can pass the id of the target table optionally.
    
    The keys will be added to the `POST` so you must not use
    reserved `POST` keys (`offset`, `limit` and `headers`).
    To be sure an error is thrown on conflict.
    
-   `yaat.http.remove(key [, target])`

    Use this event to remove a model previously added to be
    sent along with Yaat's own data. You can pass the id of
    the target table optinally.
    
    The internal reference of the model is going to be deleted.


### Events that Yaat is emitting

-   `yaat.ready`

    Sent when the `yaat` directive is ready to receive events.
    
-   `yaat.http.success`

    Emitted when the last `POST` and its parsing was successful.

-   `yaat.http.errors`

    This event is emitted when the `POST` fails. Passed arguments: `data` (error reply), 
    `status` (code), `headers`, `config`.
    
Because the sender scope is received in the event object you
can filter event sources by `$yaatId`.

```javascript
$scope.$on('yaat.ready', function(e){
    if(e.targetScope.$yaatId === 'someTable'){
        doSomething();
    }
});
```

## Dynamic CSS classes

There are some dynamic classes to help customizing the rendered
table. These are:

-   `"yh-[[ header.key ]]"`

    Table header cells always have their own `header.key` as class prepended with `"yh-"`. This can be useful for setting
    column width.
    
-   `"yc-[[ getKey($index) ]]"`

    Table body cells always have their column header key (`header.key`) as CSS class prepended with `"yc-"`.
    It is helpful for highlighting a whole column.
    
## Overriding the standard template

It it also possible to override the whole template or just pieces of it. It is very easy
using Angular's [script based template caching](https://docs.angularjs.org/api/ng/service/$templateCache).

Example:

```html
<script type="text/ng-template" id="yatable/row.html">
    <!-- Insert template code here -->
</script>
```

-   `yatable/table.html`

    This is the default base template of the rendered table. It
    includes the control area, renders the table header and rows
    and includes the paging area.

- `yatable/controls.html`

    This is the control area of the table. You should place buttons
    and links which are related to the rendered data here. (e.g.:
    select all, print, etc). Rendered content is in `.ya-ctrls`.
    
- `yatable/dropdown.html`

    This piece contains the dropdown (which is in the control are).
    In this list you can reorder the columns, show or hide them
    and sort their content.
    The button is pulled to the right.

-   `yatable/row.html`

    This template includes the declaration of the `<tr></tr>`
    element used inside
    the `<tbody></tbody>` section of the rendered table.
    Overriding this template is extremely useful when you want
    to render a cell value different than others.
    
-   `yatable/paging.html`

    This template includes the paging footer right after the
    `<table>`. It's rendered in `.ya-paging`.


> See `dev/yatable/static/*.html` for implementations.

### Per-table templates

In case you need more than one instances of `<yat>` on the same page but one (or many)
should use different templates than others then you can override the template URLs
too.

Available template URLs in the scope:

-   `$controlsTemplate`

    URL of the template of table's control area. Rendered content goes into 
    `.ya-ctrls`.
    
    Default: `yatable/row.html` 

-   `$rowTemplate`

    URL of the template of `<tr></tr>` element used inside the <tbody></tbody>`
    section of the rendered table. 
    
    Default: `yatable/row.html`

-   `$pagingTemplate`

    URL of the template of table's paging footer. Rendered content goes into 
    `.ya-paging`.
    
    Default: `yatable/paging.html`

#### Overriding the whole template
You have to pass this URLS as an argument because the directive gets access to its own (and its parents') scope after 
the template is fetched so it's too later to declare it in the scope.

`<yat api="/api/" template="custom-template.html">`

### Helper methods
You can access all scope methods and objects in your templates listed above
of course. However there are some methods which haven't been mentioned yet.
They are usually accessed from templates.

-   `$scope.getKey(index)`

    It is just a shortcut of `$scope.$visibleHeaders[index].key`.
    
-   `$scope.getIndex(key)`

    Returns the index of the given column key from `$scope.$visibleHeaders`. 

## Build

Node.js is require to build the module:

1. `npm install`
2. `npm test`

Build result will be placed in `dist/` and in `dev/yatable/static/js`.

## Django integration

There is a Django application named [django-yaat](https://github.com/slapec/django-yaat) (built on the top of 
[django-restify-framework](https://github.com/lovasb/django-restify)) which helps you creating yaat-compatible
resources easily.

## Development

Source is located in `dev/yatable/static/js/yaat.js`.

### Development server

A simple Django development project can be found in `dev/`. It is not using django-yaat yet but I'm going to
change this soon. Hope this is not going to affect the yaat directive itself.
