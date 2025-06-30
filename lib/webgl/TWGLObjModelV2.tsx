import { useRef, useEffect } from "react";
import * as twgl from "twgl.js"

import vs from './glsl/gles_phongColorTexV2.vert?raw'
import fs from './glsl/gles_phongColorTexV2.frag?raw'

// @ts-ignore
import { ObjModel } from "./js/ObjModel.js"
import { Vertice } from "./ts/Vertice.js";
import { CameraOrbitConrols, OrthographicCamera, PerspectiveCamera } from "./ts/CameraOrbitControls.js";

import * as Three from 'three';

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
        initObjModel(gl);
        startRendering(gl);
    }

    const initObjModel = (gl: WebGLRenderingContext | any) => {
        gl.model = new ObjModel(gl);
        gl.model.read("http://localhost:6006/public/models/debugger_50k.obj").then((obj: any) => {
            console.log(obj, '-----obj')

            gl.objModelBufferInfo = twgl.createBufferInfoFromArrays(gl, {
                vertexPosition: obj.vertices,
                indices: obj.indices,
                vertexNormal: obj.normals,
            })

            gl.objModelWireframeBufferInfo = twgl.createBufferInfoFromArrays(gl, {
                vertexPosition: obj.vertices,
                indices: { numComponents: 2, data: Vertice.generateWireframeIndices(obj.indices)},
                vertexNormal: obj.normals,
            })
        })
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
        // gl.canvas.width, gl.canvas.height
        const { clientWidth: canvasWidth, clientHeight: canvasHeight } = gl.canvas
        gl.camera = new PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 2000)
        // gl.camera = new OrthographicCamera(-100, 100, 100, -100, 0.1, 2000);
        gl.camera.position.set(0,0,100);
        gl.cameraController = new CameraOrbitConrols({ camera: gl.camera, canvas: gl.canvas });
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

        // set view transform 没有gl.program.uniformLocations.matrixView
        const viewMatrix = gl.camera.viewMatrix;
        // const viewMatrix = gl.camera.viewMatrix.clone().multiply(gl.cameraController.quaternion.toMatrix());
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixView, false, viewMatrix.elements);

        const matrixModel = new Three.Matrix4();
        const modelViewMatrix = viewMatrix.clone().multiply(matrixModel);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelView, false, modelViewMatrix.elements);

        gl.matrixModelViewProjection = gl.camera.projectionMatrix.clone().multiply(modelViewMatrix);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelViewProjection, false, gl.matrixModelViewProjection.elements);

        if (gl.objModelWireframeBufferInfo) {
            twgl.setBuffersAndAttributes(gl, gl.programInfo, gl.objModelWireframeBufferInfo);
            twgl.drawBufferInfo(gl, gl.objModelWireframeBufferInfo, gl.LINES)
        }
        else if (gl.objModelBufferInfo) {
            twgl.setBuffersAndAttributes(gl, gl.programInfo, gl.objModelBufferInfo);
            twgl.drawBufferInfo(gl, gl.objModelBufferInfo)
        }
    }

    const handleResize = (gl: WebGLRenderingContext | any) => {
        // resize window to fit to parent
        gl.canvas.width = gl.canvas.parentNode.clientWidth;
        gl.canvas.height = gl.canvas.parentNode.clientHeight;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // gl.matrixProjection = Matrix4.makePerspective(45, gl.canvas.width / gl.canvas.height, 0.1, 1000);
    }

    return <div className="w-[100%] h-[100%]">
        <canvas ref={ref} className="w-full h-full"/>
    </div>
}