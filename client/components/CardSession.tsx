import { dashboardDateToString } from "../util";
import styles from "../styles/CardSession.module.css";

interface Props {
    timeCreatedUTC: string;
    name: string;
}

const MutationStartSession = `
    mutation($id = string!) {
    }
`;

export default function CardSession({ timeCreatedUTC, name }: Props) {
    const timeCreatedString = dashboardDateToString(new Date(timeCreatedUTC));

    const handleStartSession = () => {};

    return (
        <div className={styles.container}>
            <h3 className={styles.name}>
                <b>{name}</b>
            </h3>
            <p className={styles.datetime}>{`${timeCreatedString}`}</p>
            <a className={styles.btn_start} onClick={handleStartSession}>
                Start session
            </a>
        </div>
    );
}
