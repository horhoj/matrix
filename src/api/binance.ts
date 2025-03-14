import axios from 'axios';
import { TokenDataItem } from './binance.types';
import { DEFAULT_HEADERS } from './const';
import { memoize } from '~/utils/memoize';

export const axiosInstance = axios.create({
  baseURL: 'https://api.binance.com/api/v3',
  headers: { ...DEFAULT_HEADERS },
});

export const fetchBinanceData = memoize(async () => {
  const res = await axiosInstance.request<TokenDataItem[]>({ url: '/ticker/24hr', method: 'get' });

  const data: Record<string, TokenDataItem> = {};
  for (const el of res.data) {
    data[el.symbol] = el;
  }
  return data;
});

export const fetchTokenList = memoize(async () => {
  const res = await axiosInstance.request<TokenDataItem[]>({ url: '/ticker/24hr', method: 'get' });
  return res.data.map((el) => el.symbol);
});
