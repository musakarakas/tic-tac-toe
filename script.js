var TicTacToe = angular.module('TicTacToe', []);

TicTacToe.directive('resizableFont', function () {
  'use strict';
  return {
    restrict: 'C',
    link: function (scope, element, attributes) {
      scope.$watch('view.window.size', function (size) {
        element.css({'font-size': size / 30 + 'px'});
      });
    }
  };
});

TicTacToe.directive('bigBox', function () {
  'use strict';
  return {
    restrict: 'C',
    link: function (scope, element, attributes) {
      scope.$watch('view.window.size', function (size) {
        element.css({width: size + 'px', height: size + 'px'});
      });
    }
  };
});

TicTacToe.directive('cell', function () {
  'use strict';
  return {
    restrict: 'C',
    link: function (scope, element, attributes) {
      scope.$watch('grid.size', function (value) {
        var size = 100 / value - 2 + '%';
        var font_size = 21 / value + 'em';
        element.css({width: size, height: size, 'font-size': font_size});
      });
    }
  };
});

TicTacToe.directive('highlight', function () {
  'use strict';
  return function (scope, element, attributes) {
    scope.$watch('game.result', function (value) {
      element.toggleClass('highlight', value === attributes['highlight']);
    });
  };
});

TicTacToe.controller('TicTacToeCtrl', function ($scope) {
  'use strict';

  var AI, Scores, Chains, Grid, Game;
  init();

  function init () {
    AI = load_ai();
    Scores = $scope.scores = load_scores();
    Chains = $scope.chains = load_chains();
    Grid = $scope.grid = load_grid();
    Game = $scope.game = load_game();
    $scope.view = load_view();
  }

  function load_view () {
    return {window: load_window(), classify: load_classifier()};

    function load_window () {
      var size;

      function resize () {
        size = Math.min(window.innerWidth, window.innerHeight);
      }

      window.onresize = function () { $scope.$apply(resize); };
      resize();

      return { get size () { return size; } };
    }

    function load_classifier () {
      return {cell: classify_cell};

      function classify_cell (cell) {
        var longest = Chains.longest(cell);
        var length = longest ? longest.length : 0;
        if (length < 2) return '';
        return length > 2 ? 'chain-long' : 'chain-short';
      }
    }
  }

  function load_game () {
    var current_player, result, game_over;

    init();
    return {
      restart: restart,
      click: click,
      get result () { return result; }
    };

    function init () {
      reset();
    }

    function restart () {
      reset();
      start();
    }

    function reset () {
      current_player = 'x';
      game_over = false;
      result = '';
      Grid.reset();
      Chains.reset();
    }

    function start () {
      if (Math.random() > 0.5) {
        switch_player();
        play(AI.pick_cell());
      }
    }

    function end (winner) {
      result = winner ? winner + '_wins' : 'ties';
      Scores[result]++;
      game_over = true;
    }

    function click (cell) {
      play(cell) && play(AI.pick_cell());
    }

    function play (cell) {
      if (game_over || cell.owner) return false;
      cell.owner = current_player;
      Chains.digest(cell);
      update_status();
      switch_player();
      return true;
    }

    function update_status () {
      var longest_chain = Chains.longest(), longest_length, winner;
      if (longest_chain) {
        longest_length = longest_chain.length;
        winner = longest_chain.owner;
      }
      if (longest_length >= 3)
        end(winner);
      else if (Grid.is_full())
        end();
    }

    function switch_player () {
      current_player = current_player === 'x' ? 'o' : 'x';
    }
  }

  function load_ai () {
    var random = {
      pick_cell: function () { return _.sample(Grid.get_blank_cells()); }
    };
    var defensive = {
      pick_cell: function () {}
    };
    return random;
  }

  function load_scores () {
    var scores = {
      reset: function () {
        this.x_wins = this.o_wins = this.ties = 0;
      }
    };
    scores.reset();
    return scores;
  }

  function load_chains () {
    var chains;
    init();
    return {reset: reset, longest: longest, digest: digest};

    function init () {
      reset();
    }

    function reset () {
      chains = [];
    }

    // Returns the longest chain that contains 'cell'
    function longest (cell) {
      var _chains = cell ? filter(cell) : chains;
      if (!_chains.length) return null;
      return _.max(_chains, function (chain) { return chain.length; });
    }

    // Returns an array of chains that contain 'cell'
    function filter (cell) {
      return _.filter(chains, function (chain) { return chain.contains(cell); });
    }

    function find (cell, direction) {
      return _.find(chains, function (chain) {
        return chain.direction === direction && chain.contains(cell);
      });
    }

    // Updates chain bindings of cell
    function digest (cell) {
      var neighbors = Grid.get_neighbors_of(cell);
      for (var i = 0; i < 4; i++) {
        bind(neighbors[i], cell, i);
        bind(cell, neighbors[i + 4], i);
      }
    }

    // Binds 'cell1' to 'cell2' with a chain in 'direction'
    function bind (cell1, cell2, direction) {
      if (!cell1 || !cell2 || !cell1.owner || cell1.owner !== cell2.owner)
        return;

      var chain1 = find(cell1, direction);
      if (!chain1) chains.push(chain1 = new Chain(cell1, direction));
      var chain2 = find(cell2, direction) || new Chain(cell2, direction);
      chain1.merge(chain2);
    }

    function Chain (cell, direction) {
      var cells = this.cells = [cell];
      this.merge = merge;
      this.contains = contains;

      Object.defineProperties(this, {
        direction: {get: get_direction},
        length: {get: get_length},
        owner: {get: get_owner}
      });

      function merge (chain) {
        _.each(chain.cells, function (cell) { cells.push(cell); });
      }

      function contains (cell) { return _.contains(cells, cell); }

      function get_direction () { return direction; }

      function get_length () { return cells.length; }

      function get_owner () { return cells[0].owner; }
    }
  }

  function load_grid () {
    var size = 3, cells = [];
    init();

    return {reset: reset, is_full: is_full, level_up: level_up, level_down: level_down,
      get_blank_cells: get_blank_cells, get_neighbors_of: get_neighbors_of,
      get size () { return size; }, get cells () { return _.flatten(cells); }
    };

    function init () {
      reset();
    }

    function level_up () {
      if (size < 10) {
        size++;
        Game.restart();
      }
    }

    function level_down () {
      if (size > 3) {
        size--;
        Game.restart();
      }
    }

    function reset () {
      cells.length = size;
      for (var i = 0; i < size; i++) {
        cells[i] = [];
        for (var j = 0; j < size; j++)
          cells[i][j] = {owner: null};
      }
    }

    function get_neighbors_of (cell) {
      var index = find(cell), i = index.row, j = index.col;
      return [
        cells[i][j - 1], // W ←
        cells[i - 1] && cells[i - 1][j - 1], // NW ↖
        cells[i - 1] && cells[i - 1][j], // N ↑
        cells[i - 1] && cells[i - 1][j + 1], // NE ↗
        cells[i][j + 1], // E →
        cells[i + 1] && cells[i + 1][j + 1], // SE ↘
        cells[i + 1] && cells[i + 1][j], // S ↓
        cells[i + 1] && cells[i + 1][j - 1]  // SW ↙
      ];
    }

    function find (cell) {
      for (var i = 0; i < size; i++)
        for (var j = 0; j < size; j++)
          if (cells[i][j] === cell)
            return {row: i, col: j};
      return null;
    }

    function is_full () { return !get_blank_cells().length; }

    function get_blank_cells () {
      return _.filter(_.flatten(cells), function (cell) {return !cell.owner;});
    }
  }
});
