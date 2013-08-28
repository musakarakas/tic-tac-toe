function GameCtrl($scope) {
  var TicTacToe = $scope.TicTacToe = {};

  TicTacToe.init = function() {
    this.grid = [[], [], []];
    this.emptyCells = 9;
    this.gameIsOver = false;
    this.isDraw = false;
    this.player = 'X';
    this.line = -1;

    for (var i = 0; i < 3; i++)
      for (var j = 0; j < 3; j++)
        this.grid[i][j] = ' ';

    if (Math.random() > .5) {
      this.switchPlayer();
      this.aiPlay();
    }
  };

  TicTacToe.isGameOver = function() {
    // 3 rows + 3 columns + 2 diagonals
    var lines = new Array(8);

    for (var i = 0; i < 8; i++)
      lines[i] = '';

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        lines[i] += this.grid[i][j];
        lines[i + 3] += this.grid[j][i];
      }
      lines[6] += this.grid[i][i];
      lines[7] += this.grid[i][2 - i];
    }

    // Somebody wins if "XXX" or "OOO" is found
    for (var i = 0; i < 8; i++) {
      if (lines[i] === 'XXX' || lines[i] === 'OOO') {
        this.line = i;
        return true;
      }
    }

    // Nobody wins and no empty cells
    if (this.emptyCells === 0) {
      this.isDraw = true;
      return true;
    }

    return false;
  };

  TicTacToe.switchPlayer = function() {
    this.player = this.player === 'X' ? 'O' : 'X';
  };

  TicTacToe.play = function(row, col) {
    if (this.gameIsOver || this.grid[row][col] !== ' ')
      return false;

    this.grid[row][col] = this.player;
    this.emptyCells--;

    this.gameIsOver = this.isGameOver();

    if (this.gameIsOver) {
      alert(this.isDraw ? "It's a draw!" : "Player " + this.player + " wins!");
      if (this.isDraw) ScoreBoard.draws++;
      else if (this.player === 'X') ScoreBoard.x_wins++;
      else if (this.player === 'O') ScoreBoard.o_wins++;
    }

    this.switchPlayer();
    return true;
  };

  TicTacToe.aiPlay = function() {
    if (this.gameIsOver) return;
    var empty = [];
    for (var i = 0; i < 3; i++)
      for (var j = 0; j < 3; j++)
        if (this.grid[i][j] === ' ')
          empty.push([i, j]);

    var cell = empty[Math.floor(Math.random() * empty.length)];
    TicTacToe.play(cell[0], cell[1]);
  };

  TicTacToe.isLine = function(row, col) {
    var line = this.line, gameover = this.gameIsOver;

    return gameover && (
            row === line || // horizontal
            col === line - 3 || // vertical
            row === col && line === 6 || // \-diagonal
            row === 2 - col && line === 7 // /-diagonal
            );
  };

  TicTacToe.click = function(row, col) {
    if (TicTacToe.play(row, col))
      TicTacToe.aiPlay();
  };

  var ScoreBoard = $scope.ScoreBoard = {};

  ScoreBoard.init = function() {
    this.o_wins = 0;
    this.x_wins = 0;
    this.draws = 0;
  };

  TicTacToe.init();
  ScoreBoard.init();
}
