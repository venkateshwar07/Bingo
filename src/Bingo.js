import React, { Component } from 'react';
import axios from 'axios';
import './Game.css'

class Square extends Component {
    constructor(props) {
        super(props);

    } 
    render() {
        const buttonClass = this.props.eachSquare?.isSelected ? 'crossed-square' : '';
        const isBingo = this.props.eachSquare?.isBingo ? 'square-bingo' : '';
        return(
            <button className={`square ${buttonClass} ${isBingo}`} onClick={() => this.props.onSquareClick()}>
                {this.props.eachSquare?.value}
            </button>
        )
    }
}


class Board extends Component {
    constructor(props) {
        super(props);
        const initialEachSquare = {};
        // for (let i = 0; i < 25; i++) {
        //     initialEachSquare[i] = { value: i + 1, isSelected: false };
        // }
        this.state = {
            eachSquare: initialEachSquare,
            squareValue: 0,
            isGameCompleted: false,
            bingoList: [
                {
                    label: 'B',
                    isSelected: false
                },
                {
                    label: 'I',
                    isSelected: false
                },
                {
                    label: 'N',
                    isSelected: false
                },
                {
                    label: 'G',
                    isSelected: false
                },
                {
                    label: 'O',
                    isSelected: false
                }
            ],
            messages: [],
            bingoCount: 0
        }

        this.ws = new WebSocket('ws://localhost:8000/ws'); // WebSocket endpoint URL

        this.ws.onopen = () => {
            // The WebSocket is now open, you can send data
            console.log('WebSocket connection is open.');
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket encountered an error:', error);
        };
      
        this.ws.onmessage = (event) => {
            console.log(event.data);
            const response = JSON.parse(event.data);
            const eachSquare = this.state.eachSquare;
            let index = -1;
            for (const key in eachSquare) {
                if(eachSquare[key].value === response.message.value) {
                    index = key; 
                    break;
                }
            }
            if(index > -1) {
                this.onSquareClick(eachSquare[index].row, eachSquare[index].col, index, true);
            }
            if(response.message.topic === 'square' && response.message.nextPlayer) {
                this.props.updateNextPlayer(response.message.nextPlayer);
            } else if(response.message.topic === 'winner')  {
                this.props.updateWinner(response.message.name);
            }
            // Update your state or perform any action with the received message
            // this.setState((prevState) => ({
            //   messages: [...prevState.messages, message],
            // }));
        };
      
               
    }

    componentWillUnmount() {
        // Close the WebSocket connection when the component unmounts
        this.ws.close();
    }

    componentDidUpdate(prevProps, prevState) {
        const { bingoCount } = this.state;
        // Check if bingoCount is 5 and it has changed from the previous state
        if (bingoCount === 5 && bingoCount !== prevState.bingoCount) {
            // Make an API call here
            this.publishMqtt({value: null, topic: "winner"});
        }
    }

    async publishMqtt(payload) {
        try {
            let dataToSend = {
              name: this.props.name,
              code: this.props.code
            };
            dataToSend = {...dataToSend, ...payload};
            const response = await axios.post('http://localhost:8000/publish', dataToSend);
            console.log('Publish response:', response.data);
          } catch (error) {
            console.error('Error sending publish request:', error);
          }
        
    }
      
    renderSquare(i, j, index) {
        return (
            <Square row={i} col={j} index={index} eachSquare={this.state.eachSquare[index]} 
            onSquareClick={
                this.props.disabled // Check if the component is disabled
                ? () => {} // Do nothing if disabled
                : () => this.onSquareClick(i, j, index)
            }/>
        )
    }

    onSquareClick(i, j, index, fromMqtt = false) {
        if(this.state.isGameCompleted) {
            return;
        }
        if(Object.keys(this.state.eachSquare).length === 25) {
            this.setState(prevState => {
                const updatedEachSquare = {...prevState.eachSquare};
                let updatedValue = updatedEachSquare[index];
                updatedValue = {...updatedValue, ...{isSelected: true }}
                updatedEachSquare[index] = updatedValue;
                if(!fromMqtt && !prevState.eachSquare[index].isSelected) {
                    this.publishMqtt({value: updatedValue.value, topic: "square"})
                }
                const bingoCount = this.calculateWinner(updatedEachSquare) || 0;
                return { eachSquare: updatedEachSquare, bingoCount: bingoCount };
            });
        } else {
            this.setState(prevState => {
                const updatedEachSquare = {...prevState.eachSquare};
                if(!updatedEachSquare[index]?.value) {
                    let squareValue = prevState.squareValue;
                    squareValue = squareValue + 1;
                    const updatedValue = {value: squareValue, row:i, col: j}
                    updatedEachSquare[index] = updatedValue;
                    if(Object.keys(updatedEachSquare).length === 25) {
                        this.props.updateSelectedCount(Object.keys(updatedEachSquare).length);
                    }
                    return { eachSquare: updatedEachSquare, squareValue: squareValue };
                }
            });
        }
        console.log(index);
    }

    calculateWinner(squares) {
        let winnerSquares = [];
        const lines = [
          [0, 1, 2, 3, 4],
          [5, 6, 7, 8, 9],
          [10, 11, 12, 13, 14],
          [15, 16, 17, 18, 19],
          [20, 21, 22, 23, 24],
          [0, 5, 10, 15, 20],
          [1, 6, 11, 16, 21],
          [2, 7, 12, 17, 22],
          [3, 8, 13, 18, 23],
          [4, 9, 14, 19, 24],
          [0, 6, 12, 18, 24],
          [4, 8, 12, 16, 20]
        ];
        let bingoCnt = 0;
        for (let i = 0; i < lines.length; i++) {
          const [a, b, c, d, e] = lines[i];
          if (squares[a]?.isSelected && squares[b]?.isSelected && squares[c]?.isSelected && squares[d]?.isSelected && squares[e]?.isSelected) {
            let bingoList = this.state.bingoList;
            if(bingoList[bingoCnt]) {
                bingoList[bingoCnt].isSelected = true;
            }
            // return {value: squares[a], slectedIndexes: [a,b,c]};
            squares[a].isBingo = squares[b].isBingo = squares[c].isBingo = squares[d].isBingo = squares[e].isBingo = true;
            bingoCnt = bingoCnt + 1;
            // winnerSquares = [a, b, c, d, e];
          }
        }
        // if (winnerSquares) {
        //     this.setState((prevState) => {
        //         const updatedEachSquare = { ...prevState.eachSquare };
        //         winnerSquares.forEach((index) => {
        //             updatedEachSquare[index] = {
        //                 ...updatedEachSquare[index],
        //                 isBingo: true,
        //             };
        //         });
        //     });
        // }
    
        // return winnerSquares;
        // if(bingoCnt === 5) {
        //     this.setState({isGameCompleted: true})
        // }
        return bingoCnt;
      }

    render() {
        const winner = this.calculateWinner(this.state.eachSquare);
        const entireBoard = [];
        let index = 0;
        let bingo = [];
        let winnerStatus = '';
        for(const i of this.state.bingoList) {
            const isBingo = i.isSelected ? 'square-bingo' : '';
            bingo.push(
            <button className={`square ${isBingo}`}>
                {i.label}
            </button>
            )
        }
        for(let i = 0; i<5; i++) {
            const boardRows = [];
            for(let j = 0; j<5; j++) {
                boardRows.push(
                    this.renderSquare(i,j, index)
                )
                index = index + 1;
            }
            entireBoard.push(
                <div className="board-row" key={i}>
                    {boardRows}
                </div>
            )
        }
        let status;
        if (Object.keys(this.state.eachSquare).length === 25) {
            status = 'Select the numbers';
        } else {
            status = 'Fill the numbers';
        }
        return (
            <div>
                <div className="bingo">
                {bingo}
                </div>
                <div className="status">{status}</div>
                <div className="entire-board">
                {entireBoard}
                </div>
            </div>
          );
    }
}

class Bingo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nextPlayer: this.props.nextPlayer,
            selectedCount: 0,
            winnerName: ''
        };
    } 

    // Define a function to update nextPlayer state
    updateNextPlayer = (nextPlayer) => {
        this.setState({ nextPlayer });
    }

    updateSelectedCount = (selectedCount) => {
        this.setState({ selectedCount })
    }

    updateWinner = (winnerName) => {
        this.setState({ winnerName })
    }

    restartTheGame() {
        window.location.reload();
    }


    render() {
        return (
            <div className="game">
                {this.state.selectedCount}
                {!this.state.winnerName && (
                    <div className="game-board">
                    {this.state.nextPlayer && this.state.nextPlayer === this.props.name ? (
                        <Board name={this.props.name} code={this.props.code} updateNextPlayer={this.updateNextPlayer} updateSelectedCount={this.updateSelectedCount} updateWinner={this.updateWinner}/>
                    ) : this.state.selectedCount === 25 ? (
                        <Board name={this.props.name} code={this.props.code} updateNextPlayer={this.updateNextPlayer} updateSelectedCount={this.updateSelectedCount} updateWinner={this.updateWinner} disabled/>
                    ) : (
                        <Board name={this.props.name} code={this.props.code} updateNextPlayer={this.updateNextPlayer} updateSelectedCount={this.updateSelectedCount} updateWinner={this.updateWinner}/>
                    )}
                  </div>
                )
                }
                {
                   this.state.winnerName && (
                    <Board name={this.props.name} code={this.props.code} updateNextPlayer={this.updateNextPlayer} updateSelectedCount={this.updateSelectedCount} updateWinner={this.updateWinner} disabled/>
                   )
                }
              <div className="game-info">
                {!this.state.winnerName && 
                    <div>
                        {this.state.nextPlayer && this.state.nextPlayer === this.props.name
                        ? 'Your turn'
                        : `${this.state.nextPlayer}'s turn`}
                    </div>
                }
                {this.state.winnerName && 
                    <div>
                        {this.state.nextPlayer && this.state.nextPlayer === this.props.name
                        ? 'You Won'
                        : `${this.state.winnerName} Won`}
                    </div>
                }
              </div>
              {this.state.winnerName && (
                  <button
                    className="bingo-button"
                    onClick={() => this.restartTheGame()}
                  >
                    Restart
                  </button>
              )}
            </div>
        );
    }
}
export default Bingo;