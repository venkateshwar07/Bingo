import React, { Component } from 'react';
import './Game.css'
class Square extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null
    }
  }

  render() {
    const buttonClass = this.props.slectedIndexes && this.props.slectedIndexes.includes(this.props.index) ? 'square-selected' : '';
    return (
      <button className={`square ${buttonClass}`} onClick={() => this.props.onClick()}>
        {this.props.value}
      </button>
    );
  }

}

class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: {},
      preValue: null,
      isXNext: true,
      winner: null
    }
  }
  renderSquare(i, slectedIndexes) {
    return (
      // <div>
      //   <h1>{JSON.stringify(this.state.values)}</h1>
      // </div>
        <Square value={this.state.values[i]} slectedIndexes={slectedIndexes} index={i} onClick={() => this.assignEachSquare(i)} />
    )
  }

  assignEachSquare(i) {
    if(this.calculateWinner(this.state.values) || this.state.values[i]) {
      console.log(this.state.values);
      return;
    }
    let preValue = null;
    if (this.state.preValue === 'O' || this.state.preValue === null) {
      preValue = 'X';
    } else {
      preValue = 'O';
    }
    this.setState(
      { values: { ...this.state.values, [i]: preValue }, preValue: preValue, isXNext: !this.state.isXNext }
    );
    // this.setState((prevState) => {
    //   const preValue = prevState.preValue === 'O' || prevState.preValue === null ? 'X' : 'O';
    //   const values = { ...prevState.values, [i]: preValue }
    //   return {preValue, values}
    // }, () => {
    //   // console.log(this.state.values, this.state.preValue, this.state);
    // }
    // )
  }

  calculateWinner(squares) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[b] && squares[c] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return {value: squares[a], slectedIndexes: [a,b,c]};
      }
    }
    return null;
  }

  restartGame() {
    this.setState({
      values: {},
      preValue: null,
      isXNext: true,
      winner: null
    });
  }

  render() {
    const winner = this.calculateWinner(this.state.values) || {};
    let status;
    if (Object.keys(winner).length > 0) {
      status = 'Winner: ' + winner.value;
    } else {
      status = 'Next player: ' + (this.state.isXNext ? 'X' : 'O');
    }
    return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderSquare(0, winner['slectedIndexes'])}
          {this.renderSquare(1, winner['slectedIndexes'])}
          {this.renderSquare(2, winner['slectedIndexes'])}
        </div>
        <div className="board-row">
          {this.renderSquare(3, winner['slectedIndexes'])}
          {this.renderSquare(4, winner['slectedIndexes'])}
          {this.renderSquare(5, winner['slectedIndexes'])}
        </div>
        <div className="board-row">
          {this.renderSquare(6, winner['slectedIndexes'])}
          {this.renderSquare(7, winner['slectedIndexes'])}
          {this.renderSquare(8, winner['slectedIndexes'])}
        </div>
        <button className="restart" onClick={() => this.restartGame()}>Restart</button>
      </div>
    );
  }
}

class Game extends Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

export default Game

// ========================================

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(<Game />);
