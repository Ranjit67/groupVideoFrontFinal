import { useState } from "react";

import { v1 as uuid } from "uuid";
import Room from "./Component/Room";
export default function App() {
  const [uui, setuui] = useState("");
  const [forJoin, setforJoin] = useState(true);

  const createRoom = () => {
    setuui(uuid());
  };
  const joinRoomHandler = () => {
    setforJoin(false);
  };
  return (
    <div>
      {!uui && forJoin ? (
        <div>
          <button onClick={createRoom}>Create room</button>
          <button onClick={joinRoomHandler}>Join room</button>
        </div>
      ) : null}
      {uui || !forJoin ? <Room uui={uui} /> : null}
      {/* <video muted ref={myVideo} autoPlay playsInline /> */}
    </div>
  );
}
