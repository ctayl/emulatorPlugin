var emulatorPluginApp = angular.module('emulatorPlugin', [ 'infinite-scroll' ]);

emulatorPluginApp.controller('emulatorPluginCtrl', ['$scope', '$sce', controller]);
function controller($scope, $sce) {

	$scope.apps = [];
	// $scope.results = [];
	$scope.searchQuery = '';
	$scope.busy = false;

	$scope.search = function () {
		debounce(_search, 500, false);
	};

	function _search() {
		const options = {
			filter: { "$json.name": { "$regex": $scope.searchQuery }}
		};
		buildfire.datastore.search(options, "test_app_data", (error, apps) => {
			if (error) return console.error(error);

			$scope.apps = apps;
			digest();
		});
	}

	$scope.openApp = function ({ appId }) {
		return console.error(appId);
		buildfire.navigation.navigateEmulator({appId });
	}

	$scope.loadMore = function () {
		console.error('loadMore');
		$scope.busy = true;
		const options = {
			limit: 20,
			skip: $scope.apps.length
		};

		if ($scope.searchQuery) {
			options.filter = { "$json.name": { "$regex": $scope.searchQuery }};
		}
		console.error(options);
		buildfire.datastore.search(options, "test_app_data", loadApps);
	}


	let timeout;
	function debounce(func, wait) {

		clearTimeout(timeout);

		timeout = setTimeout(function() {
			timeout = null;
			func();
		}, wait);

		if (!timeout) func();
	}

	$scope.loadMore();

	function loadApps(error, apps) {
		if (error) return console.error(error);

		$scope.apps = [ ...$scope.apps, ...apps];
		$scope.busy = false;
		digest();
	}


	function digest() {
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	}

	$scope.$watch('searchQuery', () => console.error($scope), true);
}
