
// @ts-ignore
import { Vector2, Vector3, Vector4 } from '../js/Vectors'

// @ts-ignore
import { Matrix4 } from '../js/Matrices'

// @ts-ignore
import { Quaternion } from "../js/Quaternion.js"

let AnimationMode = {
    LINEAR: 0,
    EASE_IN: 1,
    EASE_IN2: 2, // using circle
    EASE_OUT: 3,
    EASE_OUT2: 4, // using circle
    EASE_IN_OUT: 5,
    EASE_IN_OUT2: 6, // using circle
    BOUNCE: 7,
    ELASTIC: 8
};

export class Camera {
    position
    target
    distance
    offset
    quaternion
    matrix

    maxMoveSpeed
    maxTurnSpeed
    maxZoomSpeed
    moveAccel
    turnAccel
    zoomAccel

    shifting
    shiftTime
    shiftSpeed
    shiftVector

    zooming
    zoomTime
    zoomSpeed
    zoomDir

    constructor(x = 0, y = 0, z = 0) {
        this.position = new Vector3(x, y, z);
        this.target = new Vector3(0, 0, 0);
        this.distance = this.position.distance(this.target);
        this.offset = new Vector2(0, 0);
        this.quaternion = new Quaternion(1, 0, 0, 0);
        this.matrix = new Matrix4();

        this.maxMoveSpeed = 1;
        this.maxTurnSpeed = 1;
        this.maxZoomSpeed = 1;
        this.moveAccel = 1;
        this.turnAccel = 1;
        this.zoomAccel = 1;

        // offset animation
        this.shifting = false;
        this.shiftTime = 0;
        this.shiftSpeed = 0;
        this.shiftVector = new Vector2(0, 0);   // direction vector

        // zoom in/out animation
        this.zooming = false;
        this.zoomTime = 0;
        this.zoomSpeed = 0;
        this.zoomDir = 0;   // in:-1, out:+1ƒ
    }


    update() {
        this.matrix.identity();
        // for trackball
        this.matrix.translate(-this.target.x, -this.target.y, -this.target.z);
        this.matrix = this.quaternion.toMatrix().multiply(this.matrix);
        //@@ use position as well
        //@@this.matrix.translate(-this.position.x, -this.position.y, -this.position.distance(this.target));
        //@@this.matrix.translate(-this.offset.x, -this.offset.y, 0);
        this.matrix.translate(-this.offset.x, -this.offset.y, -this.distance);
        return this.matrix;
    }

    moveTo(to: any, duration: number, mode: any, callback: () => void): Camera {
        if (!duration)
            duration = 0;
        if (!mode)
            mode = AnimationMode.LINEAR;

        callback = callback || function () { };
        let startTime = Date.now();
        let endTime = startTime + duration;
        let from = this.target.clone();
        let self = this;
        requestAnimationFrame(moveToCallback);
        function moveToCallback() {
            let time = Date.now();
            let alpha = (time - startTime) / (endTime - startTime);
            if (time >= endTime) {
                self.target.set(to.x, to.y, to.z);
                self.update();
                callback();
                return;
            }

            self.target = Vector3.interpolate(from, to, alpha, mode);
            self.update();
            requestAnimationFrame(moveToCallback);
        }
        return this;
    }


    moveDistanceTo(to: any, duration: number, mode: any, callback: () => void) {
        if (!duration)
            duration = 0;
        if (!mode)
            mode = AnimationMode.LINEAR;

        callback = callback || function () { };
        let startTime = Date.now();
        let endTime = startTime + duration;
        let from = this.distance;
        let self = this;
        requestAnimationFrame(moveDistanceToCallback);
        function moveDistanceToCallback() {
            let time = Date.now();
            let alpha = (time - startTime) / (endTime - startTime);
            if (time >= endTime) {
                self.distance = to;
                self.update();
                callback();
                return;
            }

            alpha = getInterpolateAlpha(alpha, mode);
            self.distance = from + (to - from) * alpha;
            self.update();
            requestAnimationFrame(moveDistanceToCallback);
        }
        return this;
    }

    rotateTo(to: { s: any; x: any; y: any; z: any }, duration: number, mode: any, callback: () => void) {
        if (!duration)
            duration = 0;

        callback = callback || function () { };
        let startTime = Date.now();
        let endTime = startTime + duration;
        let from = this.quaternion.clone();
        let self = this;
        requestAnimationFrame(rotateToCallback);
        function rotateToCallback() {
            let time = Date.now();
            let alpha = (time - startTime) / (endTime - startTime);
            alpha = getInterpolateAlpha(alpha, mode); // get non-linear alpha
            if (time >= endTime) {
                self.quaternion.set(to.s, to.x, to.y, to.z);
                self.update();
                callback();
                return;
            }

            self.quaternion = Quaternion.slerp(from, to, alpha);
            self.update();
            requestAnimationFrame(rotateToCallback);
        }
        return this;
    }

    shiftTo(to: { x: any; y: any }, duration: number, mode: any, callback: () => void) {
        if (!duration)
            duration = 0;
        if (!mode)
            mode = AnimationMode.LINEAR;

        callback = callback || function () { };
        let startTime = Date.now();
        let endTime = startTime + duration;
        let from = this.offset.clone();
        let self = this;
        requestAnimationFrame(shiftToCallback);
        function shiftToCallback() {
            let time = Date.now();
            let alpha = (time - startTime) / (endTime - startTime);
            if (time >= endTime) {
                self.offset.set(to.x, to.y);
                self.update();
                callback();
                return;
            }

            self.offset = Vector2.interpolate(from, to, alpha, mode);
            self.update();
            requestAnimationFrame(shiftToCallback);
        }
        return this;
    }


    setMoveSpeed(speed: number) {
        this.maxMoveSpeed = speed;
        return this;
    }

    setRotateSpeed(speed: number) {
        this.maxTurnSpeed = speed;
        return this;
    }

    setMoveAcceleration(accel: number) {
        this.moveAccel = accel;
        return this;
    }

    setRotateAcceleration(accel: number) {
        this.turnAccel = accel;
        return this;
    }

    setZoomSpeed(speed: any) {
        this.maxZoomSpeed = speed;
        return this;
    }

    setZoomAcceleration(accel: number) {
        this.zoomAccel = accel;
        return this;
    }

    startShift(dir: string) {
        switch (dir.toLowerCase()) {
            case "left":
                this.shiftVector.set(1, 0);
                break;
            case "right":
                this.shiftVector.set(-1, 0);
                break;
            case "up":
                this.shiftVector.set(0, -1);
                break;
            case "down":
                this.shiftVector.set(0, 1);
                break;
            default:
                this.shiftVector.set(0, 0);
                return;
        }

        this.shifting = true;
        this.shiftTime = Date.now();
        this.shiftSpeed = 0;
        let self = this;
        requestAnimationFrame(function () { Camera.shiftCallback(self); });
        return this;
    }

    stopShift() {
        this.shifting = false;
        return this;
    }

    startZoom(dir: number)    // in: -1,  out: +1
    {
        this.zooming = true;
        this.zoomDir = dir;
        this.zoomSpeed = 0;
        this.zoomTime = Date.now();
        let self = this;
        requestAnimationFrame(function () { Camera.zoomCallback(self); });
        return this;
    }

    startZoomIn() {
        this.zooming = true;
        this.zoomDir = -1;
        this.zoomSpeed = 0;
        this.zoomTime = Date.now();
        let self = this;
        requestAnimationFrame(function () { Camera.zoomCallback(self); });
        return this;
    }

    startZoomOut() {
        this.zooming = true;
        this.zoomDir = 1;
        this.zoomSpeed = 0;
        this.zoomTime = Date.now();
        let self = this;
        requestAnimationFrame(function () { Camera.zoomCallback(self); });
        return this;
    }

    stopZoom() {
        this.zooming = false;
        return this;
    }

    setPosition(x: any, y: any, z: any) {
        this.position.set(x, y, z);
        return this;
    }

    setTarget(x: any, y: any, z: any) {
        this.target.set(x, y, z);
        return this;
    }

    setOffset(x: any, y: any) {
        this.offset.set(x, y);
        return this;
    }

    setQuaternion(x: any, y: any, z: any, w: any) {
        this.quaternion.set(x, y, z, w);
        return this;
    }

    toString() {
        const FIXED = 100000;
        return "===== Camera =====\n" +
            "  Position: " + this.position + "\n" +
            "    Target: " + this.target + "\n" +
            "    Offset: " + this.offset + "\n" +
            "  Distance: " + Math.round(this.distance * FIXED) / FIXED + "\n" +
            "Quaternion: " + Math.round(this.quaternion * FIXED) / FIXED + "\n";
    }

    static shiftCallback(cam: Camera) {
        let time = Date.now();
        let frameTime = (time - cam.shiftTime) * 0.001; // delta time per frame in sec
        cam.shiftTime = time; // for next frame
        cam.shiftSpeed = adjustSpeed(cam.shifting, cam.shiftSpeed, cam.maxMoveSpeed, cam.moveAccel, frameTime);

        cam.offset.x += frameTime * cam.shiftSpeed * cam.shiftVector.x;
        cam.offset.y += frameTime * cam.shiftSpeed * cam.shiftVector.y;

        cam.update();

        // loop
        if (cam.shifting || cam.shiftSpeed > 0) {
            requestAnimationFrame(function () { Camera.shiftCallback(cam); });
        }
    }

    static zoomCallback(cam: Camera) {
        let time = Date.now();
        let frameTime = (time - cam.zoomTime) * 0.001;  // delta time per frame in sec
        cam.zoomTime = time;    // for next frame
        cam.zoomSpeed = adjustSpeed(cam.zooming, cam.zoomSpeed, cam.maxZoomSpeed, cam.zoomAccel, frameTime);

        cam.distance += frameTime * cam.zoomSpeed * cam.zoomDir;
        cam.update();

        // loop
        if (cam.zooming || cam.zoomSpeed > 0) {
            requestAnimationFrame(function () { Camera.zoomCallback(cam); });
        }
    }
}

function adjustSpeed(isMoving: boolean, currSpeed: number, maxSpeed: number, accel: number, deltaTime: number) {
    // determine direction
    let sign;
    if (maxSpeed > 0)
        sign = 1;
    else
        sign = -1;

    // accelerating
    if (isMoving) {
        currSpeed += sign * accel * deltaTime;
        if ((sign * currSpeed) > (sign * maxSpeed))
            currSpeed = maxSpeed;
    }
    // deaccelerating
    else {
        currSpeed -= sign * accel * deltaTime;
        if ((sign * currSpeed) < 0)
            currSpeed = 0;
    }

    return currSpeed;
}

function getInterpolateAlpha(alpha: number, mode: any) {
    //let HALF_PI = Math.PI * 0.5;
    let t = alpha;

    // recompute alpha based on animation mode
    if (mode == AnimationMode.EASE_IN) {
        //t = 1 - Math.cos(HALF_PI * alpha);
        t = alpha * alpha * alpha;
    }
    else if (mode == AnimationMode.EASE_IN2) {
        t = 1 - Math.sqrt(1 - alpha * alpha);
    }
    else if (mode == AnimationMode.EASE_OUT) {
        //t = Math.sin(HALF_PI * alpha);
        let beta = 1 - alpha;
        t = 1 - beta * beta * beta;
    }
    else if (mode == AnimationMode.EASE_OUT2) {
        t = Math.sqrt(1 - (1 - alpha) * (1 - alpha));
    }
    else if (mode == AnimationMode.EASE_IN_OUT) {
        //t = 0.5 * (1 - Math.cos(Math.PI * alpha));
        let beta = 1 - alpha;
        let scale = 4.0;     // 0.5 / (0.5^3)
        if (alpha < 0.5)
            t = alpha * alpha * alpha * scale;
        else
            t = 1 - (beta * beta * beta * scale);
    }
    else if (mode == AnimationMode.EASE_IN_OUT2) {
        if (alpha < 0.5)
            t = 0.5 * (1 - Math.sqrt(1 - alpha * alpha));
        else
            t = 0.5 * Math.sqrt(1 - (1 - alpha) * (1 - alpha)) + 0.5;
    }
    else if (mode == AnimationMode.BOUNCE) {
    }
    else if (mode == AnimationMode.ELASTIC) {
    }

    return t;
}