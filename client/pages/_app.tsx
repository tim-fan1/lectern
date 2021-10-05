import type { AppProps } from "next/app";
import "../styles/globals.css";
/* TODO: don't really like this solution since we're importing this all the time even if we don't use it but it
doesn't make sense to use component level CSS modules. Maybe if we make a Form component then it would make sense. */
import "../styles/form.css";

function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
export default App;
