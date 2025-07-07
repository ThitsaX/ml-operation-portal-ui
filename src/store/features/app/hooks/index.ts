import { RootState } from '@store/store';
import {useSelector} from 'react-redux';
import {IAppState} from '../appSlice';

export const useAppState = () => useSelector<RootState, IAppState>(s => s.app);
