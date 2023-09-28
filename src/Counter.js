import React, {Component} from "react";
class Counter {
    constructor(props) {
        // super(props);
        this.state = {
            count: 0
        }
    }

    incrementCount = () => {
        this.setState((prevState) => ({ count: prevState.count + 1 }));
    }
    resetCount = () => {
        // this.state = {
        //     count: 0
        // };
        this.setState((prevState) => ({ count: 0 }));
    }
    render() {
        return (
            <div>
                <h1>My Counter : {this.state.count}</h1>
                <button onClick={this.incrementCount}>Increment</button>
                <button onClick={this.resetCount}>Reset</button>
            </div>
        );
    }
}


export default Counter;