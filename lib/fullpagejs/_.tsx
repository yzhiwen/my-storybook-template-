import HorizontalSlides from "./HorizontalSlides"

type Props = {
    type?: 'HorizontalSlides'
}
export default function(props: Props) {
    switch(props.type) {
        case 'HorizontalSlides': return <HorizontalSlides />
    }
    return <div>view</div>
}