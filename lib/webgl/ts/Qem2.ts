import * as Three from 'three'
import { a } from 'vitest/dist/chunks/suite.qtkXWc6R.js'

class QemVertex {
    x
    y
    z
    index

    q?: number[]

    constructor(x: number, y: number, z: number, index: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.index = index;
    }
}

class QemEdge {
    v1
    v2

    vNew?: { x: number, y: number, z: number }
    cost?: number

    constructor(v1: QemVertex, v2: QemVertex,) {
        this.v1 = v1;
        this.v2 = v2;
    }

    get key() {
        return [this.v1.index, this.v2.index].sort().join('-')
    }
}

class QemTriangle {
    v1
    v2
    v3

    constructor(v1: QemVertex, v2: QemVertex, v3: QemVertex) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }

    get key() {
        return [this.v1.index, this.v2.index, this.v3.index].sort().join('-')
    }

    get normal() {
        const e1 = new Three.Vector3(this.v2.x - this.v1.x, this.v2.y - this.v1.y, this.v2.z - this.v1.z);
        const e2 = new Three.Vector3(this.v3.x - this.v2.x, this.v3.y - this.v2.y, this.v3.z - this.v2.z);
        // const e2 = new Three.Vector3(this.v2.x - this.v3.x, this.v2.y - this.v3.y, this.v2.z - this.v3.z);

        const n = new Three.Vector3().crossVectors(e1, e2).normalize();
        const d = -(n.x * this.v1.x, n.y * this.v2.y + n.z * this.v3.z);

        return { x: n.x, y: n.y, z: n.z, d }
    }
}

export class Qem {
    inititalVertices;
    inititalIndices;
    vertices;
    indices;

    qemStore;

    sortIndices

    constructor(vertices: number[], indices: number[]) {
        this.inititalVertices = [...vertices];
        this.inititalIndices = [...indices];
        this.vertices = [...vertices];
        this.indices = [...indices];

        this.sortIndices = [...indices].sort((a, b) => a - b);

        this.qemStore = this.reset();
    }

    reset() {
        const qemStore_ = this.initQemStore();
        this.qemStore = qemStore_;
        this.qemStore.qemVertexIndexMap.forEach((qemVertex) => {
            this.calcQemVerticeQ(qemVertex);
        })
        this.qemStore.qemEdgeMap.forEach((qemEdge) => {
            this.calcQemEdgeCost(qemEdge);
        })
        return qemStore_
    }

    initQemStore() {
        // 初始化所有QemVertex
        const qemVertexIndexMap = new Map<number, QemVertex>();
        for (let cursor = 0; cursor < this.indices.length; cursor += 1) {
            const index = this.indices[cursor]!
            const x = this.vertices[index]!
            const y = this.vertices[index + 1]!
            const z = this.vertices[index + 2]!
            const qemVertex = new QemVertex(x, y, z, index);
            qemVertexIndexMap.set(index, qemVertex);
        }

        // 初始化所有QemEdge、QemTriangle
        const qemEdgeMap = new Map<string, QemEdge>();
        const qemTriangleMap = new Map<string, QemTriangle>();
        // 建立边关联的Triangle
        const qemEdgeTriangleMap = new Map<string, QemTriangle[]>();
        for (let index = 0; index < this.indices.length; index += 3) {
            const v1Index = this.indices[index]!
            const v2Index = this.indices[index + 1]!
            const v3Index = this.indices[index + 2]!

            const v1 = qemVertexIndexMap.get(v1Index)!;
            const v2 = qemVertexIndexMap.get(v2Index)!;
            const v3 = qemVertexIndexMap.get(v3Index)!;

            const qemEdge1 = new QemEdge(v1, v2);
            const qemEdge2 = new QemEdge(v2, v3);
            const qemEdge3 = new QemEdge(v3, v1);
            const qemTriangle = new QemTriangle(v1, v2, v3);

            const isDegenerate =
                v1Index === v2Index || v1Index === v3Index || v2Index === v3Index || // 顶点重复
                isCollinear(v1, v2, v3); // 几何共线

            if (!isDegenerate) {
                qemTriangleMap.set(qemTriangle.key, qemTriangle);
                qemEdgeMap.set(qemEdge1.key, qemEdge1);
                qemEdgeMap.set(qemEdge2.key, qemEdge2);
                qemEdgeMap.set(qemEdge3.key, qemEdge3);

                if (!qemEdgeTriangleMap.has(qemEdge1.key)) qemEdgeTriangleMap.set(qemEdge1.key, []);
                if (!qemEdgeTriangleMap.has(qemEdge2.key)) qemEdgeTriangleMap.set(qemEdge2.key, []);
                if (!qemEdgeTriangleMap.has(qemEdge3.key)) qemEdgeTriangleMap.set(qemEdge3.key, []);
                qemEdgeTriangleMap.get(qemEdge1.key)!.push(qemTriangle);
                qemEdgeTriangleMap.get(qemEdge2.key)!.push(qemTriangle);
                qemEdgeTriangleMap.get(qemEdge3.key)!.push(qemTriangle);
            }
        }

        // 建立顶点索引到Triangle的映射
        const qemTriangleIndexMap = new Map<number, QemTriangle[]>();
        function saveQemTriangleIndexMap(qemTriangle: QemTriangle, index: number) {
            if (!qemTriangleIndexMap.has(index)) {
                qemTriangleIndexMap.set(index, [])
            }
            qemTriangleIndexMap.get(index)!.push(qemTriangle)
        }
        qemTriangleMap.forEach((qemTriangle) => {
            saveQemTriangleIndexMap(qemTriangle, qemTriangle.v1.index);
            saveQemTriangleIndexMap(qemTriangle, qemTriangle.v2.index);
            saveQemTriangleIndexMap(qemTriangle, qemTriangle.v3.index);
        })

        return {
            qemVertexIndexMap,
            qemEdgeMap,
            qemTriangleMap,
            qemTriangleIndexMap,
            qemEdgeTriangleMap,
        }
    }

    calcQemVerticeQ(qemVertex: QemVertex) {
        const q: number[] = [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ]

        const faces = this.qemStore.qemTriangleIndexMap.get(qemVertex.index) ?? [];

        for (const face of faces) {
            const { x: a, y: b, z: c, d } = face.normal;
            const q_: number[] = [
                a * a, a * b, a * c, a * d,
                a * b, b * b, b * c, b * d,
                a * c, b * c, c * c, c * d,
                a * d, b * d, c * d, d * d,
            ]
            q.forEach((_, index) => {
                q[index] = q[index]! + q_[index]!;
            })
        }

        qemVertex.q = q;
    }

    calcQemEdgeCost(qemEdge: QemEdge) {
        // 没有效果
        // const faces = this.qemStore.qemEdgeTriangleMap.get(qemEdge.key);
        // if (faces && faces.length === 1) {
        //     qemEdge.cost = Number.MAX_VALUE;
        //     return;
        // }

        const { v1, v2 } = qemEdge;
        const q1 = qemEdge.v1.q ?? [];
        const q2 = qemEdge.v2.q ?? [];
        const q = q1.map((v, index) => v + q2[index]!) as any

        const invert = new Three.Matrix4(
            q[0], q[1], q[2], q[3],
            q[4], q[5], q[6], q[7], 
            q[8], q[9], q[10], q[11], 
            0, 0, 0, 1,
        ).invert();

        if (!invert.elements.every(item => item === 0)) {
            const v = new Three.Vector4(0, 0, 0, 1).applyMatrix4(invert);
            const vNew = {
                x: v.x,
                y: v.y,
                z: v.z,
            }
            const vNewLeft = new Three.Vector4(vNew.x, vNew.y, vNew.z, 1);
            const vNewRight = new Three.Vector4(vNew.x, vNew.y, vNew.z, 1);
            const qMatrix = new Three.Matrix4();
            for (let i = 0; i < 16; i += 1) {
                qMatrix.elements[i] = q[i]!
            }
            const cost = vNewLeft.applyMatrix4(qMatrix).dot(vNewRight)
            qemEdge.vNew = vNew;
            qemEdge.cost = cost;
            return;
        } else {
            return;
        }


        const vNew = {
            x: (v1.x + v2.x) / 2,
            y: (v1.y + v2.y) / 2,
            z: (v1.z + v2.z) / 2,
        }
        const vNewLeft = new Three.Vector4(vNew.x, vNew.y, vNew.z, 1);
        const vNewRight = new Three.Vector4(vNew.x, vNew.y, vNew.z, 1);
        const qMatrix = new Three.Matrix4();
        for (let i = 0; i < 16; i += 1) {
            qMatrix.elements[i] = q[i]!
        }
        const cost = vNewLeft.applyMatrix4(qMatrix).dot(vNewRight)

        qemEdge.vNew = vNew;
        qemEdge.cost = cost;

        const vNew1 = {
            x: v1.x,
            y: v1.y,
            z: v1.z,
        }
        const vNewLeft1 = new Three.Vector4(vNew1.x, vNew1.y, vNew1.z, 1);
        const vNewRight1 = new Three.Vector4(vNew1.x, vNew1.y, vNew1.z, 1);
        const qMatrix1 = new Three.Matrix4();
        for (let i = 0; i < 16; i += 1) {
            qMatrix1.elements[i] = q[i]!
        }
        const cost1 = vNewLeft1.applyMatrix4(qMatrix1).dot(vNewRight1)

        qemEdge.vNew = vNew1;
        qemEdge.cost = cost1;

        const vNew2 = {
            x: v2.x,
            y: v2.y,
            z: v2.z,
        }
        const vNewLeft2 = new Three.Vector4(vNew2.x, vNew2.y, vNew2.z, 1);
        const vNewRight2 = new Three.Vector4(vNew2.x, vNew2.y, vNew2.z, 1);
        const qMatrix2 = new Three.Matrix4();
        for (let i = 0; i < 16; i += 1) {
            qMatrix2.elements[i] = q[i]!
        }
        const cost2 = vNewLeft2.applyMatrix4(qMatrix2).dot(vNewRight2)

        const min = Math.min(cost, Math.min(cost1, cost2));
        if (cost === min) {
            qemEdge.vNew = vNew;
            qemEdge.cost = cost;
        } else if (cost1 === min) {
            qemEdge.vNew = vNew1;
            qemEdge.cost = cost1;
        } else if (cost2 === min) {
            qemEdge.vNew = vNew2;
            qemEdge.cost = cost2;
        }

        qemEdge.vNew = vNew1;
        qemEdge.cost = cost1;
    }

    collapse(count?: number) {
        let edge: QemEdge | undefined = undefined;
        let cost = Number.MAX_VALUE;
        const list: QemEdge[] = []
        this.qemStore.qemEdgeMap.forEach((qemEdge) => {
            list.push(qemEdge);
            if (qemEdge.cost !== undefined && qemEdge.cost < cost) {
                cost = qemEdge.cost;
                edge = qemEdge;
            }
        })
        // list.sort((a, b) => {
        //     return a.cost! - b.cost!
        // })
        // console.log(list);

        if (edge) {
            console.log("删除边", edge);
            this.collapseEdge(edge);
            this.reset();

            // this.qemStore.qemEdgeMap.delete((edge as any).key);
            // const dkeys: string[] = [];
            // this.qemStore.qemEdgeMap.forEach((item) => {
            //     const keys = [edge!.v1.index,edge!.v2.index]
            //     if (keys.includes(item.v2.index)) {
            //         dkeys.push(item.key)
            //     }
            // })
            // dkeys.forEach(key => {
            //     this.qemStore.qemEdgeMap.delete(key);
            // })


            if (count && count > 1) {
                this.collapse(count - 1);
            }
        } else {
            console.log("没找到边", this.qemStore.qemEdgeMap);
            this.reset();
        }
    }

    collapseEdge(edge: QemEdge) {
        const { v1, v2, vNew } = edge;

        this.vertices[v1.index] = vNew!.x
        this.vertices[v1.index + 1] = vNew!.y
        this.vertices[v1.index + 2] = vNew!.z

        for (let cursor = 0; cursor < this.indices.length; cursor += 1) {
            const index = this.indices[cursor];
            if (index === v2.index) {
                this.indices[cursor] = v1.index;
            }
        }

        // 更新顶点数组：更新vNew的值到v1
        // 更新索引数组：更新所有v2的索引为v1的索引

        // 用新的顶点、索引重新计算

        // 找到v1关联的所有面、面关联的所有边
        // 重新计算v1的Q矩阵
        // 重新计算v1所有面的法向
        // 重新计算所有边的QError
    }

    getResult() {
        const verticesNew = [];
        const indicesNew = [];
        const indexSet = new Set();

        for (let i = 0; i < this.indices.length; i += 3) {
            const v1Index = this.indices[i];
            const v2Index = this.indices[i + 1];
            const v3Index = this.indices[i + 2];

            const v1 = this.qemStore.qemVertexIndexMap.get(v1Index!)!
            const v2 = this.qemStore.qemVertexIndexMap.get(v2Index!)!
            const v3 = this.qemStore.qemVertexIndexMap.get(v3Index!)!

            // 检测退化情况（考虑共线情况）
            const isDegenerate =
                v1Index === v2Index || v1Index === v3Index || v2Index === v3Index || // 顶点重复
                isCollinear(v1, v2, v3); // 几何共线

            if (!isDegenerate) {
                indicesNew.push(v1Index, v2Index, v3Index);
            }
        }

        // for (let cursor = 0; cursor < indicesNew.length; cursor += 1) {
        //     const index = indicesNew[cursor]!
        //     if (indexSet.has(index)) {
        //         continue;
        //     }
        //     indexSet.add(index);
        //     const v = this.qemStore.qemVertexIndexMap.get(index)!
        //     verticesNew.push(v.x);
        //     verticesNew.push(v.y);
        //     verticesNew.push(v.z);
        // }
        return {
            vertices: this.vertices,
            indices: indicesNew,
        }
    }
}


// 共线检测函数
function isCollinear(v0: QemVertex, v1: QemVertex, v2: QemVertex) {
    const vec1 = [v1.x - v0.x, v1.y - v0.y, v1.z - v0.z];
    const vec2 = [v2.x - v0.x, v2.y - v0.y, v2.z - v0.z];

    // 计算叉积模长
    const crossX = vec1[1]! * vec2[2]! - vec1[2]! * vec2[1]!;
    const crossY = vec1[2]! * vec2[0]! - vec1[0]! * vec2[2]!;
    const crossZ = vec1[0]! * vec2[1]! - vec1[1]! * vec2[0]!;

    const areaSq = crossX * crossX + crossY * crossY + crossZ * crossZ;
    return areaSq < 1e-6;
}