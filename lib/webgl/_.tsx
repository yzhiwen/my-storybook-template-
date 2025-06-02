import TWGLInit from "./TWGLInit"
import WebGLCamera from "./WebGLCamera"
import WebGLCube from "./WebGLCube"
import WebGLInit from "./WebGLInit"

type Props = {
    type?: 'init' | 'cube' | 'camera' | 'twgl-init'
}
export default function(props: Props) {
    switch(props.type) {
        case 'init': return <WebGLInit key="init" />
        case 'cube': return <WebGLCube key="cube" />
        case 'camera': return <WebGLCamera key="camera" />
        case 'twgl-init': return <TWGLInit key="twgl-init" />
    }
    return <div>view</div>
}