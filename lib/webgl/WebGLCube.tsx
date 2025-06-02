import { useEffect, useRef } from "react"
import * as twgl from "twgl.js"

import vs from './glsl/gles_phongColorTex.vert?raw'
import fs from './glsl/gles_phongColorTex.frag?raw'

// import vs from './glsl/gles_phong.vert?raw'
// import fs from './glsl/gles_phong.frag?raw'

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


export default function () {
    const ref = useRef<HTMLCanvasElement>(null!);

    useEffect(() => {
        onInit()
    }, [])

    const onInit = () => {
        const gl = twgl.getContext(ref.current);

        initGL(gl);
        initGLSL(gl);
        initCube(gl);

        startRendering(gl);
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
        gl.material = new Material(0.8, 0.8, 0.8, 1.0);    // with default diffuse
        gl.material.ambient.set(0.2, 0.2, 0.2, 1);
        gl.material.specular.set(1, 1, 1, 1);
        gl.material.shininess = 128;

        // rotation angles (x,y,z)
        gl.angle = new Vector3();

        gl.nearPlane = 0.1;
        gl.farPlane = 100;

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
        gl.matrixProjection = Matrix4.makePerspective(45, gl.canvas.width / gl.canvas.height, 0.1, 1000);
    }

    const initGLSL = (gl: WebGLRenderingContext | any) => {
        const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
        gl.programInfo = programInfo;
        gl.program = programInfo.program;
        gl.useProgram(gl.program);

        // setup attributes
        gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexPosition);
        gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexNormal);
        gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexColor);
        gl.enableVertexAttribArray(gl.programInfo.attribLocations.vertexTexCoord0);

        // setup uniforms
        gl.uniform4fv(gl.programInfo.uniformLocations.lightPosition, gl.light.getPosition());
        gl.uniform4fv(gl.programInfo.uniformLocations.lightColor, gl.light.getColor());
        gl.uniform3fv(gl.programInfo.uniformLocations.lightAttenuation, gl.light.getAttenuations());
        gl.uniform4fv(gl.programInfo.uniformLocations.materialAmbient, gl.material.getAmbient());
        gl.uniform4fv(gl.programInfo.uniformLocations.materialDiffuse, gl.material.getDiffuse());
        gl.uniform4fv(gl.programInfo.uniformLocations.materialSpecular, gl.material.getSpecular());
        gl.uniform1f(gl.programInfo.uniformLocations.materialShininess, gl.material.shininess);
    }

    const initCube = (gl: WebGLRenderingContext | any) => {
        // cube ///////////////////////////////////////////////////////////////////
        //    v5------v4  Using GL_TRIANGLES per side
        //   /|      /|
        //  v1------v0|
        //  | |     | |
        //  | |v6---|-|v7
        //  |/      |/
        //  v2------v3

        // vertex coords array
        let vertices = new Float32Array([1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,    // v0-v1-v2-v3
            1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,    // v0-v3-v7-v4
            1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1,    // v0-v4-v5-v1
            -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1,    // v1-v5-v6-v2
            -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,    // v6-v7-v3-v2
            -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1]);  // v5-v4-v7-v6
        // normal array
        let normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,     // v0-v1-v2-v3
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v3-v7-v4
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,     // v0-v4-v5-v1
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,     // v1-v5-v6-v2
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,     // v6-v7-v3-v2
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]);   // v5-v4-v7-v6
        // color array (r,g,b,a)
        let colors = new Float32Array([1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1,       // v0-v1-v2-v3
            1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1,       // v0-v3-v7-v4
            1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1,       // v0-v4-v5-v1
            1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1,       // v1-v5-v6-v2
            0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1,       // v6-v7-v3-v2
            0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1]);     // v5-v4-v7-v6
        // tex-coord array (s,t)
        let texCoords = new Float32Array([1, 0, 0, 0, 0, 1, 1, 1,                    // v0-v1-v2-v3
            0, 0, 0, 1, 1, 1, 1, 0,                    // v0-v3-v7-v4
            1, 1, 1, 0, 0, 0, 0, 1,                    // v0-v4-v5-v1
            1, 0, 0, 0, 0, 1, 1, 1,                    // v1-v5-v6-v2
            0, 1, 1, 1, 1, 0, 0, 0,                    // v6-v7-v3-v2
            1, 0, 0, 0, 0, 1, 1, 1]);                  // v5-v4-v7-v6
        // index array (2 triangles per side)
        let indices = new Uint16Array([0, 1, 2, 2, 3, 0,                    // v0-v1-v2, v2-v3-v0
            4, 5, 6, 6, 7, 4,                    // v0-v3-v7, v7-v4-v0
            8, 9, 10, 10, 11, 8,                    // v0-v4-v5, v5-v1-v0
            12, 13, 14, 14, 15, 12,                    // v1-v5-v6, v6-v2-v1
            16, 17, 18, 18, 19, 16,                    // v6-v7-v3, v3-v2-v6
            20, 21, 22, 22, 23, 20]);                  // v5-v4-v7, v7-v6-v5


        // var arrays = {
        //     position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
        //     texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1], },
        //     normal: { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], },
        //     indices: { numComponents: 3, data: [0, 1, 2, 1, 2, 3], },
        // };

        // create  vertex buffer
        gl.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo);

        let dataSize = vertices.byteLength + normals.byteLength + colors.byteLength + texCoords.byteLength;
        gl.bufferData(gl.ARRAY_BUFFER, dataSize, gl.STATIC_DRAW);

        gl.vbo.vertexOffset = 0;
        gl.bufferSubData(gl.ARRAY_BUFFER, gl.vbo.vertexOffset, vertices);

        gl.vbo.normalOffset = vertices.byteLength;
        gl.bufferSubData(gl.ARRAY_BUFFER, gl.vbo.normalOffset, normals);

        gl.vbo.colorOffset = vertices.byteLength + normals.byteLength;
        gl.bufferSubData(gl.ARRAY_BUFFER, gl.vbo.colorOffset, colors);

        gl.vbo.texCoordOffset = vertices.byteLength + normals.byteLength + colors.byteLength;
        gl.bufferSubData(gl.ARRAY_BUFFER, gl.vbo.texCoordOffset, texCoords);

        // create index buffer
        gl.ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.ibo.indexCount = indices.length;

        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.tex0 = twgl.createTexture(gl, {
            src: `http://localhost:6006/public/images/grid512.png`,
            // src: `http://localhost:8080/files/images/grid512.png`,
            // level: 0,
            // internalFormat: gl.LUMINANCE,
            // format: gl.LUMINANCE,
            // type: gl.UNSIGNED_BYTE,

            mag: gl.LINEAR,
            min: gl.LINEAR_MIPMAP_LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE
        });
        gl.bindTexture(gl.TEXTURE_2D, gl.tex0);

        let format = gl.RGBA;
        let defaultTextureData = new Uint8Array([255, 255, 255, 255]);     // white
        gl.texImage2D(gl.TEXTURE_2D, 0, format, 1, 1, 0, format, gl.UNSIGNED_BYTE,
            defaultTextureData);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    const startRendering = (gl: WebGLRenderingContext | any) => {
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
        if (!gl.program) return;

        // tranform view
        gl.matrixView.identity();
        gl.matrixView.translate(0, 0, -4);

        // transform model
        gl.matrixModel.identity();
        gl.matrixModel.rotateX(gl.angle.x);
        gl.matrixModel.rotateY(gl.angle.y);
        gl.matrixModel.rotateZ(gl.angle.z);

        gl.matrixModelView = gl.matrixView.clone().multiply(gl.matrixModel);
        gl.matrixModelViewProjection = gl.matrixProjection.clone().multiply(gl.matrixModelView);
        gl.matrixNormal = gl.matrixModelView.getRotationMatrix();
        // console.log('gl', gl.vbo.texCoordOffset, gl)

        gl.useProgram(gl.program);
        // set matrix uniforms
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixNormal, false, gl.matrixNormal.m);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelView, false, gl.matrixModelView.m);
        gl.uniformMatrix4fv(gl.programInfo.uniformLocations.matrixModelViewProjection, false, gl.matrixModelViewProjection.m);

        // bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gl.tex0);

        // draw triangle
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbo);
        gl.vertexAttribPointer(gl.programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, gl.vbo.vertexOffset);
        gl.vertexAttribPointer(gl.programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, gl.vbo.normalOffset);
        gl.vertexAttribPointer(gl.programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, gl.vbo.colorOffset);
        gl.vertexAttribPointer(gl.programInfo.attribLocations.vertexTexCoord0, 2, gl.FLOAT, false, 0, gl.vbo.texCoordOffset);

        // draw using indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.ibo);
        gl.drawElements(gl.TRIANGLES, gl.ibo.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    const postFrame = (gl: WebGLRenderingContext | any) => {
        gl.angle.x += gl.frameTime / 1000;
        gl.angle.y += gl.frameTime / 2000;
        gl.angle.z += gl.frameTime / 3000;
    }

    return <div>
        <canvas ref={ref} width="300" height="300" />
    </div>
}