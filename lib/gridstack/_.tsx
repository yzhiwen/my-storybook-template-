import GridStack from "./GridStack"
import { TestGridNodeProps } from "./type"

type Props = {
    type?: ''
}
export default function(props: Props) {
    switch(props.type) {
    }
    return <GridStack gridRootProps={TestGridNodeProps} />
}