// // @ts-nocheck
import type { Camera } from "./Camera";

// @ts-ignore
import { MouseState } from "../js/MouseState.js"

// @ts-ignore
import { Quaternion } from "../js/Quaternion.js"

// @ts-ignore
import { Matrix4 } from '../js/Matrices'

export class CameraController {
    camera
    canvas
    gl
    mouse

    nearPlane = 0.1;
    farPlane = 1000;
    model = { radius: 10 };

    downQuaternion: any
    downDistance: any

    constructor(camera: Camera, gl: WebGLRenderingContext) {
        this.camera = camera
        this.canvas = gl.canvas as HTMLCanvasElement
        this.gl = gl
        this.mouse = new MouseState()

        // register event handlers
        window.addEventListener("resize", this.handleResize.bind(this), false);
        this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this), false);
        this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this), false);
        this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this), false);
        this.canvas.addEventListener("click", this.handleClick.bind(this), false);
        this.canvas.addEventListener("mouseout", this.handleMouseOut.bind(this), false);
        this.canvas.addEventListener("contextmenu", this.handleContextMenu.bind(this), false);
        this.canvas.addEventListener("mousewheel", this.handleMouseWheel.bind(this), false);
        this.canvas.addEventListener("DOMMouseScroll", this.handleMouseWheel.bind(this), false);
    }

    handleMouseMove(e: any) {
        var ROTATION_SCALE = 0.002;
        var PAN_SCALE = 0.01;

        const gl = this.gl;

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

        var offset = getElementOffset(this.canvas);
        this.mouse.x = e.clientX - offset.x;
        this.mouse.y = e.clientY - offset.y;

        // rotate camera
        if (this.mouse.leftDown) {
            var angleX = (this.mouse.y - this.mouse.downY) * ROTATION_SCALE;
            var angleY = (this.mouse.x - this.mouse.downX) * ROTATION_SCALE;
            var quat = Quaternion.toQuaternionFromAngles(angleX, angleY);
            this.camera.quaternion = quat.multiply(this.downQuaternion);
        }

        if (this.mouse.rightDown) {
            this.camera.distance = this.downDistance - (this.mouse.y - this.mouse.downY) * 0.1;

            //let fontScale = this.camera.distance / gl.font.height * FONT_SCALE;
            //Sgl.font.setScale(fontScale, fontScale);
        }
        //log(this.mouse);

        // update view matrix
        if (this.mouse.leftDown || this.mouse.rightDown) {
            this.camera.update();
            // gl.matrixView = this.camera.update();
        }
        // log(this.mouse.toString());
    }

    handleMouseWheel(e: any) {
        var ZOOM_SCALE = 0.0001;
        const gl = this.gl;

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
            //this.camera.distance += delta * (gl.farPlane - gl.nearPlane) * ZOOM_SCALE;
            this.camera.distance += delta * this.model.radius * 0.1;
            if (this.camera.distance < this.nearPlane)
                this.camera.distance = this.nearPlane;
            else if (this.camera.distance > this.farPlane)
                this.camera.distance = this.farPlane;

            // adjust font scale
            //let fontScale = this.camera.distance / gl.font.height * FONT_SCALE;
            //gl.font.setScale(fontScale, fontScale);

            this.camera.update();
            // gl.matrixView = this.camera.update();
        }

        e.preventDefault();
    }

    handleMouseDown(e: any) {
        this.mouse.downX = this.mouse.x;
        this.mouse.downY = this.mouse.y;
        this.downQuaternion = this.camera.quaternion.clone();
        this.downDistance = this.camera.distance;

        //e = e || window.event; // hack for IE
        if ("which" in e) {
            switch (e.which) {
                case 1: this.mouse.leftDown = true; break;
                case 2: this.mouse.middleDown = true; break;
                case 3: this.mouse.rightDown = true; break;
            }
        }
        else if ("button" in e) // for IE
        {
            if (e.button & 1) this.mouse.leftDown = true;
            if (e.button & 2) this.mouse.rightDown = true;
            if (e.button & 4) this.mouse.middleDown = true;
        }

        e.preventDefault(); // disable context menu
    }

    handleMouseUp(e: any) {
        //e = e || window.event; // hack for IE
        if ("which" in e) {
            switch (e.which) {
                case 1: this.mouse.leftDown = false; break;
                case 2: this.mouse.middleDown = false; break;
                case 3: this.mouse.rightDown = false; break;
            }
        }
        else if ("button" in e) // for IE
        {
            if (e.button & 1) this.mouse.leftDown = false;
            if (e.button & 2) this.mouse.rightDown = false;
            if (e.button & 4) this.mouse.middleDown = false;
        }
    }

    handleClick(e: any) {
    }

    handleMouseOut(e: any) {
        this.mouse.leftDown = false;
        this.mouse.rightDown = false;
    }

    handleContextMenu(e: any) {
        e.preventDefault(); // disable context menu
    }

    handleResize(gl: WebGLRenderingContext | any) {
        // resize window to fit to parent
        gl.this.canvas.width = gl.this.canvas.parentNode.clientWidth;
        gl.this.canvas.height = gl.this.canvas.parentNode.clientHeight;
        //log(gl.this.canvas.parentNode.clientWidth + "x" + gl.this.canvas.parentNode.clientHeight);

        gl.viewport(0, 0, gl.this.canvas.width, gl.this.canvas.height);
        gl.matrixProjection = Matrix4.makePerspective(45, gl.this.canvas.width / gl.this.canvas.height, 0.1, 1000);
    }

}
