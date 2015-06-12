# yaat - yet another angularjs table

Created for full server-side processing

## Build

Node.js is require to build the module:

1. `npm install`
2. `npm test`

Build result will be placed in `dist/` and in `dev/yatable/static/js`.

## Development

Source is located in `dev/yatable/static/js/yaat.js`.

### Development server

A simple Django development project can be found in `dev/`.
It's been developed in Python 3.4.2 (but it should work in Python 2.x) 

1. `pip install -r requirements`
2. `python dev/manage.py runserver`

## Usage

Use the `<yat>` directive to create a pretty table.

## API

### Declarative

Use the declarative API if the built-in logic (HTTP loading, table rendering, column
hiding and ordering, paging) suits your needs. In this case you still have some attributes
where you can customize the behaviour of the directive:

-   `api`

    There goes your API entry point which will be used to initialize the table. This
    value is stored in `$scope.$api` and it is also watched so changing it dynamically
    causes table redraw.
    
    Yaat sends a single `HTTP POST` with empty body on initialization.
    You must always return the following structure:
    
    ```
    {
        "columns": [
            {
                "key": <string>,
                "value": <string>,
                "desc": <boolean>,
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
            "prev": {
                "key": <string>,
                "value": <string>,
            },
            "current": {
                "key": <string>,
                "value": <string>,
            },
            "next": {
                "key": <string>,
                "value": <string>,
            }
        }
    }
    ```
    
    You must always return every available column name in `columns` for every request,
    but you should not return every cell in every row. Use the `hidden` flag for those
    columns which should be skipped from rendering and also leave those values out from
    rows.
    `key` indicates column key, which can be anything. `value` will be placed on the
    rendered table.
    The default order of every column is expected to be ascending so toggle `desc` value
    if it is different.
    
    Leave `"desc"` or `"hidden"` keys out if you don't wish to let the user change their
    value (rendered checkboxes become `disabled`).
    
    `rows` contains every result rows. `id` field should be unique for each row
    (so you should use some primary key here). `values` contains the actual row cells.
    
    `pages` object contains previous, current and next page labels. `key` is used as
    page offset (passed to `$scope.loadPage()`) and `value` is its rendered value.
    
-   `offset`
    
    Start page number (or any string). Value is stored in `$scope.$offset`. This value is
    sent in initialization `POST` only. Default value: `null`.

-   `limit`

    Required row count. Value is stored in `$scope.$limit`. Default value: `25`.
    
-   `dropdownText`

    This is the label text of the show/order drop-down list. Value is stored in `$scope.dropdownText`
    Default value: `Columns`.
    
-   `template`

    This is the template url of the `yat` directive which will be used to render the template.
    Default value: `yatable/table.html`.
    See `Overriding templates` section for more.
  
    
> Note: Declared attributes have the priority than imperative (scope) ones.

#### `POST`s

On initialization the following object is `POST`ed:

```
{
    "offset": $scope.$offset,
    "limit": $scope.$limit
}
```

After then this structure is used:

```
{
    "offset": $scope.$offset,
    "limit": $scope.$limit,
    "headers": [
        {
            "desc": <boolean>,
            "hidden": <boolean>,
            "key": <string>
        }, ...
    ]
}
```

### Imperative

It is possible to override the default behaviour completely by passing a controller to the
`<yat>` directive.

```
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

-   `$scope.init(url)`

    This method is called when the value of `$scope.$api` is initialized or changed. New value of
    `$api` is passed.

-   `$scope.update(sortable)`

    This method is called when any table update is required (hide/sort checkbox or
    column order changed). When column order is changed the `sortable` element is
    passed so you can sync the header order (when no ordering made this argument is
    `undefined`).
    
-   `$scope.loadPage(offset)`

    This method is called when the user navigates through table pages. Offset is
    the `key` value of the clicked `$scope.$pages` object (previous or next).
    
> **Important**: Your methods must operate on `yat` models or the template fails to render.
> See the next section for model list.

#### From scratch

When the `$scope.$api` value is undefined you get full control over the table rendering.
However there are some variables you must use to hold the values to be rendered:

-   `$scope.$headers`: This array contains every available column header. Contained object
    structure must be this:

    ```
    [
        {
            "key": <string>,
            "value": <string>,
            "desc": <boolean>,
            "hidden": <boolean>
        }, ...
    ]
    ```

    These items will be rendered in the column order/hide box.
    
    There are some optional keys too:
    -   Disable column sorting: `"unsortable": true`.
    -   Disable column hiding: `"unhideable": true`.
    
    The above keys set hide and sort checkboxes `disabled`. 
    
-   `$scope.$visibleHeaders`: This array contains every visible header. Contained object
    structure is identical to the ones stored in `$headers` but this array must not
    contain `"hidden": true` objects.
    
    These items will be rendered in the table `<thead>` section.
    
-   `$scope.$rows`: This array contains every result row object. The structure must be 
     this:
    
    ```
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
    
-   `$scope.$pages`: This object contains previous, current and next page offset. Expected
    structure is this:
    
    ```
    {
        "prev": {
            "key": <string>,
            "value": <string>,
        },
        "current": {
            "key": <string>,
            "value": <string>,
        },
        "next": {
            "key": <string>,
            "value": <string>,
        }
    }
    ```

   
### Passing `sortable();` options

It is possible to customize the behaviour of the sortable which is used for column
reordering but you must use the imperative method described above.

-   `$scope.$sortableOptions`: Use this property to pass your object.
    
    When no update handler is in the object the default handler will be used
    (see the next section for details).
    
#### The default behaviour:

```
{
    axis: 'y',
    containment: 'parent',
    tolerance: 'pointer',
    update: function(){
        scope.update(this);
    }
}
```

See the widget [documentation](http://api.jqueryui.com/sortable/) for more information.

> Note: `update` callback calls the `$scope.update()` method. The `sortable` itself
is passed as an argument.
    
### Mixed mode

It is fine to mix the previous modes. This can be useful when you want to change 
the `$scope.$sortableOptions` but nothing more.

## Styling

`yaat` does not use any front-end framework by default. See the template (`dev/yatable/static/table.html`) for
template details.

### Dynamic CSS classes

There are some dynamic classes in the template:

-   `"yh-{{ header.key }}"`

    Table header cells always have their own `header.key` as CSS class prepended with `"yh-"`. This can be
    useful for setting column width.
    
-   `"yc-{{ getKey($index) }}"`

    Table body cells always have their column header key (`header.key`) as CSS class prepended with `"yc-"`.
    You can use it for full column styling.
    
## Overriding templates

It it also possible to override the whole template or just pieces of it. It is very easy
using Angular's [`<script>` based template caching](https://docs.angularjs.org/api/ng/service/$templateCache).

Example:

```
<script type="text/ng-template" id="'yatable/row.html'">
    <tr ng-repeat="row in $rows">
        <td ng-repeat="cell in row.values" class="yc-{{ getKey($index) }}">
            {{ cell }}
        </td>
    </tr>
</script>
```

List of default templates:

-   `yatable/row.html`

    This template includes the declaration of the `<tr></tr>` element used inside
    the `<tbody></tbody>` section of the rendered table.

-   `yatable/table.html`

    This is the default base template of the rendered table.
    
> See `dev/yatable/static/*.html` for implementations.
    
### Per-table templates

In case you need more than one instances of `<yat>` on the same page but one (or many)
should use different templates than others then you can override the template URLs
too.

Available template URLs in the scope:

-   `$rowTemplate`

    URL of the template of `<tr></tr>` element used inside the `<tbody></tbody>` section of the
    rendered table. 
    
    Default: `yatable/row.html`

#### `yatable/table.html`
You can't override this URL in imperative mode because the `<yat>` directive gets access to
its own (and its parents') scope after the template is fetched. So you have to pass this URL as
an argument:

`<yat api="/api/" template="custom-template.html">`
