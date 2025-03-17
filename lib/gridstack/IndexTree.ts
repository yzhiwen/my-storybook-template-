type IndexObj = {
    id: string
    node: any

    parent?: string
    prev?: string
    next?: string
    children?: string[]
}

// 改造自 https://github.com/swiftcarrot/js-tree/blob/master/src/tree.js
export default class IndexTree {
    obj: any;
    indexes: Record<string, IndexObj>;
    idKey: string
    childrenKey: string;

    constructor(obj: any, idKey = "id", childrenKey = 'children') {
        this.obj = obj || { [childrenKey]: [] };
        this.indexes = {};
        this.idKey = idKey;
        this.childrenKey = childrenKey;
        this.#buildIndexTree(obj)
    }

    #buildIndexTree(obj: any) {
        const self = this
        const idKey = this.idKey
        const childrenKey = this.childrenKey

        const indexObj = {
            id: obj[idKey],
            node: obj,
        }
        this.indexes[indexObj.id] = indexObj
        if (obj[childrenKey]?.length > 0) {
            walk(obj[childrenKey], indexObj)
        }

        return indexObj

        function walk(objs: any[], parentObj: any) {
            const children: string[] = []

            objs.forEach((obj, i) => {
                const indexObj = {
                    id: obj[idKey],
                    node: obj,
                    parent: parentObj.id,
                }
                self.indexes[indexObj.id] = indexObj

                children.push(indexObj.id)

                if (obj[childrenKey]?.length > 0) {
                    walk(obj[childrenKey], indexObj)
                }
            })
            parentObj.children = children

            children.forEach((id, i) => {
                const indexObj = self.indexes[id]!
                if (i > 0) indexObj.prev = children[i - 1]
                if (i < children.length - 1) indexObj.next = children[i + 1]
            })
        }
    }

    get(id: string) {
        return this.indexes[id]
    }

    remove(id: string) {
        // TODO
    }

    buildRawTree() {
        // TODO
    }
}