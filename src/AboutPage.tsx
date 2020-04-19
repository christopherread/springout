import React from 'react';
import './AboutPage.css';
import julia from './images/julia.png';
import christopher from './images/christopher.png';
import mattias from './images/mattias.png';
import marisa from './images/marisa.png';
import kristine from './images/kristine.png';
import peter from './images/peter.png';
import sylvie from './images/sylvie.png';
import cricket from './images/cricket.png';
import bejal from './images/bejal.png';
import nevicia from './images/nevicia.png';

const AboutPage = () => {
    return (
        <div className="about-page">
            <h2>Spring Out / Team</h2>
            <div className="profiles">
                <div className="profile">
                    <a href="https://www.linkedin.com/in/mattias-henders-60a4641a3/"><img src={mattias} /></a>
                    <span><b>Mattias Henders</b></span>
                    <span>Lead / Presentation</span>
                </div>
                <div className="profile">
                    <a href="https://www.linkedin.com/in/julia-read-16039a33/"><img src={julia} /></a>
                    <span><b>Julia Read</b></span>
                    <span>UI Lead / Brand Specialist</span>
                </div>
                <div className="profile">
                    <a href="https://www.linkedin.com/in/chanmarisa/"><img src={marisa} /></a>
                    <span><b>Marisa Chan</b></span>
                    <span>UX Expert</span>
                </div>
                <div className="profile">
                    <a href="https://www.linkedin.com/in/kristine-villaluna/"><img src={kristine} /></a>
                    <span><b>Kristine Villaluna</b></span>
                    <span>User Research</span>
                </div>
                <div className="profile">
                    <a href="https://www.linkedin.com/in/christopher-s-read/"><img src={christopher} /></a>
                    <span><b>Christopher Read</b></span>
                    <span>Lead Developer</span>
                </div>
                <div className="profile">
                    <a href="https://www.linkedin.com/in/peter-thomsen-606b88118/"><img src={peter} /></a>
                    <span><b>Peter Thomsen</b></span>
                    <span>Developer</span>
                </div>
            </div>
            <h2>Spring Out / Mentors</h2>
            <div className="profiles">
                <div className="profile">
                    <a href="https://www.linkedin.com/in/cricket-christina-barretti-sigal-1593a163/"><img src={cricket} /></a>
                    <span><b>Christina Barretti-Sigal</b></span>
                    <span>Product / UX Research</span>
                </div>
                <div className="profile">
                    <a href="https://www.linkedin.com/in/sylvie-leduc-10a35342/"><img src={sylvie} /></a>
                    <span><b>Sylvie Leduc</b></span>
                    <span>Agile Coach / EAP</span>
                </div>
                <div className="profile">
                    <a href="https://www.linkedin.com/in/bejaljoshi/"><img src={bejal} /></a>
                    <span><b>Bejal Joshi</b></span>
                    <span>Healthcare / Tech</span>
                </div>
                <div className="profile">
                    <a href="https://www.linkedin.com/in/nevicia/"><img src={nevicia} /></a>
                    <span><b>Nevicia Case</b></span>
                    <span>Human Psychology</span>
                </div>
            </div>
        </div>
    )
}

export default AboutPage;