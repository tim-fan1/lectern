import type { AppProps } from "next/app";
import Head from "next/head";
import React from "react";
import { Provider as ProviderRedux } from "react-redux";
import { createClient, Provider as ProviderUrqlClient } from "urql";
import { store } from "../state/store";
/* TODO: don't really like this solution since we're importing this all the time even if we don't use it but it
doesn't make sense to use component level CSS modules. Maybe if we make a Form component then it would make sense. */
import "../styles/form.css";
import "../styles/globals.css";

function App({ Component, pageProps }: AppProps) {
    /* Setting up connection to GraphQL. */
    const client = createClient({
        url: `${process.env.NEXT_PUBLIC_SERVER_HOST}/graphql`,
        fetchOptions: {
            // include cookie cookie-credentials
            credentials: "include",
        },
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

            <ProviderRedux store={store}>
                <ProviderUrqlClient value={client}>
                    <Component {...pageProps} />
                </ProviderUrqlClient>
            </ProviderRedux>
        </>
    );
}
export default App;
