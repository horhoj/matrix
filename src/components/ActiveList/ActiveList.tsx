import { useWindowVirtualizer } from '@tanstack/react-virtual';
import classNames from 'classnames';
import { useEffect } from 'react';
import { Header } from '../Header';
import { Footer } from '../Footer';
import styles from './ActiveList.module.scss';
import { Portal } from '~/ui/Portal';
import { useWindowSize } from '~/hooks/useWindowSize';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { activeDeleteThunk, appInitThunk, getActiveList } from '~/store/data';

const columnTitles = ['Актив', 'Количество', 'Цена', 'Cтоимость', 'Изм. за 24 ч.', '% портфеля'] as const;

const fieldNumFormat = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ActiveList() {
  const { error: fetchError, isLoading } = useAppSelector((state) => state.data.fetchDataRequest);
  const activeData = useAppSelector(getActiveList);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(appInitThunk());
  }, []);

  const { width } = useWindowSize();
  const isMobile = width !== null && width <= 700;

  const count = activeData?.length ?? 0;
  const virtualizer = useWindowVirtualizer({
    count,
    estimateSize: () => (isMobile ? 246 : 60),
    enabled: true,
  });

  const items = virtualizer.getVirtualItems();

  const handleDeleteActive = (activeUniqueName: string) => {
    if (confirm('Удалить наблюдателя за токеном?')) {
      dispatch(activeDeleteThunk({ activeUniqueName }));
    }
  };

  return (
    <div className={styles.app}>
      <Portal>
        <div className={classNames(styles.appHeader)}>
          <Header />
          {!isMobile && (
            <div className={classNames(styles.activeRow, styles.activeListHead, 'global-container')}>
              {!fetchError &&
                !isLoading &&
                activeData &&
                activeData.length > 0 &&
                columnTitles.map((title, i) => (
                  <div key={i}>
                    <strong>{title}</strong>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Portal>

      <main className={classNames(styles.main, 'global-container')}>
        {!fetchError && activeData && activeData.length === 0 && (
          <>
            <div>Нет активов в вашем портфеле. Добавьте что-нибудь, чтобы начать! </div>
            <div>Eсли элементы не будут помещаться на страницу, они будут ВИРТУЛИЗИРОВАНЫ!!!</div>
          </>
        )}
        {fetchError && (
          <>
            <div className={styles.activeListFetchError}>Не удалось получить данные от сервера!</div>
            <div className={styles.activeListFetchError}>Ошибка: {fetchError}</div>
          </>
        )}
        {isLoading && <div>Идет загрузка данных от сервера...</div>}

        {!fetchError && !isLoading && activeData && activeData.length > 0 && (
          <div
            className={classNames(styles.activeList, 'global-container')}
            style={{
              height: virtualizer.getTotalSize(),
            }}
          >
            {items.map((virtualRow) => {
              const active = activeData[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    transform: `translateY(${items[0]?.start ?? 0}px)`,
                  }}
                  className={classNames(styles.activeRow, virtualRow.index % 2 === 1 && styles.activeOddRow)}
                  role={'button'}
                  onClick={() => handleDeleteActive(active.activeUniqueName)}
                >
                  <div>
                    {isMobile && <strong>{columnTitles[0]}: </strong>}
                    {active.activeUniqueName}
                  </div>
                  <div>
                    {isMobile && <strong>{columnTitles[1]}: </strong>}
                    {fieldNumFormat(active.count)}
                  </div>
                  <div>
                    {isMobile && <strong>{columnTitles[2]}: </strong>}${fieldNumFormat(active.itemCoast)}
                  </div>
                  <div>
                    {isMobile && <strong>{columnTitles[3]}: </strong>}${fieldNumFormat(active.totalCoast)}
                  </div>
                  <div
                    className={classNames(
                      active.changesIn24hours < 0
                        ? styles.activeListChangesIn24hoursNegative
                        : styles.activeListChangesIn24hoursPositive,
                    )}
                  >
                    {isMobile && <strong>{columnTitles[4]}: </strong>}
                    {active.changesIn24hours > 0 && <>+</>}
                    {fieldNumFormat(active.changesIn24hours)}%
                  </div>
                  <div>
                    {isMobile && <strong>{columnTitles[5]}: </strong>}
                    {fieldNumFormat(active.portfolioPercentage)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
