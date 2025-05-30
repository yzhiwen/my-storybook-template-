// TODO
// GridItem拖入接收
// SubGrid
// 默认参数确定
// 鼠标位置考虑

export type GridStackProps = {
    className?: string
    children?: any
}

export const TestGridNodeProps: GridNodeProps = {
    id: 'root',
    row: 5,
    col: 10,
    items: [
        { id: 'grid-item-1' },
        { id: 'grid-item-2', rowStart: 2, colStart: 3, rowEnd: 3, colEnd: 4 },
        { id: 'grid-item-3', },
        //  `row-start-4 col-start-5 row-span-2 col-span-3 bg-blue-700`,
        { id: 'grid-item-4', type: 'subgrid', row: 2, col: 3, rowStart: 4, colStart: 5, rowEnd: 6, colEnd: 8  }
    ]
}

export type GridNodeProps = {
    id: string
    style?: React.CSSProperties
    className?: string
    type?: "grid" | "subgrid" | "grid-item"

    // grid | subgrid
    row?: number
    col?: number
    gap?: number

    // subgrid | grid-item
    rowStart?: number
    colStart?: number
    rowEnd?: number
    colEnd?: number

    // grid-sub | grid-item
    x?: number // 第几col
    y?: number // 第几row
    w?: number // 多少col
    h?: number // 多少row

    items?: GridNodeProps[]

    children?: any
}

export type Position = {
  left: number,
  top: number,
  width: number,
  height: number
};

export type PositionParams = {
  margin: [number, number],
  containerPadding: [number, number],
  containerWidth: number,
  cols: number,
  rowHeight: number,
  maxRows: number
};

// 本想把GridNodeProps改成不是树结构的
// export type GridStackV2Props = {
//     disableDndContext?: boolean
//     children?: any
//     onGridRootChange?: (_: GridNodeProps) => void
//     onGridItemRender?: (props: GridNodeProps) => React.ReactElement
// }
// export type GridNodeTree = GridNodeProps & {
//     children?: GridNodeTree[]
// }