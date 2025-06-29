import { useRef, useEffect } from "react";
import * as twgl from "twgl.js"

import vs from './glsl/gles_phongColorTex.vert?raw'
import fs from './glsl/gles_phongColorTex.frag?raw'

// @ts-ignore
import { Light } from "./js/Light.js"
// @ts-ignore
import { Material } from "./js/Material.js"
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
        // gl.canvas.width, gl.canvas.height
        const { clientWidth: canvasWidth, clientHeight: canvasHeight } = gl.canvas
        gl.camera = new PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 2000)
        // gl.camera = new OrthographicCamera(-100, 100, 100, -100, 0.1, 2000);
        gl.camera.position.set(0,0,100);
        gl.cameraController = new CameraOrbitConrols({ camera: gl.camera, canvas: gl.canvas });
        
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
        const viewMatrix = gl.camera.viewMatrix;
        // const viewMatrix = gl.camera.viewMatrix.clone().multiply(gl.cameraController.quaternion.toMatrix());
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixView, false, viewMatrix.elements);

        // set modelview matrix
        const matrixModel = new Three.Matrix4();
        const modelViewMatrix = viewMatrix.clone().multiply(matrixModel);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelView, false, modelViewMatrix.elements);

        // compute projection matrix
        gl.matrixModelViewProjection = gl.camera.projectionMatrix.clone().multiply(modelViewMatrix);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelViewProjection, false, gl.matrixModelViewProjection.elements);

        // bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null); // disable texture

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
        //log(gl.canvas.parentNode.clientWidth + "x" + gl.canvas.parentNode.clientHeight);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // gl.matrixProjection = Matrix4.makePerspective(45, gl.canvas.width / gl.canvas.height, 0.1, 1000);
    }

    return <div className="w-[100%] h-[100%]">
        <canvas ref={ref} className="w-full h-full"/>
    </div>
}