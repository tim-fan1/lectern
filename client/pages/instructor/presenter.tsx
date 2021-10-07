import Navigation from "../../components/Navigation";
import TransparentButton from "../../components/TransparentButton";
import full_screen_image from "../../public/mdi_fullscreen.svg";
import exit_image from "../../public/mdi_exit-to-app.svg";

import QRCode from "qrcode.react";
import React, { useState } from "react";
import styles from "../../styles/presenter.module.css";

export default function OwO() {
    const [url, setUrl] = useState("www.owo.com");

    return (
        <div className={styles.top_level}>
            <Navigation />

            <div
                className={`container_center ${styles.main_container}`}
                id={styles.fullscreen_box}
            >
                <div className={styles.topfloat_container}>
                    <TransparentButton
                        className={styles.topfloat_item}
                        src={full_screen_image}
                        width={40}
                        height={40}
                        text={"Present in fullscreen"}
                        alt={"Fullscreen icon"}
                        onClick={() =>
                            document
                                .getElementById(styles.fullscreen_box)
                                ?.requestFullscreen()
                        }
                    />
                    <TransparentButton
                        className={styles.topfloat_item}
                        src={exit_image}
                        width={40}
                        height={40}
                        text={"Exit from presentation mode"}
                        alt={"Exit icon"}
                        onClick={() =>
                            document.fullscreenElement !== null
                                ? document.exitFullscreen()
                                : undefined
                        }
                    />
                </div>

                <div className={`container_center ${styles.middle_container}`}>
                    <h2 className={styles.middle_small_text}>Session</h2>
                    <h1 className={styles.middle_large_text}>
                        COMP3900 Lecture 3 😋{" "}
                    </h1>
                </div>

                <div className={styles.bottom_screen}>
                    <div
                        className={`container_center ${styles.bottom_text_container}`}
                    >
                        <h2 className={styles.bottom_small_text}>
                            To join enter code
                        </h2>
                        <h1 className={styles.bottom_large_text}>#123ABC</h1>
                        <h2 className={styles.bottom_small_text}>or visit</h2>
                        <h1 className={styles.bottom_large_text}>{url}</h1>
                    </div>
                    <div className={styles.bottom_qr_container}>
                        <QRCode
                            className={styles.qrcode}
                            value={url}
                            size={256}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
