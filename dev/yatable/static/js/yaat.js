angular.module('yaat', [])
.controller('YATableController', ['$scope', '$http', function($scope, $http){
    var self = this;

    this.init = function(url){
        if(url !== undefined) {
            $http({
                method: 'POST',
                url: url
            }).success(function(data) {
                self.parse(data)
            });
        }
    };

    this.parse = function(data){
        var headers = [];
        var visibleHeaders = [];
        for(var i=0; i<data.columns.length; i++){
            var header = data.columns[i];
            headers.push(header);
            if(header.hidden === false){
                visibleHeaders.push(header);
            }
        }
        $scope.headers = headers;
        $scope.visibleHeaders = visibleHeaders;
        $scope.rows = data.rows;
    };

    this.applyOrder = function(sortable){
        var keys = $(sortable).sortable('toArray');

        var headerOrder = [];
        for(var i=0; i<keys.length; i++){
            for(var j=0; j<$scope.headers.length; j++){
                if(keys[i] === $scope.headers[j].key){
                    headerOrder.push($scope.headers.splice(j, 1));
                    break;
                }
            }
        }
        $scope.headers = headerOrder;
    };

    $scope.update = function(sortable){
        if(sortable !== undefined){
            self.applyOrder(sortable);
            return;
        }

        $http({
            method: 'POST',
            url: $scope.apiUrl
        }).success(function(data){
            self.parse(data);
        });
    };

    $scope.$watch('apiUrl', function(){
        self.init($scope.apiUrl);
    });
        
    window.getScope = function(){
        console.log($scope);
    }
}])
.directive('yat', [function(){
    return {
        restrict: 'E',
        controller: 'YATableController',
        templateUrl: 'yatable/table.html',
        scope: true,
        link: function(scope, element, attrs){
            if(attrs.api !== undefined){
                scope.apiUrl = attrs.api;
            }

            var headerList = $(element).find('.ya-headers');
            headerList.disableSelection();
            headerList.sortable({
                axis: 'y',
                containment: 'parent',
                tolerance: 'pointer',
                update: function(){
                    scope.update(this);
                }
            });
        }
    }
}]);