import Resizable from "./Resizable"
import UseResizableView from "./UseResizableView"

type Props = {
    type?: 'resizable' | 'UseResizable'
}
export default function (props: Props) {
    switch (props.type) {
        case 'resizable': return <div><Resizable resizable centered className="w-[100px] h-[100px]" /></div>
        case 'UseResizable': return <UseResizableView className="w-[100px] h-[100px]" />
    }
    return <div>view</div>
}