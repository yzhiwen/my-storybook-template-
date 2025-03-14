// @ts-nocheck
import { Observable } from 'rxjs';
import spy from './RxSpy';
// import './case1';
// import './case2';

export default function() {
    return <div onClick={() => spy.log('mergeMap 2')}>rx-view</div>
}