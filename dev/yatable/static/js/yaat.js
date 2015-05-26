angular.module('yaat', [])
.controller('YATableController', ['$scope', '$http', function($scope, $http){
    var self = this;

    $scope.$limit = 25;

    $scope.update = function(sortable){
        if(sortable !== undefined){
            self.applyOrder(sortable);
        }

        $http({
            method: 'POST',
            url: $scope.$api,
            data: $scope.$headers
        }).success(function(data){
            self.parse(data);
        });
    };

    $scope.$watch('$api', function(){
        self.init($scope.$api);
    });

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
        $scope.$headers = headers;
        $scope.$visibleHeaders = visibleHeaders;
        $scope.$rows = data.rows;
    };

    this.applyOrder = function(sortable){
        var keys = $(sortable).sortable('toArray');

        var headerOrder = [];
        for(var i=0; i<keys.length; i++){
            for(var j=0; j<$scope.$headers.length; j++){
                if(keys[i] === $scope.$headers[j].key){
                    headerOrder.push($scope.$headers.splice(j, 1));
                    break;
                }
            }
        }
        $scope.$headers = headerOrder;
    };

    window.getScope = function(){
        return $scope;
    }
}])
.directive('yat', [function(){
    return {
        restrict: 'E',
        controller: 'YATableController',
        templateUrl: 'yatable/table.html',
        scope: true,
        link: function(scope, element, attrs){
            // Attribute parsing only
            if(attrs.api !== undefined){
                scope.$api = attrs.api;
            }

            if(attrs.limit !== undefined){
                scope.$limit = attrs.limit;
            }

            // Sortable setup -------------------------------------------------
            var updateHandler = function(){
                scope.update(this)
            };

            var options = scope.$sortableOptions;
            if(options !== undefined){
                if(!options.hasOwnProperty('update')){
                    options.update = updateHandler;
                }
            }
            else {
                var options = {
                    axis: 'y',
                    containment: 'parent',
                    tolerance: 'pointer',
                    update: updateHandler
                }
            }

            var headerList = $(element).find('.ya-headers');
            headerList.disableSelection();
            headerList.sortable(options);
        }
    }
}]);