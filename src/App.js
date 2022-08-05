import React from 'react';
import './App.css';
import Editor from "@monaco-editor/react";


var wsUrl = `wss://${window.location.hostname}:9876`;
var pseudoUri = "pseudo://uri"

class App extends React.Component {

  constructor(props) {
    super(props);
    
    this.docVersion = 1

    //Websocket variables
    this.mywsServer = new WebSocket(wsUrl)

    //enabling send message when connection is open
    this.mywsServer.onopen = () => {


        var msgInit = {"jsonrpc": "2.0", "id": 0, "method": "initialize", "params": {
            "rootPath": null, 
            "rootUri": pseudoUri, 
            "initializationOptions": null, "capabilities": {}, "trace": "off", 
            "workspaceFolders": [{"name": "pseudo", "uri": pseudoUri}]}}
        
        var msgInitd = {"jsonrpc": "2.0", "method": "initialized", "params": {}}


        var msgOpen = {"jsonrpc": "2.0", "method": "textDocument/didOpen", "params": 
          {"textDocument": {"uri": pseudoUri, "languageId": "lean", "version": this.docVersion, 
          "text": ""}}}

        
        this.mywsServer.send(JSON.stringify(msgInit));
        this.mywsServer.send(JSON.stringify(msgInitd));
        this.mywsServer.send(JSON.stringify(msgOpen));

    }

    //handling message event
    this.mywsServer.onmessage = (event) => {
        var { data } = event
        data = JSON.parse(data);
        console.log(data)
        if (data.method === "textDocument/publishDiagnostics") {
          console.log(data.params.diagnostics)

          for (const model of this.monaco.editor.getModels()) {
            // TODO: Why would there be multiple models?
            // const fn = model.uri;
            const markers = [];
            for (const diag of data.params.diagnostics) {
              // if (data.params.uri !== fn) {
              //   continue;
              // }
              const marker = {
                severity: this.severityLeanToMonaco(diag.severity),
                message: diag.message,
                startLineNumber: diag.range.start.line,
                startColumn: diag.range.start.character + 1,
                endLineNumber: diag.range.end.line,
                endColumn: diag.range.end.character + 1,
              };
              markers.push(marker);
            }
            this.monaco.editor.setModelMarkers(model, 'lean', markers);
          }
        }
    }
  }

  severityLeanToMonaco(severity) {
    switch (severity) {
      case 3: return this.monaco.MarkerSeverity.Info;
      case 2: return this.monaco.MarkerSeverity.Warning;
      case 1: return this.monaco.MarkerSeverity.Error;
      default: throw new Error("Unknown Severity")
    }
  }

  handleEditorWillMount(monaco) {
    monaco.languages.register({
      id: 'lean',
      filenamePatterns: ['*.lean'],
    });
    this.monaco = monaco
  }
  
  handleEditorChange(value, event) {
    var msgChange = {"jsonrpc": "2.0", "method": "textDocument/didChange", "params": {
      "textDocument": {"uri": pseudoUri, "version": ++this.docVersion},
      "contentChanges": [{"text": value}]}}
    console.log(this.mywsServer)
    this.mywsServer.send(JSON.stringify(msgChange));
  }

  render() {
    return (
      <div className="App">
        <Editor
          className="editor"
          height="100vh"
          defaultLanguage="lean"
          defaultValue=""
          beforeMount={this.handleEditorWillMount.bind(this)}
          onChange={this.handleEditorChange.bind(this)}
        />
      </div>
    );
  }
}

export default App;
