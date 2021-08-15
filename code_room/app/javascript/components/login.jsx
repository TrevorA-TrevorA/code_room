import React from 'react';
import { LOGIN } from '../reducers/auth_reducer';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = { email: "", password: "" }
    this.update = this.update.bind(this);
    this.authenticateUser = this.authenticateUser.bind(this);
  }
  
  update(e) {
    this.setState({ [e.target.type]: e.target.value });
  }

  async authenticateUser(e) {
    e.preventDefault();
    const params = { user: this.state };
    const options = {
      body: JSON.stringify(params),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    }

    try {
      const response = await fetch("api/session", options)
      if (!response.ok) throw new Error("log in failed")
      const user = await response.json();
      window.currentUser = user;
      this.props.dispatch({ type: LOGIN, user: user})
      
    } catch(error) {
      console.log(error);
    }
  }
  
  render() {
    if (this.props.currentUser) {
      return <Redirect to="/dash"/>
    }

    return (
      <div className="login">
        <form onSubmit={this.authenticateUser}>
          <label>email</label>
          <input type="email" autoFocus onChange={this.update} value={this.state.email}/>
          <label>password</label>
          <input type="password" onChange={this.update} value={this.state.password}/>
          <input type="submit" value="sign in"/>
        </form>
      </div>
    )
  }
}

export default Login;