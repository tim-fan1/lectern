import type { AppProps } from "next/app";
import { createClient, Provider } from "urql";
import "../styles/globals.css";
/* TODO: don't really like this solution since we're importing this all the time even if we don't use it but it
doesn't make sense to use component level CSS modules. Maybe if we make a Form component then it would make sense. */
import "../styles/form.css";

function App({ Component, pageProps }: AppProps) {
    /* Setting up connection to GraphQL. */
    const client = createClient({
        url: `${process.env.NEXT_PUBLIC_SERVER_HOST}/graphql`,
        fetchOptions: () => {
            return {
                // include cookie cookie-credentials
                credentials: "include",
            };
        },
    });

    return (
        <Provider value={client}>
            <Component {...pageProps} />
        </Provider>
    );
}
export default App;
