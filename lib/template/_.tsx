type Props = {
    type?: 'type-a'
}
export default function(props: Props) {
    switch(props.type) {
        case 'type-a': return <>type-a</>
    }
    return <div>view</div>
}