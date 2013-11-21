angular.module("userListModule").config(["$routeProvider","piProvider","config",function(a,b,c){function d(a){return c.assetRoot+a+".html"}function e(a){return{data:["$q","$route","$rootScope","server",function(b,d,e,f){var g=b.defer(),h=d.current.params;return e.alert=2,f.get(a,h).success(function(a){for(var b=a.users,d=0,i=b.length;i>d;d++){var j=b[d];j.checked=0,j.front_roles&&(j.front_roles=j.front_roles.join(",")),j.admin_roles&&(j.admin_roles=j.admin_roles.join(",")),j.editUrl=c.editUrlRoot+"index/uid/"+j.id}angular.extend(a,f.getRoles()),a.filter=h,g.resolve(a),e.alert=""}),g.promise}]}}a.when("/all",{templateUrl:d("index-all"),controller:"ListCtrl",resolve:e("all")}).when("/activated",{templateUrl:d("index-activated"),controller:"ListCtrl",resolve:e("activated")}).when("/pending",{templateUrl:d("index-pending"),controller:"ListCtrl",resolve:e("pending")}).when("/new",{templateUrl:d("index-new"),controller:"NewCtrl"}).when("/search",{templateUrl:d("advanced-search"),controller:"SearchCtrl"}).when("/all/search",{templateUrl:d("advanced-search-result"),controller:"ListCtrl",resolve:e("search")}).otherwise({redirectTo:"/all"}),b.hashPrefix(),b.navTabs(c.navTabs),b.translations(c.t),b.ajaxSetup(),b.setGetHeader()}]).service("server",["$http","$cacheFactory","config",function(a,b,c){var d=c.urlRoot;this.get=function(b,c){return a.get(d+b,{params:c})},this.filterEmpty=function(a){var b={};for(var c in a)a[c]&&(b[c]=a[c]);return b},this.getRoles=function(){var a=[],b=[],d=[];return angular.forEach(c.roles,function(c){"front"==c.type&&a.push(c),"admin"==c.type&&b.push(c),"member"!=c.name&&d.push(c)}),{frontRoles:a,adminRoles:b,roles:c.roles,assignRoles:d}},this.roles=c.roles,this.disable=function(b){return angular.isArray(b)&&(b=b.join(",")),a.post(d+"disable",{ids:b})},this.enable=function(b){return angular.isArray(b)&&(b=b.join(",")),a.post(d+"enable",{ids:b})},this.active=function(b){return angular.isArray(b)&&(b=b.join(",")),a.post(d+"activateUser",{ids:b})},this.remove=function(b){return angular.isArray(b)&&(b=b.join(",")),a.post(d+"deleteUser",{ids:b})},this.add=function(b){return a.post(d+"addUser",b)},this.assignRole=function(b,c,e){return angular.isArray(b)&&(b=b.join(",")),a.post(d+"assignRole",{ids:b,role:c,type:e})},this.advanceSearch=function(b){return a.get(d+"search",{params:b})},this.uniqueUrl=d+"checkExist"}]).service("editServer",["$http","config",function(a,b){var c=b.editUrlRoot;this.urlRoot=b.editUrlRoot,this.get=function(b){var d=b.id;return a.get(c+"index",{cache:!0,params:{uid:d}}).success(function(a){switch(a.action=b.action,angular.forEach(a.nav,function(a){a.href="#!/edit/"+d+"/"+a.name}),a.action){case"info":a.formHtmlUrl=c+"info?uid="+d;break;case"avatar":a.formHtmlUrl="avatar-template.html";break;default:a.formHtmlUrl=c+"compound?uid="+d+"&compound="+a.action}})},this.defaultAvatar=function(b){return a.get(c+"avatar",{params:{uid:b}})},this.deleteCompound=function(b,d,e){return a.post(c+"deleteCompound",{uid:b,compound:d,set:e})}}]).controller("ListCtrl",["$scope","$location","data","config","server",function(a,b,c,d,e){function f(){var b=[];return angular.forEach(a.users,function(a){a.checked&&b.push(a.id)}),b.length||(a.$parent.alert={status:0,message:d.t.BATCH_CHECKED}),b}function g(a,b){a.checked&&(a.front_roles=b.front_roles?b.front_roles.join(","):"",a.admin_roles=b.admin_roles?b.admin_roles.join(","):"",a.checked=0)}function h(b,c){if(c.status){var d=c.users_status,e=function(a){var b=d[a.id];a.active=b.active,a.time_disabled=b.disabled,a.time_activated=b.activated,a.checked=0};angular.isArray(b)?(a.allChecked=0,angular.forEach(b,function(a){a.checked&&e(a)})):e(b)}}angular.extend(a,c),a.$watch("paginator.page",function(a,c){a!==c&&b.search("p",a)}),a.markAll=function(){angular.forEach(a.users,function(b){b.checked=a.allChecked})},a.disableBatchAction=function(){var b=f();b.length&&e.disable(b).success(function(b){h(a.users,b)})},a.enableAction=function(a){a.time_disabled?e.enable(a.id).success(function(b){h(a,b)}):e.disable(a.id).success(function(b){h(a,b)})},a.enableBatchAction=function(){var b=f();b.length&&e.enable(b).success(function(b){h(a.users,b)})},a.activeAction=function(a){a.time_activated||confirm(d.t.CONFIRM_ACTIVATED)&&e.active(a.id).success(function(b){h(a,b)})},a.activeBatchAction=function(){var b=f();b.length&&confirm(d.t.CONFIRM_ACTIVATED_BATCH)&&e.active(b).success(function(b){h(a.users,b)})},a.deleteAction=function(a){if(confirm(d.t.CONFIRM)){var b=this.users,c=b[a];e.remove(c.id).success(function(c){c.deleted_uids&&b.splice(a,1)})}},a.deleteBatchAction=function(){var b=f();b.length&&confirm(d.t.CONFIRMS)&&e.remove(b).success(function(b){var c=[],d=b.deleted_uids||[];a.allChecked=0,angular.forEach(a.users,function(a){-1==d.indexOf(a.id)&&(c.push(a),a.checked=0)}),a.users=c})},a.assignRoleBacthAction=function(){var b=a.assignRole,c=f();a.assignRole="",c.length&&b&&e.assignRole(c,b.name,"add").success(function(b){b.status&&(a.allChecked=0,angular.forEach(a.users,function(a){g(a,b.data[a.id])}))})},a.unassignRoleBacthAction=function(){var b=a.unassignRole,c=f();a.unassignRole="",c.length&&b&&e.assignRole(c,b,"remove").success(function(b){b.status&&(a.allChecked=0,angular.forEach(a.users,function(a){g(a,b.data[a.id])}))})},a.filterAction=function(){b.search(e.filterEmpty(a.filter)),b.search("p",null)}}]).controller("NewCtrl",["$scope","server",function(a,b){function c(){angular.forEach(a.roles,function(a){a.checked=-1!=d.roles.indexOf(a.name)?!0:!1})}var d={activated:1,enable:1,roles:["member"]};a.entity=angular.copy(d),a.uniqueUrl=b.uniqueUrl,a.roles=angular.copy(b.roles),c(),a.submit=function(){b.add(a.entity).success(function(b){b.status&&(a.entity=angular.copy(d),a.userForm.$setPristine(),c())})},a.$watch("roles",function(){var b=[];angular.forEach(a.roles,function(a){a.checked&&b.push(a.name)}),a.entity.roles=b},!0)}]).controller("SearchCtrl",["$scope","$location","$filter","config","server",function(a,b,c,d,e){a.roles=angular.copy(e.roles),a.today=d.today,a.filter={},a.$watch("roles",function(b,c){if(b===c)return angular.forEach(b,function(a){"member"==a.name&&(a.checked=!0)}),void 0;var d=[],e=[],f=a.filter;angular.forEach(b,function(a){a.checked&&("front"==a.type?d.push(a.name):e.push(a.name))}),d.length&&(f.front_role=d.join(",")),e.length&&(f.admin_role=e.join(","))},!0),a.submit=function(){var d=angular.copy(a.filter),e=function(a){return c("date")(a,"yyyy-M-d")};d.time_created_from&&(d.time_created_from=e(d.time_created_from)),d.time_created_to&&(d.time_created_to=e(d.time_created_to)),b.path("/all/search").search(d)}}]);