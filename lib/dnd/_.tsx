import Resizable from "./Resizable"

type Props = {
    type?: 'resizable'
}
export default function (props: Props) {
    switch (props.type) {
        case 'resizable': return <div><Resizable resizable centered className="w-[100px] h-[100px]" /></div>
    }
    return <div>view</div>
}