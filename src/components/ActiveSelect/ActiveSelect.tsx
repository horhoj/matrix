import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './ActiveSelect.module.scss';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { activeSelectThunk, fetchTokenListThunk, setIsShowActiveSelect } from '~/store/data';

export function ActiveSelect() {
  const dispatch = useAppDispatch();
  const { isLoading, error, data } = useAppSelector((state) => state.data.fetchTokenListRequest);

  useEffect(() => {
    dispatch(fetchTokenListThunk());
  }, []);

  const parentRef = useRef<HTMLDivElement>(null);
  const [filterValue, setFilterValue] = useState('');
  const [tockenCount, setTokenCount] = useState(1);
  const activeList = data ?? [];

  const activeListFiltered = useMemo(
    () => activeList.filter((el) => el.toLowerCase().includes(filterValue.trim().toLowerCase())),
    [activeList, filterValue],
  );

  const handleSetCount = (val: string) => {
    let actualVal = +val;
    if (actualVal < 1 || Number.isNaN(actualVal)) {
      actualVal = 1;
    }
    setTokenCount(actualVal);
  };

  const handleAddActive = (activeUniqueName: string) => {
    dispatch(activeSelectThunk({ activeConfigItem: { activeUniqueName, count: tockenCount } }));
  };

  const count = activeListFiltered.length;
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    enabled: true,
  });
  const items = virtualizer.getVirtualItems();
  return (
    <div className={styles.ActiveSelect} onClick={(e) => e.stopPropagation()}>
      <button className={styles.closeBtn} onClick={() => dispatch(setIsShowActiveSelect(false))}>
        X
      </button>
      {isLoading && <div>Идет загрузка...</div>}
      {error && <div>Ошибка получения списка токенов</div>}
      {data && (
        <>
          <input
            className={styles.input}
            placeholder={'Поиск валюты...'}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder={'Единиц валюты...'}
            value={tockenCount}
            type={'number'}
            min={1}
            onChange={(e) => handleSetCount(e.target.value)}
          />
          <div className={styles.activeListWrapper} ref={parentRef}>
            <ul
              style={{
                height: virtualizer.getTotalSize(),
              }}
              className={styles.activeList}
            >
              {items.map((virtualRow) => (
                <li
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    transform: `translateY(${items[0]?.start ?? 0}px)`,
                  }}
                  className={classNames(styles.activeListItem)}
                >
                  <button
                    className={classNames(
                      styles.activeListItemButton,
                      virtualRow.index % 2 === 1 ? styles.activeListItemOdd : styles.activeListItemEven,
                    )}
                    onClick={() => handleAddActive(activeListFiltered[virtualRow.index])}
                  >
                    {activeListFiltered[virtualRow.index]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
