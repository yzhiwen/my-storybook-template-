import IndexTree from "./IndexTree"
import type { GridAreaCalcResult } from "./calcGridItemArea"
import type { GridNodeProps } from "./type"

type Params = {
    overId?: string
    overProps?: any

    activeId: string
    activeProps?: any
    activeArea: GridAreaCalcResult

    root: GridNodeProps
}

export default function onHandleDragEnd(params: Params) {
    const { activeId, overId, root, activeArea, overProps, activeProps, } = params
    const tree = new IndexTree(root, 'id', 'items')
    console.log(params, tree);

    const activeTreeNode = tree.get(activeId)
    if (!activeTreeNode) {
        const overTreeNode = overId ? tree.get(overId) : undefined
        if (overTreeNode) {
            if (!overTreeNode.node.items) overTreeNode.node.items = []
            overTreeNode.node.items.push({ id: Math.random().toString().substring(2), ...activeProps, ...activeArea, })
        }
        return { ...root }
    }

    const parentId = activeTreeNode.parent
    if (parentId === overId) {
        // drag的父节点未变
        Object.assign(activeTreeNode.node, activeProps, activeArea)
        return { ...root }
    } else {
        // drag的父节点改变
        Object.assign(activeTreeNode.node, activeProps, activeArea)

        // 删除旧节点方式
        const parentTreeNodeOld = parentId ? tree.get(parentId) : undefined
        if (parentTreeNodeOld) {
            const items_ = parentTreeNodeOld.node.items?.filter((item: any) => item.id !== activeId)
            parentTreeNodeOld.node.items = items_
        }

        // 添加新节点
        const parentTreeNodeNew = overId ? tree.get(overId) : undefined
        if (parentTreeNodeNew) {
            const item = activeTreeNode.node
            parentTreeNodeNew.node.items = [...(parentTreeNodeNew.node.items ?? []), item]
        }
        return { ...root }
    }
}