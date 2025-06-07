import { useRef, useEffect } from "react";
import * as twgl from "twgl.js"

import vs from './glsl/gles_point.vert?raw'
import fs from './glsl/gles_point.frag?raw'

// @ts-ignore
import { Vector3 } from './js/Vectors.js'
// @ts-ignore
import { Matrix4 } from "./js/Matrices.js"
// @ts-ignore
import { Line } from "./js/Line.js"
// @ts-ignore
import { Plane } from "./js/Plane.js"
import { Camera } from "./ts/Camera.js"
import { CameraController } from "./ts/CameraController.js";
import { Vertice } from "./ts/Vertice.js";

export default function () {
    const ref = useRef<HTMLCanvasElement>(null!);
    const glRef = useRef<WebGLRenderingContext | any>(null!);

    useEffect(() => {
        onInit()
    }, [])

    const onInit = () => {
        const gl = twgl.getContext(ref.current);
        glRef.current = gl;

        initGL(gl);
        initGLSL(gl);
        handleResize(gl);
        startRendering(gl);
    }

    const initGL = (gl: WebGLRenderingContext | any) => {
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);   // enable depth test
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);    // enable culling backface
        gl.cullFace(gl.BACK);
    }

    const initGLSL = (gl: WebGLRenderingContext | any) => {
        const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
        gl.programInfo = programInfo;
        gl.program = programInfo.program;
        gl.useProgram(gl.program);

        // init camera
        var CAMERA_DIST = 15;
        gl.camera = new Camera(0, 0, 0);
        gl.camera.distance = CAMERA_DIST;
        gl.camera.setMoveAcceleration(150);
        gl.camera.setMoveSpeed(80);
        gl.camera.setZoomAcceleration(150);
        gl.camera.setZoomSpeed(100);
        gl.camera.update();

        gl.cameraController = new CameraController(gl.camera, gl);

        // init matrices
        gl.matrixProjection = new Matrix4();

        gl.point = new Vector3(-1, -1, -1);
    }

    const startRendering = (gl: WebGLRenderingContext | any) => {
        let frameCallback = function () {
            frame(gl);
            requestAnimationFrame(frameCallback);
        };

        requestAnimationFrame(frameCallback);
    }

    const frame = (gl: WebGLRenderingContext | any) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        drawModel(gl);
    }

    const drawModel = (gl: WebGLRenderingContext | any) => {
        gl.disable(gl.CULL_FACE);
        var t = gl.point;
        var matrixModel = new Matrix4();
        matrixModel.translate(t.x, t.y, t.z);


        const uniforms = {
            matrixModel: matrixModel.m,
            matrixView: gl.camera.matrix.m,
            matrixProjection: gl.matrixProjection.m,
            materialDiffuse: [0.3, .5, .2, .6],
            pointSize: 10.0,
        };
        twgl.setUniforms(gl.programInfo, uniforms);

        var vertices = gl.point.toFloat32Array();
        const bufferInfo_ = twgl.createBufferInfoFromArrays(gl, {
            vertexPosition: vertices,
        })
        twgl.setBuffersAndAttributes(gl, gl.programInfo, bufferInfo_);
        twgl.drawBufferInfo(gl, bufferInfo_, gl.POINTS);
    }

    const handleResize = (gl: WebGLRenderingContext | any) => {
        // resize window to fit to parent
        gl.canvas.width = gl.canvas.parentNode.clientWidth;
        gl.canvas.height = gl.canvas.parentNode.clientHeight;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.matrixProjection = Matrix4.makePerspective(45, gl.canvas.width / gl.canvas.height, 0.1, 1000);
    }

    return <div className="w-[100vw] h-[100vh]">
        <canvas ref={ref} width="200" height="200" />
    </div>
}