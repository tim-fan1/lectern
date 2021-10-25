import { useMutation, useSubscription } from "urql";
import Head from "next/head";
import Link from "next/link";

const BikeSheddingMutation = `
    mutation($isBikeShedding: Boolean!) {
        bikeSheddingMutation(isBikeShedding: $isBikeShedding)
    }
`;
const BikeSheddingSubscription = `
    subscription OwO {
        bikeShedSubscription {
            id,
            isBikeShedding,
            dateChanged
        }
    }
`;

interface QueriedBikeShed {
    id: number;
    isBikeShedding: boolean;
    dateChanged: Date;
}

export default function TestSub() {
    const handleSubscription = (
        messages = [] as QueriedBikeShed[],
        response: { bikeShedSubscription: QueriedBikeShed }
    ) => {
        return [response.bikeShedSubscription, ...messages];
    };
    // reducer function - simply add the most recent object to the front of the messages

    const [res] = useSubscription({ query: BikeSheddingSubscription }, handleSubscription);
    const [_, changeBikeshedding] = useMutation(BikeSheddingMutation);

    return (
        <div className="container_center">
            <Head>
                <title>
                    lectern {res.data ? (res.data[0].isBikeShedding ? "" : "Not") : "dunno"}{" "}
                    Bikeshedding / 10
                </title>
            </Head>
            <h1>Team Bikeshedding Page :)</h1>
            <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ marginRight: "5em" }}>
                    <h2> Press me when we devolve from meaningful conversation</h2>
                    <button
                        className="btn btn_primary"
                        onClick={async () => {
                            const variables = {
                                isBikeShedding: true,
                            };
                            await changeBikeshedding(variables);
                        }}
                    >
                        Started Bike Shedding
                    </button>
                </div>
                <div style={{ marginLeft: "5em" }}>
                    <h2> Or me when the team gets back on track</h2>
                    <button
                        className="btn btn_secondary"
                        onClick={async () => {
                            const variables = {
                                isBikeShedding: false,
                            };
                            await changeBikeshedding(variables);
                        }}
                    >
                        Stopped Bike Shedding
                    </button>
                </div>
            </div>
            <div>
                {res.data ? (
                    res.data.map((bike: QueriedBikeShed, index) => (
                        <div
                            key={index}
                            style={{ margin: "10px", borderBottom: "2px solid Gainsboro" }}
                        >
                            <p key={index}>
                                We {bike.isBikeShedding ? "started" : "stopped"} bikeshedding at{" "}
                                {bike.dateChanged}
                            </p>
                        </div>
                    ))
                ) : (
                    <p>No data loaded yet :(</p>
                )}
            </div>
        </div>
    );
}
