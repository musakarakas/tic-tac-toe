var TicTacToe = {};

TicTacToe.init = function () {
  this.grid = [[], [], []];
  this.emptyCells = 9;
  this.gameIsOver = false;
  this.isDraw = false;
  this.player = 'O';

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++)
      this.grid[i][j] = ' ';
  }
};

TicTacToe.isGameOver = function () {
  // 3 rows + 3 columns + 2 diagonals
  var lines = new Array(8);

  for (var i = 0; i < 8; i++)
    lines[i] = '';

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      lines[i] += this.grid[i][j];
      lines[i+3] += this.grid[j][i];
    }
    lines[6] += this.grid[i][i];
    lines[7] += this.grid[i][2 - i];
  }

  // Somebody wins if "XXX" or "OOO" is found
  for (var i = 0; i < 8; i++)
    if (lines[i] == 'XXX' || lines[i] == 'OOO')
      return true;

  // Nobody wins and no empty cells
  if (this.emptyCells == 0) {
    this.isDraw = true;
    return true;
  }

  return false;
};

TicTacToe.switchPlayer = function () {
  this.player = this.player == 'X' ? 'O' : 'X';
};

TicTacToe.play = function (row, col, cell) {
  if (this.gameIsOver)
    return;

  if (this.grid[row][col] != ' ') {
    console.log('cell already filled');
    return;
  }

  this.grid[row][col] = this.player;
  $(cell).text(this.grid[row][col]);
  this.emptyCells--;

  this.gameIsOver = this.isGameOver();

  if (this.gameIsOver)
    alert(this.isDraw ? "It's a draw!" : "Player " + this.player + " wins!");

  this.switchPlayer();
};

$(function () {
  TicTacToe.init();

  $('td').click(function () {
    var row = $(this).parent().index();
    var col = $(this).index();
    TicTacToe.play(row, col, this);
  });
});
