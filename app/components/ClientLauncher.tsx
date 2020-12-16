/* eslint-disable no-case-declarations */
import { Client, IMessage, ISession, IUser } from "@vex-chat/vex-js";
import { sleep } from "@extrahash/sleep";
import { ipcRenderer, remote } from "electron";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import { routes } from "../constants/routes";
import { resetApp, setApp } from "../reducers/app";
import { addFamiliar, setFamiliars } from "../reducers/familiars";
import { addMessage, resetMessages } from "../reducers/messages";
import { addSession, setSessions } from "../reducers/sessions";
import { selectSettings } from "../reducers/settings";
import { setUser } from "../reducers/user";
import os from "os";
import { resetInputStates } from "../reducers/inputs";
import { EventEmitter } from "events";
import log from "electron-log";
import { setServers } from "../reducers/servers";
import { addChannels } from "../reducers/channels";
import { addGroupMessage } from "../reducers/groupMessages";
import Loading from "./Loading";

declare global {
    interface Window {
        vex: Client;
    }
}

const homedir = os.homedir();
export const progFolder = `${homedir}/.vex-desktop`;
// eslint-disable-next-line no-var
let client: Client;

const launchEvents = new EventEmitter();

export async function initClient(): Promise<void> {
    if (window.vex && window.vex.hasInit) {
        await window.vex.close();
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const PK = localStorage.getItem("PK")!;
    client = new Client(PK, {
        dbFolder: progFolder,
        logLevel: "info",
    });
    window.vex = client;
    client.on("ready", async () => {
        const [, err] = await client.users.retrieve(client.getKeys().public);

        if (err !== null) {
            if (err.response) {
                log.warn(
                    "Server responded to users.retrieve() with " +
                        err.response.status
                );

                switch (err.response.status) {
                    case 404:
                        launchEvents.emit("needs-register");
                        break;
                    default:
                        await client.close();
                        await sleep(1000 * 10);
                        launchEvents.emit("retry");
                }
            }
        }
        await client.login();
    });
    client.init();
}

function objifySessions(sessions: ISession[]): Record<string, ISession[]> {
    const sessionsObj: Record<string, ISession[]> = {};

    for (const sess of sessions) {
        if (sessionsObj[sess.userID] === undefined) {
            sessionsObj[sess.userID] = [];
        }
        sessionsObj[sess.userID].push(sess);
    }
    return sessionsObj;
}

export function ClientLauncher(): JSX.Element {
    const dispatch = useDispatch();
    const history = useHistory();
    const settings = useSelector(selectSettings);

    const messageHandler = async (message: IMessage) => {
        if (message.group) {
            dispatch(addGroupMessage(message));
        } else {
            dispatch(addMessage(message));
        }

        if (
            !message.group &&
            settings.notifications &&
            message.direction === "incoming" &&
            message.recipient !== message.sender
        ) {
            const msgNotification = new Notification("Vex", {
                body: message.message,
            });

            msgNotification.onclick = () => {
                remote.getCurrentWindow().show();
                history.push(
                    routes.MESSAGING +
                        "/" +
                        (message.direction === "incoming"
                            ? message.sender
                            : message.recipient)
                );
            };
        }
    };

    const needsRegisterHandler = () => {
        history.push(routes.REGISTER);
    };

    const retryHandler = async () => {
        history.push(routes.HOME);
    };

    const relaunch = async () => {
        await client.close();

        client.off("authed", authedHandler);
        client.off("disconnect", relaunch);
        client.off("session", sessionHandler);
        client.off("message", messageHandler);

        dispatch(resetApp);
        dispatch(resetInputStates);
        dispatch(resetMessages);

        history.push(routes.HOME);
    };

    const sessionHandler = async (session: ISession, user: IUser) => {
        dispatch(addSession(session));
        dispatch(addFamiliar(user));
    };

    const authedHandler = async () => {
        dispatch(setApp("initialLoad", true));
        const me = client.users.me();
        dispatch(setUser(me));

        history.push(routes.MESSAGING + "/" + me.userID);

        const sessions = await client.sessions.retrieve();
        dispatch(setSessions(objifySessions(sessions)));

        const familiars = await client.users.familiars();
        dispatch(setFamiliars(familiars));
        for (const user of familiars) {
            const history = await client.messages.retrieve(user.userID);
            for (const message of history) {
                if (message.group) {
                    dispatch(addGroupMessage(message));
                } else {
                    dispatch(addMessage(message));
                }
            }
        }

        const servers = await client.servers.retrieve();
        dispatch(setServers(servers));
        for (const server of servers) {
            const channels = await client.channels.retrieve(server.serverID);
            dispatch(addChannels(channels));
        }

        dispatch(setApp("initialLoad", false));
    };

    /* giving useMemo an empty set of dependencies
    so that this only happens once */
    useMemo(() => {
        ipcRenderer.on("relaunch", relaunch);
        initClient();
    }, []);

    useEffect(() => {
        launchEvents.on("needs-register", needsRegisterHandler);
        launchEvents.on("retry", relaunch);

        client.on("authed", authedHandler);
        client.on("disconnect", relaunch);
        client.on("session", sessionHandler);
        client.on("message", messageHandler);

        return () => {
            launchEvents.off("needs-register", needsRegisterHandler);
            launchEvents.off("retry", retryHandler);
        };
    });
    return <Loading size={256} animation={"cylon"} />;
}
