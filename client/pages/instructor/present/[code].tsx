import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import QRCode from "qrcode.react";
import React, { useState } from "react";
import { useQuery } from "urql";

import TransparentButton from "../../../components/TransparentButton";
import Navigation from "../../../components/Navigation";
import styles from "../../../styles/present.module.css";
// TODO: mixing casing?
import full_screen_image from "../../../public/mdi_fullscreen.svg";
import exit_image from "../../../public/mdi_exit-to-app.svg";

const QuerySessionDetails = `
    query ($code: String!) {
        sessionDetails(code: $code) {
            session {
                name
            }
            errors {
                kind
                msg
            }
        }
    }
`;

// TODO: "back to dashboard" and "present in fullscreen" should be on same level
// TODO: fix up these class names

export default function Present() {
    const router = useRouter();
    const { code } = router.query;
    const url = process.env.NEXT_PUBLIC_FRONTEND_HOST + "/join/" + code;

    const [isFullscreen, setIsFullscreen] = useState(false);

    /* TODO: error-handling for whether or not `code` is valid. */
    const [result] = useQuery({ query: QuerySessionDetails, variables: { code: code } });
    const { data, fetching, error } = result;

    const handleEnterFullscreen = async () => {
        setIsFullscreen(true);
        document.getElementById(styles.fullscreen_box)?.requestFullscreen();
    };

    const handleExitFullscreen = async () => {
        setIsFullscreen(false);
        document.fullscreenElement !== null ? document.exitFullscreen() : undefined;
    };

    return (
        <div className={styles.top_level}>
            <Head>
                <title>lectern - present {code}</title>
            </Head>
            <Navigation />
            <div className="container_center">
                <Link href="/instructor/dashboard">
                    <a>Back to dashboard</a>
                </Link>
            </div>

            <div className={`container_center ${styles.main_container}`} id={styles.fullscreen_box}>
                <div className={styles.topfloat_container}>
                    {!isFullscreen && (
                        <TransparentButton
                            className={styles.topfloat_item}
                            src={full_screen_image}
                            width={40}
                            height={40}
                            text={"Present in fullscreen"}
                            alt={"Fullscreen icon"}
                            onClick={handleEnterFullscreen}
                        />
                    )}
                    {isFullscreen && (
                        <TransparentButton
                            className={styles.topfloat_item}
                            src={exit_image}
                            width={40}
                            height={40}
                            text={"Exit from presentation mode"}
                            alt={"Exit icon"}
                            onClick={handleExitFullscreen}
                        />
                    )}
                </div>

                <div className={`container_center ${styles.middle_container}`}>
                    <h2 className={styles.middle_small_text}>Presenting session:</h2>
                    {!fetching && (
                        <h1 className={styles.middle_large_text}>
                            {data.sessionDetails.session.name}
                        </h1>
                    )}
                </div>

                <div className={styles.bottom_screen}>
                    <div className={`container_center ${styles.bottom_text_container}`}>
                        <h2 className={styles.bottom_small_text}>To join enter code</h2>
                        <h1 className={styles.bottom_large_text}>#{code}</h1>
                        <h2 className={styles.bottom_small_text}>or visit</h2>
                        <h1 className={styles.bottom_url_text}>{url}</h1>
                    </div>
                    <div className={styles.bottom_qr_container}>
                        <QRCode className={styles.qrcode} value={url} size={256} />
                    </div>
                </div>
            </div>
        </div>
    );
}
