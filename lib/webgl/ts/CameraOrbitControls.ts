import * as Three from 'three'

export class Camera {
    position = new Three.Vector3(0, 0, 100);
    target = new Three.Vector3(0, 0, 0);
    up = new Three.Vector3(0, 1, 0); // 不是 (0,0,0) - (0,1,0)

    get zAxis() { // camera dir
        return this.position.clone().sub(this.target).normalize()
    }

    get xAxis() { // camera right
        return new Three.Vector3().crossVectors(this.up, this.zAxis).normalize();
    }

    get yAxis() { // camera up
        return new Three.Vector3().crossVectors(this.zAxis, this.xAxis).normalize();
    }

    get viewMatrix222() {
        return new Three.Matrix4().lookAt(this.position, this.target, this.up);
    }

    get viewMatrix() {
        const { xAxis, yAxis, zAxis } = this;
        const tx = -xAxis.clone().dot(this.position);
        const ty = -yAxis.clone().dot(this.position);
        const tz = -zAxis.clone().dot(this.position);

        /*
            V = [ right_x  up_x  -dir_x  pos_x ]
                [ right_y  up_y  -dir_y  pos_y ]
                [ right_z  up_z  -dir_z  pos_z ]
                [ 0        0      0       1    ]
        */
        const m = new Array<number>(16);
        m[0] = xAxis.x; m[4] = xAxis.y; m[8] = xAxis.z; m[12] = tx;
        m[1] = yAxis.x; m[5] = yAxis.y; m[9] = yAxis.z; m[13] = ty;
        m[2] = zAxis.x; m[6] = zAxis.y; m[10] = zAxis.z; m[14] = tz;
        m[3] = 0; m[7] = 0; m[11] = 0; m[15] = 1;

        const mat4 = new Three.Matrix4(
            // m[0], m[1], m[2], m[3],
            // m[4], m[5], m[6], m[7],
            // m[8], m[9], m[10], m[11],
            // m[12], m[13], m[14], m[15]

            m[0], m[4], m[8], m[12],
            m[1], m[5], m[9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15]
        );

        return mat4
    }
}

export class OrthographicCamera extends Camera {

    left;
    right;
    top;
    bottom;
    near;
    far;

    constructor(left: number, right: number, top: number, bottom: number, near: number, far: number) {
        super()
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.near = near;
        this.far = far;
    }

    get projectionMatrix() {
        return new Three.Matrix4().makeOrthographic(this.left, this.right, this.bottom, this.top, this.near, this.far)
    }
}

export class PerspectiveCamera extends Camera {

    fov;
    aspect;
    near;
    far;

    constructor(fov: number, aspect: number, near: number, far: number) {
        super()
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
    }

    get projectionMatrix() {
        let tangent = Math.tan(this.fov / 2 * Math.PI / 180);
        let height = this.near * tangent;
        let width = height * this.aspect;

        // 跟Threejs的PerspectiveCamera计算方式不太一样
        return new Three.Matrix4().makePerspective(-width, width, height, -height, this.near, this.far);

        const l = -width;
        const r = width;
        const t = height;
        const b = -height;
        const n = this.near;
        const f = this.far;
        let m = new Three.Matrix4().identity();
        m.elements[0] = 2 * n / (r - l);
        m.elements[5] = 2 * n / (t - b);
        m.elements[8] = (r + l) / (r - l);
        m.elements[9] = (t + b) / (t - b);
        m.elements[10] = -(f + n) / (f - n);
        m.elements[11] = -1;
        m.elements[14] = -(2 * f * n) / (f - n);
        m.elements[15] = 0;

        return m;

    }
}

class Spherical {

    radius
    phi
    theta

    constructor(radius = 1, phi = 0, theta = 0) {
        this.radius = radius
        this.phi = phi
        this.theta = theta
    }

    getVec3FromSphericalCoords() {
        const { radius, phi, theta } = this;

        const sinPhiRadius = Math.sin(phi) * radius;
        const x = sinPhiRadius * Math.sin(theta);
        const y = Math.cos(phi) * radius;
        const z = sinPhiRadius * Math.cos(theta);
        return new Three.Vector3(x, y, z);
    }

    setFromCartesianCoords(x: number, y: number, z: number) {
        this.radius = Math.sqrt(x * x + y * y + z * z);
        if (this.radius === 0) {
            this.theta = 0;
            this.phi = 0;
        } else {
            this.theta = Math.atan2(x, z);
            this.phi = Math.acos(this.clamp(y / this.radius, - 1, 1));
        }
    }

    makeSafe() {
        const EPS = 0.000001;
        this.phi = this.clamp(this.phi, EPS, Math.PI - EPS);
        return this;
    }

    clamp(value: number, min: number, max: number) {
        return Math.max(min, Math.min(max, value));
    }

}

export class CameraOrbitConrols {
    gl: WebGLRenderingContext
    camera: Camera
    cameraClone: Camera
    canvas: HTMLCanvasElement

    state: "none" | "pan" | "dolly" | "rotate"

    panStart: Three.Vector2 = new Three.Vector2();
    panEnd: Three.Vector2 = new Three.Vector2();
    panOffset: Three.Vector3 = new Three.Vector3();

    zoom = 1; // 缩放因子
    zoomScale = 0.90; // 滚轮每次滚动的缩放系数

    spherical = new Spherical();
    quaternion = new Three.Quaternion();
    rotateOffset: Three.Vector3 = new Three.Vector3()



    constructor(options: {
        gl: WebGLRenderingContext,
        camera: Camera,
        canvas: HTMLCanvasElement
        disableResizeHandle?: boolean
    }) {
        this.gl = options.gl;
        this.camera = options.camera;
        // https://gist.github.com/GeorgeGkas/36f7a7f9a9641c2115a11d58233ebed2
        this.cameraClone = Object.assign(
            Object.create(
                // Set the prototype of the new object to the prototype of the instance.
                // Used to allow new object behave like class instance.
                Object.getPrototypeOf(options.camera),
            ),
            // Prevent shallow copies of nested structures like arrays, etc
            JSON.parse(JSON.stringify(options.camera)),
        );
        this.canvas = options.canvas
        this.state = "none"
        this.init();
        if (!options.disableResizeHandle) {
            this.initResize();
        }
    }

    init() {
        this.canvas.addEventListener("pointerdown", (ev) => {
            const { button } = ev;
            if (button === 1) { // 鼠标中键
                this.state = "pan";
                this.panStart.set(ev.clientX, ev.clientY);
            } else if (button === 0) { // 鼠标左键
                this.state = "rotate";
                this.panStart.set(ev.clientX, ev.clientY);
            }
        });
        this.canvas.addEventListener("pointermove", (ev) => {
            switch (this.state) {
                case 'pan':
                    this.panEnd.set(ev.clientX, ev.clientY);
                    const panDelta = this.panEnd.clone().sub(this.panStart);
                    this.pan({ deltaX: panDelta.x, deltaY: panDelta.y });
                    this.update();
                    this.panStart.copy(this.panEnd);
                    break;
                case 'rotate':
                    this.panEnd.set(ev.clientX, ev.clientY);
                    const rotateDelta = this.panEnd.clone().sub(this.panStart);
                    this.rotate({ deltaX: rotateDelta.x, deltaY: rotateDelta.y });
                    // this.rotateByQuat({ deltaX: rotateDelta.x, deltaY: rotateDelta.y });
                    // this.rotateByQuat2({ deltaX: rotateDelta.x, deltaY: rotateDelta.y });
                    this.update();
                    this.panStart.copy(this.panEnd);
                    break;
            }
        });
        this.canvas.addEventListener("wheel", (ev) => {
            this.state = "dolly"
            const delta = ev.deltaY > 0 ? this.zoomScale : 1 / this.zoomScale; // 计算缩放方向（滚轮向上为缩小，向下为放大）
            this.zoom *= delta; // 更新缩放因子，指数缩放
            // this.zoom = Math.min(Math.max(this.zoom, minZoom), maxZoom); // 控制最大最小缩放值
            this.dolly();
        })
        this.canvas.addEventListener("pointerup", (ev) => {
            this.state = 'none'
        })
    }

    initResize() {
        const onResize = () => {
            this.gl.canvas.width = this.canvas.clientWidth;
            this.gl.canvas.height = this.canvas.clientHeight;
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

            if (this.camera instanceof PerspectiveCamera) {
                this.camera.aspect = this.gl.canvas.width / this.gl.canvas.height;
            }
        }

        onResize()
        window.addEventListener("resize", onResize)
    }


    pan(options: any) {
        if (this.camera instanceof OrthographicCamera) {
            this.panOrthographicCamera(options)
        } else if (this.camera instanceof PerspectiveCamera) {
            this.panPerspectiveCamera(options)
        }
    }

    panPerspectiveCamera(options: any) {
        const { deltaX, deltaY } = options;
        const { xAxis, yAxis, zAxis, position, target } = this.camera;
        const { fov } = this.camera as PerspectiveCamera;
        const { clientWidth: canvasWidth, clientHeight: canvasHeight } = this.canvas

        // 相机视点到目标点的距离
        const length = position.clone().sub(target).length();
        // 视椎体垂直夹角的一半(弧度)
        const halfFov = fov * Math.PI / 360;
        // 目标平面的高度
        const perspectiveHeight = length * Math.tan(halfFov) * 2
        // 目标平面与画布的高度比
        const ratio = perspectiveHeight / canvasHeight;
        //画布位移量转目标平面位移量
        const panX = -deltaX * ratio;
        const panY = deltaY * ratio;

        this.panOffset = new Three.Vector3().add(xAxis.clone().multiplyScalar(panX)).add(yAxis.clone().multiplyScalar(panY));
        console.log('this.panOffset', this.panOffset)
    }

    panOrthographicCamera(options: any) {
        const { deltaX, deltaY } = options;
        const { xAxis, yAxis, zAxis } = this.camera;
        const { right, left, top, bottom, } = this.camera as OrthographicCamera;
        const { clientWidth: canvasWidth, clientHeight: canvasHeight } = this.canvas

        // 获取正交投影参数
        const orthoWidth = right - left;  // 投影体宽度
        const orthoHeight = top - bottom; // 投影体高度

        // 计算像素缩放因子（与距离无关！）
        const panScaleX = orthoWidth / canvasWidth;
        const panScaleY = orthoHeight / canvasHeight;

        // 计算世界空间平移量
        const panX = -deltaX * panScaleX;
        const panY = -deltaY * panScaleY;

        // 合成平移向量（基向量计算同透视投影）
        // const panVector = panX * xAxis + panY * yAxis;
        this.panOffset = new Three.Vector3().add(xAxis.clone().multiplyScalar(panX)).add(yAxis.clone().multiplyScalar(panY));

        // 移动摄像机+目标点。（放到update处理）
        // this.camera.position += panVector;
        // this.camera.target += panVector;
    }

    // TODO 基于焦点的缩放（透视投影专用）
    dolly() {
        if (this.camera instanceof OrthographicCamera) {
            this.dollyOrthographicProjection();
        } else if (this.camera instanceof PerspectiveCamera) {
            this.dollyPerspectiveProjection();
        }
    }

    dollyOrthographicProjection() {
        const orthographicCamera = this.camera as OrthographicCamera
        const { left, right, top, bottom } = this.cameraClone as OrthographicCamera;
        const dx = (right - left) / (2 * this.zoom);
        const dy = (top - bottom) / (2 * this.zoom);
        const cx = (right + left) / 2;
        const cy = (top + bottom) / 2;

        let left_ = cx - dx;
        let right_ = cx + dx;
        let top_ = cy + dy;
        let bottom_ = cy - dy;

        orthographicCamera.left = left_;
        orthographicCamera.right = right_;
        orthographicCamera.top = top_;
        orthographicCamera.bottom = bottom_;
    }

    dollyPerspectiveProjection() {
        const perspectiveCamera = this.camera as PerspectiveCamera
        const { position: cameraPosition, fov } = this.cameraClone as PerspectiveCamera

        // 方案1：改变视野角度（FOV）
        // perspectiveCamera.fov = fov / this.zoom;  // 缩放FOV

        // 方案2：改变相机位置（更推荐）
        perspectiveCamera.position.z = cameraPosition.z * this.zoom;
    }

    rotate(options: any) {
        const { deltaX, deltaY } = options;

        const { position, target } = this.camera;

        const r = position.clone().sub(target);
        this.spherical.setFromCartesianCoords(r.x, r.y, r.z)

        const sensitivity = 0.01; // 角度变化灵敏度因子
        this.spherical.phi -= deltaY * sensitivity;
        this.spherical.theta -= deltaX * sensitivity;
        // 限制极角范围（避免翻转）
        this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));

        this.rotateOffset = this.spherical.getVec3FromSphericalCoords()
        console.log('deltaX, deltaY', deltaX, deltaY)
        console.log('phi theta', this.spherical.phi, this.spherical.theta)
        console.log('rotateOffset', this.rotateOffset)

        this.camera.position.copy(this.rotateOffset);
        this.camera.position.copy(this.camera.target.clone().add(this.rotateOffset));
        this.rotateOffset.set(0, 0, 0);
    }

    rotateByQuat(options: any) {
        const { deltaX, deltaY } = options;

        const sensitivity = 0.3; // 角度变化灵敏度因子
        // const pitch = deltaY * sensitivity;  // 俯仰角（绕X轴）
        // const yaw = deltaX * sensitivity; // 偏航角（绕Y轴）
        const pitch = - Math.PI * deltaY * sensitivity / this.canvas.clientHeight;  // 俯仰角（绕X轴）
        const yaw = - Math.PI * deltaX * sensitivity / this.canvas.clientHeight; // 偏航角（绕Y轴）

        const pitchQuat = new Three.Quaternion();
        const yawQuat = new Three.Quaternion();

        pitchQuat.setFromAxisAngle(new Three.Vector3(1, 0, 0), pitch);
        yawQuat.setFromAxisAngle(new Three.Vector3(0, 1, 0), yaw);

        // 组合旋转（顺序很重要！）
        // 先偏航后俯仰：currentQuat = pitchQuat * (yawQuat * currentQuat)
        const quaternionClone = this.quaternion.clone();
        this.quaternion.multiply(yawQuat);
        this.quaternion.multiply(pitchQuat);
        this.quaternion.normalize();

        // 通过四元数
        // const positionObj = this.cameraClone.position;
        // const position_ = new Vector3(positionObj.x, positionObj.y, positionObj.z);
        // position_.applyQuaternion(this.quaternion);
        // this.camera.position.set(position_);
    }

    minPolarAngle = 0;
    maxPolarAngle = Math.PI;
    quaternion2 = new Three.Quaternion();
    rotateByQuat2(options: any) {
        const { deltaX, deltaY } = options;
        const position = new Three.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        const target = new Three.Vector3(this.camera.target.x, this.camera.target.y, this.camera.target.z);
        // const up = new Three.Vector3(this.camera.up.x, this.camera.up.y, this.camera.up.z);
        const up = new Three.Vector3(this.camera.up.x, this.camera.up.y, this.camera.up.z);

        const _v = new Three.Vector3();
        const _quat = new Three.Quaternion().setFromUnitVectors(up, new Three.Vector3(0, 1, 0));
        const _quatInverse = _quat.clone().invert();
        const _spherical = new Three.Spherical();
        const _sphericalDelta = new Three.Spherical();

        const sensitivity = 1; // 角度变化灵敏度因子
        const pitch = Math.PI * deltaY * sensitivity / this.canvas.clientHeight;  // 俯仰角（绕X轴）
        const yaw = Math.PI * deltaX * sensitivity / this.canvas.clientHeight; // 偏航角（绕Y轴）
        _sphericalDelta.theta -= yaw; // _rotateLeft
        _sphericalDelta.phi -= pitch; // _rotateUp

        _v.copy(position).sub(target);
        _v.applyQuaternion(_quat);
        _spherical.setFromVector3(_v);

        _spherical.theta += _sphericalDelta.theta;
        _spherical.phi += _sphericalDelta.phi;
        // _spherical.phi = _spherical.phi % (2 * Math.PI);
        _spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, _spherical.phi));
        _spherical.makeSafe();

        _v.setFromSpherical(_spherical);
        // rotate offset back to "camera-up-vector-is-up" space
        _v.applyQuaternion(_quatInverse);
        position.copy(target).add(_v);
        this.camera.target.set(target.x, target.y, target.z);
        this.camera.position.set(position.x, position.y, position.z);

        _sphericalDelta.set(0, 0, 0);

        console.log("camera", this.camera.position,)
    }

    update() {
        this.camera.position.add(this.panOffset);
        this.camera.target.add(this.panOffset);
        this.panOffset.set(0, 0, 0);
    }
}