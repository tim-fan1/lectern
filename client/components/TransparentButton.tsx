import Image, { ImageProps } from "next/image";
import styles from "../styles/TransparentButton.module.css";

type TransparentButtonProps = {
    width: number;
    height: number;
    src: ImageProps["src"];
    alt: string;
    text: string;
    onClick: () => Promise<any | void> | undefined;
    className: string;
};

const uwu = ({ className, width, height, src, text, onClick, alt }: TransparentButtonProps) => (
    <div className={className}>
        {/* cursed code */}
        <a onClick={() => (onClick ? onClick() : null)}>
            <div className={styles.verticle_container}>
                <span>{text}</span>
                <Image src={src} alt={alt} width={width} height={height} />
            </div>
        </a>
    </div>
);

export default uwu;

// className={`${styles.white_text} ${styles.verticle_item}`}
