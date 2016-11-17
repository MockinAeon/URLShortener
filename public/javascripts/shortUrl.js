var app = angular.module('wxr-ShortUrl', []);

var list = new Array();
app.controller('shortUrl-controller', ['$scope', '$http', function ($scope, $http) {
	$scope.shortenFun = function ($timeout) {
		var check = $scope.longUrl.replace('http://', '').replace('https://', '').startsWith('127.0.0.1:3000');
		if (check) {
			$scope.errorData = 'Unable to create short URL';

		} else {
			$scope.show = true;
			$scope.errorData = '';
			$scope.shortUrl = null;
			$http({
				method: 'POST',
				url: '/shorten',
				data: {
					longUrl: $scope.longUrl
				}
			}).
			then(function (response) {
				$scope.status = response.status;
				$scope.shortUrl = response.data;
				$scope.longUrlShow = $scope.longUrl;
				var newData = {
					'sUrl': $scope.shortUrl,
					'lUrl': $scope.longUrlShow
				};
				list.push(newData);
				$scope.list = list;
			}, function (response) {
				$scope.shortUrl = response.data || 'Request failed';
				$scope.status = response.status;
			});
		}
	};
  }]);

$('#shorten').click(function () {
	var check = $('.input-text').val();
	if (check.replace('http://', '').replace('https://', '').startsWith('127.0.0.1:3000')) {
		$('.error').show(200).delay(2000).hide(200);
	}
	if (check == '') {
		$('.input-text').css({
			"border": "1px solid rgb(140, 22, 21)"
		})
	}
});
$(".input-text").focusin(function () {
	$(this).css({
		"border": "1px solid lightgray"
	});
});
$(".input-text").bind('keypress', function (event) {
	if (event.keyCode == "13"){
		$('#shorten').click();
	}

});