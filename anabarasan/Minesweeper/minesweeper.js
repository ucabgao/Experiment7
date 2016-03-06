function Cell() {
  this.value = 0;
  this.state = 'up';
}

function MineField() {
  var self = this;

  this.create = function create(field, rows, cols, mines) {
    self.field = field;
    self.cells = null;
    self.rows = rows;
    self.cols = cols;
    self.mines = mines;
    self.flags = 0;
    self.downs = (rows * cols) - mines;

    self.createCells();
    self.addMines();
    self.renderField();
  };

  this.createCells = function createCells() {
    self.cells = [];
    for (var row = 0; row < self.rows; row ++) {
      self.cells[row] = [];
      for (var col = 0; col < self.cols; col ++) {
        self.cells[row][col] = new Cell();
      }
    }
  };

  this.addMines = function addMines() {
    for (var mine = 0; mine < self.mines; mine ++) {
      self.buryMine();
    }
  };

  this.buryMine = function buryMine() {
    var row, col;
    do {
      row = Math.floor(Math.random() * self.rows);
      col = Math.floor( Math.random() * self.cols);
    } while (self.isMine(row, col));
    self.cells[row][col].value = 'm';
    console.debug('Buried mine at co-ordinates (' + row + ', ' + col + ')');
    self.addClues(row, col);
  };

  this.addClues = function addClues(row, col) {
    console.debug('Bomb set @ (' + row + ', ' + col + ')');
    console.debug('row', Math.max(row - 1, 0), Math.min(row + 1, self.rows - 1));
    console.debug('col', Math.max(col - 1, 0), Math.min(col + 1, self.cols - 1));
    for (var r = Math.max(row - 1, 0); r <= Math.min(row + 1, self.rows - 1); r++) {
      for (var c = Math.max(col - 1, 0); c <= Math.min(col + 1, self.cols - 1); c++) {
        console.debug('setting Clue @ row : ' + r + ', col : ' + c);
        if (! self.isMine(r, c)) {
          self.cells[r][c].value ++;
          console.debug('incrementing (' + r + ', ' + c + ') to ' + self.cells[r][c].value);
        }
      }
    }
  };

  this.isMine = function isMine(row, col) {
  try {
    return self.cells[row][col].value === 'm';
  } catch (err) {
    console.error(err.message);
    console.error(row, col);
    throw err.message;
  }
  };

  this.isEmpty = function isEmpty(row, col) {
    return self.cells[row][col].value === 0;
  };

  this.renderField = function renderField() {
    self.field.innerHTML='';
    var table = document.createElement('table');
    for (var row = 0; row < self.rows; ++ row) {
      var tr = document.createElement('tr');
      for (var col = 0; col < self.cols; ++ col ) {
        tr.appendChild(this.renderCell(row, col));
      }
      table.appendChild(tr);
    }
    self.field.appendChild(table);
  };

  this.renderCell = function renderCell(row, col) {
    var cell = document.createElement('td');
    cell.id = 'Cell' + String(row * self.cols + col);
    cell.className = self.cells[row][col].state;
    cell.row = row;
    cell.col = col;
    if (self.cells[row][col].state === 'down') {
      cell.innerText = self.cells[row][col].value === 0 ? '' : self.cells[row][col].value;
    }
    return cell;
  };

  this.changeState = function changeState(row, col) {
    var cell = self.cells[row][col];
    if (cell.state === 'up' && self.flags === self.mines) {
      return;
    }

    switch(cell.state) {
      case 'up':
        self.flags ++;
        self.downs --;
        cell.state = 'flag';
        break;
      case 'flag':
        self.flags --;
        self.downs ++;
        cell.state = 'question';
        break;
      case 'question':
        cell.state = 'up';
    }
  };

  this.uncover = function uncover(row, col) {
    if (self.cells[row][col].state === 'down') {
      return;
    }

    if (self.cells[row][col].state === 'flag') {
      return;
    }

    if (!self.isMine(row, col)){
      self.cells[row][col].state = 'down';
      self.downs --;
      if (self.isEmpty(row, col)) {
        self.uncoverNeighbours(row, col);
      }
    }
  };

  this.uncoverNeighbours = function uncoverNeighbours(row, col) {
    if (row > 0) {
      if (col > 0) {
        self.uncover(row - 1, col - 1);
      }
      self.uncover(row - 1, col);
      if (col < (self.cols - 1)) {
        self.uncover(row - 1, col + 1);
      }
    }

    if (col > 0) {
      self.uncover(row, col - 1);
    }
    if (col < (self.cols - 1)) {
      self.uncover(row, col + 1);
    }

    if (row < (self.rows - 1)) {
      if (col > 0) {
        self.uncover(row + 1, col - 1);
      }
      self.uncover(row + 1, col);
      if (col < (self.cols - 1)) {
        self.uncover(row + 1, col + 1);
      }
    }
  };

  this.checkFlags = function checkFlags() {
    var flags = 0
    for (var row = 0; row < self.rows; row ++) {
      for (var col = 0; col < self.cols; col ++) {
        var cell = self.cells[row][col];
        if (cell.state === 'flag' && cell.value === 'm') {
          flags ++
        }
      }
    }
    return flags === self.flags;
  };

  this.showMines = function showMines() {
    for (var row = 0; row < self.rows; row ++) {
      for (var col = 0; col < self.cols; col ++) {
        var cell = self.cells[row][col];
        if (cell.state !== 'flag' && cell.value === 'm') {
          cell.state = 'mine';
        }
      }
    }
    self.renderField();
  }
}

function Game(level, board, result) {
  var DIFFICULTY = {
    'Beginner': { 'lines' : 7, 'mines': 5 },
    'Easy': { 'lines' : 9, 'mines': 10 },
    'Intermediate': { 'lines' : 12, 'mines': 24 },
    'Advanced': { 'lines' : 16, 'mines': 60 },
  };

  var self = this;
  var gameover = false;
  var lines = DIFFICULTY[level].lines;
  var mines = DIFFICULTY[level].mines;
  var minefield = new MineField();
  minefield.create(board, lines, lines, mines);

  result.innerHTML = '';

  var checkWin = function checkWin() {
    if (minefield.downs === 0 && minefield.checkFlags) {
      alert('You Win');
      result.innerHTML = '<span style="color: green">You Win!</span>'
      gameover = true;
      minefield.showMines();
    }
  }

  var onLeftClick = function onLeftClick(event) {
    if (!gameover) {
      var cell =  event.srcElement;
      var row = cell.row;
      var col = cell.col;
      console.debug(event, row, col);

      if (row !== undefined && col !== undefined) {
        if (minefield.isMine(row, col)) {
          console.info('Game Over');
          gameover = true;
          minefield.showMines();
          alert('Game Over');
          result.innerHTML = '<span style="color: red">You Lose!</span>'
          return;
        } else {
          minefield.uncover(row, col);
          minefield.renderField();
          checkWin();
        }
      }
    };
  };

  var onRightClick = function onRightClick(event) {
    event.preventDefault();
    if (!gameover) {
      var cell =  event.srcElement;
      var row = cell.row;
      var col = cell.col;
      console.debug(event, row, col);

      if (row && col) {
        minefield.changeState(row, col);
        minefield.renderField();
      }
    }
  };

  board.addEventListener('click', onLeftClick, false);
  board.addEventListener('contextmenu', onRightClick, false);
}

function newGame() {
  var level = document.getElementById('level');
  var board = document.getElementById('board');
  var result = document.getElementById('result');
  level = level.options[level.selectedIndex].value;
  game = new Game(level, board, result);
}

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    newGame();
  }
}