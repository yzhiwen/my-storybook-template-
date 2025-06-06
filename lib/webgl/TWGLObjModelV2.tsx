import { useRef, useEffect } from "react";
import * as twgl from "twgl.js"

import vs from './glsl/gles_phongColorTex.vert?raw'
import fs from './glsl/gles_phongColorTex.frag?raw'

// @ts-ignore
import { Light } from "./js/Light.js"
// @ts-ignore
import { Material } from "./js/Material.js"
// @ts-ignore
import { Vector3 } from './js/Vectors.js'
// @ts-ignore
import { Matrix4 } from "./js/Matrices.js"
// @ts-ignore
import { ObjModel } from "./js/ObjModel.js"
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

            // configure camera
            gl.camera.distance = 35.146700896824605 * 5;
            gl.camera.target.set(-0.0012578964233398438, -0.000732421875, -0.0012111663818359375);
            gl.camera.update();

            // startRendering(gl);
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
        gl.camera = new Camera();
        gl.camera.distance = CAMERA_DIST;
        gl.camera.setMoveAcceleration(150);
        gl.camera.setMoveSpeed(80);
        gl.camera.setZoomAcceleration(150);
        gl.camera.setZoomSpeed(100);

        gl.cameraController = new CameraController(gl.camera, gl);

        // gl.camera.distance = 35.146700896824605 * 2;
        // gl.camera.target.set(-0.0012578964233398438, -0.000732421875, -0.0012111663818359375);
        // gl.camera.update();

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
        gl.matrixView = gl.camera.matrix;
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixView, false, gl.matrixView.m);

        // set modelview matrix
        gl.matrixModelView = gl.matrixView.clone().multiply(gl.matrixModel);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelView, false, gl.matrixModelView.m);

        // compute normal transform
        gl.matrixNormal = gl.matrixModelView.clone();
        gl.matrixNormal.setTranslation(0, 0, 0); // remove tranlsation part
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixNormal, false, gl.matrixNormal.m);

        // compute projection matrix
        gl.matrixModelViewProjection = gl.matrixProjection.clone().multiply(gl.matrixModelView);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelViewProjection, false, gl.matrixModelViewProjection.m);

        // bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null); // disable texture

        if (gl.objModelBufferInfo) {
            twgl.setBuffersAndAttributes(gl, gl.programInfo, gl.objModelBufferInfo);
            twgl.drawBufferInfo(gl, gl.objModelBufferInfo)
        }
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