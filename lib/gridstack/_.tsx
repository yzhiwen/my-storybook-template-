import GridStack from "./GridStack"
import GridStackSample from "./GridStackSample"
import { TestGridNodeProps } from "./type"

type Props = {
    type?: ''
}
export default function(props: Props) {
    switch(props.type) {
    }
    return <GridStackSample />
    return <GridStack gridRootProps={TestGridNodeProps} />
}
