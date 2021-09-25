import React from 'react';
import connectToDoc from '../channels/doc_channel';
import NavContainer from '../containers/nav_container'
import AceEditor from 'react-ace';
import ChatBox from './chat_box';
import "ace-builds";
import "ace-builds/webpack-resolver";
import { withRouter } from 'react-router-dom';
import { Redirect } from 'react-router';

class Room extends React.Component {
  constructor(props) {
    super(props);
    this.getEditorMode = this.getEditorMode.bind(this);
    this.state = { 
      editorText: "",
      editorMode: "javascript",
      initialState: true,
    }

    this.receiveEdit = this.receiveEdit.bind(this);
    this.broadcastEdit = this.broadcastEdit.bind(this);
    this.docSubscription = connectToDoc(this.receiveEdit.bind(this), this.getCurrentRow.bind(this));
    this.ensureDeltaOrder = this.ensureDeltaOrder.bind(this);
    this.editorRef = React.createRef();
    this.broadcastChange = true;
    this.offsetDelta = this.offsetDelta.bind(this);
    this.deltaHistory = [];
    this.localDeltaHistory = [];
    window.room = this;
  }

  broadcastEdit(content, event) {
    const time = Date.now();
    window.changeEvent = event;
    if (!this.broadcastChange) return;

    const delta = {
      time,
      senderId: this.props.user.id,
      changeData: event
    }

    this.docSubscription.send(delta);
    this.localDeltaHistory.push(delta);
    this.deltaHistory.push(delta);
    this.setState({editorText: content});
  }

  componentWillUnmount() {
    this.docSubscription.unsubscribe();
  }

  receiveEdit(data) {
    if (data.senderId === this.props.user.id) return;
    const editorDoc = this.editorRef.current.editor.session.doc;
    this.ensureDeltaOrder(data);
    const newContent = editorDoc.getValue();

    this.setState({
      editorText: newContent,
      initialState: false
    })
  }

  ensureDeltaOrder(data) {
    this.broadcastChange = false;
    const editorDoc = this.editorRef.current.editor.session.doc;
    const popped = [];
    while (this.deltaHistory.length && this.deltaHistory.slice(-1)[0].time > data.time) {
      const prev = this.deltaHistory.pop();
      editorDoc.revertDelta(prev.changeData);
      popped.push(prev);
    }

    editorDoc.applyDelta(data.changeData);
    this.deltaHistory.push(data)

    while (popped.length) {
      const next = popped.pop();
      editorDoc.applyDelta(next.changeData);
      this.deltaHistory.push(next);
    }

    this.broadcastChange = true;
  }

  getCurrentRow(data) {
    if (data.senderId === this.props.user.id) return;

    $(".ace_text-layer").find('div').css({backgroundColor: ""})
    const rowElement = $(".ace_text-layer").find('div')[data.row]
    if (rowElement) rowElement.style.backgroundColor = "rgba(255, 0, 0, 0.3)"
  }

  offsetDelta(e) {
    this.docSubscription.send({ senderId: this.props.user.id, row: e.lead.row })
    const lastDelta = this.localDeltaHistory.slice(-1)[0];
    if (!lastDelta) return;
    const start = lastDelta.changeData.start.row;
    if (start !== lastDelta.changeData.end.row) return;
    if (Date.now() - lastDelta.time < 500 && start) {
      lastDelta.changeData.start.row = e.lead.row;
      lastDelta.changeData.end.row = e.lead.row;
    }
  }

  getEditorMode(fileName) {
    const fileExt = fileName.split(".").pop();
    switch(fileExt) {
      case "js":
        return "javascript"
      case "jsx":
        return "jsx"
      case "rb":
        return "ruby"
      case "java":
        return "java"
      case "py":
        return "python"
      case "php":
        return "php"
      case "cs":
        return "csharp"
      case "css":
        return "css"
      case "scss":
        return "sass"
      case "xml":
        return "xml"
      case "coffee":
        return "coffee"
      case "dart":
        return "dart"
      default:
        return "text"
    }
  }

  componentDidMount() {
    if (!this.state.initialState) return;

    const docId = this.props.match.params.docId;
    const url = `/api/documents/${docId}`;
    fetch(url).then(res => {
      if (!res.ok) {
        throw new Error(res.statusText);
      } else {
        return res.json();
      }
    }).then(json => {
      const content = json.content;
      const mode = this.getEditorMode(json.file_name);
      this.setState({ editorText: "\n" + content, editorMode: mode })
    }).catch(err => console.log(err))
  }
  
  render() {
    if (!this.props.user) {
      this.docSubscription.unsubscribe();
      return <Redirect to="/"/>
    }
    
    return (
    <div className="room">
      <NavContainer/>
      <div className="gray-area doc-room">
      <AceEditor
      onChange={this.broadcastEdit}
      onCursorChange={this.offsetDelta}
      height="37.708333333333336vw"
      width="55.46875vw"
      mode={this.state.editorMode}
      theme="terminal"
      ref={this.editorRef}
      keyboardHandler="vscode"
      value={this.state.editorText}
      />
      <ChatBox user={this.props.user}/>
      </div>
    </div>
    )
  }
}

export default withRouter(Room);