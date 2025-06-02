import { useEffect, useRef } from "react"
import * as twgl from "twgl.js"
import vs from './glsl/gles_phongColorTex.vert?raw'
import fs from './glsl/gles_phongColorTex.frag?raw'

import { OBJLoader } from '@loaders.gl/obj';
import { load, } from '@loaders.gl/core';
import { OBJLoader as ThreeOBJLoader } from 'three/addons';

// @ts-ignore
import { Vector3 } from './js/Vectors.js'
// @ts-ignore
import { Matrix4 } from "./js/Matrices.js"
// @ts-ignore
import { Timer } from "./js/Timer.js"
// @ts-ignore
import { Light } from "./js/Light.js"
// @ts-ignore
import { Material } from "./js/Material.js"
// @ts-ignore
import { MouseState } from "./js/MouseState.js"
// @ts-ignore
import { Quaternion } from "./js/Quaternion.js"
// @ts-ignore
import { Camera } from "./js/Camera.js"
// @ts-ignore
import { ObjModel } from "./js/ObjModel.js"

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
        console.log('error ----initGL', gl.getError())
        initGLSL(gl);
        console.log('error ----initGLSL', gl.getError())
        initObjModel(gl);
        startRendering(gl);
    }

    const initObjModel = (gl: WebGLRenderingContext | any) => {
        gl.model = new ObjModel(gl);
        gl.model.read("http://localhost:6006/public/models/debugger_50k.obj").then((obj: any) => {
            console.log(obj, '-----obj')

            // create VBOs
            gl.model.vboVertex = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.model.vboVertex);
            gl.bufferData(gl.ARRAY_BUFFER, obj.vertices.byteLength + obj.normals.byteLength, gl.STATIC_DRAW);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, obj.vertices);
            gl.bufferSubData(gl.ARRAY_BUFFER, obj.vertices.byteLength, obj.normals);
            gl.model.vboVertex.normalOffset = obj.vertices.byteLength;

            gl.model.vboIndex = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.model.vboIndex);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.indices, gl.STATIC_DRAW);
            gl.model.vboIndex.indexCount = obj.indices.length;

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

        // default light
        gl.light = new Light(0, 0, 1, 0);
        //gl.light.position.normalize();
        gl.light.color.set(1.0, 1.0, 1.0, 1.0);        // light color
        gl.light.attenuations.set(1, 0.05, 0); // attenuations (constant, linear, quad)

        // default material
        gl.material = new Material(0.7, 0.7, 0.7, 1.0);    // with default diffuse
        gl.material.ambient.set(0.2, 0.2, 0.2, 1);
        gl.material.specular.set(1, 1, 1, 1);
        gl.material.shininess = 32;

        // init camera
        var CAMERA_DIST = 15;
        gl.camera = new Camera();
        gl.camera.distance = CAMERA_DIST;
        gl.camera.setMoveAcceleration(150);
        gl.camera.setMoveSpeed(80);
        gl.camera.setZoomAcceleration(150);
        gl.camera.setZoomSpeed(100);

        gl.nearPlane = 0.1;
        gl.farPlane = 100;
        gl.model = { radius: 1 };

        // init matrices
        gl.matrixModel = new Matrix4();
        gl.matrixView = new Matrix4();
        gl.matrixProjection = new Matrix4();
        gl.matrixModelView = gl.matrixView.clone().multiply(gl.matrixModel);
        gl.matrixNormal = gl.matrixModelView.getRotationMatrix();
        handleResize(gl);

        console.log(gl)
    }

    const handleResize = (gl: WebGLRenderingContext | any) => {
        // resize window to fit to parent
        gl.canvas.width = gl.canvas.parentNode.clientWidth;
        gl.canvas.height = gl.canvas.parentNode.clientHeight;
        //log(gl.canvas.parentNode.clientWidth + "x" + gl.canvas.parentNode.clientHeight);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        console.log('error ----viewport', gl.getError())
        gl.matrixProjection = Matrix4.makePerspective(45, gl.canvas.width / gl.canvas.height, 0.1, 1000);
    }

    const initGLSL = (gl: WebGLRenderingContext | any) => {

        const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
        gl.programInfo = programInfo;
        gl.program = programInfo.program;
        gl.useProgram(gl.program);
        console.log('error ----initGLSL 1', gl.getError())

        // setup attributes
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexPosition);
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexNormal);
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexColor);
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexTexCoord0);

        console.log('error ----initGLSL 2', gl.getError())

        // setup uniforms
        gl.uniform4fv(gl.programInfo.uniformLocations.lightPosition, gl.light.getPosition());
        console.log('error ----initGLSL 3', gl.getError())
        gl.uniform4fv(gl.programInfo.uniformLocations.lightColor, gl.light.getColor());
        console.log('error ----initGLSL 3', gl.getError())
        gl.uniform3fv(gl.programInfo.uniformLocations.lightAttenuation, gl.light.getAttenuations());
        console.log('error ----initGLSL 3', gl.getError())
        gl.uniform4fv(gl.programInfo.uniformLocations.materialAmbient, gl.material.getAmbient());
        console.log('error ----initGLSL 3', gl.getError())
        gl.uniform4fv(gl.programInfo.uniformLocations.materialDiffuse, gl.material.getDiffuse());
        console.log('error ----initGLSL 3', gl.getError())
        gl.uniform4fv(gl.programInfo.uniformLocations.materialSpecular, gl.material.getSpecular());
        console.log('error ----initGLSL 3', gl.getError())
        gl.uniform1f(gl.programInfo.uniformLocations.materialShininess, gl.material.shininess);

        console.log('error ----initGLSL 3', gl.getError())
    }

    const startRendering = (gl: WebGLRenderingContext | any) => {
        // add mouse state holder
        gl.mouse = new MouseState();
        // register event handlers
        registerEventHandlers(gl.canvas);
        let timer = new Timer();
        let frameCallback = function () {
            gl.frameTime = timer.getFrameTime();
            frame(gl);
            postFrame(gl);
            requestAnimationFrame(frameCallback);
        };

        timer.start();
        requestAnimationFrame(frameCallback);
    }

    const frame = (gl: WebGLRenderingContext | any) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        console.log('error ----6', gl.getError())
        drawModel(gl)
    }

    const drawModel = (gl: WebGLRenderingContext | any) => {
        if (!gl.program) return;
        gl.useProgram(gl.program);
        console.log('error ----5', gl.getError())

        // set view transform 没有gl.program.uniformLocations.matrixView
        gl.matrixView = gl.camera.matrix;
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixView, false, gl.matrixView.m);
        console.log('error ----4', gl.getError())

        // set modelview matrix
        gl.matrixModelView = gl.matrixView.clone().multiply(gl.matrixModel);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelView, false, gl.matrixModelView.m);
        console.log('error ----3', gl.getError())

        // compute normal transform
        gl.matrixNormal = gl.matrixModelView.clone();
        gl.matrixNormal.setTranslation(0, 0, 0); // remove tranlsation part
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixNormal, false, gl.matrixNormal.m);
        console.log('error ----2', gl.getError())

        // compute projection matrix
        gl.matrixModelViewProjection = gl.matrixProjection.clone().multiply(gl.matrixModelView);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelViewProjection, false, gl.matrixModelViewProjection.m);
        console.log('error ----1', gl.getError())

        // bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null); // disable texture

        // draw OBJ
        if (gl.model.vboVertex && gl.model.vboIndex) {
            // setup attributes
            gl.program.attributePosition = gl.getAttribLocation(gl.program, "vertexPosition");
            console.log('error 1', gl.getError())
            gl.program.attributeNormal = gl.getAttribLocation(gl.program, "vertexNormal");
            console.log('error 2', gl.getError())
            gl.enableVertexAttribArray(gl.program.attributePosition);
            console.log('error 3', gl.getError())
            gl.enableVertexAttribArray(gl.program.attributeNormal);
            console.log('error 4', gl.getError())

            console.log('gl.model.vboVertex', gl.model.vboVertex)
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.model.vboVertex);
            console.log('error 5', gl.getError())
            gl.vertexAttribPointer(gl.program.attributePosition, 3, gl.FLOAT, false, 0, 0);
            console.log('error 6', gl.getError())
            gl.vertexAttribPointer(gl.program.attributeNormal, 3, gl.FLOAT, false, 0, gl.model.vboVertex.normalOffset);
            console.log('error 7', gl.getError())
            //gl.vertexAttribPointer(gl.program.attributeColor, 4, gl.FLOAT, false, 0, gl.model.vboVertex.colorOffset);

            console.log('gl.model.vboIndex', gl.model.vboIndex)
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.model.vboIndex);
            console.log('error 8', gl.getError())
            gl.drawElements(gl.TRIANGLES, gl.model.vboIndex.indexCount, gl.UNSIGNED_SHORT, 0);
            console.log('error 9', gl.getError())
            //log(gl.model.vboIndex.indexCount);
            return;
        }

        // draw OBJ
        // if (gl.model.vboVertex && gl.model.vboIndex) {
        //     // console.log("draww model")
        //     // setup attributes
        //     console.log(gl.isContextLost(), "isContextLost")

        //     gl.program.attributePosition = gl.programInfo.attribLocations.vertexPosition;
        //     // gl.getAttribLocation(gl.program, "vertexPosition");
        //     // console.log('error -1', gl.getError())
        //     gl.program.attributeNormal = gl.programInfo.attribLocations.vertexNormal
        //     // gl.getAttribLocation(gl.program, "vertexNormal");
        //     // console.log('error 0', gl.getError())
        //     gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexPosition);
        //     console.log('error 1', gl.getError())
        //     gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexNormal);
        //     console.log('error 2', gl.getError())

        //     gl.bindBuffer(gl.ARRAY_BUFFER, gl.model.vboVertex);
        //     console.log('error bindBuffer ARRAY_BUFFER', gl.getError())
        //     gl.vertexAttribPointer(gl.programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        //     console.log('error 3', gl.getError())
        //     gl.vertexAttribPointer(gl.programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, gl.model.vboVertex.normalOffset);
        //     console.log('error 4', gl.getError())

        //     // console.log("gl.model.vboIndex", gl.model.vboIndex)
        //     // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.model.vboIndex);
        //     // console.log('error bindBuffer ELEMENT_ARRAY_BUFFER', gl.getError())
        //     // gl.drawElements(gl.TRIANGLES, gl.model.vboIndex.indexCount, gl.UNSIGNED_SHORT, 0);

        //     // console.log("gl.model.vboVertex.vertexCount", gl.model.vboIndex.indexCount)
        //     gl.drawArrays(gl.TRIANGLES, 0, gl.model.vboVertex.vertexCount / 3);
        //     console.log('error drawArrays / drawElements', gl.getError())

        //     // 报错：no buffer is bound to enabled attribute
        //     // 原因： gl.enableVertexAttribArray() 参数传了undefined
        // }
    }

    const postFrame = (gl: WebGLRenderingContext | any) => {

    }

    function registerEventHandlers(canvas: HTMLCanvasElement) {
        // register event handlers
        window.addEventListener("resize", () => handleResize(glRef.current), false);

        canvas.addEventListener("mousemove", handleMouseMove, false);

        canvas.addEventListener("mousedown", handleMouseDown, false);

        canvas.addEventListener("mouseup", handleMouseUp, false);

        canvas.addEventListener("click", handleClick, false);

        canvas.addEventListener("mouseout", handleMouseOut, false);

        canvas.addEventListener("contextmenu", handleContextMenu, false);

        canvas.addEventListener("mousewheel", handleMouseWheel, false);
        canvas.addEventListener("DOMMouseScroll", handleMouseWheel, false);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // handlers for mouse event
    ///////////////////////////////////////////////////////////////////////////////
    function handleMouseMove(e: any) {
        var ROTATION_SCALE = 0.002;
        var PAN_SCALE = 0.01;

        const gl = glRef.current;

        function getElementOffset(element: any) {
            let x = 0;
            let y = 0;
            while (element) {
                x += element.offsetLeft || 0;
                y += element.offsetTop || 0;
                element = element.offsetParent; // next
            }

            return { x: x, y: y };
        }

        var offset = getElementOffset(ref.current);
        gl.mouse.x = e.clientX - offset.x;
        gl.mouse.y = e.clientY - offset.y;

        // rotate camera
        if (gl.mouse.leftDown) {
            var angleX = (gl.mouse.y - gl.mouse.downY) * ROTATION_SCALE;
            var angleY = (gl.mouse.x - gl.mouse.downX) * ROTATION_SCALE;
            var quat = Quaternion.toQuaternionFromAngles(angleX, angleY);
            gl.camera.quaternion = quat.multiply(gl.camera.downQuaternion);
        }

        if (gl.mouse.rightDown) {
            gl.camera.distance = gl.camera.downDistance - (gl.mouse.y - gl.mouse.downY) * 0.1;

            //let fontScale = gl.camera.distance / gl.font.height * FONT_SCALE;
            //Sgl.font.setScale(fontScale, fontScale);
        }
        //log(gl.mouse);

        // update view matrix
        if (gl.mouse.leftDown || gl.mouse.rightDown) {
            gl.matrixView = gl.camera.update();
        }
        // log(gl.mouse.toString());
    }

    function handleMouseWheel(e: any) {
        var ZOOM_SCALE = 0.0001;
        const gl = glRef.current;

        var delta = 0;
        if ("wheelDelta" in e) {
            delta = e.wheelDelta / 120;
        }
        else // firefox
        {
            // firefox has different delta and scale.
            delta = -e.detail / 3;
        }

        // positive delta = scroll up
        // negative delta = scroll down
        if (delta != 0) {
            //gl.camera.distance += delta * (gl.farPlane - gl.nearPlane) * ZOOM_SCALE;
            gl.camera.distance += delta * gl.model.radius * 0.1;
            if (gl.camera.distance < gl.nearPlane)
                gl.camera.distance = gl.nearPlane;
            else if (gl.camera.distance > gl.farPlane)
                gl.camera.distance = gl.farPlane;

            // adjust font scale
            //let fontScale = gl.camera.distance / gl.font.height * FONT_SCALE;
            //gl.font.setScale(fontScale, fontScale);

            gl.matrixView = gl.camera.update();
        }

        e.preventDefault();
    }

    function handleMouseDown(e: any) {
        const gl = glRef.current;

        gl.mouse.downX = gl.mouse.x;
        gl.mouse.downY = gl.mouse.y;
        gl.camera.downQuaternion = gl.camera.quaternion.clone();
        gl.camera.downDistance = gl.camera.distance;

        //e = e || window.event; // hack for IE
        if ("which" in e) {
            switch (e.which) {
                case 1: gl.mouse.leftDown = true; break;
                case 2: gl.mouse.middleDown = true; break;
                case 3: gl.mouse.rightDown = true; break;
            }
        }
        else if ("button" in e) // for IE
        {
            if (e.button & 1) gl.mouse.leftDown = true;
            if (e.button & 2) gl.mouse.rightDown = true;
            if (e.button & 4) gl.mouse.middleDown = true;
        }

        e.preventDefault(); // disable context menu
    }

    function handleMouseUp(e: any) {
        const gl = glRef.current;

        //e = e || window.event; // hack for IE
        if ("which" in e) {
            switch (e.which) {
                case 1: gl.mouse.leftDown = false; break;
                case 2: gl.mouse.middleDown = false; break;
                case 3: gl.mouse.rightDown = false; break;
            }
        }
        else if ("button" in e) // for IE
        {
            if (e.button & 1) gl.mouse.leftDown = false;
            if (e.button & 2) gl.mouse.rightDown = false;
            if (e.button & 4) gl.mouse.middleDown = false;
        }
    }

    function handleClick(e: any) {
    }

    function handleMouseOut(e: any) {
        const gl = glRef.current;
        gl.mouse.leftDown = false;
        gl.mouse.rightDown = false;
    }

    function handleContextMenu(e: any) {
        e.preventDefault(); // disable context menu
    }

    return <div className="w-[100vw] h-[100vh]">
        <canvas ref={ref} width="100%" height="100%" />
    </div>
}


// 这个方法应该改变了法线
function generateIndices(vertices: any[]) {
    // 存储唯一顶点和索引映射
    const uniqueVertices = [];
    const vertexMap = new Map();
    const indices = [];

    // 顶点数据应为每3个元素一组 (x, y, z)
    const vertexCount = vertices.length / 3;

    for (let i = 0; i < vertexCount; i++) {
        // 提取当前顶点
        const x = vertices[i * 3];
        const y = vertices[i * 3 + 1];
        const z = vertices[i * 3 + 2];

        // 创建顶点键
        const key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;

        // 检查顶点是否已存在
        if (vertexMap.has(key)) {
            // 使用已有索引
            indices.push(vertexMap.get(key));
        } else {
            // 添加新顶点
            const newIndex = uniqueVertices.length / 3;
            uniqueVertices.push(x, y, z);
            vertexMap.set(key, newIndex);
            indices.push(newIndex);
        }
    }

    return {
        vertices: new Float32Array(uniqueVertices),
        indices: new Uint16Array(indices)
    };
}