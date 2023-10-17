import React, { Component } from "react";
import axios from "axios";
import Bingo from "./Bingo";
import "./Home.css"; // Import your CSS file

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      code: "",
      isStartGame: false,
      joinType: "",
      players: [],
      showBingo: false, // Add a state to control the Bingo component visibility
      nextPlayer: ''
    };

    // Initialize WebSocket in the constructor
    this.ws = new WebSocket("ws://13.51.85.157:5000/ws");

    this.ws.onopen = () => {
      console.log("WebSocket connection is open.");
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket encountered an error:", error);
    };

    this.ws.onmessage = (event) => {
      console.log(event.data);
      const response = JSON.parse(event.data);
      if (response.message.topic === "joinedGame") {
        const receivedCode = response.message?.code;
        if (receivedCode === this.state.code) {
          // Handle the response message as needed
          console.log("Received WebSocket message with code:", receivedCode);
          // You may want to trigger the playersList function here
          this.playersList(receivedCode);
        }
      } else if (response.message.topic === "startTheGame") {
        this.setState({ showBingo: true });
        this.setState({ nextPlayer: response.message.nextPlayer })
      }
    };
  }

  componentWillUnmount() {
    // Close the WebSocket connection when the component unmounts
    if (
      this.ws.readyState === WebSocket.OPEN ||
      this.ws.readyState === WebSocket.CONNECTING
    ) {
      this.ws.close();
      console.log("WebSocket connection closed.");
    }
  }

  handleJoinClick = async () => {
    // API Call
    try {
      const dataToSend = {
        name: this.state.name,
        code: this.state.code,
      };
      const response = await axios.post(
        "http://13.51.85.157:5000/join-game",
        dataToSend
      );
      console.log("Join Game response:", response.data);
      this.setState({
        isStartGame: response.data.game_code,
        code: response.data.game_code,
        joinType: "Joined",
      });
      // You may want to trigger the playersList function here
      this.playersList(response.data.game_code);
    } catch (error) {
      console.error("Error sending join-game request:", error);
    }
  };

  handleHostClick = async () => {
    try {
      const dataToSend = {
        name: this.state.name,
      };
      const response = await axios.post(
        "http://13.51.85.157:5000/host-game",
        dataToSend
      );
      console.log("Host Game response:", response.data);
      this.setState({
        isStartGame: response.data.game_code,
        code: response.data.game_code,
        joinType: "Hosted",
      });
      // You may want to trigger the playersList function here
      this.playersList(response.data.game_code);
    } catch (error) {
      console.error("Error sending host-game request:", error);
    }
  };

  playersList = async (gameCode) => {
    try {
      const dataToSend = {
        code: gameCode,
      };
      const response = await axios.post(
        "http://13.51.85.157:5000/players-list",
        dataToSend
      );
      console.log("Players List response:", response.data);
      this.setState({
        players: response.data,
      });
    } catch (error) {
      console.error("Error fetching players list:", error);
    }
  };

  async publishMqtt(value, topic) {
    try {
      const dataToSend = {
        value: value, // Replace with the data you want to send
        topic: topic, // Replace with the topic,
        name: this.state.name,
        code: value.code
      };
      const response = await axios.post("http://13.51.85.157:5000/publish", dataToSend);
      console.log("Publish response:", response.data);
    } catch (error) {
      console.error("Error sending publish request:", error);
    }
  }

  startTheGame = () => {
    this.setState({ showBingo: true });
    this.setState({ nextPlayer: this.state.name });
    this.publishMqtt({ code: this.state.code }, "startTheGame");
  };

  render() {
    const { name, code, isStartGame, joinType, players, showBingo } = this.state;
    const canStartGame = players.length >= 2;

    return (
      <div className="home-container">
        {isStartGame && !showBingo ? (
          <div className="form-container">
            <h3>Game Code : {code}</h3>
            <span>
              {joinType} by {name}
            </span>
            <div className="player-list">
                <table>
                    <tbody>
                    {players.map((player, index) => (
                        <tr key={index}>
                        <td>Player-{index + 1}</td>
                        <td>{player.name}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {joinType === "Hosted" && (
              <button
                className="bingo-button"
                onClick={() => this.startTheGame()}
                disabled={!canStartGame}
              >
                {canStartGame ? "Start the Game" : "Waiting for other players"}
              </button>
            )}
          </div>
        ) : (
          !showBingo && (
            <div className="form-container">
              <h3>Welcome to Bingo</h3>
              <input
                type="text"
                placeholder="Enter Name"
                value={name}
                onChange={(e) => {
                  this.setState({ name: e.target.value });
                }}
              />
              <input
                  type="text"
                  placeholder="Enter Code"
                  value={code}
                  onChange={(e) => {
                    this.setState({ code: e.target.value });
                  }}
                />
                <button onClick={this.handleJoinClick} disabled={!this.state.name || !this.state.code}>Join Game</button>
                <button onClick={this.handleHostClick} disabled={!this.state.name}>Host a Game</button>
            </div>
          )
        )}
        {showBingo && <Bingo players={players} name={name} code={code} nextPlayer={this.state.nextPlayer}/>}
      </div>
    );
  }
}

export default Home;
