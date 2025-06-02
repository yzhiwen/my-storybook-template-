import { useEffect, useRef } from "react"
import * as twgl from "twgl.js"

export default function () {
    const ref = useRef<HTMLCanvasElement>(null!);

    useEffect(() => {
        onInit()
    }, [])

    const onInit = () => {
        const gl = twgl.getContext(ref.current);
        // const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);   // enable depth test
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);    // enable culling backface
        gl.cullFace(gl.BACK);


        startRendering(gl);
    }

    const startRendering = (gl: WebGLRenderingContext | any) => {
        gl.bgColor = { r: 0, g: 0, b: 0 };
        gl.hue = 0; // red

        let frameCallback = function () {
            frame(gl);
            postFrame(gl);
            requestAnimationFrame(frameCallback);
        };
        requestAnimationFrame(frameCallback);
    }

    const frame = (gl: WebGLRenderingContext | any) => {
        gl.clearColor(gl.bgColor.r, gl.bgColor.g, gl.bgColor.b, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    const postFrame = (gl: WebGLRenderingContext | any) => {
        // update hue to rgb
        gl.hue++; // 0~360
        if (gl.hue >= 360) gl.hue = 0;
        let h = (gl.hue / 60) % 6; // 0~360 to 0~6
        if (h < 1) gl.bgColor = { r: 1, g: h, b: 0 };
        else if (h < 2) gl.bgColor = { r: 2 - h, g: 1, b: 0 };
        else if (h < 3) gl.bgColor = { r: 0, g: 1, b: h - 2 };
        else if (h < 4) gl.bgColor = { r: 0, g: 4 - h, b: 1 };
        else if (h < 5) gl.bgColor = { r: h - 4, g: 0, b: 1 };
        else gl.bgColor = { r: 1, g: 0, b: 6 - h };
    }

    return <div>
        <canvas ref={ref} />
    </div>
}