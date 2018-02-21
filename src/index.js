import React from "react";
import { render } from "react-dom";
import "./style.css";

//reset progress range and thumb in break.
class App extends React.Component {
  constructor() {
    super();
    this.state = {
      countDownStatus: "in session",
      timerStatus: "START NOW",
      minPrefix: "",
      secPrefix: ":00",
      minCountDown: 25,
      secCountDown: 60,
      sessionControl: 25,
      breakControl: 5,
      startTimer: true,
      inBreak: false
    };
    this.xPos = 200 * Math.cos(0.75 * Math.PI);
    this.yPos = 200 * Math.sin(0.75 * Math.PI);
    this.eachFrame = 0;
    this.FPS = 61000 / 16.67;
    this.togglePos = false;
    this.rangeFrame = 1.5 / this.FPS;

    this.handleControllers = this.handleControllers.bind(this);
    this.handleBreakController = this.handleBreakController.bind(this);
    this.handleSessionController = this.handleSessionController.bind(this);
    this.handleCountDown = this.handleCountDown.bind(this);
    this.handleTimer = this.handleTimer.bind(this);
    this.handleTracker = this.handleTracker.bind(this);
  }

  handleControllers(event, controller) {
    if (!this.state.startTimer) {
      this.setState({ [controller]: this.state[controller] }); //- freeze on countdown.
    } else {
      this.setState(
        prevState =>
          prevState[controller] > 1
            ? event.textContent === ">"
              ? { [controller]: prevState[controller] + 1 }
              : { [controller]: prevState[controller] - 1 }
            : event.textContent === ">" //- counters when get to 1.
              ? { [controller]: prevState[controller] + 1 }
              : { [controller]: prevState[controller] }
      );
    }
  }

  handleSessionController(e) {
    e.preventDefault();
    let sessionEvent = e.target,
      sessionController = "sessionControl";
    this.handleControllers(sessionEvent, sessionController);

    if (this.state.startTimer) {
      //- sync session and min countdown.
      this.setState(state => ({ minCountDown: state.sessionControl }));
      //- reset to defaults.
      document.querySelector(".sec").style = "display: none";
      this.setState({
        secPrefix: ":00",
        secCountDown: 60,
        countDownStatus: "in session",
        timerStatus: "START NOW"
      });
      //- reset tracker thumb to default position.
      this.eachFrame = 0;
      this.togglePos = false;
      this.rangeFrame = 1.5 / this.FPS;
      this.xPos = 200 * Math.cos(0.75 * Math.PI);
      this.yPos = 200 * Math.sin(0.75 * Math.PI);
      this.handleTracker();
    }
    //- prepend zero to single min digits on controller.
    this.setState(prevState => ({
      minPrefix: prevState.minCountDown.toString().length === 1 ? "0" : ""
    }));
  }

  handleBreakController(e) {
    e.preventDefault();
    let breakEvent = e.target,
      breakController = "breakControl";
    this.handleControllers(breakEvent, breakController);
  }

  handleCountDown(prependMinZero = "", prependSecZero = "") {
    document.querySelector(".sec").style = "display: inline"; //- display initial sec.
    //- toggle countdowns timer and status between session and break.
    if (this.state.secCountDown === 0 && this.state.minCountDown === 0) {
      this.setState({ inBreak: !this.state.inBreak });
      //- sync the breakTime state above this set states.
      this.setState(
        this.state.inBreak
          ? {
              minCountDown: this.state.breakControl,
              countDownStatus: "in break"
            }
          : {
              minCountDown: this.state.sessionControl,
              countDownStatus: "in session"
            }
      );
      prependSecZero = "0"; //prepend zero in initial transition.
    } else {
      //- countdowns rerender
      this.setState(
        prevState =>
          prevState.secCountDown === 0 || prevState.secCountDown === 60
            ? { secCountDown: 59, minCountDown: prevState.minCountDown - 1 }
            : { secCountDown: prevState.secCountDown - 1 }
      );
      //- prepend zero for single min digits.
      prependSecZero =
        this.state.secCountDown < 10 && this.state.secCountDown >= 0 ? "0" : "";
    }
    prependMinZero = this.state.minCountDown < 10 ? "0" : "";
    this.setState({
      minPrefix: `${prependMinZero}`,
      secPrefix: `:${prependSecZero}`
    });
  }

  handleTimer() {
    this.setState({ startTimer: !this.state.startTimer }); //- toggle countdown.
    if (this.state.startTimer) {
      this.setState({ timerStatus: "PAUSE" });
      this.timerID = setInterval(() => this.handleCountDown(), 1000);
      this.trackerID = requestAnimationFrame(this.handleTracker);
    } else {
      this.setState({ timerStatus: "RESUME" });
      clearInterval(this.timerID);
      cancelAnimationFrame(this.trackerID);
    }
  }

  handleTracker() {
    this.tracker.save();
    this.tracker.clearRect(0, 0, 500, 500); //- clear canvas for repaint.
    this.tracker.translate(250, 250); //- move origin to middle of canvas.
    //- paint tracker range.
    this.tracker.beginPath();
    this.tracker.arc(0, 0, 200, 0.75 * Math.PI, 0.25 * Math.PI);
    this.tracker.lineWidth = 20;
    this.tracker.strokeStyle = "#1FFFFF";
    this.tracker.shadowBlur = 1;
    this.tracker.shadowColor = "#FFF";
    this.tracker.lineCap = "round";
    this.tracker.stroke();
    //- updates thumb positions.
    if (this.eachFrame === Math.floor(this.FPS)) {
      this.eachFrame = 1;
      const POS_ANGLE = (this.togglePos ? 0.75 : 0.25) * Math.PI;
      // this.setState({
      this.xPos = 200 * Math.cos(POS_ANGLE);
      this.yPos = 200 * Math.sin(POS_ANGLE);
      // })
      this.togglePos = !this.togglePos;
    }
    console.log("togglepos", this.togglePos);
    //- determine rotation directions and span.
    if (this.togglePos) {
      this.rotation = -1;
      this.totalTime = this.state.breakControl;
      this.rangeFrame -= 1.5 / (this.totalTime * this.FPS);
    } else {
      this.rotation = 1;
      this.totalTime = this.state.sessionControl;
      this.rangeFrame += 1.5 / (this.totalTime * this.FPS);
    }
    //- paint tracker session progress range.
    this.tracker.beginPath();
    this.tracker.arc(
      0,
      0,
      200,
      0.75 * Math.PI,
      (0.75 + this.rangeFrame) * Math.PI
    );
    this.tracker.lineWidth = 21;
    this.tracker.strokeStyle = "#5bf800";
    this.tracker.lineCap = "round";
    this.tracker.stroke();
    //- updates the rotation of thumb.
    const ROTATE_ANGLE = this.eachFrame / (this.totalTime * this.FPS);
    this.tracker.rotate(this.rotation * ROTATE_ANGLE * 1.5 * Math.PI);
    //- paint tracker thumb.
    this.tracker.beginPath();
    this.tracker.arc(this.xPos, this.yPos, 20, 0, 2 * Math.PI);
    this.tracker.fillStyle = "#45AF02";
    this.tracker.shadowBlur = 1;
    this.tracker.shadowColor = "#D3D3D3";
    this.tracker.fill();

    //- avoid infinite requestanimationframe in componentDidMount.
    if (this.eachFrame > 0) {
      //- paint the arc fill when countdown is active.
      this.tracker.beginPath();
      this.tracker.arc(0, 0, 170, 0, 2 * Math.PI);
      this.tracker.fillStyle = this.togglePos ? "#1FFFFF" : "#5bf800";
      this.tracker.fill();

      this.trackerID = requestAnimationFrame(this.handleTracker);
    }

    this.tracker.restore();
    this.eachFrame++;
  }

  componentDidMount() {
    this.tracker = this.refs.canvas.getContext("2d");
    this.handleTracker(); //- initial canvas paint.
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
    cancelAnimationFrame(this.handleTracker);
  }

  render() {
    return (
      <div className="container">
        <canvas id="timeTracker" width="500px" height="500px" ref="canvas" />
        <div className="content">
          <div className="count-down-time">
            {this.state.minPrefix}
            {this.state.minCountDown}
            {this.state.secPrefix}
            <span className="sec">{this.state.secCountDown}</span>
          </div>
          <div className="count-down-status">{this.state.countDownStatus}</div>
          <button className="timer-btn" onClick={this.handleTimer}>
            {this.state.timerStatus}
          </button>
          <div className="controllers-panel">
            <SessionController
              SessionControl={this.state.sessionControl}
              handleSession={this.handleSessionController}
            />
            <BreakController
              BreakControl={this.state.breakControl}
              handleBreak={this.handleBreakController}
            />
          </div>
        </div>
      </div>
    );
  }
}

//----------------------

const BreakController = props => (
  <div className="break-container">
    <span className="controller" onClick={e => props.handleBreak(e)}>
      &lt;
    </span>
    <span className="break-min">{props.BreakControl}</span>
    <span className="controller" onClick={e => props.handleBreak(e)}>
      &gt;
    </span>
    <p>break time</p>
  </div>
);

//----------------------

const SessionController = props => (
  <div className="session-container">
    <span className="controller" onClick={e => props.handleSession(e)}>
      &lt;
    </span>
    <span className="session-min">{props.SessionControl}</span>
    <span className="controller" onClick={e => props.handleSession(e)}>
      &gt;
    </span>
    <p>session time</p>
  </div>
);

//----------------------

render(<App />, document.getElementById("root"));
