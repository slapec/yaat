// Created: Wed May 27 2015 09:07:18 GMT+0200 (CEST)
angular.module('yaat', [])
.controller('YATableController', ['$scope', '$http', function($scope, $http){
    var self = this;

    $scope.$limit = $scope.$limit === undefined? 25:$scope.$limit ;

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
            if(header.desc === undefined){
                header.unsortable = true;
            }
            if(header.hidden === undefined){
                header.unhideable = true;
                visibleHeaders.push(header);
            }
            else if(header.hidden === false){
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
angular.module("yaat").run(["$templateCache", function($templateCache) {$templateCache.put("yatable/table.html","<div class=\"yat\"><div class=\"ya-ctrls\"><ol class=\"ya-headers\"><li ng-repeat=\"header in $headers\" id=\"{{ header.key }}\"><input type=\"checkbox\" ng-model=\"header.hidden\" ng-disabled=\"header.unhideable\" ng-click=\"update()\"> <span class=\"ya-header-value\">{{ header.value }}</span> <input type=\"checkbox\" ng-model=\"header.desc\" ng-disabled=\"header.unsortable\" ng-click=\"update()\"></li></ol></div><table class=\"ya-table\"><thead><tr><td ng-repeat=\"header in $visibleHeaders\">{{ header.value }}</td></tr></thead><tbody><tr ng-repeat=\"row in $rows\"><td ng-repeat=\"cell in row.values\">{{ cell }}</td></tr></tbody></table><pre class=\"ya-debug\">$headers={{ $headers }}\n$visibleHeaders={{ $visibleHeaders }}\n$limit={{ $limit }}\n</pre></div>");}]);