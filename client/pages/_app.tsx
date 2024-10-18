import type { AppProps } from "next/app";
import Head from "next/head";
import React from "react";
import { Provider as ProviderRedux } from "react-redux";
import {
    createClient,
    defaultExchanges,
    Provider as ProviderUrqlClient,
    subscriptionExchange,
} from "urql";
import { createClient as createWSClient } from "graphql-ws";
import { store } from "../state/store";
import "../styles/form.css";
import "../styles/globals.css";

function App({ Component, pageProps }: AppProps) {
    const isBrowser = process.browser;
    // don't create the wsClient if we are doing static rendering (server side)
    const wsClient = isBrowser
        ? createWSClient({
              url: `${process.env.NEXT_PUBLIC_SERVER_WS_HOST}/graphql`,
          })
        : null;
    /* Setting up connection to GraphQL. */
    const client = createClient({
        url: `${process.env.NEXT_PUBLIC_SERVER_HOST}/graphql`,
        fetchOptions: {
            // include cookie cookie-credentials
            credentials: "include",
        },
        exchanges: [
            ...defaultExchanges,
            subscriptionExchange({
                forwardSubscription(operation) {
                    return {
                        subscribe: (sink) => {
                            // this is the recommended way of creating a subscription in
                            // urql - I don't know why the typing system complains
                            // https://formidable.com/open-source/urql/docs/advanced/subscriptions/
                            // @ts-ignore sad typing noises - both sink and wsClient are improperly typed
                            const dispose = wsClient.subscribe(operation, sink);
                            return {
                                unsubscribe: dispose,
                            };
                        },
                    };
                },
            }),
        ],
    });

    return (
        <>
            <Head>
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
                <link rel="shortcut icon" href="/favicon.ico" />
                <title>lectern</title>
            </Head>
            <div id="modal-root" />
            <ProviderRedux store={store}>
                <ProviderUrqlClient value={client}>
                    <Component {...pageProps} />
                </ProviderUrqlClient>
            </ProviderRedux>
        </>
    );
}
export default App;
