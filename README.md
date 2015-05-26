# yaat - yet another angularjs table
Created for full server-side processing

## Build
Node.js is require to build the module:

1. `npm install`
2. `npm test`

Build result will be placed in `dist/` and in `dev/yatable/static/js`.

## Development

The project is developed in Python 3.4.2. A simple Django development project
can be found in `dev/`.

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
    
    Yaat sends a single `HTTP POST` with empty body. You must return with the following
    structure:
    
    ```python
    {
        "columns": [
            {
                "key": "head0",
                "value": "Head",
                "desc": false,
                "hidden": false
            }, ...
        ],
        "rows": [
            {
                "id": 1
                "values": [
                    "Cell1",
                    ...
                ] 
            }, ...
        ]
    }
    ```
    
    You must always return every available column name in `columns` for every request,
    but you should not return every cell in every row. Use the `hidden` flag for those
    columns which should be skipped from rendering and also leave those values out. 
    `key` indicates column key, which can be anything. `value` will be placed on the
    rendered table.
    The default order of every column is expected to be ascending so toggle `desc` value
    if it is different.
    
    `rows` contains every result rows. `id` field should be unique for each row
    (so you should use some primary key here). `values` contains the actual row cells.

### Imperative
It is possible to override completely the default behaviour by passing a controller to the
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

> Note: Create custom modules for your application which depend on `yaat`.

If you prefer this way but you still want to use the default behaviour just set
the `$scope.$api` property and everything starts working automagically (but read the
Declarative section above).

When the `$scope.$api` value is undefined you get full control over the table rendering.
However there are 3 variables which must hold the values to be rendered:

-   `$scope.$headers`: This array contains every available column header. Contained object
    structure must be this:

    ```
    [
        {
            "key": "head0",
            "value": "Head",
            "desc": false,
            "hidden": false
        }, ...
    ]
    ```

    These items will be rendered in the column order/hide box.
    
-   `$scope.$visibleHeaders`: This array contains every visible header. Contained object
    structure is identical to the ones stored in `$headers` but this array must not
    contain `"hidden": true` objects.
    
    These items will be rendered in the table `<thead>` section.
    
-   `$scope.$rows`: This array contains every result row object. The structure must be 
     this:
    
    ```
    [
        {
            "id": 1
            "values": [
                "Cell1",
                ...
            ] 
        }, ...
    ]
    ```
    
    Length of each `"values"` array should match the length of `$scope.$visibleHeaders`
    so every cell have its column in the row.

### Passing `sortable();` options

It is possible to customize the behaviour of the sortable which is used for column
reordering but you must use the imperative method described above.

-   `$scope.sortableOptions`: Use this property to pass your object.
    
    When no update handler is in the object the default handler will be used
    (see the next section for details).
    
### Mixed mode
It is fine to mix the previous modes. This can be useful when you want to change 
the `$scope.$sortableOptions` but nothing more.

> Note: Declared attributes have higher priority.

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