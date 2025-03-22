import React from "react";
import ReactFullpage from "@fullpage/react-fullpage";
import './style.css'

export default function () {
    return <ReactFullpage
        debug
        render={() => (
            <ReactFullpage.Wrapper>
                <div className="section" id="section1">
                    <div className="slide"><h1>Horizontal Slides</h1></div>
                    <div className="slide"><h1>Slide 2</h1></div>
                    <div className="slide"><h1>Slide 3</h1></div>
                    <div className="slide"><h1>Slide 4</h1></div>
                </div>
            </ReactFullpage.Wrapper>
        )} credits={{
            enabled: undefined,
            label: undefined,
            position: undefined
        }} />
}