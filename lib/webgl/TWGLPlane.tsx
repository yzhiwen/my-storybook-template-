import { useRef, useEffect } from "react";
import * as twgl from "twgl.js"

import vs from './glsl/gles_phong.vert?raw'
import fs from './glsl/gles_phong.frag?raw'

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

        // default light
        gl.light = new Light(0, 0, 1, 0);
        //gl.light.position.normalize();
        gl.light.color.set(1.0, 1.0, 1.0, 1.0);        // light color
        gl.light.attenuations.set(1, 0.05, 0); // attenuations (constant, linear, quad)

        // default material
        gl.material = new Material(0.8, 0.8, 0.8, 1.0);    // with default diffuse
        gl.material.ambient.set(0.2, 0.2, 0.2, 1);
        gl.material.specular.set(1, 1, 1, 1);
        gl.material.shininess = 128;

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
        gl.matrixModel = new Matrix4();
        gl.matrixView = new Matrix4();
        gl.matrixProjection = new Matrix4();
        gl.matrixModelView = gl.matrixView.clone().multiply(gl.matrixModel);
        gl.matrixNormal = gl.matrixModelView.getRotationMatrix();

        // setup uniforms
        gl.uniform4fv(gl.programInfo.uniformLocations.lightPosition, gl.light.getPosition());
        gl.uniform4fv(gl.programInfo.uniformLocations.lightColor, gl.light.getColor());
        gl.uniform3fv(gl.programInfo.uniformLocations.lightAttenuation, gl.light.getAttenuations());
        gl.uniform4fv(gl.programInfo.uniformLocations.materialAmbient, gl.material.getAmbient());
        gl.uniform4fv(gl.programInfo.uniformLocations.materialDiffuse, gl.material.getDiffuse());
        gl.uniform4fv(gl.programInfo.uniformLocations.materialSpecular, gl.material.getSpecular());
        gl.uniform1f(gl.programInfo.uniformLocations.materialShininess, gl.material.shininess);

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

        gl.matrixView = gl.camera.matrix;

        // gl.a1 += 1;
        // gl.plane1.set(gl.a1, gl.b1, gl.c1, gl.d1);
        var n = gl.plane1.normal.clone();
        n.normalize();
        var d = gl.plane1.getDistance();
        var t = n.scale(d);
        var matrix = new Matrix4();
        matrix.lookAt(gl.a1, gl.b1, gl.c1);
        matrix.translate(t.x, t.y, t.z);
        gl.matrixModel = matrix;

        gl.matrixModelView = gl.matrixView.clone().multiply(gl.matrixModel);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelView, false, gl.matrixModelView.m);

        gl.matrixNormal = gl.matrixModelView.clone();
        gl.matrixNormal.setTranslation(0, 0, 0); // remove tranlsation part
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixNormal, false, gl.matrixNormal.m);

        gl.matrixModelViewProjection = gl.matrixProjection.clone().multiply(gl.matrixModelView);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelViewProjection, false, gl.matrixModelViewProjection.m);

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
        //log(gl.canvas.parentNode.clientWidth + "x" + gl.canvas.parentNode.clientHeight);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.matrixProjection = Matrix4.makePerspective(45, gl.canvas.width / gl.canvas.height, 0.1, 1000);
    }

    return <div className="w-[100vw] h-[100vh]">
        <canvas ref={ref} width="200" height="200" />
    </div>
}