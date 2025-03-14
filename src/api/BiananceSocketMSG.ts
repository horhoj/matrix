import { BIananceSocketMSG } from './biananceSocketMSG.types';
import { setData } from '~/store/data';
import { store } from '~/store';

let activeSocket: WebSocket | null = null;

export const closeBIanaceSocket = () => {
  if (activeSocket && activeSocket.readyState === 1) {
    activeSocket.close();
    activeSocket = null;
  }
};

export const openBinanceSocket = (tokenList: string[]) => {
  closeBIanaceSocket();
  activeSocket = new WebSocket(
    `wss://stream.binance.com:9443/stream?streams=${tokenList.map((token) => token.toLowerCase() + '@ticker').join('/')}`,
  );
  activeSocket.onmessage = (ev) => {
    const msg = JSON.parse(ev.data) as BIananceSocketMSG;
    store.dispatch(setData({ activeUniqueName: msg.data.s, coastItem: msg.data.c, priceChangePercent: msg.data.P }));
  };
  activeSocket.onerror = () => {
    setTimeout(() => {
      openBinanceSocket(tokenList);
    }, 1000);
  };
};
