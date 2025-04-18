import GridFlip from "./GridFlip"
import GridArea from "./GridArea"
import GridItemDnd from "./GridItemDnd"
import GridItemDndFlip from "./GridItemDndFlip"
import GridItemDndResize from "./GridItemDndResize"
import GridSub from "./GridSub"

type Props = {
    type?:  "arem" | "subgrid" |
            "grid-item-dnd" | "grid-item-flip" |
            "grid-item-dnd-flip" | "grid-item-dnd-resize"
}

export default function (props: Props) {
    const { type } = props

    switch (type) {
        case 'arem': return <GridArea />
        case 'subgrid': return <GridSub />
        case 'grid-item-dnd': return <GridItemDnd />
        case 'grid-item-flip': return <GridFlip />
        case "grid-item-dnd-flip": return <GridItemDndFlip />
        case "grid-item-dnd-resize": return <GridItemDndResize />
    }

    return <div className="w-100 grid grid-cols-4 gap-4">
        <div className="bg-blue-100 col-start-1 col-end-1">1</div>
        <div className="bg-blue-100 col-start-2 col-end-2">2</div>
        <div className="bg-blue-100 col-start-3 col-end-3">3</div>
        <div className="bg-blue-100 col-start-4 col-end-4">4</div>

        <div className="bg-blue-100 col-start-1 col-end-3">1</div>
        <div className="bg-blue-100 col-start-3 col-end-5">2</div>

        <div className="bg-blue-100 col-start-1 col-end-3">1</div>
        <div className="bg-blue-100 col-start-2 col-end-5">2</div>


        {/* 需要指定同一row，才会触发重叠 */}
        <div className="bg-blue-100 col-start-1 col-end-3 row-5">1</div>
        <div className="bg-blue-100 col-start-2 col-end-5 row-5">2</div>
    </div>
}