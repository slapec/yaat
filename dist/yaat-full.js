/* Created: Fri Sep 04 2015 18:01:21 GMT+0200 (CEST)*/
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
    $scope.$noDropdown = $scope.$noDropdown || false;
    $scope.$noControls = $scope.$noControls || false;
    $scope.$yaatId = $scope.$yaatId || null;
    $scope.$untouchedOffset = $scope.$offset;
    $scope.$postExtra = {};

    // Template URLs -----------------------------------------------------------
    $scope.$controlsTemplate = $scope.$controlsTemplate || 'yatable/controls.html';
    $scope.$rowTemplate = $scope.$rowTemplate || 'yatable/row.html';
    $scope.$pagingTemplate = $scope.$pagingTemplate || 'yatable/paging.html';

    // Not-so private variables ------------------------------------------------
    $scope.dropdownText = $scope.dropdownText || 'Columns';

    // Watchers ----------------------------------------------------------------
    $scope.$watch('$api', function(){
        $scope.init($scope.$api);
    });

    $scope.$watch('$limit', function(newValue, oldValue){
        if(newValue !== oldValue){
            $scope.init($scope.$api);
        }
    });

    // Events ------------------------------------------------------------------
    $scope.$on('yaat.http.post.add', function(e, key, model, target){
        if(target === undefined || target == $scope.$yaatId){
            if(key === 'offset' || key === 'limit' || key === 'headers'){
                throw Error("Key '" + key + "' conflicts with the internals of yaat");
            }
            else {
                $scope.$postExtra[key] = model;
            }
        }
    });

    $scope.$on('yaat.http.post.remove', function(e, key, model, target){
        if(target === undefined || target == $scope.$yaatId){
            delete $scope.$postExtra[key];
        }
    });

    $scope.$on('yaat.init', function(e, api, target){
        if(target === undefined || target == $scope.$yaatId){
            if($scope.$api === api){
                $scope.init($scope.$api);
            }
            $scope.$api = api;
        }
    });

    $scope.$on('yaat.update', function(e, target){
        if(target === undefined || target === $scope.$yaatId){
            $scope.update();
        }
    });

    // Scope methods -----------------------------------------------------------
    if($scope.init === undefined){
        $scope.init = function(url){
            if(url !== undefined) {
                var payload = angular.extend({}, self.initPayload(), $scope.$postExtra);
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

            var payload = angular.extend({}, self.getPayload(), $scope.$postExtra);

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
            return $scope.$visibleHeaders[idx].key;
        }
    }

    if($scope.getIndex === undefined){
        $scope.getIndex = function(key){
            return $scope.$visibleHeadersReverse[key];
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
        var visibleHeadersReverse = {};
        var visibleIndex = 0;
        for(var i=0; i<data.columns.length; i++){
            var header = data.columns[i];
            headers.push(header);
            if(header.order === undefined){
                header.unorderable = true;
            }
            if(header.hidden === undefined){
                header.unhideable = true;
                visibleHeaders.push(header);
                visibleHeadersReverse[header.key] = visibleIndex++;
            }
            else if(header.hidden === false){
                visibleHeaders.push(header);
                visibleHeadersReverse[header.key] = visibleIndex++;
            }
        }
        $scope.$headers = headers;
        $scope.$visibleHeaders = visibleHeaders;
        $scope.$visibleHeadersReverse = visibleHeadersReverse;
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
                scope.$limit = scope.$eval(attrs.limit);
                scope.$watch(attrs.limit, function(newValue, oldValue){
                    if(newValue !== oldValue){
                        scope.$limit = newValue;
                    }
                });
            }

            if(attrs.offset !== undefined){
                scope.$offset = attrs.offset;
                scope.$untouchedOffset = attrs.offset;
            }

            if(attrs.dropdowntext !== undefined){
                scope.dropdownText = attrs.dropdowntext;
            }

            if(attrs.nodropdown !== undefined){
                scope.$noDropdown = true;
            }

            if(attrs.nocontrols !== undefined){
                scope.$noControls = true;
            }

            if(attrs.id !== undefined){
                scope.$yaatId = attrs.id;
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

            var disable = scope.$on('$includeContentLoaded', function(e, url){
                if(url === 'yatable/dropdown.html'){
                    disable();

                    var headerList = $(element).find('.ya-headers');
                    headerList.disableSelection();
                    headerList.sortable(options);

                    // To avoid the dropdown closing itself when clicking on a checkbox
                    $(document).on('click', '.dropdown-menu', function(e) {
                        e.stopPropagation();
                    });
                }
            });

            // Ready to receive events -------------------------------------------------
            scope.$emit('yaat.ready');
        }
    }
}]);
angular.module("yaat").run(["$templateCache", function($templateCache) {$templateCache.put("yatable/table.html","<div class=\"yat\"><div class=\"ya-ctrls\" ng-hide=\"$noControls\" ng-include=\"\'yatable/controls.html\'\"></div><div class=\"ya-wrap\"><table class=\"ya-table table table-bordered table-condensed table-customized table-striped\"><thead><tr><th ng-repeat=\"header in $visibleHeaders\" class=\"yh-[[ ::header.key ]]\">[[ ::header.value ]] <span ng-switch on=\"header.order\" ng-click=\"toggleSorting(header)\" class=\"ya-sort-btn\"><i ng-switch-when=\"0\" class=\"glyphicon glyphicon-sort ya-unsorted\"></i> <i ng-switch-when=\"1\" class=\"glyphicon glyphicon-sort-by-attributes\"></i> <i ng-switch-when=\"2\" class=\"glyphicon glyphicon-sort-by-attributes-alt\"></i></span></th></tr></thead><tbody ng-include=\"$rowTemplate\"></tbody></table></div><nav class=\"ya-paging text-center\" ng-include=\"\'yatable/paging.html\'\"></nav></div>");
$templateCache.put("yatable/controls.html","<div class=\"pull-right dropdown\" ng-hide=\"$noDropdown\" ng-include=\"\'yatable/dropdown.html\'\"></div>");
$templateCache.put("yatable/dropdown.html","<button class=\"btn btn-default dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">[[ ::dropdownText ]] <span class=\"caret\"></span></button><ol class=\"ya-headers dropdown-menu\" aria-labelledby=\"dropdownMenu\"><li ng-repeat=\"header in $headers\" id=\"[[ ::header.key ]]\"><input id=\"hide-[[ ::header.key ]]\" type=\"checkbox\" class=\"glyphicon ya-hide\" ng-model=\"header.hidden\" ng-disabled=\"header.unhideable\" ng-click=\"update()\"><label for=\"hide-[[ ::header.key ]]\" class=\"glyphicon\"></label><span class=\"ya-header-value\">[[ ::header.value ]]</span></li></ol>");
$templateCache.put("yatable/row.html","<tr ng-repeat=\"row in $rows\"><td ng-repeat=\"cell in row.values track by $index\" class=\"yc-[[ getKey($index) ]]\">[[ ::cell ]]</td></tr>");
$templateCache.put("yatable/paging.html","<ol class=\"pagination pagination-lg\"><li ng-repeat=\"page in $pages.list track by $index\" ng-class=\"{\'ya-prev\': $first, \'ya-next\': $last, \'ya-current active\': $index==$pages.current}\"><a ng-click=\"loadPage(page.key)\" ng-if=\"$index !== $pages.current\">[[ page.value ]]</a> <span ng-if=\"$index === $pages.current\">[[ page.value ]]</span></li></ol>");}]);