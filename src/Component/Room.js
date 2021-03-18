import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import PeerVideo from "./PeerVideo";
import { makeStyles } from "@material-ui/core/styles";
import { Button, TextField } from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import Modal from "@material-ui/core/Modal";

function rand() {
  return Math.round(Math.random() * 20) - 10;
}
function getModalStyle() {
  const top = 50 + rand();
  const left = 52 + rand();

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}
const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    // margin: "40px 0 0 0",
  },
  selfVideo: {
    // margin: "10px 0 20px 0",
    // width: "360px",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
    },
    [theme.breakpoints.up("md")]: {
      width: "480px",
    },
  },

  selfVideoScreenDownIco: {
    position: "absolute",
    top: "15px",
    right: "10px",
    color: "white",
    cursor: "pointer",
  },
  selfVideoAndIcon: {
    position: "relative",
  },
  joinAndCreateBtn: {
    backgroundColor: "#7f8c8d",
    color: "white",
    marginLeft: "20px",
  },
  closeMeetingBtn: {
    backgroundColor: "#c0392b",
    color: "white",
    marginBottom: "30px",
  },
  userDisplayMeessage: {
    fontFamily: "sans-serif",
  },
  innerDivItemMakeCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  roomList: {
    width: "90%",
  },
  roomListUpperDiv: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  enterRoomOrName: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  listRoomBtn: {
    backgroundColor: "#8395a7",
    color: "black",
    display: "inline-block",
    marginRight: "10px",
  },
  acceptAndRejectDiv: {
    width: "50%",
    fontFamily: "sans-serif",
    [theme.breakpoints.down("sm")]: {
      padding: "20px 0 0 20px",
    },
    [theme.breakpoints.up("md")]: {
      padding: "20px 0 0 60px",
    },
  },
  acceptBtn: {
    backgroundColor: "#303952",
    color: "white",
    marginRight: "20px",
    "&:hover": {
      backgroundColor: "#596275",
    },
  },
  rejectBtn: {
    backgroundColor: "#a5b1c2",
    color: "black",
  },
  nameRequester: {
    fontSize: "1.4rem",
  },
  videosContDiv: {
    // padding: "40px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(22rem,3fr))",
    gridGap: "1rem",
    [theme.breakpoints.up("md")]: {
      padding: "40px",
    },
  },
  smallScreenVideo: {
    position: "fixed",
    bottom: "65px",
    right: "15px",
    height: "124px",
    width: "137px",
  },
  smallVideo: {
    width: "100%",
  },
  selfVideoOff: {
    display: "none",
    width: 0,
    height: "0",
  },
  leaveMeetingBtn: {
    backgroundColor: "#fc5c65",
    marginBottom: "30px",
  },
  forHostDiv: {
    backgroundColor: "red",
    height: "360px",
    width: "480px",
  },
  paper: {
    position: "absolute",
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    minWidth: "212px",
  },
  requestModal: {
    backgroundColor: "transparent",
  },
  message: {
    width: "90%",
  },
}));
export default function Room(props) {
  const [modalStyle, setMakeStyle] = useState(getModalStyle);
  const [message, setmessage] = useState("");
  const [roomID, setroomID] = useState("");
  const [roomName, setroomName] = useState("");
  const [name, setname] = useState("");
  const [inputstate, setinputstate] = useState();
  const [roomList, setroomList] = useState({});
  const [clientRequest, setclientRequest] = useState([]); //object arry /clientName /clientId
  const [peers, setPeers] = useState([]);
  // design

  const [videoScreen, setvideoScreen] = useState(true);
  const myVideo = useRef();
  const myVideoShortScreen = useRef();
  const socketRef = useRef();
  const peersRef = useRef([]);
  useEffect(() => {
    // https://groupvideocallapi.herokuapp.com/
    // http://localhost:4000/
    socketRef.current = io("https://groupvideocallapi.herokuapp.com/");
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        myVideo.current.srcObject = stream;

        myVideoShortScreen.current.srcObject = stream;

        socketRef.current.on("permission is granted", (users) => {
          setmessage("");
          const peers = [];
          users.userInthisRoom.forEach((userid) => {
            const peer = createPeer(userid, socketRef.current.id, stream);
            peersRef.current.push({
              peerID: userid,
              peer,
            });

            peers.push({ peer, peerID: userid });
          });
          setPeers(peers);
        });
        socketRef.current.on("user joiend", (payload) => {
          const peer = addPeer(payload.clientSignal, payload.clientId, stream);
          peersRef.current.push({
            peerID: payload.clientId,
            peer,
          });

          setPeers((users) => [
            ...users,
            {
              peer,
              peerID: payload.clientId,
              host: payload.host,
              name: payload.name,
            },
          ]);
        });
      });
    socketRef.current.on("self room id", (selfRoom) => {
      setroomID(selfRoom.selfRoom);
    });
    socketRef.current.on("rooms", (rooms) => {
      setroomList(rooms.roomToName);
    });

    socketRef.current.on("for permission", (detailClient) => {
      const data = {
        clientId: detailClient.clientId,
        clientName: detailClient.name,
      };

      setclientRequest((req) => [...req, data]);
      setMakeStyle(getModalStyle);
    });
    socketRef.current.on("permission is rejected", (payload) => {
      setmessage(payload.message);
      setroomList(payload.roomToName);
      setroomID();
    });

    socketRef.current.on("receiving return signal", (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);

      item.peer.signal(payload.signal);
    });
    // disconnected
    socketRef.current.on("client disconnected mess to host", (payload) => {
      console.log("dis " + payload.disClient);
      const p = peersRef.current.find((id) => id.peerID === payload.disClient);
      p.peer.destroy();

      setPeers((users) =>
        users.filter((clients) => clients.peerID !== payload.disClient)
      );
      payload.rooms.forEach((eachClient) => {
        socketRef.current.emit("for leve action get to other client", {
          otherClient: eachClient,
          disClient: payload.disClient,
        });
      });
    });
    socketRef.current.on("remove that client", (payload) => {
      const p = peersRef.current.find(
        (id) => id.peerID === payload.removeClient
      );
      p.peer.destroy();
      setPeers((users) =>
        users.filter((clients) => clients.peerID !== payload.removeClient)
      );
    });
    //disconnected end
    socketRef.current.on("peer destroy", (payload) => {
      setPeers([]);
      peersRef.current = [];
      setroomID();
      socketRef.current.emit("back to see room", {
        roomToName: payload.roomToName,
      });
    });
    socketRef.current.on("host leave", (host) => {
      // console.log(host.roomToName);
      if (host.roomToName) {
        setroomList(host.roomToName);
      } else {
        setroomList({});
      }

      socketRef.current.emit("cheack you are this room", {
        roomID: host.roomID,
      });
    });
    socketRef.current.on("data match", () => {
      socketRef.current.emit("leave from metting", "data match");
    });
    socketRef.current.on("disconnect all clint video in host", () => {
      setPeers([]);
      socketRef.current.emit("disconnect host to client");
    });
    socketRef.current.on("go and leave", () => {
      socketRef.current.emit("leave from metting", "leave");
    });
  }, []);
  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }
  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  }

  const createRoomHandler = () => {
    setroomName(inputstate);
    socketRef.current.emit("create room", {
      roomId: props.uui,
      roomName: inputstate,
    });
  };
  const joinRoomHandler = () => {
    setname(inputstate);
    socketRef.current.emit("new clint join to room", { name: inputstate });
  };
  const connectToClient = (id) => {
    socketRef.current.emit("connect request to host", { hostRoomId: id });
  };
  const accept = (clin) => {
    socketRef.current.emit("permission status send host", {
      accept: true,
      clintId: clin,
    });
  };
  const reject = (clin) => {
    socketRef.current.emit("permission status send host", {
      accept: false,
      clintId: clin,
    });
  };
  const clientRequestManiqulation = (id) => {
    let temp = clientRequest;
    temp.splice(id, 1);
    temp = [...temp];
    setclientRequest(temp);
  };
  const disconnect = (id) => {
    socketRef.current.emit("This clint should to leave", { clientId: id });
  };
  const leaveMeeting = () => {
    socketRef.current.emit("leave from metting", "leave");
  };
  const closeMeeting = () => {
    socketRef.current.emit("close the meeting");
    props.cleanUui();
  };
  const selfVideoHandel = () => {
    setvideoScreen(false);
  };
  const selfVideoHandelSmallScreen = () => {
    setvideoScreen(true);
  };

  const classes = useStyles();
  return (
    <div>
      {roomName && (
        <div className={classes.innerDivItemMakeCenter}>
          <h3 className={classes.userDisplayMeessage}>
            {roomName} room is created.
          </h3>
          <Button className={classes.closeMeetingBtn} onClick={closeMeeting}>
            Close meeting
          </Button>
        </div>
      )}
      {name && (
        <div className={classes.innerDivItemMakeCenter}>
          <h3 className={classes.userDisplayMeessage}>Hi... {name}.</h3>
          {peers.length > 0 && (
            <Button
              variant="contained"
              className={classes.leaveMeetingBtn}
              onClick={leaveMeeting}
            >
              Leave meeting
            </Button>
          )}
        </div>
      )}
      {
        <div className={classes.innerDivItemMakeCenter}>
          <div className={classes.selfVideoAndIcon}>
            <video
              className={videoScreen ? classes.selfVideo : classes.selfVideoOff}
              muted
              ref={myVideo}
              autoPlay
              playsInline
            />
            {peers.length > 0 && (
              <ExpandMore
                onClick={selfVideoHandel}
                className={classes.selfVideoScreenDownIco}
              />
            )}
          </div>
        </div>
      }
      {!roomName && !name && (
        <div className={classes.enterRoomOrName}>
          <TextField
            onChange={(e) => {
              setinputstate(e.target.value);
            }}
            id="standard-basic"
            label={props.uui ? "Enter room name" : "Enter name"}
          />
          <Button
            variant="contained"
            className={classes.joinAndCreateBtn}
            onClick={props.uui ? createRoomHandler : joinRoomHandler}
          >
            Submit
          </Button>
        </div>
      )}

      <div>
        <div className={classes.acceptAndRejectDiv}>
          {clientRequest &&
            clientRequest.map((reqList, index) => (
              <Modal
                disableBackdropClick={true}
                hideBackdrop={true}
                disableScrollLock={true}
                open={reqList.clientName}
                className={classes.requestModal}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
              >
                <div key={index} style={modalStyle} className={classes.paper}>
                  <p>
                    <span className={classes.nameRequester}>
                      {reqList.clientName}
                    </span>{" "}
                    is request to connect.
                  </p>
                  <Button
                    className={classes.acceptBtn}
                    onClick={() => {
                      accept(reqList.clientId);
                      clientRequestManiqulation(index);
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    className={classes.rejectBtn}
                    onClick={() => {
                      clientRequestManiqulation(index);
                      reject(reqList.clientId);
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </Modal>
            ))}
        </div>

        {/* <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
         <div key={index}>
                <p>
                  <span className={classes.nameRequester}>
                    {reqList.clientName}
                  </span>{" "}
                  is request to connect.
                </p>
                <Button
                  className={classes.acceptBtn}
                  onClick={() => {
                    accept(reqList.clientId);
                    clientRequestManiqulation(index);
                  }}
                >
                  Accept
                </Button>
                <Button
                  className={classes.rejectBtn}
                  onClick={() => {
                    clientRequestManiqulation(index);
                    reject(reqList.clientId);
                  }}
                >
                  Reject
                </Button>
              </div>
        
      </Modal> */}

        {!roomID && name && (
          <div className={classes.roomListUpperDiv}>
            <div className={classes.roomList}>
              <p>Rooms are</p>
              {Object.keys(roomList).map((key, index) => (
                <Button
                  className={classes.listRoomBtn}
                  key={key}
                  onClick={() => {
                    connectToClient(key);
                    setmessage("Requested.....");
                    setroomID("client");
                  }}
                >
                  {Object.values(roomList)[index]}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className={classes.innerDivItemMakeCenter}>
          <div className={classes.message}>{message && message}</div>
        </div>
      </div>

      <div className={classes.videosContDiv}>
        {peers.map((peer, index) => {
          // console.log(nameClient);
          return (
            <PeerVideo
              key={peer.peerID}
              roomName={roomName}
              peerId={peer.peerID}
              disconnect={() => disconnect(peer.peerID)}
              peer={peer.peer}
            />
          );
        })}
      </div>

      <div
        onClick={selfVideoHandelSmallScreen}
        className={
          !videoScreen ? classes.smallScreenVideo : classes.selfVideoOff
        }
      >
        <video
          className={!videoScreen ? classes.smallVideo : classes.selfVideoOff}
          muted
          ref={myVideoShortScreen}
          autoPlay
          playsInline
          // width="360"
        />
      </div>
    </div>
  );
}
