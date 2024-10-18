import Image, { ImageProps } from "next/image";
import styles from "../styles/ButtonTransparent.module.css";

type Props = {
    width: number;
    height: number;
    src: ImageProps["src"];
    alt: string;
    text: string;
    onClick: () => Promise<void> | void;
    className: string;
};

export default function ButtonTransparent({
    className,
    width,
    height,
    src,
    text,
    onClick,
    alt,
}: Props) {
    return (
        <div className={className}>
            <a onClick={onClick}>
                <div className={styles.verticle_container}>
                    <span id={styles.text}>{text}</span>
                    <Image src={src} alt={alt} width={width} height={height} />
                </div>
            </a>
        </div>
    );
}
