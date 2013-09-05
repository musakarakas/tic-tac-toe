function GameCtrl ($scope) {
  'use strict';
  var Game, AI, Scores, Chains, grid;
  init();

  function init () {
    AI = load_ai();
    Scores = $scope.scores = load_scores();
    Chains = load_chains();
    Game = $scope.game = load_game();
  }

  function load_game () {
    var gameover, result, current_player;

    init();
    return {is_over: is_over, get_result: get_result,
      restart: restart, update_status: update_status,
      get_current_player: get_current_player, switch_player: switch_player};

    function init () {
      reset();
    }

    function restart () {
      reset();
      start();
    }

    function reset () {
      current_player = 'X';
      gameover = false;
      result = '';
      grid = $scope.grid = new Grid(3);
      Chains.reset();
    }

    function start () {
      if (Math.random() > 0.5) {
        switch_player();
        AI.play();
      }
    }

    function end (winner) {
      if (winner) {
        result = winner.toLowerCase() + '_wins';
        ++Scores[result];
      } else {
        result = 'tied';
        ++Scores.ties;
      }
      gameover = true;
    }

    function is_over () {
      return gameover;
    }

    function get_result () {
      return result;
    }

    function get_current_player () {
      return current_player;
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
      current_player = current_player === 'X' ? 'O' : 'X';
    }
  }

  function load_ai () {
    var random = {
      play: function () {
        var blanks = grid.get_blank_cells();
        var cell = blanks[Math.floor(Math.random() * blanks.length)];
        cell.play();
      }
    };
    var defensive = {
      play: function () {
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

    function longest () {
      if (!chains.length) return null;
      var longest = chains[0];
      for (var i = 1; i < chains.length; i++)
        if (chains[i].length > longest.length)
          longest = chains[i];
      return longest;
    }

    function digest (cell) {
      var neighbors = grid.get_neighbors_of(cell);
      for (var i = 0; i < 4; i++) {
        bind(neighbors[i], cell, i);
        bind(cell, neighbors[i + 4], i);
      }
    }

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
        cells[i][j] = new Cell();
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

    function Cell () {
      var chains = this.chains = [];

      this.click = function () {
        if (this.play() && !Game.is_over()) AI.play();
      };

      this.play = function () {
        if (Game.is_over() || this.owner) return false;
        this.owner = Game.get_current_player();
        Chains.digest(this);
        Game.update_status();
        Game.switch_player();
        return true;
      };

      this.max_chain_length = function () {
        var max = 0;
        for (var i = 0; i < chains.length; i++)
          if (chains[i] && chains[i].length > max)
            max = chains[i].length;
        return max;
      };
    }
  }
}
