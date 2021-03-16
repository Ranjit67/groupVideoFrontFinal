import { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
// import Peer from "simple-peer";
const PeerVideo = (props) => {
  const ref = useRef();
  const socketRef = useRef();
  const [clientName, setclientName] = useState();
  const [host, sethost] = useState();
  useEffect(() => {
    socketRef.current = io("http://localhost:4000/");
    props.peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });

    socketRef.current.emit("request for name", { id: props.peerId });
    socketRef.current.on("client name", (name) => {
      // console.log(name.clientName);
      if (!name.clientName) {
        socketRef.current.emit("for room name", { id: props.peerId });
      } else {
        setclientName(name.clientName);
      }
    });
    socketRef.current.on("room name", (roomName) => {
      sethost(roomName.roomName);
    });
  }, []);

  return (
    <div style={{ display: "inline-block" }}>
      <div>
        {clientName && <h3>{clientName}</h3>}
        {host && <h1 style={{ color: "red" }}>{host}</h1>}
      </div>
      <div>
        <video playsInline autoPlay ref={ref} width="360" />
      </div>
      {props.roomName && (
        <div>
          <button
            style={{ background: "red", color: "white" }}
            onClick={props.disconnect}
          >
            Disconnect{" "}
          </button>
        </div>
      )}
    </div>
  );
};
export default PeerVideo;
