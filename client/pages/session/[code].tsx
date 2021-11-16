import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import LecternLogo from "../../components/LecternLogo";
import Poll from "../../components/Poll";
import MultipleChoiceQuiz from "../../components/MultipleChoiceQuiz";
import DragAndDropQuiz from "../../components/DragAndDropQuiz";
import styles from "../../styles/session.module.css";
import { SessionActivity } from "../../utils/util";
import NavigationSession from "../../components/NavigationSession";
import { DragDropContext } from "react-beautiful-dnd";
import MultipleChoiceQuizResults from "../../components/MultipleChoiceQuizResults";
import { Activity } from "../../entities/entities";
import { useAppDispatch, useAppSelector } from "../../state/hooks";

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
$$ 

we also autolink literals for funzys 

www.google.com

* [ ] to do
* [x] done

~~uwu~~

`;

function getActivityElement(selection: SessionActivity, activity: Activity) {
    switch (selection) {
        case SessionActivity.POLL:
            return <Poll activity={activity} />;
        case SessionActivity.QUIZ:
            return (
                <>
                    <MultipleChoiceQuiz
                        title={"What is the best web development software for complexity?"}
                        answers={[
                            "Package managers",
                            "JavaScript bundlers",
                            "Frameworks on top of frameworks (e.g. Next.js)",
                            "All of the above",
                        ]}
                    />
                    <MultipleChoiceQuizResults
                        title={"What is the best web development software for complexity?"}
                        results={[
                            {
                                optionName: "OPTION AAAAAAAAA",
                                numberOfVotes: 9,
                                isCorrectAnswer: false,
                            },
                            {
                                optionName: "OPTION BB",
                                numberOfVotes: 1,
                                isCorrectAnswer: false,
                            },
                            {
                                optionName: "OPTION C",
                                numberOfVotes: 24,
                                isCorrectAnswer: true,
                            },
                            {
                                optionName: "OPTION DDDD",
                                numberOfVotes: 13,
                                isCorrectAnswer: false,
                            },
                        ]}
                    />
                    <DragAndDropQuiz
                        title={title}
                        answers={[
                            "Package managers",
                            "JavaScript bundlers",
                            "Frameworks on top of frameworks (e.g. Next.js)",
                            "All of the above",
                        ]}
                    />
                </>
            );
        default:
            return <p>Coming soon™</p>;
    }
}

export default function Session() {
    const router = useRouter();
    const { code } = router.query;
    const [selectedActivityKind, setSelectedActivityKind] = useState(SessionActivity.POLL);
    const session = useAppSelector((s) => s.session.session);
    const openActivity =
        session !== undefined && session.activities !== undefined
            ? session.activities.find((a) => a.state === "open")
            : undefined;
    return (
        <div className={`container_center ${styles.root_container}`}>
            <Head>
                <title>lectern - Session {code}</title>
            </Head>

            <div className={styles.top_container}>
                <LecternLogo />
                <NavigationSession
                    selected={selectedActivityKind}
                    setSelected={setSelectedActivityKind}
                />
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
                {openActivity !== undefined
                    ? getActivityElement(selectedActivityKind, openActivity)
                    : ""}
            </div>
        </div>
    );
}
