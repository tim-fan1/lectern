import Image from 'next/image'
import Navigation from "../../components/Navigation";
import TransparentButton from "../../components/TransparentButton"
import fuLl_ScrEeN from "../../public/mdi_fullscreen.svg"
import exit_image from "../../public/mdi_exit-to-app.svg"

import Link from "next/link";
import QRCode from "qrcode.react"
import React from 'react';
import styles from "../../styles/presenter.module.css";


export default function owo() {
    return (
        <div className={styles.top_level}>
            <Navigation />
            
            <div className={`container_center ${styles.main_container}`} id={"yeet"}>
                <div className={styles.topfloat_containeR}>
                    {/*
                    <div className={styles.topfloat}>
                        <a href="/">
                            <div className={`${styles.verticle_container} ${styles.not_grah_border} ${styles.top_bottom_margin}`}>
                                <span className={`${styles.white_text} ${styles.verticle_item}`}></span>
                                <Image src={fuLl_ScrEeN} alt="Present in fullscreen" width={40} height={40}/>
                            </div>
                        </a>
                    </div>
                    <div className={styles.topfloat}>
                        <a href="/">
                            <div className={`${styles.verticle_container} ${styles.not_grah_border}`}>
                                <span className={`${styles.white_text} ${styles.verticle_item}`}>Exit from presentation mode</span>
                                <Image src={} alt="" width={40} height={40}/>
                            </div>
                        </a>
                    </div>*/}
                    <TransparentButton className={styles.topfloat} src={fuLl_ScrEeN} width={40} height={40} text={"Present in fullscreen"} alt={"Fullscreen icon"} onClick={() => document.getElementById("yeet")?.requestFullscreen()}/>
                    <TransparentButton className={styles.topfloat} src={exit_image} width={40} height={40} text={"Exit from presentation mode"} alt={"Exit icon"} onClick={() => document.exitFullscreen()}/>
                </div>
               
                   
                
                <div className={`container_center ${styles.middle_container}`}>
                    <h2 className={styles.middle_small_text}>Session</h2>
                    <h1 className={styles.middle_large_text}>COMP3900 Lecture 3 😋 </h1>
                </div>

                <div className={styles.bottom_screen}>
                    <div className={`container_center ${styles.bottom_text_container}`}>
          
                        <h2 className={styles.bottom_small_text}>To join enter code</h2>
                        <h1 className={styles.bottom_large_text}>#123ABC</h1>
                        <h2 className={styles.bottom_small_text}>or visit</h2>
                        <h1 className={styles.bottom_large_text}>slidr.io/123ABC</h1>
                      
                    </div>

                    <div style={{background: 'white', width: 5, height: 200}}>
                    </div>
                    <div className={styles.bottom_qr_container}>
                        <QRCode className={styles.qrcode} value="www.owo.com" size={256}/>
                    </div>
                </div>
            </div>
            
        </div>




    )
}