angular.module('yaat', [])
.config(['$interpolateProvider', function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
}])
.controller('YATableController', ['$scope', '$http', function($scope, $http){
    var self = this;

    // Variable initialization ------------------------------------------------
    if($scope.$limit === undefined){
        $scope.$limit = 25;
    }

    if($scope.$offset === undefined){
        $scope.$offset = null;
    }

    // Template URLs ----------------------------------------------------------
    if($scope.$rowTemplate === undefined){
        $scope.$rowTemplate = 'yatable/row.html';
    }

    if($scope.$pagingTemplate === undefined){
        $scope.$pagingTemplate = 'yatable/paging.html';
    }

    // Not-so private variables -----------------------------------------------
    if($scope.dropdownText === undefined) {
        $scope.dropdownText = 'Columns';
    }

    $scope.$watch('$api', function(){
        $scope.init($scope.$api);
    });

    // Scope methods ----------------------------------------------------------
    if($scope.init === undefined){
        $scope.init = function(url){
            if(url !== undefined) {
                var payload = self.initPayload();
                $http({
                    method: 'POST',
                    url: url,
                    data: payload
                }).success(function(data) {
                    self.parse(data)
                });
            }
        }
    }

    if($scope.update === undefined){
        $scope.update = function(sortable){
            if(sortable !== undefined){
                self.applyOrder(sortable);
            }

            var payload = self.getPayload();

            $http({
                method: 'POST',
                url: $scope.$api,
                data: payload
            }).success(function(data){
                self.parse(data);
            });
        }
    }

    if($scope.loadPage === undefined){
        $scope.loadPage = function(offset){
            $scope.$offset = offset;
            $scope.update();
        }
    }

    if($scope.getKey === undefined){
        $scope.getKey = function(idx){
            // This is useful for generating column css class
            return $scope.$headers[idx].key;
        }
    }


    // Privates ---------------------------------------------------------------
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
        $scope.$pages = data.pages;
        $scope.$offset = data.pages.list[data.pages.current].key;
    };

    this.applyOrder = function(sortable){
        var keys = $(sortable).sortable('toArray');

        var headerOrder = [];
        for(var i=0; i<keys.length; i++){
            for(var j=0; j<$scope.$headers.length; j++){
                if(keys[i] === $scope.$headers[j].key){
                    headerOrder.push($scope.$headers.splice(j, 1)[0]);
                    break;
                }
            }
        }
        $scope.$headers = headerOrder;
    };

    this.initPayload = function(){
        return {
            offset: $scope.$offset,
            limit: $scope.$limit
        }
    };

    this.getPayload = function(){
        var clean = [];
        var headers = $scope.$headers;
        for(var i=0; i<headers.length; i++){
            var header = headers[i];
            clean.push({
                desc: header.desc,
                hidden: header.hidden,
                key: header.key
            });
        }

        return {
            offset: $scope.$offset,
            limit: $scope.$limit,
            headers: clean
        }
    }
}])
.directive('yat', [function(){
    return {
        restrict: 'E',
        controller: 'YATableController',
        templateUrl: function(elem, attrs){
            return attrs.template !== undefined ? attrs.template : 'yatable/table.html';
        },
        scope: true,
        link: function(scope, element, attrs){
            // Attribute parsing only -----------------------------------------
            if(attrs.api !== undefined){
                scope.$api = attrs.api;
            }

            if(attrs.limit !== undefined){
                scope.$limit = parseInt(attrs.limit);
            }

            if(attrs.offset !== undefined){
                scope.$offset = attrs.offset;
            }

            if(attrs.dropdowntext !== undefined){
                scope.dropdownText = attrs.dropdowntext;
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