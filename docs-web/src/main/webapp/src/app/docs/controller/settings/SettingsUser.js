'use strict';

/**
 * Settings user page controller.
 */
angular.module('docs').controller('SettingsUser', function($scope, $state, Restangular) {
  /**
   * Load users from server.
   */
  $scope.loadUsers = function() {
    Restangular.one('user/list').get({
      sort_column: 1,
      asc: true
    }).then(function(data) {
      $scope.users = data.users;
      //log the users
      console.log($scope.users);
    });
  };
  
  $scope.loadUsers();
  
  /**
   * Edit a user.
   */
  $scope.editUser = function(user) {
    $state.go('settings.user.edit', { username: user.username });
  };

  /**
   * Approve a user.
   */
  $scope.approveUser = function(user, $event) {
    $event.stopPropagation();
    Restangular.one('user', user.username).post('approve').then(function() {
      $scope.loadUsers();
    });
  };

  /**
   * Kill a user.
   */
  $scope.killUser = function(user, $event) {
    $event.stopPropagation();
    Restangular.one('user', user.username).post('kill').then(function() {
      $scope.loadUsers();
    });
  };
});