import logo from './logo.svg';
import './App.css';
import Greeting from './Greeting';
import Counter from './Counter';
import Game from './Game'
import Bingo from './Bingo';
import { useEffect, useState } from 'react';
import Home from './Home';

function App() {
  const [title, setTitle] = useState('Welcome to Bingo');
  return (
    <div className="App">
      {/* <h1>{title}</h1> */}
      <Home />
    </div>
  );
}

export default App;
