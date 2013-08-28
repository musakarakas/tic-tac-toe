var TicTacToe = {};

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

  $('.tic-tac-toe td').removeClass('line');
  this.redraw();
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

  TicTacToe.redraw();

  if (this.gameIsOver) {
    alert(this.isDraw ? "It's a draw!" : "Player " + this.player + " wins!");
    if (this.isDraw) ScoreBoard.draws++;
    else if (this.player === 'X') ScoreBoard.x_wins++;
    else if (this.player === 'O') ScoreBoard.o_wins++;
    ScoreBoard.redraw();
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

TicTacToe.redraw = function() {
  var line = this.line, gameover = this.gameIsOver;

  $('.tic-tac-toe td').each(function() {
    var row = $(this).parent().index();
    var col = $(this).index();
    $(this).text(TicTacToe.grid[row][col]);

    if (gameover) {
      // Highlight if 3-in-a-row
      if (row === line || // horizontal
              col === line - 3 || // vertical
              row === col && line === 6 || // \-diagonal
              row === 2 - col && line === 7) // /-diagonal
        $(this).addClass('line');
    }
  });
};

var ScoreBoard = {};

ScoreBoard.init = function() {
  this.o_wins = 0;
  this.x_wins = 0;
  this.draws = 0;
  this.redraw();
};

ScoreBoard.redraw = function() {
  $('.scoreboard .o_wins').text(this.o_wins);
  $('.scoreboard .x_wins').text(this.x_wins);
  $('.scoreboard .draws').text(this.draws);
};

$(function() {
  TicTacToe.init();
  ScoreBoard.init();

  $('.tic-tac-toe td').click(function() {
    var row = $(this).parent().index();
    var col = $(this).index();
    if (TicTacToe.play(row, col))
      TicTacToe.aiPlay();
  });

  $('button:contains("Reset")').click(function() {
    ScoreBoard.init();
  });

  $('button:contains("Start")').click(function() {
    TicTacToe.init();
  });
});
