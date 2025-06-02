import WebGLCamera from "./WebGLCamera"
import WebGLCube from "./WebGLCube"
import WebGLInit from "./WebGLInit"

type Props = {
    type?: 'init' | 'cube' | 'camera'
}
export default function(props: Props) {
    switch(props.type) {
        case 'init': return <WebGLInit key="init" />
        case 'cube': return <WebGLCube key="cube" />
        case 'camera': return <WebGLCamera key="camera" />
    }
    return <div>view</div>
}