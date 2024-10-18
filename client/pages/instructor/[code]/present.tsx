import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import QRCode from "qrcode.react";
import React, { useState } from "react";
import { useQuery } from "urql";
import Navigation from "../../../components/Navigation";
import ButtonTransparent from "../../../components/ButtonTransparent";
import iconExitFullscreen from "../../../public/mdi_exit-to-app.svg";
import iconEnterFullscreen from "../../../public/mdi_fullscreen.svg";
import styles from "../../../styles/present.module.css";

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

export default function Present() {
    const router = useRouter();
    const { code } = router.query;
    const url = process.env.NEXT_PUBLIC_FRONTEND_HOST + "/join/" + code;
    const shortenedUrl = url.replace(/(^\w+:|^)\/\//, "");

    const [isFullscreen, setIsFullscreen] = useState(false);

    const [result] = useQuery({ query: QuerySessionDetails, variables: { code: code } });
    const { data, fetching, error } = result;

    const handleEnterFullscreen = () => {
        document
            .getElementById(styles.fullscreen_box)
            ?.requestFullscreen()
            .then(() => {
                setIsFullscreen(true);
            });
    };

    const handleExitFullscreen = async () => {
        await document.exitFullscreen();
        setIsFullscreen(false);
    };

    return (
        <div className={styles.top_level}>
            <Head>
                <title>lectern - Present {code}</title>
            </Head>
            <Navigation />
            <div className={`container_center ${styles.main_container}`} id={styles.fullscreen_box}>
                <div className={styles.topfloat_container}>
                    {!isFullscreen && (
                        <ButtonTransparent
                            className={styles.topfloat_item}
                            src={iconEnterFullscreen}
                            width={40}
                            height={40}
                            text={"Present in fullscreen"}
                            alt={"Fullscreen icon"}
                            onClick={handleEnterFullscreen}
                        />
                    )}
                    {isFullscreen && (
                        <ButtonTransparent
                            className={styles.topfloat_item}
                            src={iconExitFullscreen}
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
                        <h1 className={styles.bottom_url_text}>{shortenedUrl}</h1>
                    </div>
                    <div className={styles.bottom_qr_container}>
                        <QRCode className={styles.qrcode} value={url} size={256} />
                    </div>
                </div>
            </div>
        </div>
    );
}
