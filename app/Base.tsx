import React, { useEffect } from "react";
import { Switch, Route } from "react-router-dom";
import { routes } from "./constants/routes";
import App from "./views/App";
import HomePage from "./views/HomePage";
import { Client, IMessage } from "@vex-chat/vex-js";
import { useDispatch } from "react-redux";
import { setUser } from "./reducers/user";
import os from "os";
import { setFamiliars } from "./reducers/familiars";
import { setMessages } from "./reducers/messages";

const homedir = os.homedir();
export const progFolder = `${homedir}/.vex-desktop`;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const client = new Client(localStorage.getItem("PK")!, {
    dbFolder: progFolder,
});
client.on("ready", async () => {
    await client.register("yellnat");
    client.login();
});
client.init();

export interface IDisplayMessage extends IMessage {
    timestamp: Date;
    direction: "outgoing" | "incoming";
}

export default function Base(): JSX.Element {
    const dispatch = useDispatch();

    useEffect(() => {
        client.on("authed", async () => {
            dispatch(setUser(client.users.me()));
            dispatch(setFamiliars(await client.familiars.retrieve()));
        });

        client.on("message", async (message: IMessage) => {
            const dispMsg: IDisplayMessage = {
                message: message.message,
                nonce: message.nonce,
                timestamp: new Date(Date.now()),
                sender: message.sender,
                direction: "incoming",
            };
            dispatch(setMessages(dispMsg));
        });
    });

    return (
        <App>
            <Switch>
                <Route path={routes.HOME} component={HomePage} />
            </Switch>
        </App>
    );
}
