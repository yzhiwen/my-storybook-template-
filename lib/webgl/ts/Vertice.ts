export class Vertice {

    static generateWireframeIndices(triangleIndices: number[]) {
        const wireframeIndices: number[] = [];

        for (let i = 0; i < triangleIndices.length; i += 3) {
            const a = triangleIndices[i];
            const b = triangleIndices[i + 1];
            const c = triangleIndices[i + 2];

            // 添加三条边（每条边两个顶点）
            wireframeIndices.push(a!, b!, b!, c!, c!, a!);
        }

        return wireframeIndices;
    }

    // generateWireframeIndices去重版本
    static generateUniqueWireframeIndices(triangleIndices: number[]) {
        const edgeMap = new Map(); // 存储边: "minIndex_maxIndex"
        const wireframeIndices = [];

        for (let i = 0; i < triangleIndices.length; i += 3) {
            const indices = [
                triangleIndices[i]!,
                triangleIndices[i + 1]!,
                triangleIndices[i + 2]!,
            ];

            // 处理三条边
            for (let j = 0; j < 3; j++) {
                let idx1 = indices[j]!;
                let idx2 = indices[(j + 1) % 3]!;

                // 确保 idx1 < idx2 以统一键值
                if (idx1 > idx2) [idx1, idx2] = [idx2, idx1];

                const key = `${idx1}_${idx2}`;

                // 如果边不存在则添加
                if (!edgeMap.has(key)) {
                    edgeMap.set(key, true);
                    wireframeIndices.push(idx1, idx2);
                }
            }
        }

        return wireframeIndices;
    }
}