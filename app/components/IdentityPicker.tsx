import { IUser, Client } from "@vex-chat/vex";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router";
import { routes } from "../constants/routes";
import { keyFolder } from "./ClientLauncher";
import { IconUsername } from "./IconUsername";
import fs from "fs";
import Loading from "./Loading";
import { Link } from "react-router-dom";
import { dbFolder } from "../components/ClientLauncher";
import { VerticalAligner } from "./VerticalAligner";

export function IdentityPicker(): JSX.Element {
    const pubkeyRegex = /[0-9a-f]{64}/;

    const initialState: Record<string, IUser> = {};
    const [initialLoad, setInitialLoad] = useState(true);
    // const [errText, setErrText] = useState("");
    const [accounts, setAccounts] = useState(initialState);
    const history = useHistory();

    useMemo(async () => {
        const keyFiles = fs.readdirSync(keyFolder);
        const tempClient = new Client(undefined, { dbFolder });
        const accs: Record<string, IUser> = {};
        for (const keyFile of keyFiles) {
            if (!pubkeyRegex.test(keyFile)) {
                continue;
            }

            // filename is public key
            const [user, err] = await tempClient.users.retrieve(keyFile);
            if (err) {
                console.warn(err);
                continue;
            }
            if (user) {
                accs[user.signKey] = user;
            }
        }
        setAccounts(accs);
        setInitialLoad(false);
    }, [history]);

    if (initialLoad) {
        return <Loading size={256} animation={"cylon"} />;
    }

    if (!initialLoad && Object.keys(accounts).length === 0) {
        history.push(routes.REGISTER);
    }

    return (
        <VerticalAligner>
            <p className="title">Local Identities</p>
            <p className="subtitle">Which identity would you like to use?</p>

            <div className="panel is-light identity-panel">
                {Object.keys(accounts).length > 0 &&
                    Object.keys(accounts).map((key) => (
                        <div key={key} className="panel-block identity-link">
                            <span
                                className="identity-link"
                                onClick={() => {
                                    history.push(routes.LOGIN + "?key=" + key);
                                }}
                            >
                                {IconUsername(accounts[key])}
                            </span>
                        </div>
                    ))}
            </div>

            <div className="buttons is-right">
                <Link to={routes.REGISTER} className="button">
                    New Identity
                </Link>
            </div>
        </VerticalAligner>
    );
}
