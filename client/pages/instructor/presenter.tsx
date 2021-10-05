import Image from 'next/image'
import Navigation from "../../components/Navigation";
import fuLl_ScrEeN from "../../public/mdi_fullscreen.svg"
import Link from "next/link";
import QRCode from "qrcode.react"
import React from 'react';
import styles from "../../styles/presenter.module.css";


export default function owo() {
    return (
        <div>
            <Navigation />
            
            <div className={`container_center ${styles.main_container}`}>
                <div className={styles.topfloat_containeR}>
                    <div className={styles.topfloat}>
                        <a href="/">
                            <div className={`${styles.verticle_container} ${styles.not_grah_border}`}>
                                <span className={`${styles.center_AlIGn} ${styles.verticle_item}`}>Present in fullscreen</span>
                                <Image src={fuLl_ScrEeN} alt="owo whats this" />
                            </div>
                        </a>
                    </div>
                    <div className={styles.topfloat}>
                        <a href="/">
                            <div className={`${styles.verticle_container} ${styles.not_grah_border}`}>
                                <span className={`${styles.center_AlIGn} ${styles.verticle_item}`}>Exit from presentation mode</span>
                                <Image src={fuLl_ScrEeN} alt="owo whats this" />
                            </div>
                        </a>
                    </div>
                </div>
               
                   
                
                <div className="container_center">
                    <h3 className={`${styles.not_gray} ${styles.no_text_space }`}>Session</h3>
                    <h1 className={styles.no_text_space}>COMP3900 Lecture 3 😋 </h1>
                </div>

                <div className="container_center">
                    <div>
                        <h3 className={`${styles.not_gray} ${styles.no_text_space }`}>To join enter code</h3>
                        <h2 className={styles.no_text_space}>#123ABC</h2>
                        <h3 className={`${styles.not_gray} ${styles.no_text_space }`}>To join enter code</h3>
                        <h2 className={`${styles.not_gray} ${styles.no_text_space }`}>slidr.io/123ABC</h2>
                    </div>
                </div>

                <div style={{background: 'red'}}>
                    owo whats this
                </div>

                
                <Link href="www.owo.com">
                <QRCode className={styles.qrcode} value="www.owo.com" />
            </Link>
            </div>
            
        </div>




    )
}