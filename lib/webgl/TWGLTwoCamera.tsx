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

        gl.camera2 = new PerspectiveCamera(60, canvasWidth / canvasHeight, 10, 200)
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
        gl.camera2.position.applyEuler(new Three.Euler(0.01, 0.01));
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
        drawCameraFrustum(gl);

        gl.camera = gl.camera2;
        gl.camera.aspect = gl.canvas.width / 2 / gl.canvas.height;
        gl.cameraController = gl.cameraController2;

        gl.viewport(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height);
        drawModel(gl);
    }

    const drawModel = (gl: WebGLRenderingContext | any) => {
        const viewMatrix = gl.camera.viewMatrix;
        const matrixModel = new Three.Matrix4().identity();
        const projectionMatrix = gl.camera.projectionMatrix
        const modelViewMatrix = viewMatrix.clone().multiply(matrixModel);
        const matrixModelViewProjection = projectionMatrix.clone().multiply(modelViewMatrix);
        const uniforms = {
            matrixView: viewMatrix.elements,
            matrixModelView: modelViewMatrix.elements,
            matrixModelViewProjection: matrixModelViewProjection.elements,
        };
        twgl.setUniforms(gl.programInfo, uniforms);

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

        const uniforms = {
            matrixModelView: modelViewMatrix.elements,
            matrixModelViewProjection: matrixModelViewProjection.elements,
        };
        twgl.setUniforms(gl.programInfo, uniforms);

        // const bufferInfo_ = twgl.primitives.createCubeBufferInfo(gl, 10) as any;
        // bufferInfo_.attribs.vertexPosition = bufferInfo_.attribs.position;
        // bufferInfo_.attribs.vertexNormal = bufferInfo_.attribs.normal;
        // twgl.setBuffersAndAttributes(gl, gl.programInfo, bufferInfo_);
        // twgl.drawBufferInfo(gl, bufferInfo_);

        const cubeVertices = twgl.primitives.createCubeVertices(10) as any;
        const wireframeBufferInfo_ = twgl.createBufferInfoFromArrays(gl, {
            vertexPosition: cubeVertices.position,
            indices: { numComponents: 2, data: Vertice.generateWireframeIndices(cubeVertices.indices) },
            vertexNormal: cubeVertices.normal,
        });

        twgl.setBuffersAndAttributes(gl, gl.programInfo, wireframeBufferInfo_);
        twgl.drawBufferInfo(gl, wireframeBufferInfo_, gl.LINES)
    }

    const drawCameraFrustum = (gl: WebGLRenderingContext | any) => {
        // 1. 计算尺寸
        // 60 0.8597951344430218 0.1 1000
        // const { fov, aspect, near, far } = gl.camera2 as PerspectiveCamera;
        // const tanFov = Math.tan(60 * Math.PI / 180 / 2); // Math.tan(fov/2);
        // const nearH = 2 * tanFov * near;
        // const nearW = nearH * aspect;
        // const farH = 2 * tanFov * far;
        // const farW = farH * aspect;

        // // 2. 摄像机空间顶点
        // const points = [
        //     // 近裁剪面
        //     [-nearW/2,  nearH/2, -near], // top-left
        //     [ nearW/2,  nearH/2, -near], // top-right
        //     [ nearW/2, -nearH/2, -near], // bottom-right
        //     [-nearW/2, -nearH/2, -near], // bottom-left

        //     // 远裁剪面
        //     [-farW/2,  farH/2, -far],    // top-left
        //     [ farW/2,  farH/2, -far],    // top-right
        //     [ farW/2, -farH/2, -far],    // bottom-right
        //     [-farW/2, -farH/2, -far]     // bottom-left
        // ];

        const points = [
            // 近裁剪面
            [-1, 1, -1], // top-left
            [1, 1, -1], // top-right
            [1, -1, -1], // bottom-right
            [-1, -1, -1], // bottom-left

            // 远裁剪面
            [-1, 1, 1],    // top-left
            [1, 1, 1],    // top-right
            [1, -1, 1],    // bottom-right
            [-1, -1, 1]     // bottom-left
        ];

        const vertices: number[] = [];
        points.forEach(point => {
            const projectionMatrix = gl.camera2.projectionMatrix.clone().invert();
            const viewMatrixmatrix = gl.camera2.viewMatrix.clone().invert();
            const matrix = new Three.Matrix4().multiplyMatrices(viewMatrixmatrix, projectionMatrix,)
            // projectionMatrix一打开的结果是对的，但是相机旋转的话结果有问题。frustm没有朝向target
            // 改成matrix就正常
            const vec = new Three.Vector3(point[0], point[1], point[2]).applyMatrix4(matrix);
            vertices.push(vec.x, vec.y, vec.z);
        });

        // console.log("vertices",vertices)

        // 4. 定义连接关系 (12条边)
        const indices = [
            // 近面
            0, 1, 1, 2, 2, 3, 3, 0,
            // 远面
            4, 5, 5, 6, 6, 7, 7, 4,
            // 侧面连接
            0, 4, 1, 5, 2, 6, 3, 7
        ];

        const position = gl.camera2.position; // new Three.Vector3(0, 0, 100);
        const matrixModel = new Three.Matrix4().identity().makeTranslation(position);
        const modelViewMatrix = gl.camera.viewMatrix.clone().multiply(matrixModel);
        const matrixModelViewProjection = gl.camera.projectionMatrix.clone().multiply(modelViewMatrix);

        const uniforms = {
            matrixModelView: modelViewMatrix.elements,
            matrixModelViewProjection: matrixModelViewProjection.elements,
        };
        twgl.setUniforms(gl.programInfo, uniforms);

        const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
            vertexPosition: { numComponents: 3, data: vertices },
            indices,
        })

        twgl.setBuffersAndAttributes(gl, gl.programInfo, bufferInfo);
        twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);
    }


    return <div className="w-[100%] h-[100%]">
        <canvas ref={ref} className="w-full h-full" />
    </div>
}