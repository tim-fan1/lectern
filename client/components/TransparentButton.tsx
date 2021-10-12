import Image, { ImageProps } from "next/image";
import styles from "../styles/TransparentButton.module.css";

type Props = {
    width: number;
    height: number;
    src: ImageProps["src"];
    alt: string;
    text: string;
    onClick: () => Promise<any | void> | undefined;
    className: string;
};

export default function TransparentButton({
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
            {/* TODO: cursed code */}
            <a onClick={() => (onClick ? onClick() : null)}>
                <div className={styles.verticle_container}>
                    <span id={styles.text}>{text}</span>
                    <Image src={src} alt={alt} width={width} height={height} />
                </div>
            </a>
        </div>
    );
}
