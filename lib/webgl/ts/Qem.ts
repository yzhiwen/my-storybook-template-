import * as THREE from 'three'

class Vertex3 {
    x
    y
    z
    index

    constructor(x: number, y: number, z: number, index: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.index = index;
    }

    get key() {
        return `${this.x}-${this.y}-${this.z}`
    }

    static isEqual(v1: Vertex3, v2: Vertex3) {
        return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z
    }
}

class Edge {
    v1
    v2
    key
    quadrics = Number.MAX_VALUE
    collapseVertex?: Vertex3

    constructor(v1: Vertex3, v2: Vertex3) {
        this.v1 = v1;
        this.v2 = v2;

        const idx1 = v1.index!;
        const idx2 = v2.index!;
        this.key = idx1 < idx2 ? `${idx1}_${idx2}` : `${idx2}_${idx1}`;
    }

    hasVertex(v: Vertex3) {
        return Vertex3.isEqual(this.v1, v) || Vertex3.isEqual(this.v2, v)
    }
}

class Face {
    v1
    v2
    v3

    constructor(v1: Vertex3, v2: Vertex3, v3: Vertex3) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
    }

    get normal() {
        return new Vertex3(0, 0, 0, -1)
    }

    hasEdge(edge: Edge) {
        return this.hasVertex(edge.v1) && this.hasVertex(edge.v2);
    }

    hasVertex(v: Vertex3) {
        return Vertex3.isEqual(this.v1, v) || Vertex3.isEqual(this.v2, v) || Vertex3.isEqual(this.v3, v)
    }
}

export class Qem {

    vertices;
    indices;
    edges;
    faces;
    vertexIndexFaces;

    constructor(vertices: number[], indices: number[]) {
        this.vertices = vertices;
        this.indices = indices;

        this.edges = new Array<Edge>();
        this.faces = new Array<Face>();
        this.vertexIndexFaces = new Map<number, Face[]>(); // 改成 vertex key

        // 计算出所有edge
        // 计算出所有face
    }

    reset() {
        this.calculateEdgesFaces();
        this.calculateQuadrics();
    }

    vertex(index: number) {
        const stride = 3; // 默认3
        const x = this.vertices[index * stride]!
        const y = this.vertices[index * stride + 1]!
        const z = this.vertices[index * stride + 2]!
        return new Vertex3(x, y, z, index)
    }

    updateVertexIndexFace(face: Face) {
        const vs = [face.v1, face.v2, face.v3]
        for (const v of vs) {
            if (!this.vertexIndexFaces.has(v.index)) {
                this.vertexIndexFaces.set(v.index, [])
            }
            this.vertexIndexFaces.get(v.index)?.push(face)
        }
    }

    calculateEdgesFaces() {
        const edgeKeySet = new Set();

        for (let i = 0; i < this.indices.length; i += 3) {
            const v1 = this.vertex(this.indices[i]!)
            const v2 = this.vertex(this.indices[i + 1]!)
            const v3 = this.vertex(this.indices[i + 2]!)

            const vs = [v1, v2, v3]
            const face = new Face(v1, v2, v3);
            this.faces.push(face);
            this.updateVertexIndexFace(face);

            // 处理三条边
            for (let j = 0; j < 3; j++) {
                let v1 = vs[j]!;
                let v2 = vs[(j + 1) % 3]!;

                let idx1 = v1.index!;
                let idx2 = v2.index!;

                // 确保 idx1 < idx2 以统一键值
                const key = idx1 < idx2 ? `${idx1}_${idx2}` : `${idx2}_${idx1}`;
                if (!edgeKeySet.has(key)) {
                    edgeKeySet.add(key)
                    const edge = new Edge(v1, v2);
                    this.edges.push(edge);
                }
            }
        }
    }

    calculateQuadrics() {
        this.edges.forEach(edge => {
            this.calculateEdgeQuadrics(edge)
        })

        // 按代价排序边（从小到大）
        this.edges.sort((e1, e2) => e1.quadrics - e2.quadrics);
    }

    calculateEdgeQuadrics(edge: Edge) {
        const q1 = this.calculateVertexQuadrics(edge.v1!)
        const q2 = this.calculateVertexQuadrics(edge.v2!)

        const elements = q1.elements.map((e, i) => {
            return e + q2.elements[i]!
        })
        let mat = new THREE.Matrix4();
        (mat as any).set(...elements)

        let quadrics = 0;
        const vmid = new THREE.Vector3();

        //计算vT (Q1+Q2) v 得到边的代价(cost)deltaV
        for (let j = 0; j < 4; j++) {
            let t = 0;
            for (let k = 0; k < 4; k++) {
                t += vmid.getComponent(k) * mat.elements[j * 4 + k]!;
            }
            quadrics += t * vmid.getComponent(j)
        }

        edge.quadrics = quadrics;
    }

    calculateVertexQuadrics(vertex: Vertex3) {
        let quadrics = new THREE.Matrix4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        let tmp = new THREE.Vector4()

        const vfaces: Face[] = this.vertexIndexFaces.get(vertex.index) ?? [];
        vfaces.forEach(face => {
            const { x, y, z } = face.normal;
            const d = -1;
            tmp.set(x, y, z, d)
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    quadrics.elements[j * 4 + k]! += tmp.getComponent(j) * tmp.getComponent(k);
                }
            }
        })

        return quadrics;
    }

    collapseEdge() {
        const quadricsMinEdge: Edge = null!;
        if (!quadricsMinEdge?.collapseVertex) return

        // 删除边，相当于删除v1、v2
        // 都有v1、v2的face，直接删除
        // 只有v1、v2的face，改成新的顶点
        // 收集v1、v2的边，直接删除
        // 收集v1或v2的边，重新计算quadrics

        const deleteEdges: Edge[] = []
        const changeeEdges: Edge[] = []
        this.edges.forEach(edge => {
            if (edge.hasVertex(quadricsMinEdge.v1) && edge.hasVertex(quadricsMinEdge.v2)) {
                deleteEdges.push(edge);
            } else if (Vertex3.isEqual(edge.v1, quadricsMinEdge.v1)) {
                edge.v1 = quadricsMinEdge.collapseVertex!
                changeeEdges.push(edge);
            } else if (Vertex3.isEqual(edge.v1, quadricsMinEdge.v2)) {
                edge.v1 = quadricsMinEdge.collapseVertex!
                changeeEdges.push(edge);
            } else if (Vertex3.isEqual(edge.v2, quadricsMinEdge.v1)) {
                edge.v2 = quadricsMinEdge.collapseVertex!
                changeeEdges.push(edge);
            } else if (Vertex3.isEqual(edge.v2, quadricsMinEdge.v2)) {
                edge.v2 = quadricsMinEdge.collapseVertex!
                changeeEdges.push(edge);
            }
        })

        const deleteFaces: Face[] = [];
        const changesFaces: Face[] = [];
        this.faces.forEach(face => {
            if (face.hasVertex(quadricsMinEdge.v1) && face.hasVertex(quadricsMinEdge.v2)) {
                deleteFaces.push(face)
            } else if (face.hasVertex(quadricsMinEdge.v1)) {
                if (Vertex3.isEqual(face.v1, quadricsMinEdge.v1)) {
                    face.v1 = quadricsMinEdge.collapseVertex!
                }
                if (Vertex3.isEqual(face.v2, quadricsMinEdge.v1)) {
                    face.v2 = quadricsMinEdge.collapseVertex!
                }
                if (Vertex3.isEqual(face.v3, quadricsMinEdge.v1)) {
                    face.v3 = quadricsMinEdge.collapseVertex!
                }
                changesFaces.push(face)
            } else if (face.hasVertex(quadricsMinEdge.v2)) {
                if (Vertex3.isEqual(face.v1, quadricsMinEdge.v2)) {
                    face.v1 = quadricsMinEdge.collapseVertex!
                }
                if (Vertex3.isEqual(face.v2, quadricsMinEdge.v2)) {
                    face.v2 = quadricsMinEdge.collapseVertex!
                }
                if (Vertex3.isEqual(face.v3, quadricsMinEdge.v2)) {
                    face.v3 = quadricsMinEdge.collapseVertex!
                }
                changesFaces.push(face)
            }
        })

        changeeEdges.forEach(edge => {
            this.calculateEdgeQuadrics(edge)
        })

    }
}

