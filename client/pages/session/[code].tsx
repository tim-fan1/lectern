import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import LecternLogo from "../../components/LecternLogo";
import Poll from "../../components/Poll";
import styles from "../../styles/session.module.css";
import { SessionActivity } from "../../utils/util";
import NavigationSession from "../../components/NavigationSession";

// man js strings SUCK for putting markdown in
const title =
    `What is the best web development software for complexity? It couldn't be 
\`javascript\`, **markdown**, *italic*,  or, wowee might even be 
\`\`\`cpp
\#include <iostream>
\#include <string>
std::string bestLanguage() {
    return "cpp";
}
\`\`\` 
or
~~~haskell
main :: IO ()
main = putStrLn "Hello, World!"
~~~


or maybe 
` +
    String.raw`$$
c = \pm\sqrt{a^2 + b^2}
$$ ` +
    "\n" +
    String.raw`$$
c = S (ω)=1.466\, H_s^2 \,  \frac{ω_0^5}{ω^6 }  \, e^[-3^ { ω/(ω_0  )]^2}
$$ ` +
    "\n" +
    String.raw`$$
\text{another one}
$$ `;

function getActivityElement(activity: SessionActivity) {
    switch (activity) {
        case SessionActivity.POLL:
            return (
                <Poll
                    title={title}
                    questions={[
                        "Package managers",
                        "JavaScript `bundlers`",
                        "Frameworks on top of frameworks (e.g. Next.js)",
                        "All of the above",
                    ]}
                />
            );
        default:
            return <p>Coming soon™</p>;
    }
}

export default function Session() {
    const router = useRouter();
    const { code } = router.query;
    const [selectedActivity, setSelectedActivity] = useState(SessionActivity.POLL);

    return (
        <div className={`container_center ${styles.root_container}`}>
            <Head>
                <title>lectern - Session {code}</title>
            </Head>

            <div className={styles.top_container}>
                <LecternLogo />
                <NavigationSession selected={selectedActivity} setSelected={setSelectedActivity} />
                <div id={styles.room_id_container}>
                    <span id={styles.room_id_room} className={styles.room_text}>
                        Room:{" "}
                    </span>
                    <span id={styles.room_id_hash} className={styles.room_text}>
                        #
                    </span>
                    <span className={styles.room_text}>{code}</span>
                </div>
            </div>
            <div className={`"container_center" ${styles.content_container}`}>
                {getActivityElement(selectedActivity)}
            </div>
        </div>
    );
}
