import katex from "katex";
import React from "react";
import "katex/dist/katex.min.css";

export type SingleText = {
    isLatex: boolean;
    text: string;
};
export type TextProps = {
    texts: SingleText[];
};

export const LatexRenderedText = ({ texts }: TextProps) => {
    return (
        <>
            {texts.map((text, i) => {
                let div;
                console.log(texts);

                if (text.isLatex) {
                    return (
                        <div
                            key={i}
                            dangerouslySetInnerHTML={{
                                __html: katex.renderToString(text.text),
                            }}
                        />
                    );
                } else {
                    div = (
                        <div key={i}>
                            <p>{text.text}</p>
                        </div>
                    );
                }
                return div;
            })}
        </>
    );
};
