import {useState} from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import {SaveEntry} from "../wailsjs/go/main/App";

function App() {
    const [text, setText] = useState('');
    const [goCode, setGoCode] = useState('');
    const [saveResponse, setSaveResponse] = useState('Enter your text and Go code, then save to JSON.');

    const updateText = (e) => setText(e.target.value);
    const updateGoCode = (e) => setGoCode(e.target.value);

    const saveEntry = () => {
        SaveEntry(text, goCode)
            .then((path) => setSaveResponse(`Saved JSON to: ${path}`))
            .catch((err) => setSaveResponse(`Save failed: ${err?.message || err}`));
    }

    return (
        <div id="App">
            <img src={logo} id="logo" alt="logo"/>
            <div id="result" className="result">{saveResponse}</div>
            <div className="form-container">
                <label htmlFor="text-input">Text</label>
                <textarea
                    id="text-input"
                    className="input"
                    value={text}
                    onChange={updateText}
                    placeholder="Enter any text here"
                />
                <label htmlFor="code-input">Go code</label>
                <textarea
                    id="code-input"
                    className="input code-input"
                    value={goCode}
                    onChange={updateGoCode}
                    placeholder="Enter Go code to save as JSON"
                />
                <button className="btn" onClick={saveEntry}>Save to JSON</button>
            </div>
        </div>
    )
}

export default App
