import { useState } from "react";

import { v1 as uuid } from "uuid";
import Room from "./Component/Room";
import { makeStyles } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
const useStyles = makeStyles((theme) => ({
  root: {
    height: "40%",
    width: "100%",
    position: "absolute",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    margin: "0 20px 0 0",
  },
}));
export default function App() {
  const [uui, setuui] = useState("");
  const [forJoin, setforJoin] = useState(true);

  const createRoom = () => {
    setuui(uuid());
  };
  const joinRoomHandler = () => {
    setforJoin(false);
  };
  const cleanUui = () => {
    setuui();
  };
  const classes = useStyles();
  return (
    <div className={classes.mainRoot}>
      {!uui && forJoin ? (
        <div className={classes.root}>
          <Button
            color="primary"
            variant="contained"
            className={classes.createButton}
            onClick={createRoom}
          >
            Create New Room
          </Button>
          <Button
            color="secondary"
            variant="contained"
            onClick={joinRoomHandler}
          >
            Join Rooms
          </Button>
        </div>
      ) : null}
      {uui || !forJoin ? <Room uui={uui} cleanUui={cleanUui} /> : null}
      {/* <video muted ref={myVideo} autoPlay playsInline /> */}
    </div>
  );
}
