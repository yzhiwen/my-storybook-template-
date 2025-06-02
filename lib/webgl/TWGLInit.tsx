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
import { MouseState } from "./js/MouseState.js"
// @ts-ignore
import { Quaternion } from "./js/Quaternion.js"
// @ts-ignore
import { Camera } from "./js/Camera.js"

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
        gl.camera = new Camera();
        gl.camera.distance = CAMERA_DIST;
        gl.camera.setMoveAcceleration(150);
        gl.camera.setMoveSpeed(80);
        gl.camera.setZoomAcceleration(150);
        gl.camera.setZoomSpeed(100);

        // gl.camera.distance = 35.146700896824605 * 2;
        // gl.camera.target.set(-0.0012578964233398438, -0.000732421875, -0.0012111663818359375);
        // gl.camera.update();

        gl.nearPlane = 0.1;
        gl.farPlane = 1000;
        gl.model = { radius: 10 };
        gl.mouse = new MouseState();

        registerEventHandlers(gl.canvas);

        // init matrices
        gl.matrixModel = new Matrix4();
        gl.matrixView = new Matrix4();
        gl.matrixProjection = new Matrix4();
        gl.matrixModelView = gl.matrixView.clone().multiply(gl.matrixModel);
        gl.matrixNormal = gl.matrixModelView.getRotationMatrix();

        // setup attributes
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.position);
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.normal);
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexPosition);
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexNormal);
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexColor);
        // gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexTexCoord0);

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

        if (!gl.cubeBufferInfo) {
            gl.cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
            gl.cubeBufferInfo.attribs.vertexPosition = gl.cubeBufferInfo.attribs.position
            gl.cubeBufferInfo.attribs.vertexNormal = gl.cubeBufferInfo.attribs.normal
            delete gl.cubeBufferInfo.attribs.position
            delete gl.cubeBufferInfo.attribs.normal
        }

        twgl.setBuffersAndAttributes(gl, gl.programInfo, gl.cubeBufferInfo);
        twgl.drawBufferInfo(gl, gl.cubeBufferInfo)
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