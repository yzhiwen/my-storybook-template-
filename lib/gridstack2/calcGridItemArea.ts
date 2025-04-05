type GridAreaCalc = {
    row: number
    col: number

    x: number
    y: number
    width: number
    height: number
    // gap?

    itemX: number
    itemY: number
    itemWidth: number
    itemHeight: number
}

export type GridAreaCalcResult = { 
    x: number // new item x 
    y: number // new item y
    width: number // new item width
    height: number // new item height
    rowStart: number, 
    rowEnd: number, 
    colStart: number, 
    colEnd: number, 
    'grid-area': string, 
}

export default function calcGridItemArea(options: GridAreaCalc): GridAreaCalcResult {
    // console.log(">>>calcGridItemArea", JSON.stringify(options))
    const rowSize = options.height / options.row
    const colSize = options.width / options.col
    const offsetX = options.itemX - options.x
    const offsetY = options.itemY - options.y

    // 假设完全在容器内
    let rowStart = 1;
    for (; rowStart <= options.row; rowStart += 1) {
        if (offsetY < rowStart * rowSize - rowSize / 2) break
    }
    let colStart = 1;
    for (; colStart <= options.col; colStart += 1) {
        if (offsetX < colStart * colSize - colSize / 2) break
    }

    let rowSpan = 1;
    while (true) {
        if (options.itemHeight < (rowSpan + 1) * rowSize - rowSize / 2) break
        rowSpan += 1
    }
    let rowEnd = rowStart + rowSpan

    let colSpan = 1;
    while (true) {
        if (options.itemWidth < (colSpan + 1) * colSize - colSize / 2) break
        colSpan += 1
    }
    let colEnd = colStart + colSpan
    // console.log(">>>", JSON.stringify({rowStart, rowEnd, colStart, colEnd, colSpan, rowSpan}))

    // let rowEnd = 1;
    // for (; rowEnd <= options.row; rowEnd += 1) {
    //     if (options.itemY - options.y + options.itemHeight < rowEnd * rowSize) break
    // }
    // let colEnd = 1;
    // for (; colEnd <= options.col; colEnd += 1) {
    //     if (options.itemX - options.x + options.itemWidth < colEnd * colSize) break
    // }

    const itemXNew = options.x + (colStart - 1) * colSize;
    const itemYNew = options.y + (rowStart - 1) * rowSize;
    const itemWidth = colSpan * colSize
    const itemHeight = rowSpan * rowSize

    return {
        x: itemXNew, y: itemYNew, width: itemWidth, height: itemHeight,
        rowStart, rowEnd, colStart, colEnd,
        'grid-area': `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`
    }
}
