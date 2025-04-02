import Select from "./select"

type Props = {
    type?: 'select'
}
export default function(props: Props) {
    switch(props.type) {
        case 'select': return <Select />
    }
    return <div>view</div>
}