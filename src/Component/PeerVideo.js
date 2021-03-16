import { useRef, useEffect } from "react";
const PeerVideo = (props) => {
  const ref = useRef();

  useEffect(() => {
    props.peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return (
    <div style={{ display: "inline-block" }}>
      <div>
        {props.nameClient !== "c" && <h3>{props.nameClient}</h3>}
        {props.hostName !== "h" && (
          <h1 style={{ color: "red" }}>{props.hostName}</h1>
        )}
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
