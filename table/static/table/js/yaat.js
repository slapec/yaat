angular.module('yaat', [])
.controller('YATableController', ['$scope', '$http', function($scope, $http){
    var self = this;

    $scope.$watch('apiUrl', function(newUrl){
        self.init(newUrl);
    });

    this.init = function(url){
        $http({
            method: 'POST',
            url: url
        }).success(function(data){
            self.parse(data)
        });
    };

    this.parse = function(data){
        $scope.data = data;

        var headers = [];
        var rows = [];
        for(var i=0; i<data.columns.length; i++){
            var column = data.columns[i];
            headers.push(column.value);

            for(var j=0; j<column.rows.length; j++){
                var cell = column.rows[j];
                if(rows[j] === undefined){
                    rows[j] = [];
                }
                rows[j].push(cell);
            }
        }

        $scope.headers = headers;
        $scope.rows = rows;
    };

    window.stuff = function(){
        return $scope
    }
}])
.directive('yat', [function(){
    return {
        restrict: 'E',
        controller: 'YATableController',
        templateUrl: '/static/table/templates/yatable-body.html',
        link: function(scope, element, attrs){
            if(attrs.api !== undefined){
                scope.apiUrl = attrs.api;
            }
        }
    }
}]);