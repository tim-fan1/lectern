import Head from "next/head"
import type { AppProps } from "next/app"
import "../styles/globals.css"

function App({ Component, pageProps }: AppProps) {
    return (
        <div>
            <Head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
            </Head>
            <Component {...pageProps} />
        </div>
    )
}
export default App
