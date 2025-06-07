import { useRef, useEffect } from "react";
import * as twgl from "twgl.js"

import vs from './glsl/gles_flat.vert?raw'
import fs from './glsl/gles_flat.frag?raw'

// @ts-ignore
import { Light } from "./js/Light.js"
// @ts-ignore
import { Material } from "./js/Material.js"
// @ts-ignore
import { Vector3 } from './js/Vectors.js'
// @ts-ignore
import { Matrix4 } from "./js/Matrices.js"
// @ts-ignore
import { Plane } from "./js/Plane.js"
import { Camera } from "./ts/Camera.js"
import { CameraController } from "./ts/CameraController.js";

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
        gl.camera = new Camera(0, 0, 10);
        gl.camera.distance = CAMERA_DIST;
        gl.camera.setMoveAcceleration(150);
        gl.camera.setMoveSpeed(80);
        gl.camera.setZoomAcceleration(150);
        gl.camera.setZoomSpeed(100);

        gl.cameraController = new CameraController(gl.camera, gl);

        // init matrices
        gl.matrixProjection = new Matrix4();

        // 2.0x + 3.0y + 1.0z + 3.0 = 0
        gl.a1 = 2;
        gl.b1 = 3;
        gl.c1 = 1;
        gl.d1 = 3;
        gl.plane1 = new Plane(2, 3, 1, 3);
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

        gl.a1 = 2;
        gl.b1 = 3;
        gl.c1 = 1;
        gl.d1 = 3;
        gl.plane1.set(gl.a1, gl.b1, gl.c1, gl.d1);
        drawModel(gl);

        // 绘制多个面
        // gl.a1 = -2;
        // gl.b1 = -3;
        // gl.c1 = 1;
        // gl.d1 = 3;
        // gl.plane1.set(gl.a1, gl.b1, gl.c1, gl.d1);
        // drawModel(gl);
    }

    const drawModel = (gl: WebGLRenderingContext | any) => {
        gl.disable(gl.CULL_FACE);

        // gl.a1 += 1;
        // gl.plane1.set(gl.a1, gl.b1, gl.c1, gl.d1);

        var n = gl.plane1.normal.clone().normalize();
        var d = gl.plane1.getDistance();
        var t = n.scale(d);
        var matrixModel = new Matrix4();
        matrixModel.lookAt(gl.a1, gl.b1, gl.c1);
        matrixModel.translate(t.x, t.y, t.z);

        const uniforms = {
            matrixModel: matrixModel.m,
            matrixView: gl.camera.matrix.m,
            matrixProjection: gl.matrixProjection.m,
            materialDiffuse: [0.3,.5,.2,.6]
        };
        twgl.setUniforms(gl.programInfo, uniforms);

        var s = 10;     // length
        var planeVertices = new Float32Array([-s, -s, 0, s, -s, 0, s, s, 0, s, s, 0, -s, s, 0, -s, -s, 0]);
        var planeNormals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
        const bufferInfo_ = twgl.createBufferInfoFromArrays(gl, {
            vertexPosition: planeVertices,
            // vertexNormal: planeNormals,
        })
        twgl.setBuffersAndAttributes(gl, gl.programInfo, bufferInfo_);
        twgl.drawBufferInfo(gl, bufferInfo_);

        // if (!gl.cubeBufferInfo) {
        //     gl.cubeBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 100, 100)
        //     gl.cubeBufferInfo.attribs.vertexPosition = gl.cubeBufferInfo.attribs.position
        //     gl.cubeBufferInfo.attribs.vertexNormal = gl.cubeBufferInfo.attribs.normal
        //     delete gl.cubeBufferInfo.attribs.position
        //     delete gl.cubeBufferInfo.attribs.normal
        // }

        // twgl.setBuffersAndAttributes(gl, gl.programInfo, gl.cubeBufferInfo);
        // twgl.drawBufferInfo(gl, gl.cubeBufferInfo);

        gl.enable(gl.CULL_FACE);    // enable culling backface
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