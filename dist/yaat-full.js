/* Created: Fri Jul 10 2015 10:08:19 GMT+0200 (CEST)*/
angular.module('yaat', [])
.config(['$interpolateProvider', function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
}])
.controller('YATableController', ['$scope', '$http', function($scope, $http){
    var self = this;

    // Variable initialization -------------------------------------------------
    $scope.$limit = $scope.$limit || 25;
    $scope.$offset = $scope.$offset || null;
    $scope.$untouchedOffset = $scope.$offset;

    // Template URLs -----------------------------------------------------------
    $scope.$rowTemplate = $scope.$rowTemplate || 'yatable/row.html';
    $scope.$pagingTemplate = $scope.$pagingTemplate || 'yatable/paging.html';

    // Not-so private variables -----------------------------------------------
    $scope.dropdownText = $scope.dropdownText || 'Columns';

    $scope.$watch('$api', function(){
        $scope.init($scope.$api);
    });

    // Events ------------------------------------------------------------------

    $scope.$on('yaat.http.extra', function(e, args){
        $scope.$httpExtra = args;
    });

    $scope.$on('yaat.init', function(e, api){
        if($scope.$api === api){
            $scope.init($scope.$api);
        }
        $scope.$api = api;
    });

    $scope.$on('yaat.update', function(){
        $scope.update();
    });

    // Scope methods -----------------------------------------------------------
    if($scope.init === undefined){
        $scope.init = function(url){
            if(url !== undefined) {
                var payload = self.initPayload();
                if($scope.$httpExtra !== undefined){
                    payload.extra = $scope.$httpExtra;
                }
                $http({
                    method: 'POST',
                    url: url,
                    data: payload
                }).success(function(data) {
                    $scope.$emit('yaat.http.success');
                    self.parse(data);
                }).error(function(data, status, headers, config){
                    $scope.$emit('yaat.http.error', data, status, headers, config);
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

            if($scope.$httpExtra !== undefined){
                payload.extra = $scope.$httpExtra;
            }

            $http({
                method: 'POST',
                url: $scope.$api,
                data: payload
            }).success(function(data){
                $scope.$emit('yaat.http.success');
                self.parse(data);
            }).error(function(data, status, headers, config){
                $scope.$emit('yaat.http.error', data, status, headers, config);
            });
        }
    }

    if($scope.loadPage === undefined){
        $scope.loadPage = function(offset){
            if(offset){
                $scope.$offset = offset;
                $scope.update();
            }
        }
    }

    if($scope.getKey === undefined){
        $scope.getKey = function(idx){
            // This is useful for generating column css class
            return $scope.$headers[idx].key;
        }
    }

    $scope.toggleSorting = function(header){
        header.order = (header.order + 1) % 3;
        $scope.update();
    };

    // Controller only ---------------------------------------------------------
    this.parse = function(data){
        var headers = [];
        var visibleHeaders = [];
        for(var i=0; i<data.columns.length; i++){
            var header = data.columns[i];
            headers.push(header);
            if(header.order === undefined){
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
        var keys = $(sortable).find('li').map(function(){return this.id}).get();

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
            offset: $scope.$untouchedOffset,
            limit: $scope.$limit
        }
    };

    this.getPayload = function(){
        var clean = [];
        var headers = $scope.$headers;
        for(var i=0; i<headers.length; i++){
            var header = headers[i];
            clean.push({
                order: header.order,
                hidden: header.hidden,
                key: header.key
            });
        }

        return {
            offset: $scope.$offset,
            limit: $scope.$limit,
            headers: clean
        }
    };

    // Ready to receive events -------------------------------------------------
    $scope.$emit('yaat.ready');
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
            // Attribute parsing only ------------------------------------------
            if(attrs.api !== undefined){
                scope.$api = attrs.api;
            }

            if(attrs.limit !== undefined){
                scope.$limit = parseInt(attrs.limit);
            }

            if(attrs.offset !== undefined){
                scope.$offset = attrs.offset;
                scope.$untouchedOffset = attrs.offset;
            }

            if(attrs.dropdowntext !== undefined){
                scope.dropdownText = attrs.dropdowntext;
            }

            // Sortable setup --------------------------------------------------
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

            $(document).on('click', '.dropdown-menu', function(e) {
                e.stopPropagation();
            });
        }
    }
}])
.directive('ngIndeterminate', function($compile) {
    return {
        restrict: 'A',
        link: function(scope, element, attributes) {
            scope.$watch(attributes['ngIndeterminate'], function (value) {
                element.prop('indeterminate', !!value);
            });
        }
    };
});
angular.module("yaat").run(["$templateCache", function($templateCache) {$templateCache.put("yatable/table.html","<div class=\"yat\"><div class=\"ya-ctrls\"><ul class=\"ya-drop\"><li><span class=\"ya-drop-label\">[[ ::dropdownText ]]</span><ol class=\"ya-headers\"><li ng-repeat=\"header in $headers\" id=\"[[ ::header.key ]]\"><input type=\"checkbox\" class=\"ya-hide\" ng-model=\"header.hidden\" ng-disabled=\"header.unhideable\" ng-click=\"update()\"> <span class=\"ya-header-value\">[[ ::header.value ]]</span></li></ol></li></ul></div><div class=\"ya-wrap\"><table class=\"ya-table\"><thead><tr><th ng-repeat=\"header in $visibleHeaders\" class=\"yh-[[ ::header.key ]]\"><input type=\"checkbox\" class=\"ya-sort\" ng-model=\"header.desc\" ng-disabled=\"header.unsortable\" ng-click=\"update()\"> [[ ::header.value ]]</th></tr></thead><tbody ng-include=\"$rowTemplate\"></tbody></table></div><nav class=\"ya-paging\" ng-include=\"$pagingTemplate\"></nav></div>");
$templateCache.put("yatable/row.html","<tr ng-repeat=\"row in $rows\"><td ng-repeat=\"cell in row.values track by $index\" class=\"yc-[[ getKey($index) ]]\">[[ ::cell ]]</td></tr>");
$templateCache.put("yatable/paging.html","<ol><li ng-repeat=\"page in $pages.list track by $index\" ng-class=\"{\'ya-prev\': $first, \'ya-next\': $last, \'ya-current\': $index==$pages.current}\"><a ng-click=\"loadPage(page.key)\" ng-if=\"$index !== $pages.current\">[[ page.value ]]</a> <span ng-if=\"$index === $pages.current\">[[ page.value ]]</span></li></ol>");
$templateCache.put("yatable/bootstrap_table.html","<div class=\"yat\"><div class=\"ya-ctrls dropdown pull-right\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">[[ ::dropdownText ]] <span class=\"caret\"></span></button><ol class=\"ya-headers dropdown-menu\" aria-labelledby=\"dropdownMenu\"><li ng-repeat=\"header in $headers\" id=\"[[ ::header.key ]]\"><input type=\"checkbox\" class=\"glyphicon ya-hide\" ng-model=\"header.hidden\" ng-disabled=\"header.unhideable\" ng-click=\"update()\"> <span class=\"ya-header-value\">[[ ::header.value ]]</span></li></ol></div><div class=\"ya-wrap\"><table class=\"ya-table table table-bordered table-condensed table-customized table-striped\"><thead><tr><th ng-repeat=\"header in $visibleHeaders\" class=\"yh-[[ ::header.key ]]\"><input type=\"checkbox\" class=\"glyphicon ya-sort\" ng-indeterminate=\"header.order==1\" ng-checked=\"header.order==2\" ng-disabled=\"header.unsortable\" ng-click=\"toggleSorting(header)\"> [[ ::header.value ]]</th></tr></thead><tbody ng-include=\"$rowTemplate\"></tbody></table></div><nav class=\"ya-paging text-center\" ng-include=\"\'yatable/bootstrap_paging.html\'\"></nav></div>");
$templateCache.put("yatable/bootstrap_paging.html","<ol class=\"pagination pagination-lg\"><li ng-repeat=\"page in $pages.list track by $index\" ng-class=\"{\'ya-prev\': $first, \'ya-next\': $last, \'ya-current active\': $index==$pages.current}\"><a ng-click=\"loadPage(page.key)\" ng-if=\"$index !== $pages.current\">[[ page.value ]]</a> <span ng-if=\"$index === $pages.current\">[[ page.value ]]</span></li></ol>");}]);