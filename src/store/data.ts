import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { makeRequestExtraReducer, makeRequestStateProperty, RequestList, RequestStateProperty } from './helpers';
import { RootState } from './types';
import { fetchBinanceData, fetchTokenList } from '~/api/binance';
import { ActiveListItem } from '~/types/ActiveListItem';
import { openBinanceSocket } from '~/api/BiananceSocketMSG';

const SLICE_NAME = 'data';
const TOKEN_LIST_LS_KEY = 'token_list_ls_key';

interface ConfigActiveItem {
  activeUniqueName: string;
  count: number;
}

interface SelectedActiveItem {
  activeUniqueName: string;
  count: number;
  coastItem: string;
  priceChangePercent: string;
}

interface IS {
  fetchDataRequest: RequestStateProperty<SelectedActiveItem[], string>;
  fetchTokenListRequest: RequestStateProperty<string[], string>;
  isShowActiveSelect: boolean;
}

const initialState: IS = {
  fetchDataRequest: makeRequestStateProperty(),
  fetchTokenListRequest: makeRequestStateProperty(),
  isShowActiveSelect: false,
};

const { actions, reducer } = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    clear: () => initialState,
    setData: (
      state,
      action: PayloadAction<{ activeUniqueName: string; coastItem: string; priceChangePercent: string }>,
    ) => {
      if (state.fetchDataRequest.data === null) {
        return;
      }
      const currentEl = state.fetchDataRequest.data.find(
        (el) => el.activeUniqueName === action.payload.activeUniqueName,
      );
      if (currentEl !== undefined) {
        currentEl.coastItem = action.payload.coastItem;
        currentEl.priceChangePercent = action.payload.priceChangePercent;
      }
    },
    setRequestData: (state, action: PayloadAction<SelectedActiveItem[] | null>) => {
      state.fetchDataRequest.data = action.payload;
    },
    setIsShowActiveSelect: (state, action: PayloadAction<boolean>) => {
      state.isShowActiveSelect = action.payload;
    },
  },
  extraReducers: (builder) => {
    makeRequestExtraReducer<RequestList<IS>>(builder, fetchDataThunk, 'fetchDataRequest');
    makeRequestExtraReducer<RequestList<IS>>(builder, fetchTokenListThunk, 'fetchTokenListRequest', true);
  },
});

export const appInitThunk = createAsyncThunk(`SLICE_NAME/appInitThunk`, async (_, store) => {
  try {
    const activeList = JSON.parse(localStorage.getItem(TOKEN_LIST_LS_KEY) ?? '[]') as ConfigActiveItem[];
    if (activeList.length === 0) {
      store.dispatch(actions.setRequestData([]));
      return store.fulfillWithValue(null);
    }

    store.dispatch(fetchDataThunk({ activeList }));
    return store.fulfillWithValue(null);
  } catch (e: unknown) {
    return store.rejectWithValue(e instanceof Error ? e.message : 'unknown error');
  }
});

export const fetchDataThunk = createAsyncThunk(
  `SLICE_NAME/fetchDataThunk`,
  async ({ activeList }: { activeList: ConfigActiveItem[] }, store) => {
    try {
      const binanceData = await fetchBinanceData();

      const actualActiveList: SelectedActiveItem[] = [];

      for (const el of activeList) {
        const activeData = binanceData[el.activeUniqueName];
        if (activeData) {
          actualActiveList.push({
            activeUniqueName: el.activeUniqueName,
            count: el.count,
            coastItem: activeData.bidPrice,
            priceChangePercent: activeData.priceChangePercent,
          });
        }
      }

      openBinanceSocket(activeList.map((el) => el.activeUniqueName));

      localStorage.setItem(TOKEN_LIST_LS_KEY, JSON.stringify(activeList));

      return store.fulfillWithValue(actualActiveList);
    } catch (e: unknown) {
      return store.rejectWithValue(e instanceof Error ? e.message : 'unknown error');
    }
  },
);

export const fetchTokenListThunk = createAsyncThunk(`SLICE_NAME/fetchTokenListThunk`, async (_, store) => {
  try {
    const tokenList = await fetchTokenList();

    return store.fulfillWithValue(tokenList);
  } catch (e: unknown) {
    return store.rejectWithValue(e instanceof Error ? e.message : 'unknown error');
  }
});

export const activeSelectThunk = createAsyncThunk(
  `SLICE_NAME/activeSelectThunk`,
  async ({ activeConfigItem }: { activeConfigItem: ConfigActiveItem }, store) => {
    try {
      const activeList = JSON.parse(localStorage.getItem(TOKEN_LIST_LS_KEY) ?? '[]') as ConfigActiveItem[];

      const elInArr = activeList.find((el) => el.activeUniqueName === activeConfigItem.activeUniqueName);

      if (elInArr === undefined) {
        activeList.push(activeConfigItem);
      }
      if (elInArr) {
        elInArr.count = activeConfigItem.count;
      }

      store.dispatch(fetchDataThunk({ activeList }));
      store.dispatch(actions.setIsShowActiveSelect(false));

      return store.fulfillWithValue(null);
    } catch (e: unknown) {
      return store.rejectWithValue(e instanceof Error ? e.message : 'unknown error');
    }
  },
);

export const activeDeleteThunk = createAsyncThunk(
  `SLICE_NAME/activeDeleteThunk`,
  async ({ activeUniqueName }: { activeUniqueName: string }, store) => {
    try {
      const activeList = (JSON.parse(localStorage.getItem(TOKEN_LIST_LS_KEY) ?? '[]') as ConfigActiveItem[]).filter(
        (el) => el.activeUniqueName !== activeUniqueName,
      );

      store.dispatch(fetchDataThunk({ activeList }));
      store.dispatch(actions.setIsShowActiveSelect(false));

      return store.fulfillWithValue(null);
    } catch (e: unknown) {
      return store.rejectWithValue(e instanceof Error ? e.message : 'unknown error');
    }
  },
);

export const getActiveList = createSelector(
  (state: RootState) => state.data.fetchDataRequest.data,
  (data) => {
    if (data === null) {
      return null;
    }
    const actualActiveList: ActiveListItem[] = [];
    let sum = 0;
    for (const el of data) {
      const itemCoast = Number.parseFloat(el.coastItem);
      const totalCoast = itemCoast * el.count;
      sum += totalCoast;
      actualActiveList.push({
        activeUniqueName: el.activeUniqueName,
        count: el.count,
        itemCoast,
        totalCoast,
        changesIn24hours: Number.parseFloat(el.priceChangePercent),
        portfolioPercentage: 0,
      });
    }
    actualActiveList.forEach((el) => {
      el.portfolioPercentage = (el.totalCoast / sum) * 100;
    });

    return actualActiveList;
  },
);

export const dataReducer = reducer;
export const { setData, setIsShowActiveSelect } = actions;
