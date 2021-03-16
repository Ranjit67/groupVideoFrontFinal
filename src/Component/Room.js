import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import PeerVideo from "./PeerVideo";

export default function Room(props) {
  const [message, setmessage] = useState("");
  const [roomID, setroomID] = useState("");
  const [roomName, setroomName] = useState("");
  const [name, setname] = useState("");
  const [inputstate, setinputstate] = useState();
  const [roomList, setroomList] = useState({});
  const [clientRequest, setclientRequest] = useState([]); //object arry /clientName /clientId
  const [peers, setPeers] = useState([]);
  // const [nameClient, setnameClient] = useState([]);
  // const [hostName, sethostName] = useState([]);
  const myVideo = useRef();
  const socketRef = useRef();
  const peersRef = useRef([]);
  useEffect(() => {
    socketRef.current = io("http://localhost:4000/");
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        myVideo.current.srcObject = stream;
        socketRef.current.on("permission is granted", (users) => {
          // console.log(users.name);
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
          // if (payload.name) {
          //   // console.log(payload.name);
          //   // setnameClient(payload.name);
          //   setnameClient((cli) => [...cli, payload.name]);
          // } else {
          //   setnameClient((cli) => [...cli, "c"]);
          // }

          // if (payload.host) {
          //   // console.log(payload.host);
          //   sethostName((hos) => [...hos, payload.host]);
          // } else {
          //   sethostName((hos) => [...hos, "h"]);
          // }
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
          // }
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
    });
    socketRef.current.on("permission is rejected", (payload) => {
      setmessage(payload.message);
      setroomList(payload.roomToName);
      setroomID();
      // console.log(payload.roomToName);
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
      // const temp = peers.filter(
      //   (clients) => clients.peerID !== payload.disClient
      // );

      // const indexOftheItem = peers.findIndex(
      //   (clients) => clients.peerID == payload.disClient
      // );
      // let tempArayClintName = nameClient;
      // console.log(tempArayClintName);
      // tempArayClintName.splice(indexOftheItem, 1);
      // tempArayClintName = [...tempArayClintName];
      // console.log(tempArayClintName);
      // setnameClient(tempArayClintName);
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
        (id) => id.peerID == payload.removeClient
      );
      p.peer.destroy();
      setPeers((users) =>
        users.filter((clients) => clients.peerID !== payload.removeClient)
      );
    });
    //disconnected end
    socketRef.current.on("peer destroy", (payload) => {
      // console.log(payload);
      // const peer = new Peer({
      //   initiator: false,
      //   trickle: false,
      // });
      // peer.destroy();
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
      // console.log("hit");
      // peers.forEach((peer) => {
      //   peer.peer.destroy();
      // });
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
    // alert("This is create section.");
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
    // alert("hit");
    socketRef.current.emit("close the meeting");
  };
  return (
    <div>
      {!roomName && !name && (
        <div>
          <input
            type="text"
            placeholder={props.uui ? "Enter room name" : "Enter name"}
            onChange={(e) => {
              setinputstate(e.target.value);
            }}
          />
          <button onClick={props.uui ? createRoomHandler : joinRoomHandler}>
            Submit
          </button>
        </div>
      )}
      {roomName && (
        <div>
          <p>{roomName} is created.</p>
          <button onClick={closeMeeting}>Close meeting</button>
        </div>
      )}
      {name && (
        <div>
          {" "}
          <p>Hi... {name}.</p>
          {peers.length > 0 && (
            <button onClick={leaveMeeting}>Leave meeting</button>
          )}
        </div>
      )}
      <video muted ref={myVideo} autoPlay playsInline width="360" />
      <div>
        {clientRequest &&
          clientRequest.map((reqList, index) => (
            <div key={index}>
              <p>{reqList.clientName} is request to connect.</p>
              <button
                onClick={() => {
                  accept(reqList.clientId);
                  clientRequestManiqulation(index);
                }}
              >
                Accept
              </button>
              <button
                onClick={() => {
                  clientRequestManiqulation(index);
                  reject(reqList.clientId);
                }}
              >
                Reject
              </button>
            </div>
          ))}
        {!roomID &&
          Object.keys(roomList).map((key, index) => (
            <button
              key={key}
              onClick={() => {
                connectToClient(key);
                setmessage("Requested.....");
                setroomID("client");
              }}
            >
              {Object.values(roomList)[index]}
            </button>
          ))}
        {message && message}
      </div>

      {peers.map((peer, index) => {
        // console.log(nameClient);
        return (
          <PeerVideo
            key={peer.peerID}
            // nameClient={peer.name}
            // nameClient={nameClient[index]}
            // hostName={hostName[index]}
            // hostName={peer.host}
            roomName={roomName}
            peerId={peer.peerID}
            disconnect={() => disconnect(peer.peerID)}
            peer={peer.peer}
          />
        );
      })}
    </div>
  );
}
