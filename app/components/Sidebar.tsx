import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "@vex-chat/vex-js";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useHistory } from "react-router-dom";
import {
    addConversation,
    selectConversations,
    setConversations,
} from "../reducers/conversations";
import {
    addFamiliar,
    selectFamiliars,
    setFamiliars,
} from "../reducers/familiars";
import { selectInputs, setInputState } from "../reducers/inputs";
import { selectUser } from "../reducers/user";
import { strToIcon } from "../utils/strToIcon";
import { IconUsername } from "./IconUsername";
import { client } from "../Base";

export const clickFX = new Audio("https://www.extrahash.org/move.wav");
clickFX.load();

export default function Sidebar(): JSX.Element {
    const user: IUser = useSelector(selectUser);
    const history = useHistory();

    const dispatch = useDispatch();
    const inputs = useSelector(selectInputs);

    const familiars: Record<string, IUser> = useSelector(selectFamiliars);
    const conversations: Record<string, string[]> = useSelector(
        selectConversations
    );

    return (
        <div className="sidebar">
            <div className="field has-addons search-wrapper">
                <figure className="user-icon image is-32x32">
                    {user.userID !== "" && (
                        <img
                            className="is-rounded"
                            src={strToIcon(user.username.slice(0, 2))}
                        />
                    )}
                </figure>
                <div className="field">
                    <p className="control has-icons-left">
                        <input
                            className="input has-icons-left is-grey is-small is-rounded"
                            type="text"
                            placeholder="Search"
                            value={inputs["search-bar"] || ""}
                            onChange={async (event) => {
                                dispatch(
                                    setInputState(
                                        "search-bar",
                                        event.target.value
                                    )
                                );

                                const results: Record<string, IUser> = {};

                                try {
                                    if (event.target.value.length > 2) {
                                        for (const userID in familiars) {
                                            if (
                                                familiars[userID].username
                                                    .trim()
                                                    .toLowerCase()
                                                    .includes(
                                                        event.target.value.toLowerCase()
                                                    )
                                            ) {
                                                results[userID] =
                                                    familiars[userID];
                                            }
                                        }

                                        const serverResults = await client.users.retrieve(
                                            event.target.value
                                        );
                                        if (serverResults) {
                                            dispatch(
                                                addFamiliar(serverResults)
                                            );
                                            dispatch(
                                                setInputState("search-bar", "")
                                            );
                                            dispatch(
                                                addConversation(
                                                    serverResults.userID
                                                )
                                            );
                                            history.push(
                                                "/" + serverResults.userID
                                            );
                                            clickFX.play();
                                        }
                                    }
                                } catch (err) {
                                    console.error(err);
                                }
                            }}
                        />
                        <span className="icon is-small is-left">
                            <FontAwesomeIcon
                                className="is-left"
                                icon={faSearch}
                            />
                        </span>
                    </p>
                </div>
            </div>
            <aside className="menu">
                <ul className="menu-list">
                    {FamiliarButton({
                        user: familiars[user.userID],
                        self: true,
                    })}

                    {Object.keys(conversations).map((userID) => {
                        if (familiars[userID] === undefined) {
                            return;
                        }

                        if (user.userID === userID) {
                            return;
                        }

                        return FamiliarButton({ user: familiars[userID] });
                    })}
                </ul>
            </aside>
        </div>
    );
}

type buttonProps = {
    user: IUser;
    self?: boolean;
};

function FamiliarButton({ user, self = false }: buttonProps): JSX.Element {
    if (!user) {
        return <div />;
    }

    if (self) {
        user.username = "Me";
    }

    return (
        <li className="familiar-button" key={user.userID}>
            <Link to={"/" + user.userID}>{IconUsername(user, 48)}</Link>
        </li>
    );
}
