import React, { useState } from "react";
import { BackButton } from "../components/BackButton";
import { VerticalAligner } from "../components/VerticalAligner";
import { routes } from "../constants/routes";
import { dataStore } from "./Base";

export default function Settings(): JSX.Element {
    const [notification, setNotifications] = useState(
        dataStore.get("settings.notifications") as boolean
    );

    return (
        <VerticalAligner top={<BackButton route={routes.HOME} />}>
            <div className="panel is-light">
                <p className="panel-heading">Settings</p>
                <div className="panel-block">
                    <label className="checkbox settings-box">
                        <input
                            onChange={() => {
                                dataStore.set(
                                    "settings.notifications",
                                    !notification
                                );
                                setNotifications(!notification);
                            }}
                            type="checkbox"
                            checked={notification}
                        />
                        &nbsp; Notifications
                    </label>
                </div>
            </div>
        </VerticalAligner>
    );
}
