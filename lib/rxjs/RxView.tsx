// @ts-nocheck
import { Observable } from 'rxjs';
import spy from './RxSpy';
// import './case1';
import './case2';
import { tag } from 'rxjs-spy/operators';

export default function() {
    return <div onClick={() => spy.log('mergeMap 2')}>rx-view</div>
}