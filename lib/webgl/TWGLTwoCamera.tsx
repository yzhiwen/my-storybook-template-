import { useRef, useEffect } from "react";
import * as twgl from "twgl.js"

import vs from './glsl/gles_phongColorTexV2.vert?raw'
import fs from './glsl/gles_phongColorTexV2.frag?raw'

// @ts-ignore
import { ObjModel } from "./js/ObjModel.js"
import { Vertice } from "./ts/Vertice.js";
import { CameraOrbitConrols, OrthographicCamera, PerspectiveCamera } from "./ts/CameraOrbitControls.js";

import * as Three from 'three';
import { ConstNode } from "three/webgpu";

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
                indices: { numComponents: 2, data: Vertice.generateWireframeIndices(obj.indices) },
                vertexNormal: obj.normals,
            })

            console.log(gl.objModelWireframeBufferInfo, '-----objModelWireframeBufferInfo')
        })
    }

    const initGL = (gl: WebGLRenderingContext | any) => {
        gl.clearColor(1, 1, 0.5, 3);
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
        gl.camera1 = new PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 1000)
        // gl.camera = new OrthographicCamera(-100, 100, 100, -100, 0.1, 2000);
        gl.camera1.position.set(200, 0, 200);
        gl.cameraController1 = new CameraOrbitConrols({
            gl, camera: gl.camera1, canvas: gl.canvas,
            disableResizeHandle: true,
        });

        gl.camera2 = new PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 1000)
        // gl.camera2 = new OrthographicCamera(-100, 100, 100, -100, 0.1, 2000);
        gl.camera2.position.set(0, 0, 100);
        gl.cameraController2 = new CameraOrbitConrols({
            gl, camera: gl.camera2, canvas: gl.canvas,
            disableResizeHandle: true,
            disableOrbitControls: true,
        });

        gl.camera = gl.camera1;
        gl.cameraController = gl.cameraController1;
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

        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;

        gl.camera = gl.camera1;
        gl.camera.aspect = gl.canvas.width / 2 / gl.canvas.height;
        gl.cameraController = gl.cameraController1;

        gl.viewport(0, 0, gl.canvas.width / 2, gl.canvas.height);
        // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        drawModel(gl);
        drawCamera(gl);

        gl.camera = gl.camera2;
        gl.camera.aspect = gl.canvas.width / 2 / gl.canvas.height;
        gl.cameraController = gl.cameraController2;

        gl.viewport(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height);
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

    const drawCamera = (gl: WebGLRenderingContext | any) => {
        const position = gl.camera2.position; // new Three.Vector3(0, 0, 100);

        const matrixModel = new Three.Matrix4().identity().makeTranslation(position);
        const modelViewMatrix = gl.camera.viewMatrix.clone().multiply(matrixModel);
        const matrixModelViewProjection = gl.camera.projectionMatrix.clone().multiply(modelViewMatrix);


        console.log("draw camera ", position, matrixModel,)

        const uniforms = {
            matrixModelView: modelViewMatrix.elements,
            matrixModelViewProjection: matrixModelViewProjection.elements,
        };
        twgl.setUniforms(gl.programInfo, uniforms);

        const bufferInfo_ = twgl.primitives.createCubeBufferInfo(gl, 10) as any;
        bufferInfo_.attribs.vertexPosition = bufferInfo_.attribs.position;
        bufferInfo_.attribs.vertexNormal = bufferInfo_.attribs.normal;
        twgl.setBuffersAndAttributes(gl, gl.programInfo, bufferInfo_);
        twgl.drawBufferInfo(gl, bufferInfo_);
    }

    return <div className="w-[100%] h-[100%]">
        <canvas ref={ref} className="w-full h-full" />
    </div>
}