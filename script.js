var TicTacToe = angular.module('TicTacToe', []);

TicTacToe.directive("highlight", function () {
  'use strict';

  return function (scope, element, attrs) {
    scope.$watch("game.result", function (value) {
      element.toggleClass('highlight', value === attrs.highlight);
    });
  };
});

TicTacToe.controller('TicTacToeCtrl', function ($scope) {
  'use strict';

  var AI, Scores, Chains, grid;
  init();

  function init () {
    AI = load_ai();
    Scores = $scope.scores = load_scores();
    Chains = $scope.chains = load_chains();
    $scope.game = load_game();
  }

  function load_game () {
    var current_player, result, game_over;

    init();
    return {
      restart: restart,
      click: click,
      get result () {
        return result;
      }
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
      grid = $scope.grid = new Grid(3);
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
      if (longest_length === 3)
        end(winner);
      else if (grid.is_full())
        end();
    }

    function switch_player () {
      current_player = current_player === 'x' ? 'o' : 'x';
    }
  }

  function load_ai () {
    var random = {
      pick_cell: function () {
        var blanks = grid.get_blank_cells();
        return blanks[Math.floor(Math.random() * blanks.length)];
      }
    };
    var defensive = {
      pick_cell: function () {
      }
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
    return {reset: reset, longest: longest,
      digest: digest, add: add, remove: remove};

    function init () {
      reset();
    }

    function reset () {
      chains = [];
    }

    // Returns the longest chain that contains 'cell'
    function longest (cell) {
      return longest_of(filter(cell));
    }

    // Returns the longest chain in 'chains'
    function longest_of (chains) {
      if (!chains.length) return null;
      var longest = chains[0];
      for (var i = 1; i < chains.length; i++)
        if (chains[i].length > longest.length)
          longest = chains[i];
      return longest;
    }

    // Returns an array of chains that contain 'cell'
    function filter (cell) {
      if (!cell) return chains;

      var filtered = [];
      for (var i = 0; i < chains.length; i++)
        if (chains[i].cells.indexOf(cell) !== -1)
          filtered.push(chains[i]);
      return filtered;
    }

    // Updates chain bindings of cell
    function digest (cell) {
      var neighbors = grid.get_neighbors_of(cell);
      for (var i = 0; i < 4; i++) {
        bind(neighbors[i], cell, i);
        bind(cell, neighbors[i + 4], i);
      }
    }

    // Binds 'cell1' to 'cell2' with a chain in 'direction'
    function bind (cell1, cell2, direction) {
      if (!cell1 || !cell2 || !cell1.owner || cell1.owner !== cell2.owner)
        return false;
      if (!cell1.chains[direction])
        cell1.chains[direction] = new Chain(cell1, direction);
      cell1.chains[direction].bind(cell2);
      return true;
    }

    function add (chain) {
      if (chains.indexOf(chain) === -1)
        chains.push(chain);
    }

    function remove (chain) {
      var i = chains.indexOf(chain);
      if (i !== -1) chains.splice(i, 1);
    }

    function Chain (cell, direction) {
      var cells = this.cells = [cell];
      this.bind = bind;

      Object.defineProperties(this, {
        length: {get: get_length},
        owner: {get: get_owner}
      });

      Chains.add(this);

      var self = this;

      function add (cell) {
        cell.chains[direction] = self;
        cells.push(cell);
      }

      function bind (cell) {
        if (cell.chains[direction]) merge(cell.chains[direction]);
        else add(cell);
      }

      function merge (chain) {
        for (var i = 0; i < chain.length; i++)
          add(chain.cells[i]);
        Chains.remove(chain);
      }

      function get_length () {
        return cells.length;
      }

      function get_owner () {
        return cells[0].owner;
      }
    }
  }

  function Grid (size) {
    var cells = this.cells = [];
    this.is_full = is_full;
    this.get_blank_cells = get_blank_cells;
    this.get_neighbors_of = get_neighbors_of;

    for (var i = 0; i < size; i++) {
      cells[i] = [];
      for (var j = 0; j < size; j++)
        cells[i][j] = {owner: null, chains: []};
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
      return {row: -1, col: -1};
    }

    function is_full () {
      return !get_blank_cells().length;
    }

    function get_blank_cells () {
      var blanks = [];
      for (var i = 0; i < size; i++)
        for (var j = 0; j < size; j++)
          if (!cells[i][j].owner)
            blanks.push(cells[i][j]);
      return blanks;
    }
  }
});
